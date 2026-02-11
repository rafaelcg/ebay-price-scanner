import { NextResponse } from 'next/server';

export async function GET() {
  const hasAppId = !!process.env.EBAY_APP_ID;
  const hasCertId = !!process.env.EBAY_CERT_ID;
  const hasDevId = !!process.env.EBAY_DEV_ID;
  const env = process.env.EBAY_ENVIRONMENT || 'not set';

  return NextResponse.json({
    status: 'ok',
    credentials: {
      EBAY_APP_ID: hasAppId ? 'set' : 'MISSING',
      EBAY_CERT_ID: hasCertId ? 'set' : 'MISSING',
      EBAY_DEV_ID: hasDevId ? 'set' : 'MISSING',
      EBAY_ENVIRONMENT: env,
    }
  });
}
