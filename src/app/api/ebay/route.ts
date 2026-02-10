import { NextRequest, NextResponse } from 'next/server';

// Mock data generator for demo purposes
// In production, integrate with eBay Browse API or Finding API
function generateMockListings(query: string, count: number = 50): any[] {
  const conditions = ['Used', 'Like New', 'New', 'Good', 'Very Good'];
  const listings = [];
  
  for (let i = 0; i < count; i++) {
    // Generate realistic prices based on a base value
    const basePrice = Math.floor(Math.random() * 200) + 20;
    const variance = basePrice * (Math.random() * 0.8 - 0.4); // ±40%
    const price = Math.round((basePrice + variance) * 100) / 100;
    
    // Generate random sold date within last 90 days
    const soldDate = new Date();
    soldDate.setDate(soldDate.getDate() - Math.floor(Math.random() * 90));
    
    listings.push({
      title: `${query} - Item #${1000 + i} (${conditions[i % conditions.length]})`,
      image: `https://via.placeholder.com/150x150/f5f5f5/999?text=${encodeURIComponent(query.substring(0, 10))}`,
      soldDate: soldDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
      price: price,
      soldPrice: price,
      currency: 'USD',
      condition: conditions[i % conditions.length],
      url: `https://www.ebay.com/itm/${100000000000 + i}`,
    });
  }
  
  return listings;
}

function calculateStats(listings: any[]): any {
  const prices = listings.map(l => l.price).sort((a, b) => a - b);
  const count = prices.length;
  
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
  
  if (!query) {
    return NextResponse.json(
      { error: 'Query parameter "q" is required' },
      { status: 400 }
    );
  }
  
  try {
    // For demo: Generate mock data
    // In production, use eBay API:
    // const response = await fetch(`https://api.ebay.com/browse/v1/item_summary/search?q=${encodeURIComponent(query)}&filter=condition:3000,3001,3002,3003,3004,3005,3006&limit=100`, {
    //   headers: { 'Authorization': `Bearer ${EBay_API_KEY}` }
    // });
    
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    const listings = generateMockListings(query, 50);
    const stats = calculateStats(listings);
    
    return NextResponse.json({
      query,
      listings,
      stats,
      note: 'Demo mode - connect eBay API for real data',
    });
  } catch (error) {
    console.error('eBay API error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch eBay data' },
      { status: 500 }
    );
  }
}
