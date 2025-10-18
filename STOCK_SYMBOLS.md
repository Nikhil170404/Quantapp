# Upstox Stock Symbols Reference

## Popular NSE Stocks (Equity)

Format: `NSE_EQ|ISIN_CODE`

### Nifty 50 Stocks

| Company | Symbol | ISIN Code |
|---------|--------|-----------|
| Reliance Industries | `NSE_EQ\|INE002A01018` | INE002A01018 |
| TCS | `NSE_EQ\|INE467B01029` | INE467B01029 |
| HDFC Bank | `NSE_EQ\|INE040A01034` | INE040A01034 |
| Infosys | `NSE_EQ\|INE009A01021` | INE009A01021 |
| ICICI Bank | `NSE_EQ\|INE090A01021` | INE090A01021 |
| Bharti Airtel | `NSE_EQ\|INE397D01024` | INE397D01024 |
| SBI | `NSE_EQ\|INE062A01020` | INE062A01020 |
| Wipro | `NSE_EQ\|INE075A01022` | INE075A01022 |
| HCL Tech | `NSE_EQ\|INE860A01027` | INE860A01027 |
| Axis Bank | `NSE_EQ\|INE238A01034` | INE238A01034 |
| ITC | `NSE_EQ\|INE154A01025` | INE154A01025 |
| Larsen & Toubro | `NSE_EQ\|INE018A01030` | INE018A01030 |
| Kotak Mahindra Bank | `NSE_EQ\|INE237A01028` | INE237A01028 |
| Asian Paints | `NSE_EQ\|INE021A01026` | INE021A01026 |
| Maruti Suzuki | `NSE_EQ\|INE585B01010` | INE585B01010 |
| Titan | `NSE_EQ\|INE280A01028` | INE280A01028 |
| Bajaj Finance | `NSE_EQ\|INE296A01024` | INE296A01024 |
| Ultratech Cement | `NSE_EQ\|INE481G01011` | INE481G01011 |
| Tech Mahindra | `NSE_EQ\|INE669C01036` | INE669C01036 |
| Sun Pharma | `NSE_EQ\|INE044A01036` | INE044A01036 |

### IT Sector
| Company | Symbol | ISIN Code |
|---------|--------|-----------|
| TCS | `NSE_EQ\|INE467B01029` | INE467B01029 |
| Infosys | `NSE_EQ\|INE009A01021` | INE009A01021 |
| Wipro | `NSE_EQ\|INE075A01022` | INE075A01022 |
| HCL Tech | `NSE_EQ\|INE860A01027` | INE860A01027 |
| Tech Mahindra | `NSE_EQ\|INE669C01036` | INE669C01036 |
| LTI Mindtree | `NSE_EQ\|INE214T01019` | INE214T01019 |
| Mphasis | `NSE_EQ\|INE356A01018` | INE356A01018 |
| Coforge | `NSE_EQ\|INE591G01017` | INE591G01017 |

### Banking Sector
| Company | Symbol | ISIN Code |
|---------|--------|-----------|
| HDFC Bank | `NSE_EQ\|INE040A01034` | INE040A01034 |
| ICICI Bank | `NSE_EQ\|INE090A01021` | INE090A01021 |
| SBI | `NSE_EQ\|INE062A01020` | INE062A01020 |
| Axis Bank | `NSE_EQ\|INE238A01034` | INE238A01034 |
| Kotak Mahindra Bank | `NSE_EQ\|INE237A01028` | INE237A01028 |
| IndusInd Bank | `NSE_EQ\|INE095A01012` | INE095A01012 |
| Punjab National Bank | `NSE_EQ\|INE160A01022` | INE160A01022 |
| Bank of Baroda | `NSE_EQ\|INE028A01039` | INE028A01039 |

### Pharma Sector
| Company | Symbol | ISIN Code |
|---------|--------|-----------|
| Sun Pharma | `NSE_EQ\|INE044A01036` | INE044A01036 |
| Cipla | `NSE_EQ\|INE059A01026` | INE059A01026 |
| Dr. Reddy's | `NSE_EQ\|INE089A01023` | INE089A01023 |
| Divi's Lab | `NSE_EQ\|INE361B01024` | INE361B01024 |
| Biocon | `NSE_EQ\|INE376G01013` | INE376G01013 |

### Auto Sector
| Company | Symbol | ISIN Code |
|---------|--------|-----------|
| Maruti Suzuki | `NSE_EQ\|INE585B01010` | INE585B01010 |
| Tata Motors | `NSE_EQ\|INE155A01022` | INE155A01022 |
| Mahindra & Mahindra | `NSE_EQ\|INE101A01026` | INE101A01026 |
| Bajaj Auto | `NSE_EQ\|INE917I01010` | INE917I01010 |
| Eicher Motors | `NSE_EQ\|INE066A01021` | INE066A01021 |

## NSE Indices

Format: `NSE_INDEX|{INDEX_NAME}`

| Index | Symbol |
|-------|--------|
| Nifty 50 | `NSE_INDEX\|Nifty 50` |
| Nifty Bank | `NSE_INDEX\|Nifty Bank` |
| Nifty IT | `NSE_INDEX\|Nifty IT` |
| Nifty Pharma | `NSE_INDEX\|Nifty Pharma` |
| Nifty Auto | `NSE_INDEX\|Nifty Auto` |
| Nifty FMCG | `NSE_INDEX\|Nifty FMCG` |
| Nifty Midcap 100 | `NSE_INDEX\|NIFTY MIDCAP 100` |

## BSE Stocks (Equity)

Format: `BSE_EQ|{SCRIP_CODE}`

| Company | Symbol | Scrip Code |
|---------|--------|------------|
| Reliance | `BSE_EQ\|500325` | 500325 |
| TCS | `BSE_EQ\|532540` | 532540 |
| HDFC Bank | `BSE_EQ\|500180` | 500180 |
| Infosys | `BSE_EQ\|500209` | 500209 |
| ICICI Bank | `BSE_EQ\|532174` | 532174 |

## How to Use

### Example 1: Get Signal for Reliance
```bash
curl "http://localhost:3000/api/stocks/signals?symbol=NSE_EQ|INE002A01018"
```

### Example 2: Get Historical Data for TCS
```bash
curl "http://localhost:3000/api/stocks/historical?symbol=NSE_EQ|INE467B01029&interval=1day&days=90"
```

### Example 3: Batch Signals
```bash
curl -X POST "http://localhost:3000/api/stocks/signals" \
  -H "Content-Type: application/json" \
  -d '{
    "symbols": [
      "NSE_EQ|INE002A01018",
      "NSE_EQ|INE467B01029",
      "NSE_EQ|INE040A01034"
    ]
  }'
```

## Finding More Symbols

### Method 1: Download Instrument List
```bash
# Download NSE instruments
curl "https://assets.upstox.com/market-quote/instruments/exchange/NSE" -o nse_instruments.csv

# Download BSE instruments
curl "https://assets.upstox.com/market-quote/instruments/exchange/BSE" -o bse_instruments.csv
```

### Method 2: Use Upstox API
```bash
curl -X GET "https://api.upstox.com/v2/market-quote/ltp?symbol=NSE_EQ|INE002A01018" \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN"
```

## Symbol Format Rules

### NSE Equity
- **Format**: `NSE_EQ|{ISIN_CODE}`
- **Example**: `NSE_EQ|INE002A01018`
- ISIN codes are 12 characters (INE + 9 alphanumeric)

### BSE Equity
- **Format**: `BSE_EQ|{SCRIP_CODE}`
- **Example**: `BSE_EQ|500325`
- Scrip codes are 6 digits

### NSE Indices
- **Format**: `NSE_INDEX|{INDEX_NAME}`
- **Example**: `NSE_INDEX|Nifty 50`
- Name should match exactly (case-sensitive)

### NSE Futures (F&O)
- **Format**: `NSE_FO|{INSTRUMENT_KEY}`
- **Example**: `NSE_FO|54268` (Nifty Future)

### NSE Options
- **Format**: `NSE_FO|{INSTRUMENT_KEY}`
- Complex format with strike price and expiry

## Notes

1. **Market Hours**: NSE/BSE trading hours are 9:15 AM - 3:30 PM IST
2. **Holidays**: Market is closed on weekends and public holidays
3. **Corporate Actions**: Symbol format may change after stock splits, mergers, etc.
4. **Delisted Stocks**: Some symbols may become invalid if stocks are delisted
5. **New Listings**: IPO stocks get ISIN codes after listing

## Recommended Stocks for Testing

**Low Volatility** (Conservative):
- TCS (`NSE_EQ|INE467B01029`)
- HDFC Bank (`NSE_EQ|INE040A01034`)
- Asian Paints (`NSE_EQ|INE021A01026`)

**Medium Volatility** (Balanced):
- Infosys (`NSE_EQ|INE009A01021`)
- Reliance (`NSE_EQ|INE002A01018`)
- ICICI Bank (`NSE_EQ|INE090A01021`)

**High Volatility** (Aggressive):
- Tata Motors (`NSE_EQ|INE155A01022`)
- Adani Enterprises (`NSE_EQ|INE423A01024`)
- Yes Bank (`NSE_EQ|INE528G01035`)

---

**Last Updated**: 2024
**Source**: Upstox API Documentation
