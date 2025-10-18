/**
 * Notification and Webhook System
 */

export interface NotificationPayload {
  event: 'target_hit' | 'stop_loss_hit' | 'signal_generated' | 'risk_alert';
  symbol: string;
  currentPrice: number;
  targetPrice?: number;
  stopLoss?: number;
  message: string;
  timestamp: Date;
  metadata?: Record<string, any>;
}

export class NotificationService {
  private webhookUrl: string;

  constructor(webhookUrl?: string) {
    this.webhookUrl = webhookUrl || process.env.WEBHOOK_URL || '';
  }

  /**
   * Send webhook notification
   */
  async sendWebhook(payload: NotificationPayload): Promise<boolean> {
    if (!this.webhookUrl) {
      console.warn('Webhook URL not configured');
      return false;
    }

    try {
      const response = await fetch(this.webhookUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        console.error('Webhook failed:', response.statusText);
        return false;
      }

      return true;
    } catch (error) {
      console.error('Webhook error:', error);
      return false;
    }
  }

  /**
   * Check if target price is hit
   */
  async checkTargetHit(
    symbol: string,
    currentPrice: number,
    targetPrice: number
  ): Promise<boolean> {
    if (currentPrice >= targetPrice) {
      await this.sendWebhook({
        event: 'target_hit',
        symbol,
        currentPrice,
        targetPrice,
        message: `🎯 Target hit for ${symbol}! Current: ₹${currentPrice}, Target: ₹${targetPrice}`,
        timestamp: new Date(),
      });
      return true;
    }
    return false;
  }

  /**
   * Check if stop loss is hit
   */
  async checkStopLoss(
    symbol: string,
    currentPrice: number,
    stopLoss: number
  ): Promise<boolean> {
    if (currentPrice <= stopLoss) {
      await this.sendWebhook({
        event: 'stop_loss_hit',
        symbol,
        currentPrice,
        stopLoss,
        message: `🛑 Stop loss hit for ${symbol}! Current: ₹${currentPrice}, Stop Loss: ₹${stopLoss}`,
        timestamp: new Date(),
      });
      return true;
    }
    return false;
  }

  /**
   * Send signal notification
   */
  async notifySignal(
    symbol: string,
    signalType: 'BUY' | 'SELL',
    confidence: number,
    currentPrice: number,
    targetPrice?: number,
    stopLoss?: number
  ): Promise<void> {
    const emoji = signalType === 'BUY' ? '📈' : '📉';
    let message = `${emoji} ${signalType} signal for ${symbol} (Confidence: ${confidence}%)\n`;
    message += `Current Price: ₹${currentPrice}`;

    if (targetPrice) {
      message += `\nTarget: ₹${targetPrice}`;
    }
    if (stopLoss) {
      message += `\nStop Loss: ₹${stopLoss}`;
    }

    await this.sendWebhook({
      event: 'signal_generated',
      symbol,
      currentPrice,
      targetPrice,
      stopLoss,
      message,
      timestamp: new Date(),
      metadata: { signalType, confidence },
    });
  }

  /**
   * Send risk alert
   */
  async notifyRiskAlert(
    symbol: string,
    riskLevel: string,
    riskScore: number,
    currentPrice: number
  ): Promise<void> {
    await this.sendWebhook({
      event: 'risk_alert',
      symbol,
      currentPrice,
      message: `⚠️ ${riskLevel} risk detected for ${symbol} (Score: ${riskScore})`,
      timestamp: new Date(),
      metadata: { riskLevel, riskScore },
    });
  }
}

// Singleton instance
export const notificationService = new NotificationService();

/**
 * Helper functions
 */
export async function checkTargetHit(
  symbol: string,
  currentPrice: number,
  targetPrice: number
): Promise<boolean> {
  return notificationService.checkTargetHit(symbol, currentPrice, targetPrice);
}

export async function checkStopLoss(
  symbol: string,
  currentPrice: number,
  stopLoss: number
): Promise<boolean> {
  return notificationService.checkStopLoss(symbol, currentPrice, stopLoss);
}
