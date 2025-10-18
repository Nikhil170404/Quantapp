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
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
    'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Safari/605.1.15',
    'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:121.0) Gecko/20100101 Firefox/121.0',
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
   * Scrape news from DuckDuckGo search with optional search terms
   */
  async scrapeNews(
    query: string,
    maxResults: number = 10,
    searchTerms?: string[]
  ): Promise<NewsItem[]> {
    try {
      await this.delay();

      // Use search terms if provided, otherwise use query
      const searchQuery = searchTerms && searchTerms.length > 0
        ? `${searchTerms[0]} stock news India latest 2025`
        : `${query} stock news India latest 2025`;

      console.log('Searching news for:', searchQuery);

      const response = await axios.get(
        `https://duckduckgo.com/html/?q=${encodeURIComponent(searchQuery)}`,
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
          timeout: 15000,
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
            source: 'Web Search',
            timestamp: new Date(),
          });
        }
      });

      console.log(`Found ${results.length} news items for ${query}`);
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
   * Enhanced sentiment analysis with more keywords
   */
  analyzeSentiment(text: string): {
    sentiment: 'positive' | 'negative' | 'neutral';
    score: number; // -1 to 1
  } {
    const positiveKeywords = [
      'profit', 'growth', 'bullish', 'surge', 'rally', 'gain', 'rise',
      'up', 'high', 'record', 'strong', 'outperform', 'beat', 'upgrade',
      'buy', 'positive', 'breakout', 'momentum', 'expansion', 'success',
      'innovation', 'milestone', 'achievement', 'boost', 'increase',
      'soar', 'jump', 'advance', 'recovery', 'improvement', 'optimistic'
    ];

    const negativeKeywords = [
      'loss', 'decline', 'bearish', 'crash', 'drop', 'fall', 'down',
      'low', 'weak', 'underperform', 'miss', 'downgrade', 'sell',
      'negative', 'breakdown', 'concern', 'risk', 'slump', 'plunge',
      'tumble', 'decrease', 'warning', 'caution', 'struggle', 'challenge',
      'pressure', 'debt', 'default', 'fraud', 'scandal', 'crisis'
    ];

    const lowerText = text.toLowerCase();
    let score = 0;

    positiveKeywords.forEach((keyword) => {
      const matches = (lowerText.match(new RegExp(`\\b${keyword}\\b`, 'g')) || []).length;
      score += matches;
    });

    negativeKeywords.forEach((keyword) => {
      const matches = (lowerText.match(new RegExp(`\\b${keyword}\\b`, 'g')) || []).length;
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
    maxResults: number = 10,
    searchTerms?: string[]
  ): Promise<Array<NewsItem & { sentiment: string; sentimentScore: number }>> {
    const news = await this.scrapeNews(symbol, maxResults, searchTerms);

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