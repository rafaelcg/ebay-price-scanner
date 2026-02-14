import { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { BRANDS, CATEGORIES } from '../../seo-data';
import Link from 'next/link';

export function generateStaticParams() {
  return BRANDS.map((brand) => ({ slug: brand.slug }));
}

export function generateMetadata({ params }: { params: { slug: string } }): Metadata {
  const brand = BRANDS.find((b) => b.slug === params.slug);
  if (!brand) return { title: 'Brand Not Found' };

  return {
    title: `${brand.name} eBay Prices | Check Market Value`,
    description: `Find eBay sold prices for ${brand.name} ${brand.popular.slice(0, 3).join(', ')} and more. Check market values instantly with our free price scanner.`,
    keywords: [`${brand.name} eBay price`, `${brand.name} sold prices`, `${brand.name} market value`, ...brand.popular.map(p => `${brand.name} ${p}`)],
    alternates: { canonical: `https://ebay-price-scanner.vercel.app/brand/${brand.slug}` },
  };
}

export default function BrandPage({ params }: { params: { slug: string } }) {
  const brand = BRANDS.find((b) => b.slug === params.slug);
  if (!brand) notFound();

  const category = CATEGORIES.find(c => c.slug === brand.category);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
      <div className="max-w-6xl mx-auto px-6 py-12">
        <nav className="text-sm text-gray-400 mb-6">
          <Link href="/" className="hover:text-white">Home</Link>
          <span className="mx-2">/</span>
          {category && <><Link href={`/category/${category.slug}`} className="hover:text-white">{category.name}</Link><span className="mx-2">/</span></>}
          <span className="text-white">{brand.name}</span>
        </nav>

        <div className="text-center mb-12">
          <h1 className="text-4xl md:text-5xl font-bold text-white mb-4">{brand.name} Prices on eBay</h1>
          <p className="text-xl text-gray-300 max-w-2xl mx-auto">Check sold prices and market values for {brand.name} {brand.popular.slice(0, 3).join(', ')} and more.</p>
        </div>

        <div className="bg-slate-800/90 rounded-2xl p-6 border border-slate-700/50 mb-12">
          <h2 className="text-2xl font-bold text-white mb-4">Search {brand.name} Items</h2>
          <form action="/" method="GET" className="flex gap-3">
            <input type="text" name="q" placeholder={`Search ${brand.name}...`} defaultValue={brand.name} className="flex-1 px-4 py-3 bg-slate-700/50 rounded-xl text-white placeholder-gray-400 border border-slate-600/50 focus:outline-none focus:border-purple-500/70" />
            <button type="submit" className="px-6 py-3 bg-gradient-to-br from-blue-500 to-purple-600 text-white rounded-xl font-semibold hover:shadow-lg transition-all">Check Price</button>
          </form>
        </div>

        <div className="mb-12">
          <h2 className="text-2xl font-bold text-white mb-6">Popular {brand.name} Items</h2>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
            {brand.popular.map((item) => (
              <a key={item} href={`/?q=${encodeURIComponent(`${brand.name} ${item}`)}`} className="bg-slate-800/90 rounded-xl p-6 border border-slate-700/50 hover:bg-slate-700/50 transition-all text-center group">
                <div className="text-3xl mb-3">🔍</div>
                <span className="text-white font-semibold group-hover:text-purple-400 transition-colors">{brand.name} {item}</span>
              </a>
            ))}
          </div>
        </div>

        <div className="bg-slate-800/50 rounded-2xl p-8 border border-slate-700/30 mb-12">
          <h2 className="text-2xl font-bold text-white mb-4">Buying & Selling {brand.name} on eBay</h2>
          <div className="prose prose-invert max-w-none">
            <p className="text-gray-300 mb-4">{brand.name} is one of the most popular {category?.name.toLowerCase() || 'product'} brands on eBay. Whether you're looking to buy authentic {brand.name} items or sell your own, understanding the current market value is crucial.</p>
            <p className="text-gray-300 mb-4">Our eBay price scanner analyzes thousands of sold {brand.name} listings to give you accurate market values. Popular {brand.name} items like {brand.popular.slice(0, 3).join(', ')} can vary significantly based on condition, rarity, and current demand.</p>
            <h3 className="text-xl font-semibold text-white mt-6 mb-3">Tips for {brand.name} Sellers</h3>
            <ul className="list-disc list-inside text-gray-300 space-y-2">
              <li>Research sold prices before listing</li>
              <li>Take clear, high-quality photos</li>
              <li>Be honest about condition in your description</li>
              <li>Include model numbers and authenticating details</li>
              <li>Price competitively based on recent sales</li>
            </ul>
          </div>
        </div>

        {category && (
          <div className="text-center">
            <Link href={`/category/${category.slug}`} className="inline-flex items-center gap-2 px-6 py-3 bg-slate-800/50 rounded-xl text-gray-300 hover:bg-slate-700/50 hover:text-white transition-all border border-slate-700/30">← Browse all {category.name}</Link>
          </div>
        )}
      </div>
    </div>
  );
}
