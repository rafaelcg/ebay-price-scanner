import { NextRequest, NextResponse } from 'next/server';

const EBAY_APP_ID = process.env.EBAY_APP_ID || '';
const EBAY_CERT_ID = process.env.EBAY_CERT_ID || '';
const EBAY_ENVIRONMENT = process.env.EBAY_ENVIRONMENT || 'production';
const EBAY_API_BASE = EBAY_ENVIRONMENT === 'sandbox' ? 'https://api.sandbox.ebay.com' : 'https://api.ebay.com';
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
  '3007': 'Refurbished',
};

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const query = searchParams.get('q') || '';
  const marketplace = searchParams.get('marketplace') || 'GB';

  if (!query) return NextResponse.json({ error: 'Query required' }, { status: 400 });

  try {
    const accessToken = await getAccessToken();
    const marketplaceId = MARKETPLACE_IDS[marketplace] || MARKETPLACE_IDS['GB'];

    // Active listings (not sold)
    const url = `${EBAY_API_BASE}/buy/browse/v1/item_summary/search?q=${encodeURIComponent(query)}&filter=buyingOptions:FIXED_PRICE&limit=20`;
    const response = await fetch(url, {
      headers: { 'Authorization': `Bearer ${accessToken}`, 'X-EBAY-C-MARKETPLACE-ID': marketplaceId },
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('eBay active API error:', response.status, errorText);
      return NextResponse.json({ error: 'Failed to fetch active listings' }, { status: 500 });
    }

    const data = await response.json();
    console.log('eBay Active API response:', { total: data.total, count: data.itemSummaries?.length });
    const listings = (data.itemSummaries || []).map((item: any) => {
      const conditionId = item.condition?.conditionId;
      const conditionName = conditionId ? (CONDITION_MAP[conditionId] || 'Unknown') : 'Unknown';
      
      return {
        title: item.title,
        image: item.image?.imageUrl || item.thumbnailImages?.[0]?.imageUrl || null,
        price: item.price?.value || 0,
        currency: item.price?.currency || 'USD',
        condition: conditionName,
        url: item.itemWebUrl || '#',
      };
    });

    return NextResponse.json({ query, listings });
  } catch (error: any) {
    console.error('API error:', error);
    return NextResponse.json({ error: 'Failed', details: error.message }, { status: 500 });
  }
}
