import { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { CATEGORIES, BRANDS } from '../../seo-data';
import Link from 'next/link';

export function generateStaticParams() {
  return CATEGORIES.map((category) => ({
    slug: category.slug,
  }));
}

export function generateMetadata({ params }: { params: { slug: string } }): Metadata {
  const category = CATEGORIES.find((c) => c.slug === params.slug);
  if (!category) return { title: 'Category Not Found' };

  return {
    title: `${category.name} Prices | eBay Market Value Checker`,
    description: `Check eBay sold prices for ${category.name.toLowerCase()}. Find market values for ${category.keywords.slice(0, 3).join(', ')} and more. Free price scanner.`,
    keywords: [`eBay ${category.name.toLowerCase()} prices`, `${category.name.toLowerCase()} market value`, `sold ${category.name.toLowerCase()} eBay`, ...category.keywords],
    alternates: { canonical: `https://ebay-price-scanner.vercel.app/category/${category.slug}` },
  };
}

export default function CategoryPage({ params }: { params: { slug: string } }) {
  const category = CATEGORIES.find((c) => c.slug === params.slug);
  if (!category) notFound();

  const relatedBrands = BRANDS.filter(b => b.category === category.slug).slice(0, 6);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
      <div className="max-w-6xl mx-auto px-6 py-12">
        <nav className="text-sm text-gray-400 mb-6">
          <Link href="/" className="hover:text-white">Home</Link>
          <span className="mx-2">/</span>
          <span className="text-white">{category.name}</span>
        </nav>

        <div className="text-center mb-12">
          <h1 className="text-4xl md:text-5xl font-bold text-white mb-4">{category.name} Prices</h1>
          <p className="text-xl text-gray-300 max-w-2xl mx-auto">{category.description}</p>
        </div>

        <div className="bg-slate-800/90 rounded-2xl p-6 border border-slate-700/50 mb-12">
          <h2 className="text-2xl font-bold text-white mb-4">Check {category.name} Prices</h2>
          <form action="/" method="GET" className="flex gap-3">
            <input type="text" name="q" placeholder={`Search ${category.name.toLowerCase()}...`} className="flex-1 px-4 py-3 bg-slate-700/50 rounded-xl text-white placeholder-gray-400 border border-slate-600/50 focus:outline-none focus:border-purple-500/70" />
            <button type="submit" className="px-6 py-3 bg-gradient-to-br from-blue-500 to-purple-600 text-white rounded-xl font-semibold hover:shadow-lg transition-all">Check Price</button>
          </form>
        </div>

        <div className="mb-12">
          <h2 className="text-2xl font-bold text-white mb-6">Popular {category.name} Items</h2>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {category.keywords.map((keyword) => (
              <a key={keyword} href={`/?q=${encodeURIComponent(keyword)}`} className="bg-slate-800/90 rounded-xl p-4 border border-slate-700/50 hover:bg-slate-700/50 transition-all text-center group">
                <span className="text-white group-hover:text-purple-400 transition-colors">{keyword}</span>
              </a>
            ))}
          </div>
        </div>

        {relatedBrands.length > 0 && (
          <div className="mb-12">
            <h2 className="text-2xl font-bold text-white mb-6">Top {category.name} Brands</h2>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              {relatedBrands.map((brand) => (
                <Link key={brand.slug} href={`/brand/${brand.slug}`} className="bg-slate-800/90 rounded-xl p-4 border border-slate-700/50 hover:bg-slate-700/50 transition-all">
                  <h3 className="text-lg font-semibold text-white mb-2">{brand.name}</h3>
                  <p className="text-sm text-gray-400">Popular: {brand.popular.slice(0, 3).join(', ')}</p>
                </Link>
              ))}
            </div>
          </div>
        )}

        <div className="bg-slate-800/50 rounded-2xl p-8 border border-slate-700/30">
          <h2 className="text-2xl font-bold text-white mb-4">About {category.name} on eBay</h2>
          <div className="prose prose-invert max-w-none">
            <p className="text-gray-300 mb-4">
              Looking to buy or sell {category.name.toLowerCase()} on eBay? Our price scanner helps you find the current market value by analyzing thousands of sold listings. Whether you're looking for {category.keywords.slice(0, 3).join(', ')}, or other {category.name.toLowerCase()}, we provide instant price comparisons.
            </p>
            <p className="text-gray-300 mb-4">
              The {category.name.toLowerCase()} market on eBay is constantly changing. Prices vary based on condition, rarity, brand, and current demand. Use our tool to check sold prices before listing or making a purchase.
            </p>
            <h3 className="text-xl font-semibold text-white mt-6 mb-3">How to Check {category.name} Prices</h3>
            <ol className="list-decimal list-inside text-gray-300 space-y-2">
              <li>Enter the item name or scan the barcode</li>
              <li>Select your marketplace (US, UK, etc.)</li>
              <li>View min, max, and average sold prices</li>
              <li>Compare conditions (new, used, refurbished)</li>
              <li>Set up price alerts for items you're watching</li>
            </ol>
          </div>
        </div>

        <div className="mt-12">
          <h2 className="text-2xl font-bold text-white mb-6">Browse Other Categories</h2>
          <div className="flex flex-wrap gap-3">
            {CATEGORIES.filter(c => c.slug !== category.slug).map((cat) => (
              <Link key={cat.slug} href={`/category/${cat.slug}`} className="px-4 py-2 bg-slate-800/50 rounded-full text-gray-300 hover:bg-slate-700/50 hover:text-white transition-all border border-slate-700/30">{cat.name}</Link>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
