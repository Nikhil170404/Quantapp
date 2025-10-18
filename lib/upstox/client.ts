import axios, { AxiosInstance } from 'axios';

export interface MarketQuote {
  symbol: string;
  ltp: number;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
  timestamp: string;
}

export interface HistoricalCandle {
  timestamp: string;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
  oi?: number;
}

export interface UpstoxConfig {
  apiKey?: string;
  apiSecret?: string;
  accessToken: string;
}

export class UpstoxClient {
  private baseUrl = 'https://api.upstox.com/v2';  // ✅ Correct API endpoint
  private accessToken: string;
  private client: AxiosInstance;

  constructor(config: UpstoxConfig) {
    this.accessToken = config.accessToken;
    this.client = axios.create({
      baseURL: this.baseUrl,
      headers: {
        'Authorization': `Bearer ${this.accessToken}`,
        'Accept': 'application/json',
      },
      timeout: 10000,
    });
  }

  /**
   * Get market quotes for multiple symbols
   * @param symbols Array of instrument keys (max 100)
   */
  async getMarketQuote(symbols: string[]): Promise<Record<string, MarketQuote>> {
    try {
      // Batch symbols (max 100 per request)
      const batches = this.chunkArray(symbols, 100);
      const results: Record<string, MarketQuote> = {};

      for (const batch of batches) {
        const response = await this.client.get('/market-quote/ltp', {
          params: {
            symbol: batch.join(','),
          },
        });

        Object.assign(results, response.data.data);
      }

      return results;
    } catch (error) {
      console.error('Error fetching market quotes:', error);
      throw error;
    }
  }

  /**
   * Get historical candle data
   * 
   * Valid intervals:
   * - 1minute: last 1 month candles
   * - 30minute: last 1 year candles  
   * - day: last 1 year candles
   * - week: last 10 years candles
   * - month: last 10 years candles
   * 
   * @param symbol Instrument key (e.g., "NSE_EQ|INE002A01018")
   * @param interval 1minute | 30minute | day | week | month
   * @param fromDate YYYY-MM-DD
   * @param toDate YYYY-MM-DD
   */
  async getHistoricalData(
    symbol: string,
    interval: string,
    fromDate: string,
    toDate: string
  ): Promise<HistoricalCandle[]> {
    try {
      // Validate interval
      const validIntervals = ['1minute', '30minute', 'day', 'week', 'month'];
      if (!validIntervals.includes(interval)) {
        throw new Error(`Invalid interval: ${interval}. Valid intervals are: ${validIntervals.join(', ')}`);
      }

      // URL encode the symbol to handle special characters like |
      const encodedSymbol = encodeURIComponent(symbol);
      
      // Format: /historical-candle/{instrument_key}/{interval}/{to_date}/{from_date}
      const url = `/historical-candle/${encodedSymbol}/${interval}/${toDate}/${fromDate}`;

      console.log('Upstox API Request:', {
        baseUrl: this.baseUrl,
        url,
        fullUrl: `${this.baseUrl}${url}`,
        symbol,
        encodedSymbol,
        interval,
        fromDate,
        toDate,
      });

      const response = await this.client.get(url);

      console.log('Upstox API Response Status:', response.status);
      console.log('Upstox API Response Data:', JSON.stringify(response.data).substring(0, 200));

      // Check if data exists
      if (!response.data || !response.data.data || !response.data.data.candles) {
        console.error('No candles in response:', response.data);
        throw new Error('No historical data available for this symbol');
      }

      // Transform candle data
      const candles = response.data.data.candles.map((candle: any[]) => ({
        timestamp: candle[0],
        open: candle[1],
        high: candle[2],
        low: candle[3],
        close: candle[4],
        volume: candle[5],
        oi: candle[6],
      }));

      console.log(`Successfully fetched ${candles.length} candles`);
      return candles;
    } catch (error: any) {
      console.error('Upstox API Error Details:', {
        status: error.response?.status,
        statusText: error.response?.statusText,
        data: error.response?.data,
        message: error.message,
      });

      // Better error message extraction
      if (error.response?.status === 400) {
        let errorMsg = 'Invalid request';
        
        // Try to extract error from response
        if (error.response?.data?.errors && Array.isArray(error.response.data.errors)) {
          const errorDetails = error.response.data.errors[0];
          errorMsg = errorDetails?.message || JSON.stringify(errorDetails);
          console.error('Detailed Error:', errorDetails);
        } else if (error.response?.data?.message) {
          errorMsg = error.response.data.message;
        }
        
        throw new Error(`Upstox API 400 Error: ${errorMsg}`);
      } else if (error.response?.status === 401) {
        throw new Error('Upstox API authentication failed. Your access token may be invalid or expired. Please generate a new one from https://upstox.com/api/dashboard');
      } else if (error.response?.status === 429) {
        throw new Error('Rate limit exceeded. Please try again later.');
      }

      throw error;
    }
  }

  /**
   * Get intraday candle data
   * @param symbol Instrument key
   * @param interval 1minute | 30minute
   */
  async getIntradayData(
    symbol: string,
    interval: string
  ): Promise<HistoricalCandle[]> {
    try {
      // URL encode the symbol
      const encodedSymbol = encodeURIComponent(symbol);

      const response = await this.client.get(
        `/historical-candle/intraday/${encodedSymbol}/${interval}`
      );

      if (!response.data || !response.data.data || !response.data.data.candles) {
        throw new Error('No intraday data available');
      }

      const candles = response.data.data.candles.map((candle: any[]) => ({
        timestamp: candle[0],
        open: candle[1],
        high: candle[2],
        low: candle[3],
        close: candle[4],
        volume: candle[5],
        oi: candle[6],
      }));

      return candles;
    } catch (error: any) {
      console.error('Error fetching intraday data:', error);

      if (error.response?.status === 401) {
        throw new Error('Upstox API authentication failed.');
      }

      throw error;
    }
  }

  /**
   * Get full market quote with OHLC
   */
  async getFullMarketQuote(symbols: string[]) {
    try {
      const response = await this.client.get('/market-quote/quotes', {
        params: {
          symbol: symbols.join(','),
        },
      });

      return response.data.data;
    } catch (error) {
      console.error('Error fetching full market quotes:', error);
      throw error;
    }
  }

  /**
   * Utility: Chunk array into smaller batches
   */
  private chunkArray<T>(array: T[], size: number): T[][] {
    const chunks: T[][] = [];
    for (let i = 0; i < array.length; i += size) {
      chunks.push(array.slice(i, i + size));
    }
    return chunks;
  }
}

// Default instance (uses env variables)
export const upstoxClient = new UpstoxClient({
  accessToken: process.env.UPSTOX_ACCESS_TOKEN || '',
});