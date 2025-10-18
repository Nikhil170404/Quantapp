import axios from 'axios';
import * as cheerio from 'cheerio';

export interface NewsItem {
  title: string;
  snippet: string;
  url?: string;
  source?: string;
  timestamp: Date;
}

export class NewsScraper {
  private userAgents = [
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
    'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/14.1.1 Safari/605.1.15',
    'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/92.0.4515.107 Safari/537.36',
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:90.0) Gecko/20100101 Firefox/90.0',
  ];

  private lastRequestTime: number = 0;
  private minDelay: number = 8000; // 8 seconds minimum delay

  /**
   * Add random delay to avoid rate limiting
   */
  private async delay(ms?: number): Promise<void> {
    const delayTime = ms || Math.random() * 6000 + this.minDelay;

    // Ensure minimum time between requests
    const timeSinceLastRequest = Date.now() - this.lastRequestTime;
    if (timeSinceLastRequest < this.minDelay) {
      await new Promise((resolve) =>
        setTimeout(resolve, this.minDelay - timeSinceLastRequest)
      );
    }

    await new Promise((resolve) => setTimeout(resolve, delayTime));
    this.lastRequestTime = Date.now();
  }

  /**
   * Get random user agent
   */
  private getRandomUserAgent(): string {
    return this.userAgents[Math.floor(Math.random() * this.userAgents.length)];
  }

  /**
   * Scrape news from DuckDuckGo search
   */
  async scrapeNews(query: string, maxResults: number = 10): Promise<NewsItem[]> {
    try {
      await this.delay();

      const response = await axios.get(
        `https://duckduckgo.com/html/?q=${encodeURIComponent(query + ' stock news')}`,
        {
          headers: {
            'User-Agent': this.getRandomUserAgent(),
            'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
            'Accept-Language': 'en-US,en;q=0.5',
            'Accept-Encoding': 'gzip, deflate',
            'DNT': '1',
            'Connection': 'keep-alive',
            'Upgrade-Insecure-Requests': '1',
          },
          timeout: 10000,
        }
      );

      const $ = cheerio.load(response.data);
      const results: NewsItem[] = [];

      $('.result').each((i, elem) => {
        if (i >= maxResults) return false;

        const title = $(elem).find('.result__title').text().trim();
        const snippet = $(elem).find('.result__snippet').text().trim();
        const url = $(elem).find('.result__url').attr('href');

        if (title && snippet) {
          results.push({
            title,
            snippet,
            url: url || undefined,
            source: 'DuckDuckGo',
            timestamp: new Date(),
          });
        }
      });

      return results;
    } catch (error) {
      console.error('News scraping error:', error);
      return [];
    }
  }

  /**
   * Scrape news for multiple stocks (with delays)
   */
  async scrapeMultipleStocks(
    symbols: string[],
    maxResultsPerStock: number = 5
  ): Promise<Record<string, NewsItem[]>> {
    const results: Record<string, NewsItem[]> = {};

    for (const symbol of symbols) {
      try {
        const news = await this.scrapeNews(symbol, maxResultsPerStock);
        results[symbol] = news;
      } catch (error) {
        console.error(`Error scraping news for ${symbol}:`, error);
        results[symbol] = [];
      }
    }

    return results;
  }

  /**
   * Simple sentiment analysis based on keywords
   */
  analyzeSentiment(text: string): {
    sentiment: 'positive' | 'negative' | 'neutral';
    score: number; // -1 to 1
  } {
    const positiveKeywords = [
      'profit',
      'growth',
      'bullish',
      'surge',
      'rally',
      'gain',
      'rise',
      'up',
      'high',
      'record',
      'strong',
      'outperform',
      'beat',
      'upgrade',
      'buy',
      'positive',
      'breakout',
      'momentum',
    ];

    const negativeKeywords = [
      'loss',
      'decline',
      'bearish',
      'crash',
      'drop',
      'fall',
      'down',
      'low',
      'weak',
      'underperform',
      'miss',
      'downgrade',
      'sell',
      'negative',
      'breakdown',
      'concern',
      'risk',
    ];

    const lowerText = text.toLowerCase();
    let score = 0;

    positiveKeywords.forEach((keyword) => {
      const matches = (lowerText.match(new RegExp(keyword, 'g')) || []).length;
      score += matches;
    });

    negativeKeywords.forEach((keyword) => {
      const matches = (lowerText.match(new RegExp(keyword, 'g')) || []).length;
      score -= matches;
    });

    // Normalize score to -1 to 1
    const normalizedScore = Math.max(-1, Math.min(1, score / 10));

    let sentiment: 'positive' | 'negative' | 'neutral';
    if (normalizedScore > 0.2) sentiment = 'positive';
    else if (normalizedScore < -0.2) sentiment = 'negative';
    else sentiment = 'neutral';

    return {
      sentiment,
      score: Number(normalizedScore.toFixed(2)),
    };
  }

  /**
   * Get news with sentiment analysis
   */
  async getNewsWithSentiment(
    symbol: string,
    maxResults: number = 10
  ): Promise<Array<NewsItem & { sentiment: string; sentimentScore: number }>> {
    const news = await this.scrapeNews(symbol, maxResults);

    return news.map((item) => {
      const analysis = this.analyzeSentiment(item.title + ' ' + item.snippet);
      return {
        ...item,
        sentiment: analysis.sentiment,
        sentimentScore: analysis.score,
      };
    });
  }
}

// Singleton instance
export const newsScraper = new NewsScraper();
