/**
 * @file packages/guard/src/hitl/deferred.ts
 * Asynchronous execution suspension and approval ticket gateway for @ghost/guard.
 * Allows autonomous agents to pause execution cleanly without dropping LLM context.
 */

import { ToolSpendContext } from '../core/types.js';
import { GhostPolicyViolationError } from '../core/errors.js';

export type TicketStatus = 'pending' | 'approved' | 'rejected' | 'expired';

export interface ApprovalTicket {
  id: string;
  agentId: string;
  policyId?: string;
  context: ToolSpendContext;
  status: TicketStatus;
  createdAt: number;
  expiresAt: number;
  resolvedAt?: number;
  resolvedBy?: string;
  reason?: string;
}

export class DeferredPromise<T> {
  public readonly promise: Promise<T>;
  public resolve!: (value: T | PromiseLike<T>) => void;
  public reject!: (reason?: any) => void;

  constructor() {
    this.promise = new Promise<T>((res, rej) => {
      this.resolve = res;
      this.reject = rej;
    });
  }
}

export class ApprovalGateway {
  private tickets: Map<string, ApprovalTicket> = new Map();
  private deferredMap: Map<string, DeferredPromise<boolean>> = new Map();
  private timers: Map<string, NodeJS.Timeout> = new Map();

  /**
   * Creates an approval ticket and cleanly pauses tool execution until human sign-off or timeout.
   */
  public async requestApproval(
    agentId: string,
    context: ToolSpendContext,
    options?: { policyId?: string; timeoutMs?: number }
  ): Promise<boolean> {
    const ticketId = `ticket_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`;
    const timeoutMs = options?.timeoutMs || 30_000; // 30s default timeout
    const now = Date.now();

    const ticket: ApprovalTicket = {
      id: ticketId,
      agentId,
      policyId: options?.policyId,
      context,
      status: 'pending',
      createdAt: now,
      expiresAt: now + timeoutMs,
    };

    const deferred = new DeferredPromise<boolean>();
    this.tickets.set(ticketId, ticket);
    this.deferredMap.set(ticketId, deferred);

    // Timeout timer to automatically expire and fail closed if no human responds
    const timer = setTimeout(() => {
      if (ticket.status === 'pending') {
        ticket.status = 'expired';
        ticket.resolvedAt = Date.now();
        ticket.reason = `Approval request timed out after ${Math.round(timeoutMs / 1000)}s with no human supervisor response.`;
        deferred.reject(
          new GhostPolicyViolationError(
            `[Ghost Guard] Action Blocked: Approval ticket ${ticketId} expired without human sign-off.`,
            {
              code: 'EXECUTION_TIMEOUT',
              context,
              policyId: options?.policyId,
            }
          )
        );
        this.cleanup(ticketId);
      }
    }, timeoutMs);

    this.timers.set(ticketId, timer);

    return deferred.promise;
  }

  /**
   * Resolves an approval ticket as APPROVED. Unblocks the waiting agent execution loop!
   */
  public approve(ticketId: string, resolvedBy: string = 'admin'): boolean {
    const ticket = this.tickets.get(ticketId);
    const deferred = this.deferredMap.get(ticketId);

    if (!ticket || !deferred || ticket.status !== 'pending') {
      return false;
    }

    ticket.status = 'approved';
    ticket.resolvedAt = Date.now();
    ticket.resolvedBy = resolvedBy;

    deferred.resolve(true);
    this.cleanup(ticketId);
    return true;
  }

  /**
   * Resolves an approval ticket as REJECTED.
   */
  public reject(ticketId: string, reason: string = 'Rejected by supervisor', resolvedBy: string = 'admin'): boolean {
    const ticket = this.tickets.get(ticketId);
    const deferred = this.deferredMap.get(ticketId);

    if (!ticket || !deferred || ticket.status !== 'pending') {
      return false;
    }

    ticket.status = 'rejected';
    ticket.resolvedAt = Date.now();
    ticket.resolvedBy = resolvedBy;
    ticket.reason = reason;

    deferred.reject(
      new GhostPolicyViolationError(
        `[Ghost Guard] Action Blocked: Human supervisor rejected request: ${reason}`,
        {
          code: 'LIMIT_EXCEEDED',
          context: ticket.context,
          policyId: ticket.policyId,
        }
      )
    );

    this.cleanup(ticketId);
    return true;
  }

  /**
   * Retrieves all currently pending tickets (for dashboard inbox polling / websockets).
   */
  public getPendingTickets(): ApprovalTicket[] {
    return Array.from(this.tickets.values()).filter((t) => t.status === 'pending');
  }

  /**
   * Retrieves a specific ticket by ID.
   */
  public getTicket(ticketId: string): ApprovalTicket | undefined {
    return this.tickets.get(ticketId);
  }

  private cleanup(ticketId: string): void {
    const timer = this.timers.get(ticketId);
    if (timer) {
      clearTimeout(timer);
      this.timers.delete(ticketId);
    }
    this.deferredMap.delete(ticketId);
  }

  public clear(): void {
    for (const timer of this.timers.values()) {
      clearTimeout(timer);
    }
    this.timers.clear();
    this.tickets.clear();
    this.deferredMap.clear();
  }
}
