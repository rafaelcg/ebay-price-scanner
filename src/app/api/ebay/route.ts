import { NextRequest, NextResponse } from 'next/server';

// eBay API configuration
const EBAY_APP_ID = process.env.EBAY_APP_ID || '';
const EBAY_CERT_ID = process.env.EBAY_CERT_ID || '';
const EBAY_ENVIRONMENT = process.env.EBAY_ENVIRONMENT || 'production';

const EBAY_API_BASE = EBAY_ENVIRONMENT === 'sandbox'
  ? 'https://api.sandbox.ebay.com'
  : 'https://api.ebay.com';

// Marketplace ID mapping
const MARKETPLACE_IDS: Record<string, string> = {
  'US': 'EBAY_US',
  'GB': 'EBAY_GB',
  'CA': 'EBAY_CA',
  'AU': 'EBAY_AU',
  'DE': 'EBAY_DE',
  'FR': 'EBAY_FR',
};

// Default to UK if not specified
const DEFAULT_MARKETPLACE = MARKETPLACE_IDS['GB'];

// Get OAuth access token using client credentials flow
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

  if (!response.ok) {
    throw new Error(`Failed to get access token: ${response.statusText}`);
  }

  const data = await response.json();
  return data.access_token;
}

// Map eBay condition IDs to human-readable labels
const CONDITION_MAP: Record<string, string> = {
  '3000': 'Used',
  '3001': 'Used - Very Good',
  '3002': 'Used - Good',
  '3003': 'Used - Acceptable',
  '3004': 'New',
  '3005': 'New - Other',
  '3006': 'New - With Defects',
  '3007': 'Refurbished',
  '3008': 'Used - Like New',
};

// Transform eBay API response to our format
function transformListings(items: any[], query: string): any[] {
  return items.map((item: any) => {
    // Debug: log the structure (remove in production)
    console.log('Item structure:', JSON.stringify(item, null, 2).substring(0, 500));

    // Handle different price formats
    let price = 0;
    if (item.price?.value) {
      price = parseFloat(item.price.value);
    } else if (item.currentPrice?.value) {
      price = parseFloat(item.currentPrice.value);
    } else if (typeof item.price === 'number') {
      price = item.price;
    }

    // Handle condition
    let condition = 'Unknown';
    if (item.condition) {
      if (typeof item.condition === 'string') {
        condition = item.condition;
      } else if (item.condition?.conditionId) {
        condition = CONDITION_MAP[item.condition.conditionId] || 'Unknown';
      }
    }

    // Handle image
    let image = null;
    if (item.image?.imageUrl) {
      image = item.image.imageUrl;
    } else if (item.thumbnailImages?.[0]?.imageUrl) {
      image = item.thumbnailImages[0].imageUrl;
    }

    return {
      title: item.title,
      image,
      soldDate: item.soldDate
        ? new Date(item.soldDate).toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric',
            year: 'numeric',
          })
        : new Date().toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric',
            year: 'numeric',
          }),
      price,
      soldPrice: price,
      currency: item.price?.currency || 'USD',
      condition,
      url: item.itemWebUrl || item.webUrl || `https://www.ebay.com/sch/i.html?_nkw=${encodeURIComponent(query)}`,
    };
  });
}

function calculateStats(listings: any[]): any {
  const prices = listings.map(l => l.price).filter(p => p > 0).sort((a, b) => a - b);
  const count = prices.length;

  if (count === 0) {
    return { min: 0, max: 0, average: 0, median: 0, count: 0 };
  }

  const sum = prices.reduce((a, b) => a + b, 0);
  const average = Math.round((sum / count) * 100) / 100;

  const median = count % 2 === 0
    ? Math.round(((prices[count / 2 - 1] + prices[count / 2]) / 2) * 100) / 100
    : prices[Math.floor(count / 2)];

  return {
    min: prices[0],
    max: prices[count - 1],
    average,
    median,
    count,
  };
}

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const query = searchParams.get('q');
  const marketplace = searchParams.get('marketplace') || 'GB';

  if (!query) {
    return NextResponse.json(
      { error: 'Query parameter "q" is required' },
      { status: 400 }
    );
  }

  try {
    // Get marketplace ID
    const marketplaceId = MARKETPLACE_IDS[marketplace] || MARKETPLACE_IDS['GB'];

    // Search for sold items using Browse API (relevance by default)
    const searchUrl = `${EBAY_API_BASE}/buy/browse/v1/item_summary/search?q=${encodeURIComponent(query)}&filter=buyingOptions:FIXED_PRICE,soldItemsOnly:true&limit=50`;

    const response = await fetch(searchUrl, {
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'X-EBAY-C-MARKETPLACE-ID': marketplaceId,
      },
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('eBay API error:', response.status, errorText);
      throw new Error(`eBay API error: ${response.statusText}`);
    }

    const data = await response.json();
    console.log('eBay API response:', JSON.stringify(data, null, 2).substring(0, 1000));

    // Check for different response structures
    const items = data.itemSummaries || data.items || data.searchResult?.[0]?.item || [];

    if (!items || items.length === 0) {
      return NextResponse.json({
        query,
        listings: [],
        stats: { min: 0, max: 0, average: 0, median: 0, count: 0 },
        note: 'No sold listings found for this product',
      });
    }

    const listings = transformListings(items, query);
    console.log('Transformed listings:', listings.length, 'items, prices:', listings.slice(0, 3).map(l => l.price));
    const stats = calculateStats(listings);

    return NextResponse.json({
      query,
      listings,
      stats,
      source: 'eBay API',
    });
  } catch (error: any) {
    console.error('eBay API error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch eBay data', details: error.message },
      { status: 500 }
    );
  }
}
