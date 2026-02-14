import { Metadata } from 'next';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'eBay Selling Tips | Maximize Your Profits',
  description: 'Expert tips for selling on eBay. Learn pricing strategies, listing optimization, and how to maximize your profits.',
  keywords: ['eBay selling tips', 'how to sell on eBay', 'eBay seller guide', 'maximize eBay profits'],
};

export default function SellingTipsPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
      <div className="max-w-4xl mx-auto px-6 py-12">
        <nav className="text-sm text-gray-400 mb-6">
          <Link href="/" className="hover:text-white">Home</Link>
          <span className="mx-2">/</span>
          <span className="text-white">Selling Tips</span>
        </nav>

        <article className="prose prose-invert prose-lg max-w-none">
          <h1 className="text-4xl font-bold text-white mb-6">Complete Guide to Selling on eBay</h1>
          <p className="text-gray-300 mb-6">Selling on eBay can be incredibly profitable when done right. This guide covers everything from pricing strategies to listing optimization to help you maximize your profits.</p>

          <h2 className="text-2xl font-bold text-white mt-8 mb-4">1. Research Prices Before Listing</h2>
          <p className="text-gray-300 mb-4">The #1 mistake new sellers make is guessing their prices. Always check sold prices for similar items before listing. Use our <Link href="/" className="text-purple-400">eBay price scanner</Link> to:</p>
          <ul className="list-disc list-inside text-gray-300 space-y-2 mb-6">
            <li>See minimum, maximum, and average sold prices</li>
            <li>Compare prices across different conditions</li>
            <li>Identify the sweet spot for quick sales</li>
            <li>Understand seasonal price fluctuations</li>
          </ul>

          <h2 className="text-2xl font-bold text-white mt-8 mb-4">2. Write Compelling Titles</h2>
          <p className="text-gray-300 mb-4">Your title is the most important part of your listing. eBay's search algorithm (Cassini) heavily weights title keywords. Follow this formula:</p>
          <div className="bg-slate-800/50 p-4 rounded-lg mb-6">
            <code className="text-green-400">[Brand] + [Model] + [Key Features] + [Condition] + [MPN]</code>
          </div>
          <p className="text-gray-300 mb-4"><strong>Example:</strong> "Apple iPhone 13 A2482 128GB Unlocked Black Very Good Condition"</p>

          <h2 className="text-2xl font-bold text-white mt-8 mb-4">3. Take High-Quality Photos</h2>
          <p className="text-gray-300 mb-4">Photos can make or break your sale:</p>
          <ul className="list-disc list-inside text-gray-300 space-y-2 mb-6">
            <li>Use natural lighting or a lightbox</li>
            <li>Take photos from multiple angles</li>
            <li>Show any defects or wear honestly</li>
            <li>Include a common object for scale</li>
            <li>Use all 12 photo slots eBay allows</li>
          </ul>

          <h2 className="text-2xl font-bold text-white mt-8 mb-4">4. Price Competitively</h2>
          <p className="text-gray-300 mb-4">Pricing is a balance between profit and speed of sale:</p>
          <ul className="list-disc list-inside text-gray-300 space-y-2 mb-6">
            <li><strong>Fast sale:</strong> Price at the 25th percentile of sold prices</li>
            <li><strong>Balanced:</strong> Price at the median sold price</li>
            <li><strong>Maximum profit:</strong> Price at the 75th percentile (may take longer)</li>
          </ul>

          <h2 className="text-2xl font-bold text-white mt-8 mb-4">5. Offer Competitive Shipping</h2>
          <p className="text-gray-300 mb-4">Shipping is a major factor in buying decisions:</p>
          <ul className="list-disc list-inside text-gray-300 space-y-2 mb-6">
            <li>Offer free shipping when possible (build into price)</li>
            <li>Ship within 1 business day</li>
            <li>Use calculated shipping for heavy/odd items</li>
            <li>Pack items securely to avoid damage claims</li>
          </ul>

          <div className="bg-slate-800/50 p-6 rounded-xl mt-8">
            <h3 className="text-xl font-bold text-white mb-3">Ready to Start Selling?</h3>
            <p className="text-gray-300 mb-4">Use our free eBay price scanner to research your items before listing. Get accurate market values in seconds.</p>
            <Link href="/" className="inline-block px-6 py-3 bg-gradient-to-br from-blue-500 to-purple-600 text-white rounded-xl font-semibold hover:shadow-lg transition-all">Check Prices Now</Link>
          </div>
        </article>
      </div>
    </div>
  );
}
