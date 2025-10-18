'use client';

interface NewsItem {
  title: string;
  snippet: string;
  url?: string;
  source?: string;
  timestamp: Date;
  sentiment?: 'positive' | 'negative' | 'neutral';
  sentimentScore?: number;
}

interface NewsCardProps {
  news: NewsItem;
}

export default function NewsCard({ news }: NewsCardProps) {
  const sentimentColor = {
    positive: 'border-green-500 bg-green-500/10',
    negative: 'border-red-500 bg-red-500/10',
    neutral: 'border-gray-500 bg-gray-500/10',
  };

  const sentimentEmoji = {
    positive: '📈',
    negative: '📉',
    neutral: '➡️',
  };

  const sentimentText = {
    positive: 'Positive',
    negative: 'Negative',
    neutral: 'Neutral',
  };

  const sentimentBgColor = {
    positive: 'text-green-400 bg-green-500/20',
    negative: 'text-red-400 bg-red-500/20',
    neutral: 'text-gray-400 bg-gray-500/20',
  };

  const sentiment = news.sentiment || 'neutral';

  return (
    <div className={`border rounded-lg p-4 transition-all hover:shadow-lg hover:border-opacity-100 ${sentimentColor[sentiment]}`}>
      <div className="flex items-start justify-between gap-2 mb-2">
        <div className="flex-1">
          <a
            href={news.url}
            target="_blank"
            rel="noopener noreferrer"
            className="text-sm font-semibold text-white hover:text-primary-400 transition-colors line-clamp-2"
          >
            {news.title}
          </a>
        </div>
        <span className={`px-2 py-1 rounded text-xs font-medium flex-shrink-0 ${sentimentBgColor[sentiment]}`}>
          {sentimentEmoji[sentiment]} {sentimentText[sentiment]}
        </span>
      </div>

      <p className="text-xs text-gray-400 line-clamp-2 mb-2">
        {news.snippet}
      </p>

      <div className="flex items-center justify-between text-xs text-gray-500">
        <span>{news.source || 'Source'}</span>
        {news.sentimentScore !== undefined && (
          <span className={`font-medium ${
            news.sentimentScore > 0 ? 'text-green-400' :
            news.sentimentScore < 0 ? 'text-red-400' :
            'text-gray-400'
          }`}>
            Score: {news.sentimentScore.toFixed(2)}
          </span>
        )}
      </div>
    </div>
  );
}