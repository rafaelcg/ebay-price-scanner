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
  const credentials = Buffer.from(`${EBAY_APP_ID}:${EBAY_CERT_ID}`).toString('base64');
  const response = await fetch(`${EBAY_API_BASE}/identity/v1/oauth2/token`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
      'Authorization': `Basic ${credentials}`,
    },
    body: 'grant_type=client_credentials&scope=https://api.ebay.com/oauth/api_scope',
  });
  if (!response.ok) throw new Error(`Token failed: ${response.statusText}`);
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

function transformActive(item: any) {
  let price = 0;
  if (item.price?.value) price = parseFloat(item.price.value);
  else if (item.currentPrice?.value) price = parseFloat(item.currentPrice.value);

  let condition = 'Unknown';
  if (item.condition) {
    if (typeof item.condition === 'string') condition = item.condition;
    else if (item.condition?.conditionId) condition = CONDITION_MAP[item.condition.conditionId] || 'Unknown';
  }

  return {
    title: item.title,
    image: item.image?.imageUrl || item.thumbnailImages?.[0]?.imageUrl || null,
    price,
    currency: item.price?.currency || 'USD',
    condition,
    url: item.itemWebUrl || item.webUrl || '#',
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

  if (!query) return NextResponse.json({ error: 'Query required' }, { status: 400 });

  try {
    const accessToken = await getAccessToken();
    const marketplaceId = MARKETPLACE_IDS[marketplace] || MARKETPLACE_IDS['GB'];

    let filter = 'buyingOptions:FIXED_PRICE,soldItemsOnly:true';
    if (condition !== 'all') filter += `,condition:${condition}`;

    const soldUrl = `${EBAY_API_BASE}/buy/browse/v1/item_summary/search?q=${encodeURIComponent(query)}&filter=${filter}&limit=50`;
    const soldRes = await fetch(soldUrl, { headers: { 'Authorization': `Bearer ${accessToken}`, 'X-EBAY-C-MARKETPLACE-ID': marketplaceId } });

    let listings: any[] = [];
    let stats = { min: 0, max: 0, average: 0, median: 0, count: 0 };

    console.log('eBay API request:', { url: soldUrl, marketplaceId, filter, status: soldRes.status });

    if (soldRes.ok) {
      const data = await soldRes.json();
      console.log('eBay API response:', { total: data.total, count: data.itemSummaries?.length });
      listings = (data.itemSummaries || []).map((i: any) => transformSold(i, query));
      stats = calculateStats(listings);
    } else {
      const errorText = await soldRes.text();
      console.error('eBay API error:', soldRes.status, errorText.substring(0, 500));
    }

    return NextResponse.json({ query, listings, stats, source: 'eBay API' });
  } catch (error: any) {
    console.error('API error:', error);
    return NextResponse.json({ error: 'Failed', details: error.message }, { status: 500 });
  }
}
