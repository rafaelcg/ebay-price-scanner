'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Barcode, 
  Search, 
  Camera, 
  X, 
  TrendingUp, 
  TrendingDown, 
  DollarSign,
  Globe,
  Package,
  Sparkles,
  Zap,
  Shield
} from 'lucide-react';

interface PriceData {
  title: string;
  image: string;
  soldDate: string;
  price: number;
  soldPrice: number;
  currency: string;
  condition: string;
  url: string;
}

interface PriceStats {
  min: number;
  max: number;
  average: number;
  count: number;
  median: number;
}

const MARKETPLACES = [
  { id: 'GB', name: 'UK', currency: 'GBP', flag: '🇬🇧' },
  { id: 'US', name: 'US', currency: 'USD', flag: '🇺🇸' },
  { id: 'CA', name: 'Canada', currency: 'CAD', flag: '🇨🇦' },
  { id: 'AU', name: 'Australia', currency: 'AUD', flag: '🇦🇺' },
];

export default function Home() {
  const [searchMode, setSearchMode] = useState<'barcode' | 'text'>('barcode');
  const [marketplace, setMarketplace] = useState(MARKETPLACES[0]); // Default to UK
  const [query, setQuery] = useState('');
  const [isScanning, setIsScanning] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [priceData, setPriceData] = useState<PriceData[]>([]);
  const [stats, setStats] = useState<PriceStats | null>(null);
  const [error, setError] = useState('');
  const [lastScanned, setLastScanned] = useState('');
  const [hasSearched, setHasSearched] = useState(false);
  const [isSearching, setIsSearching] = useState(false);
  const isSearchingRef = useRef(false);
  
  const resultsRef = useRef<HTMLDivElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const codeReaderRef = useRef<any>(null);

  // Auto-scroll to results only once after search completes
  useEffect(() => {
    if (priceData.length > 0 && stats && hasSearched && !isSearching && resultsRef.current) {
      // Scroll once, then reset the flag so it won't scroll again
      resultsRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
      setHasSearched(false);
    }
  }, [priceData, stats, hasSearched, isSearching]);

  // Initialize barcode scanner
  useEffect(() => {
    const initScanner = async () => {
      try {
        const { BrowserMultiFormatReader } = await import('@zxing/library');
        codeReaderRef.current = new BrowserMultiFormatReader();
      } catch (err) {
        console.log('Barcode library not available');
      }
    };
    initScanner();

    return () => {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
      }
    };
  }, []);

  // Handle camera stream when scanning starts
  useEffect(() => {
    if (isScanning && streamRef.current && videoRef.current) {
      videoRef.current.srcObject = streamRef.current;
      videoRef.current.play().catch(err => console.error('Video play error:', err));
    }
  }, [isScanning]);

  const startScanning = async () => {
    try {
      setError('');
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment', width: 1280, height: 720 }
      });
      streamRef.current = stream;
      setIsScanning(true);

      // Start continuous scanning after state updates
      setTimeout(() => {
        if (codeReaderRef.current && videoRef.current) {
          codeReaderRef.current.decodeFromVideoDevice(
            undefined,
            videoRef.current,
            async (result: any, error: any) => {
              if (result && !isSearchingRef.current) {
                const code = result.getText();
                if (code !== lastScanned) {
                  setLastScanned(code);
                  setSearchMode('barcode');
                  setQuery(code);
                  stopScanning();
                  await searchPrices(code);
                }
              }
            }
          );
        }
      }, 100);
    } catch (err) {
      setError('Camera access denied. Please allow camera permissions.');
      setIsScanning(false);
    }
  };

  const stopScanning = () => {
    if (codeReaderRef.current) {
      codeReaderRef.current.reset();
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
    setIsScanning(false);
  };

  const searchPrices = async (searchQuery: string) => {
    if (!searchQuery.trim() || isSearchingRef.current) return;
    
    isSearchingRef.current = true;
    setIsSearching(true);
    setIsLoading(true);
    setError('');
    setPriceData([]);
    setStats(null);
    setHasSearched(true);

    try {
      const response = await fetch(`/api/ebay?q=${encodeURIComponent(searchQuery)}&marketplace=${marketplace.id}`);

      const data = await response.json();

      if (response.ok && data.listings && data.listings.length > 0) {
        setPriceData(data.listings);
        setStats(data.stats);
      } else if (response.ok && data.listings?.length === 0) {
        setError('No sold listings found for this product. Try a different search.');
      } else if (data.error) {
        setError(data.details || data.error);
      } else {
        throw new Error('Failed to fetch prices');
      }
    } catch (err) {
      setError('Failed to fetch eBay data. Please try again.');
      console.error(err);
    } finally {
      isSearchingRef.current = false;
      setIsLoading(false);
      setIsSearching(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    searchPrices(query);
  };

  const formatCurrency = (price: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: marketplace.currency,
    }).format(price);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
      {/* Hero Section */}
      <header className="relative overflow-hidden">
        {/* Background Effects */}
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute -top-1/2 -left-1/2 w-full h-full bg-gradient-to-br from-blue-500/20 to-transparent rounded-full blur-3xl animate-pulse-slow" />
          <div className="absolute -bottom-1/2 -right-1/2 w-full h-full bg-gradient-to-tl from-purple-500/20 to-transparent rounded-full blur-3xl animate-pulse-slow" />
        </div>

        <nav className="relative z-10 flex items-center justify-between px-6 py-4 max-w-7xl mx-auto">
          <div className="flex items-center gap-2">
            <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl flex items-center justify-center">
              <DollarSign className="w-6 h-6 text-white" />
            </div>
            <span className="text-xl font-bold text-white">PriceScan</span>
          </div>
          <div className="flex items-center gap-4">
            {/* Marketplace Selector */}
            <select
              value={marketplace.id}
              onChange={(e) => setMarketplace(MARKETPLACES.find(m => m.id === e.target.value) || MARKETPLACES[0])}
              className="bg-slate-800/90 text-gray-200 text-sm rounded-lg px-3 py-2 border border-slate-700/50 focus:outline-none focus:border-purple-500/70 cursor-pointer"
            >
              {MARKETPLACES.map((mp) => (
                <option key={mp.id} value={mp.id}>
                  {mp.flag} {mp.name} ({mp.currency})
                </option>
              ))}
            </select>
          </div>
        </nav>

        {/* Hero Content */}
        <div className="relative z-10 max-w-4xl mx-auto px-6 pt-12 pb-24 text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <h1 className="text-4xl md:text-6xl font-bold text-white mb-6 text-balance">
              Know What It's
              <span className="bg-gradient-to-r from-blue-400 via-purple-400 to-pink-400 bg-clip-text text-transparent"> Really Worth</span>
            </h1>
            <p className="text-lg text-gray-300 mb-8 max-w-2xl mx-auto">
              Scan any barcode or search any product to instantly see eBay sold prices.
              Min, max, average, and median market values — all in one tap.
            </p>
          </motion.div>

          {/* Search Box */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="max-w-2xl mx-auto"
          >
            <div className="bg-slate-800/90 rounded-2xl p-2 border border-slate-700/50">
              <form onSubmit={handleSubmit} className="flex items-center gap-2">
                {searchMode === 'barcode' && (
                  <button
                    type="button"
                    onClick={isScanning ? stopScanning : startScanning}
                    className={`p-4 rounded-xl transition-all ${
                      isScanning 
                        ? 'bg-red-500/20 text-red-400 animate-pulse' 
                        : 'bg-gradient-to-br from-blue-500 to-purple-600 text-white hover:shadow-lg hover:shadow-purple-500/25'
                    }`}
                  >
                    <Camera className="w-5 h-5" />
                  </button>
                )}
                <div className="flex-1 relative">
                  <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input
                    type="text"
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    placeholder={searchMode === 'barcode' ? 'Or type product name...' : 'Search any product...'}
                    className="w-full px-12 py-4 bg-slate-700/50 rounded-xl text-gray-200 placeholder-gray-400 border border-slate-600/50 focus:outline-none focus:border-purple-500/70 focus:bg-slate-700 transition-all"
                  />
                </div>
                <button
                  type="submit"
                  disabled={isLoading || !query.trim()}
                  className="px-8 py-4 bg-gradient-to-br from-blue-500 to-purple-600 text-white rounded-xl font-semibold hover:shadow-lg hover:shadow-purple-500/25 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                >
                  {isLoading ? (
                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  ) : (
                    'Search'
                  )}
                </button>
              </form>
            </div>

            {/* Mode Toggle */}
            <div className="flex items-center justify-center gap-4 mt-4">
              <button
                onClick={() => setSearchMode('barcode')}
                className={`flex items-center gap-2 px-4 py-2 rounded-full text-sm transition-all ${
                  searchMode === 'barcode' 
                    ? 'bg-white/10 text-white' 
                    : 'text-gray-300 hover:text-white'
                }`}
              >
                <Barcode className="w-4 h-4" />
                Barcode
              </button>
              <button
                onClick={() => setSearchMode('text')}
                className={`flex items-center gap-2 px-4 py-2 rounded-full text-sm transition-all ${
                  searchMode === 'text' 
                    ? 'bg-white/10 text-white' 
                    : 'text-gray-300 hover:text-white'
                }`}
              >
                <Search className="w-4 h-4" />
                Text Search
              </button>
            </div>
          </motion.div>

          {/* Camera Preview */}
          <AnimatePresence>
            {isScanning && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 z-50 bg-black"
              >
                <video
                  ref={videoRef}
                  className="w-full h-full object-cover"
                  autoPlay
                  playsInline
                  muted
                />
                <canvas ref={canvasRef} className="hidden" />
                
                {/* Scanner Overlay */}
                <div className="absolute inset-0 scanner-overlay flex items-center justify-center">
                  <div className="relative w-72 h-72">
                    {/* Corner Borders */}
                    <div className="absolute top-0 left-0 w-16 h-16 border-t-4 border-l-4 border-blue-500 rounded-tl-xl" />
                    <div className="absolute top-0 right-0 w-16 h-16 border-t-4 border-r-4 border-blue-500 rounded-tr-xl" />
                    <div className="absolute bottom-0 left-0 w-16 h-16 border-b-4 border-l-4 border-blue-500 rounded-bl-xl" />
                    <div className="absolute bottom-0 right-0 w-16 h-16 border-b-4 border-r-4 border-blue-500 rounded-br-xl" />
                    
                    {/* Scanning Line */}
                    <div className="scanner-line top-0" />
                  </div>
                </div>
                
                {/* Close Button */}
                <button
                  onClick={stopScanning}
                  className="absolute top-6 right-6 p-3 bg-white/10 backdrop-blur rounded-full text-white hover:bg-white/20 transition-all"
                >
                  <X className="w-6 h-6" />
                </button>
                
                {/* Instructions */}
                <p className="absolute bottom-24 left-0 right-0 text-center text-white/80 text-lg">
                  Point camera at a barcode
                </p>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </header>

      {/* Features */}
      <section className="relative z-10 max-w-6xl mx-auto px-6 -mt-12">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {[
            { icon: Zap, title: 'Instant Results', desc: 'Real-time eBay sold data' },
            { icon: Shield, title: 'Accurate Data', desc: 'Millions of sales analyzed' },
            { icon: Sparkles, title: 'Easy to Use', desc: 'Scan or search instantly' },
          ].map((feature, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: 0.4 + i * 0.1 }}
              className="bg-slate-800/90 rounded-2xl p-6 text-center border border-slate-700/50"
            >
              <div className="w-12 h-12 mx-auto mb-4 bg-gradient-to-br from-blue-500/30 to-purple-500/30 rounded-xl flex items-center justify-center">
                <feature.icon className="w-6 h-6 text-gray-200" />
              </div>
              <h3 className="text-gray-200 font-semibold mb-1">{feature.title}</h3>
              <p className="text-gray-400 text-sm">{feature.desc}</p>
            </motion.div>
          ))}
        </div>
      </section>

      {/* Results Section */}
      <AnimatePresence>
        {priceData.length > 0 && stats && (
          <motion.section
            ref={resultsRef}
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 40 }}
            className="relative z-10 max-w-6xl mx-auto px-6 py-16"
          >
            {/* Stats Cards */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.1 }}
                className="bg-slate-800/90 rounded-2xl p-6 text-center border border-slate-700/50"
              >
                <p className="text-gray-300 text-sm mb-2 font-semibold tracking-wide">AVERAGE</p>
                <p className="text-2xl md:text-3xl font-bold text-emerald-400">{formatCurrency(stats.average)}</p>
              </motion.div>
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.2 }}
                className="bg-slate-800/90 rounded-2xl p-6 text-center border border-slate-700/50"
              >
                <p className="text-gray-300 text-sm mb-2 font-semibold tracking-wide">MEDIAN</p>
                <p className="text-2xl md:text-3xl font-bold text-sky-400">{formatCurrency(stats.median)}</p>
              </motion.div>
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.3 }}
                className="bg-slate-800/90 rounded-2xl p-6 text-center border border-slate-700/50"
              >
                <p className="text-gray-300 text-sm mb-2 font-semibold tracking-wide">LOWEST</p>
                <p className="text-2xl md:text-3xl font-bold text-red-400">{formatCurrency(stats.min)}</p>
                <TrendingDown className="w-5 h-5 text-red-400 mx-auto mt-2" />
              </motion.div>
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.4 }}
                className="bg-slate-800/90 rounded-2xl p-6 text-center border border-slate-700/50"
              >
                <p className="text-gray-300 text-sm mb-2 font-semibold tracking-wide">HIGHEST</p>
                <p className="text-2xl md:text-3xl font-bold text-purple-400">{formatCurrency(stats.max)}</p>
                <TrendingUp className="w-5 h-5 text-purple-400 mx-auto mt-2" />
              </motion.div>
            </div>

            {/* Listings */}
            <div className="bg-slate-800/90 rounded-3xl p-6 border border-slate-700/50">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-bold text-gray-100 flex items-center gap-2">
                  <Package className="w-5 h-5 text-gray-300" />
                  Recent Sold Listings
                </h2>
                <span className="text-gray-300 font-medium">{stats.count} items analyzed</span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {priceData.slice(0, 12).map((item, i) => (
                  <motion.a
                    key={i}
                    href={item.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.5 + i * 0.05 }}
                    className="group block bg-slate-700/50 rounded-xl p-4 hover:bg-slate-700 transition-all hover:scale-[1.02] border border-slate-600/50"
                  >
                    <div className="flex gap-4">
                      {item.image && (
                        <img
                          src={item.image}
                          alt={item.title}
                          className="w-20 h-20 object-cover rounded-lg flex-shrink-0"
                          onError={(e) => {
                            (e.target as HTMLImageElement).src = 'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" width="80" height="80" viewBox="0 0 80 80"><rect fill="%23f5f5f5" width="80" height="80"/><text x="40" y="45" text-anchor="middle" fill="%23999" font-size="10">No Image</text></svg>';
                          }}
                        />
                      )}
                      <div className="flex-1 min-w-0">
                        <p className="text-gray-200 font-medium text-sm line-clamp-2 mb-2">
                          {item.title}
                        </p>
                        <div className="flex items-center justify-between">
                          <span className="text-xl font-bold text-emerald-400">
                            {formatCurrency(item.price)}
                          </span>
                          <span className="text-xs text-gray-300 bg-slate-600/80 px-2 py-1 rounded-full">
                            {item.condition}
                          </span>
                        </div>
                        <p className="text-gray-400 text-xs mt-1">
                          Sold {item.soldDate}
                        </p>
                      </div>
                    </div>
                  </motion.a>
                ))}
              </div>
            </div>
          </motion.section>
        )}
      </AnimatePresence>

      {/* Error State */}
      <AnimatePresence>
        {error && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            className="relative z-10 max-w-xl mx-auto px-6"
          >
            <div className="glass rounded-2xl p-6 border-red-500/50">
              <p className="text-red-300 text-center font-medium">{error}</p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Footer */}
      <footer className="relative z-10 text-center py-12">
        <p className="text-gray-300 text-sm">
          Data sourced from eBay sold listings • Results may vary
        </p>
      </footer>
    </div>
  );
}
