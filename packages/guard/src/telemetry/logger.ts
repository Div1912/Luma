/**
 * @file packages/guard/src/telemetry/logger.ts
 * Structured JSON enterprise telemetry logger for @ghost/guard.
 * Produces structured audit payloads compatible with OpenTelemetry, Datadog, and cloud aggregators.
 */

import { GhostExecutionReceipt, ToolSpendContext } from '../core/types.js';

export type LogLevel = 'debug' | 'info' | 'warn' | 'error' | 'audit';

export interface StructuredLogPayload {
  level: LogLevel;
  event: string;
  agentId?: string;
  policyId?: string;
  context?: ToolSpendContext;
  receipt?: GhostExecutionReceipt;
  error?: string;
  timestamp: string;
}

export class TelemetryLogger {
  private readonly enabled: boolean;
  private logs: StructuredLogPayload[] = [];

  constructor(enabled: boolean = true) {
    this.enabled = enabled;
  }

  public log(level: LogLevel, event: string, data?: Partial<StructuredLogPayload>): void {
    const payload: StructuredLogPayload = {
      level,
      event,
      timestamp: new Date().toISOString(),
      ...data,
    };

    this.logs.push(payload);

    if (this.enabled && process.env.NODE_ENV !== 'test') {
      const output = JSON.stringify(payload);
      if (level === 'error') {
        console.error(`[Ghost Guard] ${output}`);
      } else if (level === 'warn') {
        console.warn(`[Ghost Guard] ${output}`);
      } else {
        console.log(`[Ghost Guard] ${output}`);
      }
    }
  }

  public audit(event: string, receipt: GhostExecutionReceipt, agentId?: string): void {
    this.log('audit', event, {
      agentId,
      receipt,
      context: receipt.context,
    });
  }

  public getLogs(): StructuredLogPayload[] {
    return [...this.logs];
  }

  public clear(): void {
    this.logs = [];
  }
}
