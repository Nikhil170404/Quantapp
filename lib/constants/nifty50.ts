/**
 * Nifty 50 Stocks Master Data
 * Updated: October 2025
 */

export interface StockInfo {
  symbol: string; // Upstox format: NSE_EQ|ISIN
  name: string; // Full company name
  shortName: string; // Short name for display
  sector: string;
  isin: string;
  searchTerms: string[]; // Additional search terms for news
}

export const NIFTY50_STOCKS: StockInfo[] = [
  {
    symbol: 'NSE_EQ|INE002A01018',
    name: 'Reliance Industries Limited',
    shortName: 'Reliance',
    sector: 'Oil & Gas',
    isin: 'INE002A01018',
    searchTerms: ['Reliance Industries', 'RIL', 'Jio', 'Reliance Retail']
  },
  {
    symbol: 'NSE_EQ|INE040A01034',
    name: 'HDFC Bank Limited',
    shortName: 'HDFC Bank',
    sector: 'Financial Services',
    isin: 'INE040A01034',
    searchTerms: ['HDFC Bank', 'HDFCBANK']
  },
  {
    symbol: 'NSE_EQ|INE397D01024',
    name: 'Bharti Airtel Limited',
    shortName: 'Bharti Airtel',
    sector: 'Telecom',
    isin: 'INE397D01024',
    searchTerms: ['Bharti Airtel', 'Airtel']
  },
  {
    symbol: 'NSE_EQ|INE467B01029',
    name: 'Tata Consultancy Services Limited',
    shortName: 'TCS',
    sector: 'IT',
    isin: 'INE467B01029',
    searchTerms: ['TCS', 'Tata Consultancy Services']
  },
  {
    symbol: 'NSE_EQ|INE090A01021',
    name: 'ICICI Bank Limited',
    shortName: 'ICICI Bank',
    sector: 'Financial Services',
    isin: 'INE090A01021',
    searchTerms: ['ICICI Bank', 'ICICIBANK']
  },
  {
    symbol: 'NSE_EQ|INE062A01020',
    name: 'State Bank of India',
    shortName: 'SBI',
    sector: 'Financial Services',
    isin: 'INE062A01020',
    searchTerms: ['State Bank', 'SBI']
  },
  {
    symbol: 'NSE_EQ|INE296A01024',
    name: 'Bajaj Finance Limited',
    shortName: 'Bajaj Finance',
    sector: 'Financial Services',
    isin: 'INE296A01024',
    searchTerms: ['Bajaj Finance', 'BAJFINANCE']
  },
  {
    symbol: 'NSE_EQ|INE009A01021',
    name: 'Infosys Limited',
    shortName: 'Infosys',
    sector: 'IT',
    isin: 'INE009A01021',
    searchTerms: ['Infosys', 'INFY']
  },
  {
    symbol: 'NSE_EQ|INE030A01027',
    name: 'Hindustan Unilever Limited',
    shortName: 'HUL',
    sector: 'FMCG',
    isin: 'INE030A01027',
    searchTerms: ['Hindustan Unilever', 'HUL']
  },
  {
    symbol: 'NSE_EQ|INE018A01030',
    name: 'Larsen & Toubro Limited',
    shortName: 'L&T',
    sector: 'Construction',
    isin: 'INE018A01030',
    searchTerms: ['Larsen Toubro', 'L&T', 'LT']
  },
  {
    symbol: 'NSE_EQ|INE238A01034',
    name: 'Maruti Suzuki India Limited',
    shortName: 'Maruti Suzuki',
    sector: 'Automobile',
    isin: 'INE238A01034',
    searchTerms: ['Maruti Suzuki', 'Maruti']
  },
  {
    symbol: 'NSE_EQ|INE154A01025',
    name: 'ITC Limited',
    shortName: 'ITC',
    sector: 'FMCG',
    isin: 'INE154A01025',
    searchTerms: ['ITC Limited', 'ITC']
  },
  {
    symbol: 'NSE_EQ|INE101D01020',
    name: 'Mahindra & Mahindra Limited',
    shortName: 'M&M',
    sector: 'Automobile',
    isin: 'INE101D01020',
    searchTerms: ['Mahindra', 'M&M']
  },
  {
    symbol: 'NSE_EQ|INE237A01028',
    name: 'Kotak Mahindra Bank Limited',
    shortName: 'Kotak Bank',
    sector: 'Financial Services',
    isin: 'INE237A01028',
    searchTerms: ['Kotak Mahindra Bank', 'Kotak Bank']
  },
  {
    symbol: 'NSE_EQ|INE860A01027',
    name: 'HCL Technologies Limited',
    shortName: 'HCL Tech',
    sector: 'IT',
    isin: 'INE860A01027',
    searchTerms: ['HCL Technologies', 'HCL Tech']
  },
  {
    symbol: 'NSE_EQ|INE044A01036',
    name: 'Sun Pharmaceutical Industries Limited',
    shortName: 'Sun Pharma',
    sector: 'Pharma',
    isin: 'INE044A01036',
    searchTerms: ['Sun Pharma', 'Sun Pharmaceutical']
  },
  {
    symbol: 'NSE_EQ|INE238A01034',
    name: 'Axis Bank Limited',
    shortName: 'Axis Bank',
    sector: 'Financial Services',
    isin: 'INE238A01034',
    searchTerms: ['Axis Bank', 'AXISBANK']
  },
  {
    symbol: 'NSE_EQ|INE199A01024',
    name: 'UltraTech Cement Limited',
    shortName: 'UltraTech',
    sector: 'Cement',
    isin: 'INE199A01024',
    searchTerms: ['UltraTech Cement', 'UltraTech']
  },
  {
    symbol: 'NSE_EQ|INE758T01015',
    name: 'Zomato Limited',
    shortName: 'Zomato',
    sector: 'Consumer Services',
    isin: 'INE758T01015',
    searchTerms: ['Zomato']
  },
  {
    symbol: 'NSE_EQ|INE918I01018',
    name: 'Bajaj Finserv Limited',
    shortName: 'Bajaj Finserv',
    sector: 'Financial Services',
    isin: 'INE918I01018',
    searchTerms: ['Bajaj Finserv']
  },
  {
    symbol: 'NSE_EQ|INE733E01010',
    name: 'NTPC Limited',
    shortName: 'NTPC',
    sector: 'Power',
    isin: 'INE733E01010',
    searchTerms: ['NTPC']
  },
  {
    symbol: 'NSE_EQ|INE685A01028',
    name: 'Titan Company Limited',
    shortName: 'Titan',
    sector: 'Consumer Goods',
    isin: 'INE685A01028',
    searchTerms: ['Titan Company', 'Titan']
  },
  {
    symbol: 'NSE_EQ|INE742F01042',
    name: 'Adani Ports and Special Economic Zone Limited',
    shortName: 'Adani Ports',
    sector: 'Infrastructure',
    isin: 'INE742F01042',
    searchTerms: ['Adani Ports']
  },
  {
    symbol: 'NSE_EQ|INE213A01029',
    name: 'Oil and Natural Gas Corporation Limited',
    shortName: 'ONGC',
    sector: 'Oil & Gas',
    isin: 'INE213A01029',
    searchTerms: ['ONGC', 'Oil Natural Gas Corporation']
  },
  {
    symbol: 'NSE_EQ|INE263A01024',
    name: 'Bharat Electronics Limited',
    shortName: 'BEL',
    sector: 'Defense',
    isin: 'INE263A01024',
    searchTerms: ['Bharat Electronics', 'BEL']
  },
  {
    symbol: 'NSE_EQ|INE423A01024',
    name: 'Adani Enterprises Limited',
    shortName: 'Adani Enterprises',
    sector: 'Diversified',
    isin: 'INE423A01024',
    searchTerms: ['Adani Enterprises']
  },
  {
    symbol: 'NSE_EQ|INE019A01038',
    name: 'JSW Steel Limited',
    shortName: 'JSW Steel',
    sector: 'Steel',
    isin: 'INE019A01038',
    searchTerms: ['JSW Steel']
  },
  {
    symbol: 'NSE_EQ|INE752E01010',
    name: 'Power Grid Corporation of India Limited',
    shortName: 'Power Grid',
    sector: 'Power',
    isin: 'INE752E01010',
    searchTerms: ['Power Grid Corporation']
  },
  {
    symbol: 'NSE_EQ|INE121J01017',
    name: 'Coal India Limited',
    shortName: 'Coal India',
    sector: 'Mining',
    isin: 'INE121J01017',
    searchTerms: ['Coal India']
  },
  {
    symbol: 'NSE_EQ|INE571A01038',
    name: 'Wipro Limited',
    shortName: 'Wipro',
    sector: 'IT',
    isin: 'INE571A01038',
    searchTerms: ['Wipro']
  },
  {
    symbol: 'NSE_EQ|INE216A01030',
    name: 'Tata Steel Limited',
    shortName: 'Tata Steel',
    sector: 'Steel',
    isin: 'INE216A01030',
    searchTerms: ['Tata Steel']
  },
  {
    symbol: 'NSE_EQ|INE481G01011',
    name: 'Nestle India Limited',
    shortName: 'Nestle',
    sector: 'FMCG',
    isin: 'INE481G01011',
    searchTerms: ['Nestle India']
  },
  {
    symbol: 'NSE_EQ|INE127D01025',
    name: 'Shriram Finance Limited',
    shortName: 'Shriram Finance',
    sector: 'Financial Services',
    isin: 'INE127D01025',
    searchTerms: ['Shriram Finance']
  },
  {
    symbol: 'NSE_EQ|INE448A01027',
    name: 'Tata Motors Limited',
    shortName: 'Tata Motors',
    sector: 'Automobile',
    isin: 'INE448A01027',
    searchTerms: ['Tata Motors']
  },
  {
    symbol: 'NSE_EQ|INE481Q01024',
    name: 'British American Tobacco India Limited',
    shortName: 'BAT India',
    sector: 'FMCG',
    isin: 'INE481Q01024',
    searchTerms: ['British American Tobacco']
  },
  {
    symbol: 'NSE_EQ|INE155A01022',
    name: 'Grasim Industries Limited',
    shortName: 'Grasim',
    sector: 'Diversified',
    isin: 'INE155A01022',
    searchTerms: ['Grasim Industries']
  },
  {
    symbol: 'NSE_EQ|INE855B01025',
    name: 'Tech Mahindra Limited',
    shortName: 'Tech Mahindra',
    sector: 'IT',
    isin: 'INE855B01025',
    searchTerms: ['Tech Mahindra']
  },
  {
    symbol: 'NSE_EQ|INE070A01015',
    name: 'Hero MotoCorp Limited',
    shortName: 'Hero MotoCorp',
    sector: 'Automobile',
    isin: 'INE070A01015',
    searchTerms: ['Hero MotoCorp', 'Hero']
  },
  {
    symbol: 'NSE_EQ|INE059A01026',
    name: 'Cipla Limited',
    shortName: 'Cipla',
    sector: 'Pharma',
    isin: 'INE059A01026',
    searchTerms: ['Cipla']
  },
  {
    symbol: 'NSE_EQ|INE647O01011',
    name: 'SBI Life Insurance Company Limited',
    shortName: 'SBI Life',
    sector: 'Financial Services',
    isin: 'INE647O01011',
    searchTerms: ['SBI Life Insurance']
  },
  {
    symbol: 'NSE_EQ|INE205A01025',
    name: 'Hindalco Industries Limited',
    shortName: 'Hindalco',
    sector: 'Metals',
    isin: 'INE205A01025',
    searchTerms: ['Hindalco Industries']
  },
  {
    symbol: 'NSE_EQ|INE488A01026',
    name: 'Trent Limited',
    shortName: 'Trent',
    sector: 'Retail',
    isin: 'INE488A01026',
    searchTerms: ['Trent', 'Westside']
  },
  {
    symbol: 'NSE_EQ|INE795G01014',
    name: 'HDFC Life Insurance Company Limited',
    shortName: 'HDFC Life',
    sector: 'Financial Services',
    isin: 'INE795G01014',
    searchTerms: ['HDFC Life Insurance']
  },
  {
    symbol: 'NSE_EQ|INE180A01020',
    name: 'Asian Paints Limited',
    shortName: 'Asian Paints',
    sector: 'Paints',
    isin: 'INE180A01020',
    searchTerms: ['Asian Paints']
  },
  {
    symbol: 'NSE_EQ|INE010B01027',
    name: 'IndusInd Bank Limited',
    shortName: 'IndusInd Bank',
    sector: 'Financial Services',
    isin: 'INE010B01027',
    searchTerms: ['IndusInd Bank']
  },
  {
    symbol: 'NSE_EQ|INE755A01028',
    name: 'Eicher Motors Limited',
    shortName: 'Eicher Motors',
    sector: 'Automobile',
    isin: 'INE755A01028',
    searchTerms: ['Eicher Motors', 'Royal Enfield']
  },
  {
    symbol: 'NSE_EQ|INE192R01011',
    name: 'LTIMindtree Limited',
    shortName: 'LTIMindtree',
    sector: 'IT',
    isin: 'INE192R01011',
    searchTerms: ['LTIMindtree', 'LTI Mindtree']
  },
  {
    symbol: 'NSE_EQ|INE015A01024',
    name: 'Divi\'s Laboratories Limited',
    shortName: 'Divi\'s Labs',
    sector: 'Pharma',
    isin: 'INE015A01024',
    searchTerms: ['Divis Laboratories']
  },
  {
    symbol: 'NSE_EQ|INE117A01022',
    name: 'Adani Total Gas Limited',
    shortName: 'Adani Total Gas',
    sector: 'Oil & Gas',
    isin: 'INE117A01022',
    searchTerms: ['Adani Total Gas', 'Adani Gas']
  },
  {
    symbol: 'NSE_EQ|INE001A01036',
    name: 'Bharat Petroleum Corporation Limited',
    shortName: 'BPCL',
    sector: 'Oil & Gas',
    isin: 'INE001A01036',
    searchTerms: ['Bharat Petroleum', 'BPCL']
  },
];

/**
 * Get stock info by symbol
 */
export function getStockInfo(symbol: string): StockInfo | undefined {
  return NIFTY50_STOCKS.find(stock => stock.symbol === symbol);
}

/**
 * Get all symbols for batch processing
 */
export function getAllSymbols(): string[] {
  return NIFTY50_STOCKS.map(stock => stock.symbol);
}

/**
 * Get stocks by sector
 */
export function getStocksBySector(sector: string): StockInfo[] {
  return NIFTY50_STOCKS.filter(stock => stock.sector === sector);
}

/**
 * Get all unique sectors
 */
export function getAllSectors(): string[] {
  const sectors = [...new Set(NIFTY50_STOCKS.map(stock => stock.sector))];
  return sectors.sort();
}

/**
 * Market timing helpers
 */
export const MARKET_HOURS = {
  openTime: '09:15',
  closeTime: '15:30',
  timezone: 'Asia/Kolkata'
};

export function isMarketOpen(): boolean {
  const now = new Date();
  const dayOfWeek = now.getDay(); // 0 = Sunday, 6 = Saturday
  
  // Market closed on weekends
  if (dayOfWeek === 0 || dayOfWeek === 6) {
    return false;
  }
  
  // Get IST time
  const istTime = new Date(now.toLocaleString('en-US', { timeZone: MARKET_HOURS.timezone }));
  const hours = istTime.getHours();
  const minutes = istTime.getMinutes();
  const currentTime = hours * 60 + minutes;
  
  // Market hours: 9:15 AM to 3:30 PM IST
  const openTime = 9 * 60 + 15; // 9:15 AM
  const closeTime = 15 * 60 + 30; // 3:30 PM
  
  return currentTime >= openTime && currentTime <= closeTime;
}

export function getMarketStatus(): {
  isOpen: boolean;
  message: string;
  nextOpenTime?: string;
} {
  const isOpen = isMarketOpen();
  
  if (isOpen) {
    return {
      isOpen: true,
      message: '🟢 Market is OPEN'
    };
  }
  
  const now = new Date();
  const dayOfWeek = now.getDay();
  
  if (dayOfWeek === 0) {
    return {
      isOpen: false,
      message: '🔴 Market is CLOSED (Sunday)',
      nextOpenTime: 'Monday 9:15 AM IST'
    };
  }
  
  if (dayOfWeek === 6) {
    return {
      isOpen: false,
      message: '🔴 Market is CLOSED (Saturday)',
      nextOpenTime: 'Monday 9:15 AM IST'
    };
  }
  
  return {
    isOpen: false,
    message: '🔴 Market is CLOSED (After hours)',
    nextOpenTime: 'Tomorrow 9:15 AM IST'
  };
}