'use client';

import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Barcode, Search, X, TrendingUp, TrendingDown, DollarSign,
  Package, Bell, ArrowRight, ChevronDown
} from 'lucide-react';
import { LanguageProvider, useLanguage, MARKETPLACES } from './LanguageContext';

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend, Filler);

interface PriceData {
  title: string;
  image: string;
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
  currency?: string;
}

const CONDITIONS = [
  { id: 'all', name: 'All Conditions' },
  { id: '3000', name: 'Used' },
  { id: '3001', name: 'Used - Very Good' },
  { id: '3002', name: 'Used - Good' },
  { id: '3003', name: 'Used - Acceptable' },
  { id: '3004', name: 'New' },
  { id: '3005', name: 'New - Other' },
  { id: '3007', name: 'Refurbished' },
];

const LANGUAGES = [
  { id: 'en', name: 'English', flag: '🇺🇸' },
  { id: 'pt-BR', name: 'Português', flag: '🇧🇷' },
  { id: 'es', name: 'Español', flag: '🇪🇸' },
  { id: 'fr', name: 'Français', flag: '🇫🇷' },
  { id: 'it', name: 'Italiano', flag: '🇮🇹' },
];

function HomeContent() {
  const { t, locale, setLocale, marketplace, setMarketplace } = useLanguage();
  const [query, setQuery] = useState('');
  const [isScanning, setIsScanning] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [priceData, setPriceData] = useState<PriceData[]>([]);
  const [stats, setStats] = useState<PriceStats | null>(null);
  const [error, setError] = useState('');
  const [hasSearched, setHasSearched] = useState(false);
  const [isSearching, setIsSearching] = useState(false);
  const [selectedCondition, setSelectedCondition] = useState('all');
  const [alertEmail, setAlertEmail] = useState('');
  const [alertTarget, setAlertTarget] = useState('');
  const [alertSaved, setAlertSaved] = useState(false);
  
  const isSearchingRef = useRef(false);
  const resultsRef = useRef<HTMLDivElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const codeReaderRef = useRef<any>(null);

  useEffect(() => {
    if (priceData.length > 0 && stats && hasSearched && !isSearching && resultsRef.current) {
      resultsRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
      setHasSearched(false);
    }
  }, [priceData, stats, hasSearched, isSearching]);

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

  const startScanning = async () => {
    try {
      setError('');
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment', width: 1280, height: 720 }
      });
      streamRef.current = stream;
      setIsScanning(true);
      setTimeout(() => {
        if (codeReaderRef.current && videoRef.current) {
          codeReaderRef.current.decodeFromVideoDevice(
            undefined,
            videoRef.current,
            async (result: any) => {
              if (result && !isSearchingRef.current) {
                const code = result.getText();
                setQuery(code);
                stopScanning();
                await searchPrices(code);
              }
            }
          );
        }
      }, 100);
    } catch (err) {
      setError(t.errors.cameraDenied);
      setIsScanning(false);
    }
  };

  const stopScanning = () => {
    if (codeReaderRef.current) codeReaderRef.current.reset();
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    if (videoRef.current) videoRef.current.srcObject = null;
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
      console.log('Searching for:', searchQuery, 'marketplace:', marketplace.id);
      
      const res = await fetch(
        `/api/ebay?q=${encodeURIComponent(searchQuery)}&marketplace=${marketplace.id}&condition=${selectedCondition}`
      );
      const data = await res.json();
      console.log('API response:', res.status, data);

      if (res.ok && data.listings?.length > 0) {
        setPriceData(data.listings);
        setStats(data.stats);
      } else if (res.ok) {
        setError(t.listings.noResults);
      } else {
        setError(`API error: ${data.details || res.status}`);
      }
    } catch (err) {
      console.error('Search error:', err);
      setError(t.errors.apiError);
    } finally {
      isSearchingRef.current = false;
      setIsLoading(false);
      setIsSearching(false);
    }
  };

  const saveAlert = () => {
    if (!alertEmail || !alertTarget) return;
    
    const alerts = JSON.parse(localStorage.getItem('priceAlerts') || '[]');
    alerts.push({
      email: alertEmail,
      product: query,
      targetPrice: parseFloat(alertTarget),
      marketplace: marketplace.id
    });
    localStorage.setItem('priceAlerts', JSON.stringify(alerts));
    setAlertSaved(true);
    setTimeout(() => setAlertSaved(false), 3000);
    setAlertEmail('');
    setAlertTarget('');
  };

  const formatCurrency = (price: number) => {
    const localeMap: Record<string, string> = {
      'pt-BR': 'pt-BR', 'es': 'es', 'fr': 'fr', 'it': 'it', 'en': 'en-US',
    };
    return new Intl.NumberFormat(localeMap[locale] || 'en-US', {
      style: 'currency',
      currency: marketplace.currency,
    }).format(price);
  };

  const formatCurrencySimple = (price: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: marketplace.currency,
    }).format(price);
  };

  const CURRENCY_RATES: Record<string, number> = {
    'USD': 1, 'GBP': 0.79, 'EUR': 0.92, 'CAD': 1.36, 'AUD': 1.53,
    'BRL': 4.97,
  };

  const convertPrice = (price: number, fromCurrency: string) => {
    if (fromCurrency === marketplace.currency) return price;
    const usdPrice = price / (CURRENCY_RATES[fromCurrency] || 1);
    return usdPrice * (CURRENCY_RATES[marketplace.currency] || 1);
  };

  const formatConverted = (price: number, fromCurrency: string) => {
    return formatCurrencySimple(convertPrice(price, fromCurrency));
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
      <header className="relative overflow-hidden">
        <div className="absolute inset-0">
          <div className="absolute -top-1/2 -left-1/2 w-full h-full bg-gradient-to-br from-blue-500/20 to-transparent rounded-full blur-3xl animate-pulse-slow" />
          <div className="absolute -bottom-1/2 -right-1/2 w-full h-full bg-gradient-to-tl from-purple-500/20 to-transparent rounded-full blur-3xl animate-pulse-slow" />
        </div>

        <nav className="relative z-10 flex items-center justify-between px-6 py-4 max-w-7xl mx-auto">
          <div className="flex items-center gap-2">
            <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl flex items-center justify-center">
              <DollarSign className="w-6 h-6 text-white" />
            </div>
            <span className="text-xl font-bold text-white">{t.app.title}</span>
          </div>
          <div className="flex items-center gap-3">
            <div className="relative">
              <select
                value={locale}
                onChange={(e) => setLocale(e.target.value as any)}
                className="appearance-none bg-slate-800/80 text-gray-200 text-sm rounded-lg pl-9 pr-8 py-2 cursor-pointer hover:bg-slate-700/80 transition-colors border border-slate-700/50"
              >
                {LANGUAGES.map((lang) => (
                  <option key={lang.id} value={lang.id}>{lang.flag} {lang.name}</option>
                ))}
              </select>
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-lg pointer-events-none">
                {LANGUAGES.find(l => l.id === locale)?.flag}
              </span>
              <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
            </div>
            
            <div className="relative">
              <select
                value={marketplace.id}
                onChange={(e) => setMarketplace(MARKETPLACES.find(m => m.id === e.target.value) || MARKETPLACES[0])}
                className="appearance-none bg-slate-800/80 text-gray-200 text-sm rounded-lg pl-9 pr-8 py-2 cursor-pointer hover:bg-slate-700/80 transition-colors border border-slate-700/50"
              >
                {MARKETPLACES.map((mp) => (
                  <option key={mp.id} value={mp.id}>{mp.flag} {mp.name}</option>
                ))}
              </select>
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-lg pointer-events-none">
                {marketplace.flag}
              </span>
              <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
            </div>
          </div>
        </nav>

        <div className="relative z-10 max-w-4xl mx-auto px-6 pt-12 pb-24 text-center">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }}>
            <h1 className="text-4xl md:text-6xl font-bold text-white mb-6 text-balance">{t.app.tagline}</h1>
            <p className="text-lg text-gray-300 mb-8 max-w-2xl mx-auto">{t.app.subtitle}</p>
          </motion.div>

          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, delay: 0.2 }} className="max-w-2xl mx-auto">
            <div className="bg-slate-800/90 rounded-2xl p-2 border border-slate-700/50">
              <form onSubmit={(e) => { e.preventDefault(); searchPrices(query); }} className="flex items-center gap-2">
                <button type="button" onClick={isScanning ? stopScanning : startScanning} className={`p-4 rounded-xl transition-all ${isScanning ? 'bg-red-500/20 text-red-400 animate-pulse' : 'bg-gradient-to-br from-blue-500 to-purple-600 text-white hover:shadow-lg hover:shadow-purple-500/25'}`}>
                  <Barcode className="w-5 h-5" />
                </button>
                <div className="flex-1 relative">
                  <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input type="text" value={query} onChange={(e) => setQuery(e.target.value)} placeholder={t.app.searchPlaceholder} className="w-full px-12 py-4 bg-slate-700/50 rounded-xl text-gray-200 placeholder-gray-400 border border-slate-600/50 focus:outline-none focus:border-purple-500/70" />
                </div>
                <div className="relative">
                  <select value={selectedCondition} onChange={(e) => setSelectedCondition(e.target.value)} className="appearance-none bg-slate-700/50 text-gray-200 text-sm rounded-xl px-4 py-4 pr-10 border border-slate-600/50 cursor-pointer hover:bg-slate-700/70 transition-colors focus:outline-none focus:border-purple-500/70">
                    {CONDITIONS.map((c) => (<option key={c.id} value={c.id}>{c.name}</option>))}
                  </select>
                  <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                </div>
                <button type="submit" disabled={isLoading || !query.trim()} className="px-8 py-4 bg-gradient-to-br from-blue-500 to-purple-600 text-white rounded-xl font-semibold hover:shadow-lg hover:shadow-purple-500/25 disabled:opacity-50 disabled:cursor-not-allowed transition-all">
                  {isLoading ? <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : t.app.searchButton}
                </button>
              </form>
            </div>
          </motion.div>
        </div>

        <AnimatePresence>
          {isScanning && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-50 bg-black">
              <video ref={videoRef} className="w-full h-full object-cover" autoPlay playsInline muted />
              <div className="absolute inset-0 scanner-overlay flex items-center justify-center">
                <div className="relative w-72 h-72">
                  <div className="absolute top-0 left-0 w-16 h-16 border-t-4 border-l-4 border-blue-500 rounded-tl-xl" />
                  <div className="absolute top-0 right-0 w-16 h-16 border-t-4 border-r-4 border-blue-500 rounded-tr-xl" />
                  <div className="absolute bottom-0 left-0 w-16 h-16 border-b-4 border-l-4 border-blue-500 rounded-bl-xl" />
                  <div className="absolute bottom-0 right-0 w-16 h-16 border-b-4 border-r-4 border-blue-500 rounded-br-xl" />
                  <div className="scanner-line top-0" />
                </div>
              </div>
              <button onClick={stopScanning} className="absolute top-6 right-6 p-3 bg-white/10 backdrop-blur rounded-full text-white hover:bg-white/20 transition-all"><X className="w-6 h-6" /></button>
              <p className="absolute bottom-24 left-0 right-0 text-center text-white/80 text-lg">{t.app.pointCamera}</p>
            </motion.div>
          )}
        </AnimatePresence>
      </header>

      <AnimatePresence>
        {priceData.length > 0 && stats && (
          <motion.section ref={resultsRef} initial={{ opacity: 0, y: 40 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 40 }} className="relative z-10 max-w-6xl mx-auto px-6 py-16">
            
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
              {[
                { key: 'average', label: t.stats.average, value: stats.average, color: 'emerald' },
                { key: 'median', label: t.stats.median, value: stats.median, color: 'sky' },
                { key: 'lowest', label: t.stats.lowest, value: stats.min, color: 'red', icon: TrendingDown },
                { key: 'highest', label: t.stats.highest, value: stats.max, color: 'purple', icon: TrendingUp },
              ].map((stat, i) => (
                <motion.div key={stat.key} initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.1 + i * 0.1 }} className="bg-slate-800/90 rounded-2xl p-6 text-center border border-slate-700/50">
                  <p className="text-gray-300 text-sm mb-2 font-semibold tracking-wide">{stat.label}</p>
                  <p className={`text-2xl md:text-3xl font-bold text-${stat.color}-400`}>{formatConverted(stat.value, stats.currency || 'USD')}</p>
                  {stat.icon && <stat.icon className={`w-5 h-5 text-${stat.color}-400 mx-auto mt-2`} />}
                </motion.div>
              ))}
            </div>

            <div className="bg-slate-800/90 rounded-2xl p-6 border border-slate-700/50 mb-8">
              <div className="flex items-center gap-2 mb-4">
                <Bell className="w-5 h-5 text-amber-400" />
                <h3 className="text-lg font-bold text-white">Price Alert</h3>
              </div>
              <div className="flex flex-wrap gap-4 items-end">
                <div className="flex-1 min-w-48">
                  <label className="block text-gray-400 text-sm mb-1">Email</label>
                  <input type="email" value={alertEmail} onChange={(e) => setAlertEmail(e.target.value)} placeholder="your@email.com" className="w-full px-4 py-3 bg-slate-700/50 rounded-xl text-white placeholder-gray-400 border border-slate-600/50 focus:outline-none focus:border-purple-500/70" />
                </div>
                <div className="w-32">
                  <label className="block text-gray-400 text-sm mb-1">Target Price</label>
                  <input type="number" value={alertTarget} onChange={(e) => setAlertTarget(e.target.value)} placeholder="0.00" className="w-full px-4 py-3 bg-slate-700/50 rounded-xl text-white placeholder-gray-400 border border-slate-600/50 focus:outline-none focus:border-purple-500/70" />
                </div>
                <button onClick={saveAlert} className="px-6 py-3 bg-gradient-to-br from-amber-500 to-orange-600 text-white rounded-xl font-semibold hover:shadow-lg hover:shadow-amber-500/25 transition-all">
                  {alertSaved ? '✓ Saved!' : 'Notify Me'}
                </button>
              </div>
            </div>

            <div className="bg-slate-800/90 rounded-3xl p-6 border border-slate-700/50">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-bold text-gray-100 flex items-center gap-2">
                  <Package className="w-5 h-5 text-gray-300" />
                  {t.listings.title}
                </h2>
                <div className="flex items-center gap-3">
                  <span className="text-sm text-gray-400">{marketplace.flag} {marketplace.name}</span>
                  <span className="text-gray-300 font-medium">{stats.count} {t.stats.itemsAnalyzed}</span>
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {priceData.slice(0, 12).map((item, i) => (
                  <motion.a key={i} href={item.url} target="_blank" rel="noopener noreferrer" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5 + i * 0.05 }} className="group block bg-slate-700/50 rounded-xl p-4 hover:bg-slate-700 transition-all hover:scale-[1.02] border border-slate-600/50">
                    <div className="flex gap-4">
                      {item.image && <img src={item.image} alt={item.title} className="w-20 h-20 object-cover rounded-lg flex-shrink-0" onError={(e) => { e.currentTarget.src = 'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" width="80" height="80"/><rect fill="%23f5f5f5" width="80" height="80"/><text x="40" y="45" text-anchor="middle" fill="%23999" font-size="10">No Image</text></svg>'; }} />}
                      <div className="flex-1 min-w-0">
                        <p className="text-gray-200 font-medium text-sm line-clamp-2 mb-2">{item.title}</p>
                        <div className="flex items-center justify-between">
                          <span className="text-xl font-bold text-emerald-400">{formatConverted(item.price, item.currency)}</span>
                          <span className="text-xs text-gray-300 bg-slate-600/80 px-2 py-1 rounded-full">{item.condition}</span>
                        </div>
                        <p className="text-gray-400 text-xs mt-1">Sold {item.soldDate}</p>
                      </div>
                    </div>
                  </motion.a>
                ))}
              </div>
            </div>
          </motion.section>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {error && (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 20 }} className="relative z-10 max-w-xl mx-auto px-6">
            <div className="bg-slate-800/90 rounded-2xl p-6 border border-red-500/50">
              <p className="text-red-300 text-center font-medium">{error}</p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <footer className="relative z-10 text-center py-12">
        <p className="text-gray-300 text-sm">{t.footer.credit}</p>
      </footer>
    </div>
  );
}

export default function Home() {
  return (
    <LanguageProvider>
      <HomeContent />
    </LanguageProvider>
  );
}
