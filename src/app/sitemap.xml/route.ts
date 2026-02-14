import { CATEGORIES, BRANDS } from '../seo-data';

export async function GET() {
  const baseUrl = 'https://ebay-price-scanner.vercel.app';
  
  // Static routes
  const staticRoutes = [
    '',
    '/guides/selling-tips',
    '/guides/buying-guide',
  ];

  // Category routes
  const categoryRoutes = CATEGORIES.map(cat => `/category/${cat.slug}`);

  // Brand routes
  const brandRoutes = BRANDS.map(brand => `/brand/${brand.slug}`);

  // All routes
  const allRoutes = [...staticRoutes, ...categoryRoutes, ...brandRoutes];

  // Generate sitemap XML
  const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${allRoutes.map(route => {
  // Priority based on route type
  let priority = '0.5';
  let changefreq = 'weekly';
  
  if (route === '') {
    priority = '1.0';
    changefreq = 'daily';
  } else if (route.startsWith('/category/')) {
    priority = '0.8';
    changefreq = 'weekly';
  } else if (route.startsWith('/brand/')) {
    priority = '0.7';
    changefreq = 'weekly';
  }
  
  return `  <url>
    <loc>${baseUrl}${route}</loc>
    <priority>${priority}</priority>
    <changefreq>${changefreq}</changefreq>
  </url>`;
}).join('\n')}
</urlset>`;

  return new Response(sitemap, {
    headers: {
      'Content-Type': 'application/xml',
      'Cache-Control': 'public, max-age=86400',
    },
  });
}
