import { NextRequest, NextResponse } from 'next/server';

// eBay API configuration
const EBAY_APP_ID = process.env.EBAY_APP_ID || '';
const EBAY_CERT_ID = process.env.EBAY_CERT_ID || '';
const EBAY_ENVIRONMENT = process.env.EBAY_ENVIRONMENT || 'production';

const EBAY_API_BASE = EBAY_ENVIRONMENT === 'sandbox'
  ? 'https://api.sandbox.ebay.com'
  : 'https://api.ebay.com';

const MARKETPLACE_IDS: Record<string, string> = {
  'US': 'EBAY_US', 'GB': 'EBAY_GB', 'CA': 'EBAY_CA', 'AU': 'EBAY_AU',
  'DE': 'EBAY_DE', 'FR': 'EBAY_FR', 'ES': 'EBAY_ES', 'IT': 'EBAY_IT', 'PT': 'EBAY_PT',
};

async function getAccessToken(): Promise<string> {
  if (!EBAY_APP_ID || !EBAY_CERT_ID) {
    throw new Error('Missing eBay credentials');
  }
  
  const credentials = Buffer.from(`${EBAY_APP_ID}:${EBAY_CERT_ID}`).toString('base64');
  const response = await fetch(`${EBAY_API_BASE}/identity/v1/oauth2/token`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
      'Authorization': `Basic ${credentials}`,
    },
    body: 'grant_type=client_credentials&scope=https://api.ebay.com/oauth/api_scope',
  });
  
  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`OAuth failed: ${response.statusText}`);
  }
  
  const data = await response.json();
  return data.access_token;
}

const CONDITION_MAP: Record<string, string> = {
  '3000': 'Used', '3001': 'Used - Very Good', '3002': 'Used - Good',
  '3003': 'Used - Acceptable', '3004': 'New', '3005': 'New - Other',
  '3006': 'New - With Defects', '3007': 'Refurbished', '3008': 'Used - Like New',
};

function transformSold(item: any, query: string) {
  let price = 0;
  if (item.price?.value) price = parseFloat(item.price.value);
  else if (item.currentPrice?.value) price = parseFloat(item.currentPrice.value);
  else if (typeof item.price === 'number') price = item.price;

  let condition = 'Unknown';
  if (item.condition) {
    if (typeof item.condition === 'string') condition = item.condition;
    else if (item.condition?.conditionId) condition = CONDITION_MAP[item.condition.conditionId] || 'Unknown';
  }

  let image = item.image?.imageUrl || item.thumbnailImages?.[0]?.imageUrl || null;

  return {
    title: item.title,
    image,
    soldDate: item.soldDate ? new Date(item.soldDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : '',
    soldDateRaw: item.soldDate ? item.soldDate.split('T')[0] : '',
    price,
    soldPrice: price,
    currency: item.price?.currency || 'USD',
    condition,
    url: item.itemWebUrl || `https://www.ebay.com/sch/i.html?_nkw=${encodeURIComponent(query)}`,
  };
}

function calculateStats(listings: any[]) {
  const prices = listings.map(l => l.price).filter(p => p > 0).sort((a, b) => a - b);
  if (prices.length === 0) return { min: 0, max: 0, average: 0, median: 0, count: 0 };
  const sum = prices.reduce((a, b) => a + b, 0);
  const avg = Math.round((sum / prices.length) * 100) / 100;
  
  let mid: number;
  if (prices.length % 2 === 0) {
    mid = Math.round(((prices[prices.length / 2 - 1] + prices[prices.length / 2]) / 2 * 100) / 100);
  } else {
    mid = prices[Math.floor(prices.length / 2)];
  }
  
  return { min: prices[0], max: prices[prices.length - 1], average: avg, median: mid, count: prices.length };
}

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const query = searchParams.get('q') || '';
  const marketplace = searchParams.get('marketplace') || 'GB';
  const condition = searchParams.get('condition') || 'all';
  const useMock = searchParams.get('mock') === 'true';

  if (!query) return NextResponse.json({ error: 'Query required' }, { status: 400 });

  // Use mock data if requested
  if (useMock || !EBAY_APP_ID || !EBAY_CERT_ID) {
    const mockListings = [
      {
        title: `${query} - Excellent Condition`,
        image: null,
        soldDate: 'Feb 5, 2026',
        soldDateRaw: '2026-02-05',
        price: 45.00,
        soldPrice: 45.00,
        currency: marketplace === 'PT' ? 'BRL' : marketplace === 'GB' ? 'GBP' : marketplace === 'AU' ? 'AUD' : 'USD',
        condition: 'Used - Very Good',
        url: 'https://www.ebay.com/itm/mock1'
      },
      {
        title: `${query} - Good Condition`,
        image: null,
        soldDate: 'Feb 3, 2026',
        soldDateRaw: '2026-02-03',
        price: 38.50,
        soldPrice: 38.50,
        currency: marketplace === 'PT' ? 'BRL' : marketplace === 'GB' ? 'GBP' : marketplace === 'AU' ? 'AUD' : 'USD',
        condition: 'Used - Good',
        url: 'https://www.ebay.com/itm/mock2'
      },
      {
        title: `New ${query} - Sealed`,
        image: null,
        soldDate: 'Feb 1, 2026',
        soldDateRaw: '2026-02-01',
        price: 65.00,
        soldPrice: 65.00,
        currency: marketplace === 'PT' ? 'BRL' : marketplace === 'GB' ? 'GBP' : marketplace === 'AU' ? 'AUD' : 'USD',
        condition: 'New',
        url: 'https://www.ebay.com/itm/mock3'
      }
    ];

    const prices = mockListings.map(l => l.price).sort((a, b) => a - b);
    const sum = prices.reduce((a, b) => a + b, 0);
    const avg = Math.round((sum / prices.length) * 100) / 100;
    let mid: number;
    if (prices.length % 2 === 0) {
      mid = Math.round(((prices[prices.length / 2 - 1] + prices[prices.length / 2]) / 2 * 100) / 100);
    } else {
      mid = prices[Math.floor(prices.length / 2)];
    }

    return NextResponse.json({
      query,
      listings: mockListings,
      stats: { min: prices[0], max: prices[prices.length - 1], average: avg, median: mid, count: prices.length },
      source: 'MOCK - eBay sold items API not available'
    });
  }

  try {
    const accessToken = await getAccessToken();
    const marketplaceId = MARKETPLACE_IDS[marketplace] || MARKETPLACE_IDS['US'];

    let filter = 'buyingOptions:FIXED_PRICE';
    if (condition !== 'all') filter += `,condition:${condition}`;

    const soldUrl = `${EBAY_API_BASE}/buy/browse/v1/item_summary/search?q=${encodeURIComponent(query)}&filter=${filter}&limit=50`;
    const soldRes = await fetch(soldUrl, { headers: { 'Authorization': `Bearer ${accessToken}`, 'X-EBAY-C-MARKETPLACE-ID': marketplaceId } });

    let listings: any[] = [];
    let stats = { min: 0, max: 0, average: 0, median: 0, count: 0 };

    if (soldRes.ok) {
      const data = await soldRes.json();
      listings = (data.itemSummaries || []).map((i: any) => transformSold(i, query));
      stats = calculateStats(listings);
    }

    return NextResponse.json({ query, listings, stats, source: 'eBay API' });
  } catch (error: any) {
    console.error('API error:', error);
    return NextResponse.json({ error: 'Failed', details: error.message }, { status: 500 });
  }
}
