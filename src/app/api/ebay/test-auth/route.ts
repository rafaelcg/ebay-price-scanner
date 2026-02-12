import { NextResponse } from 'next/server';

const EBAY_APP_ID = process.env.EBAY_APP_ID || '';
const EBAY_CERT_ID = process.env.EBAY_CERT_ID || '';
const EBAY_API_BASE = 'https://api.ebay.com';

export async function GET() {
  if (!EBAY_APP_ID || !EBAY_CERT_ID) {
    return NextResponse.json({ 
      error: 'Missing credentials',
      hasAppId: !!EBAY_APP_ID,
      hasCertId: !!EBAY_CERT_ID
    }, { status: 500 });
  }

  try {
    const credentials = Buffer.from(`${EBAY_APP_ID}:${EBAY_CERT_ID}`).toString('base64');
    const response = await fetch(`${EBAY_API_BASE}/identity/v1/oauth2/token`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Authorization': `Basic ${credentials}`,
      },
      body: 'grant_type=client_credentials&scope=https://api.ebay.com/oauth/api_scope',
    });

    const data = await response.json();

    if (!response.ok) {
      return NextResponse.json({
        oauthStatus: response.status,
        oauthError: data,
        message: 'OAuth failed'
      }, { status: 500 });
    }

    // Test the Browse API with the token
    const browseResponse = await fetch(`${EBAY_API_BASE}/buy/browse/v1/item_summary/search?q=iphone&filter=soldItemsOnly:true&limit=5`, {
      headers: {
        'Authorization': `Bearer ${data.access_token}`,
        'X-EBAY-C-MARKETPLACE-ID': 'EBAY_US'
      }
    });

    if (!browseResponse.ok) {
      const browseError = await browseResponse.text();
      return NextResponse.json({
        oauthStatus: 'success',
        tokenLength: data.access_token?.length,
        browseStatus: browseResponse.status,
        browseError: browseError.substring(0, 500)
      }, { status: 500 });
    }

    const browseData = await browseResponse.json();

    return NextResponse.json({
      oauthStatus: 'success',
      tokenLength: data.access_token?.length,
      browseStatus: 'success',
      itemCount: browseData.itemSummaries?.length || 0,
      sampleItem: browseData.itemSummaries?.[0]
    });

  } catch (error: any) {
    return NextResponse.json({
      error: error.message
    }, { status: 500 });
  }
}
