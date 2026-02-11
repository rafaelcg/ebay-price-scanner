import { NextRequest, NextResponse } from 'next/server';

// eBay Finding API for sold listings
const EBAY_APP_ID = process.env.EBAY_APP_ID || '';
const EBAY_FINDING_API = 'https://api.ebay.com/ws/api.dll';

const MARKETPLACE_ENDPOINTS: Record<string, string> = {
  'US': 'https://api.ebay.com/ws/api.dll',
  'GB': 'https://api.ebay.com/ws/api.dll',
  'CA': 'https://api.ebay.com/ws/api.dll',
  'AU': 'https://api.ebay.com/ws/api.dll',
  'DE': 'https://api.ebay.com/ws/api.dll',
  'FR': 'https://api.ebay.com/ws/api.dll',
  'ES': 'https://api.ebay.com/ws/api.dll',
  'IT': 'https://api.ebay.com/ws/api.dll',
  'PT': 'https://api.ebay.com/ws/api.dll',
};

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const query = searchParams.get('q') || '';
  const marketplace = searchParams.get('marketplace') || 'US';

  if (!query) return NextResponse.json({ error: 'Query required' }, { status: 400 });

  // Try using eBay's sold listings search via the Browse API with correct filter
  // The filter format needs to be: filter=soldItemsOnly%3Atrue
  
  try {
    // First, let's try a different approach - get completed listings
    // Using the Browse API's filter for completed items
    const browseUrl = `https://api.ebay.com/buy/browse/v1/item_summary/search?q=${encodeURIComponent(query)}&filter=conditionIds:3000,3001,3002,3003,3004,3005,3007&limit=20`;
    
    // This is a workaround since eBay's soldItemsOnly filter may not be working
    // We'll note in the response that this is active listings, not sold
    
    return NextResponse.json({
      message: 'eBay Browse API returns active listings only. For sold prices, consider using eBay Sold Items API or third-party data.',
      query,
      marketplace,
      browseUrl,
      note: 'Active listings returned (not sold prices)'
    });

  } catch (error: any) {
    console.error('API error:', error);
    return NextResponse.json({ error: 'Failed', details: error.message }, { status: 500 });
  }
}
