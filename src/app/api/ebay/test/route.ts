import { NextRequest, NextResponse } from 'next/server';

// Mock endpoint for testing - returns sample data without calling eBay API
export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const query = searchParams.get('q') || '';
  const marketplace = searchParams.get('marketplace') || 'GB';

  console.log('TEST API called:', { query, marketplace });

  // Return mock data for testing
  const mockListings = [
    {
      title: `Test Product: ${query}`,
      image: null,
      soldDate: 'Jan 15, 2026',
      soldDateRaw: '2026-01-15',
      price: 25.99,
      soldPrice: 25.99,
      currency: marketplace === 'PT' ? 'BRL' : marketplace === 'GB' ? 'GBP' : marketplace === 'AU' ? 'AUD' : 'USD',
      condition: 'Used',
      url: 'https://www.ebay.com/itm/test'
    },
    {
      title: `Another ${query} - Used`,
      image: null,
      soldDate: 'Jan 10, 2026',
      soldDateRaw: '2026-01-10',
      price: 32.50,
      soldPrice: 32.50,
      currency: marketplace === 'PT' ? 'BRL' : marketplace === 'GB' ? 'GBP' : marketplace === 'AU' ? 'AUD' : 'USD',
      condition: 'Used - Good',
      url: 'https://www.ebay.com/itm/test2'
    },
    {
      title: `${query} - Brand New`,
      image: null,
      soldDate: 'Jan 5, 2026',
      soldDateRaw: '2026-01-05',
      price: 45.00,
      soldPrice: 45.00,
      currency: marketplace === 'PT' ? 'BRL' : marketplace === 'GB' ? 'GBP' : marketplace === 'AU' ? 'AUD' : 'USD',
      condition: 'New',
      url: 'https://www.ebay.com/itm/test3'
    }
  ];

  const prices = mockListings.map(l => l.price).sort((a, b) => a - b);
  const sum = prices.reduce((a, b) => a + b, 0);
  const avg = Math.round((sum / prices.length) * 100) / 100;
  const mid = prices.length % 2 === 0 
    ? Math.round(((prices[prices.length / 2 - 1] + prices[prices.length / 2]) / 2 * 100) / 100) 
    : prices[Math.floor(prices.length / 2)];

  return NextResponse.json({
    query,
    listings: mockListings,
    stats: {
      min: prices[0],
      max: prices[prices.length - 1],
      average: avg,
      median: mid,
      count: prices.length
    },
    source: 'MOCK - for testing'
  });
}
