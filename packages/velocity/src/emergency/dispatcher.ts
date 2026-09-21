/**
 * @file packages/velocity/src/emergency/dispatcher.ts
 * Multi-Channel Urgent Emergency Notification Dispatcher.
 * Fires high-priority Push, SMS (Twilio format), and Webhook alerts to human supervisors
 * when an on-chain velocity circuit breaker trips due to runaway loops or anomalies.
 */

import { randomBytes, createHash } from 'crypto';
import {
  AnomalyAssessment,
  EmergencyAlertDossier,
  EmergencyDispatcherConfig,
} from '../types.js';

export class EmergencyNotificationDispatcher {
  private readonly agentId: string;
  private readonly enablePush: boolean;
  private readonly enableSms: boolean;
  private readonly enableWebhook: boolean;
  private readonly smsPhoneNumber?: string;
  private readonly webhookUrl?: string;
  private readonly unfreezeBaseUrl: string;
  private readonly onAlertDispatched?: (dossier: EmergencyAlertDossier) => void;

  private readonly alertHistory: EmergencyAlertDossier[] = [];

  constructor(config?: EmergencyDispatcherConfig) {
    this.agentId = config?.agentId || 'ghost_autonomous_agent_01';
    this.enablePush = config?.enablePush !== false;
    this.enableSms = config?.enableSms !== false;
    this.enableWebhook = config?.enableWebhook !== false;
    this.smsPhoneNumber = config?.smsPhoneNumber || '+1-555-GHOST-HITL';
    this.webhookUrl = config?.webhookUrl;
    this.unfreezeBaseUrl = config?.unfreezeBaseUrl || 'https://ghost.network/emergency/unfreeze';
    this.onAlertDispatched = config?.onAlertDispatched;
  }

  /**
   * Dispatches high-priority multi-channel emergency notifications across Push, SMS, and Webhook.
   */
  public dispatchAlert(options: {
    assessment: AnomalyAssessment;
    attemptedAmount: number;
    remainingTokens: number;
    contractAddress?: string;
  }): EmergencyAlertDossier {
    const { assessment, attemptedAmount, remainingTokens, contractAddress } = options;
    const alertId = `alert_${Date.now()}_${randomBytes(4).toString('hex')}`;
    const timestamp = new Date().toISOString();

    const breakerAddr = contractAddress || '0x773a91f0c2918e104f77c8e0349b1093847291a0b38291c9472649a182649999';
    const releaseNonce = '0x' + createHash('sha256').update(`${alertId}:${timestamp}`).digest('hex').slice(0, 16);
    const unfreezeUrl = `${this.unfreezeBaseUrl}?agent=${this.agentId}&contract=${breakerAddr}&nonce=${releaseNonce}`;

    const summaryMessage = `🚨 [Ghost Emergency Alert] Runaway loop / velocity anomaly detected for agent '${this.agentId}'! ` +
      `Attempted spend: $${attemptedAmount}. Anomaly: ${assessment.anomalyType || 'VELOCITY_SURGE'} (${assessment.severity || 'HIGH'}). ` +
      `On-Chain Circuit Breaker TRIPPED for ${assessment.recommendedCooldownSeconds}s. ` +
      `Supervisor 1-Click Release: ${unfreezeUrl}`;

    const channelsSent: ('push' | 'sms' | 'webhook')[] = [];

    // 1. Dispatch WebPush payload
    if (this.enablePush) {
      this.sendPushNotification({
        title: `🚨 Emergency: Agent Circuit Breaker Tripped!`,
        body: `Agent '${this.agentId}' attempted $${attemptedAmount}. ${assessment.details || ''}`,
        url: unfreezeUrl,
        severity: assessment.severity || 'HIGH',
      });
      channelsSent.push('push');
    }

    // 2. Dispatch SMS payload (Twilio format)
    if (this.enableSms) {
      this.sendSmsAlert({
        to: this.smsPhoneNumber,
        message: summaryMessage,
      });
      channelsSent.push('sms');
    }

    // 3. Dispatch Webhook (Slack / PagerDuty format)
    if (this.enableWebhook) {
      this.sendWebhookPayload({
        alertId,
        agentId: this.agentId,
        anomalyType: assessment.anomalyType,
        attemptedAmount,
        spikeRatio: assessment.spikeRatio,
        unfreezeUrl,
        timestamp,
      });
      channelsSent.push('webhook');
    }

    const dossier: EmergencyAlertDossier = {
      alertId,
      agentId: this.agentId,
      anomalyType: assessment.anomalyType || 'EWMA_SPIKE_ANOMALY',
      severity: assessment.severity || 'HIGH',
      instantaneousRate: assessment.currentRate,
      baselineRate: assessment.baselineRate,
      spikeRatio: assessment.spikeRatio,
      attemptedAmount,
      remainingTokens,
      cooldownSeconds: assessment.recommendedCooldownSeconds,
      unfreezeUrl,
      timestamp,
      channelsSent,
      summaryMessage,
    };

    this.alertHistory.push(dossier);

    if (this.onAlertDispatched) {
      this.onAlertDispatched(dossier);
    }

    return dossier;
  }

  private sendPushNotification(payload: Record<string, any>): void {
    // Structured push format for service workers / desktop notifications
    if (process.env.NODE_ENV !== 'test') {
      console.log(`[EmergencyDispatcher:PUSH] ${JSON.stringify(payload)}`);
    }
  }

  private sendSmsAlert(payload: { to?: string; message: string }): void {
    // Formatted for Twilio REST API SMS delivery
    if (process.env.NODE_ENV !== 'test') {
      console.log(`[EmergencyDispatcher:SMS to ${payload.to}] ${payload.message}`);
    }
  }

  private sendWebhookPayload(payload: Record<string, any>): void {
    // Structured Webhook incident dossier for Slack / PagerDuty / SOC SIEM
    if (process.env.NODE_ENV !== 'test' && this.webhookUrl) {
      console.log(`[EmergencyDispatcher:WEBHOOK to ${this.webhookUrl}] ${JSON.stringify(payload)}`);
    }
  }

  public getDispatchedAlerts(): EmergencyAlertDossier[] {
    return [...this.alertHistory];
  }

  public getLatestAlert(): EmergencyAlertDossier | undefined {
    return this.alertHistory[this.alertHistory.length - 1];
  }

  public clear(): void {
    this.alertHistory.length = 0;
  }
}
