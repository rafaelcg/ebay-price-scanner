'use client';

import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence, m } from 'framer-motion';
import { 
  Barcode, Search, X, TrendingUp, TrendingDown, DollarSign,
  Package, Bell, Clock, TrendingRight, Globe, ChevronDown
} from 'lucide-react';
import { LanguageProvider, useLanguage, MARKETPLACES } from './LanguageContext';
import {
  Chart as ChartJS, CategoryScale, LinearScale, PointElement,
  LineElement, Title, Tooltip, Legend, Filler
} from 'chart.js';
import { Line } from 'react-chartjs-2';

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend, Filler);

interface PriceData {
  title: string;
  image: string;
  soldDate: string;
  soldDateRaw?: string;
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

interface ActiveListing {
  title: string;
  image: string;
  price: number;
  currency: string;
  condition: string;
  url: string;
}

interface PriceHistoryPoint {
  date: string;
  avgPrice: number;
  count: number;
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

function HomeContent() {
  const { t, locale, setLocale, marketplace, setMarketplace } = useLanguage();
  const [query, setQuery] = useState('');
  const [isScanning, setIsScanning] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [priceData, setPriceData] = useState<PriceData[]>([]);
  const [activeListings, setActiveListings] = useState<ActiveListing[]>([]);
  const [stats, setStats] = useState<PriceStats | null>(null);
  const [priceHistory, setPriceHistory] = useState<PriceHistoryPoint[]>([]);
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
    setActiveListings([]);
    setPriceHistory([]);
    setHasSearched(true);

    try {
      const soldRes = await fetch(
        `/api/ebay?q=${encodeURIComponent(searchQuery)}&marketplace=${marketplace.id}&condition=${selectedCondition}`
      );
      const soldData = await soldRes.json();

      if (soldRes.ok && soldData.listings?.length > 0) {
        setPriceData(soldData.listings);
        setStats(soldData.stats);
      } else if (soldRes.ok && soldData.listings?.length === 0) {
        setError(t.listings.noResults);
      }

      const activeRes = await fetch(
        `/api/ebay/active?q=${encodeURIComponent(searchQuery)}&marketplace=${marketplace.id}`
      );
      const activeData = await activeRes.json();
      if (activeRes.ok && activeData.listings) {
        setActiveListings(activeData.listings);
      }

      const history = generatePriceHistory(soldData.listings || []);
      setPriceHistory(history);
    } catch (err) {
      setError(t.errors.apiError);
      console.error(err);
    } finally {
      isSearchingRef.current = false;
      setIsLoading(false);
      setIsSearching(false);
    }
  };

  const generatePriceHistory = (listings: PriceData[]): PriceHistoryPoint[] => {
    if (listings.length === 0) return [];
    
    const grouped: Record<string, { sum: number; count: number }> = {};
    listings.forEach(item => {
      if (item.soldDateRaw) {
        if (!grouped[item.soldDateRaw]) {
          grouped[item.soldDateRaw] = { sum: 0, count: 0 };
        }
        grouped[item.soldDateRaw].sum += item.price;
        grouped[item.soldDateRaw].count += 1;
      }
    });

    return Object.entries(grouped)
      .sort((a, b) => a[0].localeCompare(b[0]))
      .slice(-30)
      .map(([date, data]) => ({
        date,
        avgPrice: Math.round(data.sum / data.count),
        count: data.count
      }));
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

  // Currency conversion rates (base: USD)
  const CURRENCY_RATES: Record<string, number> = {
    'USD': 1, 'GBP': 0.79, 'EUR': 0.92, 'CAD': 1.36, 'AUD': 1.53,
    'BRL': 4.97, 'FR': 0.92, 'ES': 0.92, 'IT': 0.92,
  };

  const convertPrice = (price: number, fromCurrency: string) => {
    if (fromCurrency === marketplace.currency) return price;
    const usdPrice = price / (CURRENCY_RATES[fromCurrency] || 1);
    return usdPrice * (CURRENCY_RATES[marketplace.currency] || 1);
  };

  const formatConverted = (price: number, fromCurrency: string) => {
    return formatCurrencySimple(convertPrice(price, fromCurrency));
  };

  const chartData = {
    labels: priceHistory.map(p => p.date),
    datasets: [
      {
        label: t.stats.average,
        data: priceHistory.map(p => p.avgPrice),
        borderColor: 'rgb(52, 211, 153)',
        backgroundColor: 'rgba(52, 211, 153, 0.1)',
        fill: true,
        tension: 0.4,
      },
    ],
  };

  const chartOptions = {
    responsive: true,
    plugins: { legend: { display: false } },
    scales: {
      x: { display: false },
      y: {
        ticks: { callback: (value: any) => formatCurrencySimple(value), color: '#9ca3af' },
        grid: { color: 'rgba(255,255,255,0.05)' }
      }
    }
  };

  const activeAvg = activeListings.length > 0 
    ? activeListings.reduce((a, b) => a + convertPrice(b.price, b.currency), 0) / activeListings.length 
    : 0;
  const priceDiff = stats ? activeAvg - convertPrice(stats.average, stats.currency || 'USD') : 0;

  // Custom Dropdown Component
  const CustomSelect = ({ 
    value, 
    options, 
    onChange, 
    label,
    icon: Icon 
  }: { 
    value: string; 
    options: { id: string; name: string; flag?: string; currency?: string }[]; 
    onChange: (val: string) => void;
    label?: string;
    icon?: any;
  }) => {
    const [isOpen, setIsOpen] = useState(false);
    const dropdownRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
      const handleClickOutside = (e: MouseEvent) => {
        if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
          setIsOpen(false);
        }
      };
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const selected = options.find(o => o.id === value);

    return (
      <div ref={dropdownRef} className="relative">
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="flex items-center gap-2 px-3 py-2 bg-slate-800/80 hover:bg-slate-700/80 rounded-lg border border-slate-700/50 transition-all group"
        >
          {Icon && <Icon className="w-4 h-4 text-gray-400 group-hover:text-white transition-colors" />}
          {selected?.flag && <span className="text-lg">{selected.flag}</span>}
          <span className="text-sm text-gray-200">{selected?.name || selected?.id}</span>}
          <ChevronDown className={`w-4 h-4 text-gray-500 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
        </button>
        <AnimatePresence>
          {isOpen && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="absolute right-0 top-full mt-2 w-56 bg-slate-800 border border-slate-700/50 rounded-xl shadow-xl overflow-hidden z-50"
            >
              {label && (
                <div className="px-4 py-2 bg-slate-900/50 border-b border-slate-700/50">
                  <p className="text-xs font-medium text-gray-400 uppercase tracking-wider">{label}</p>
                </div>
              )}
              <div className="max-h-64 overflow-y-auto">
                {options.map((option) => (
                  <button
                    key={option.id}
                    onClick={() => { onChange(option.id); setIsOpen(false); }}
                    className={`w-full flex items-center gap-3 px-4 py-3 hover:bg-slate-700/50 transition-colors ${value === option.id ? 'bg-slate-700/30' : ''}`}
                  >
                    {option.flag && <span className="text-lg">{option.flag}</span>}
                    <div className="flex-1 text-left">
                      <p className="text-sm text-gray-200">{option.name}</p>
                      {option.currency && <p className="text-xs text-gray-500">{option.currency}</p>}
                    </div>
                    {value === option.id && (
                      <div className="w-2 h-2 bg-emerald-400 rounded-full" />
                    )}
                  </button>
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    );
  };

  const languageOptions = [
    { id: 'en', name: 'English', flag: '🇺🇸' },
    { id: 'pt-BR', name: 'Português (BR)', flag: '🇧🇷' },
    { id: 'es', name: 'Español', flag: '🇪🇸' },
    { id: 'fr', name: 'Français', flag: '🇫🇷' },
    { id: 'it', name: 'Italiano', flag: '🇮🇹' },
  ];

  const marketplaceOptions = MARKETPLACES.map(mp => ({
    id: mp.id,
    name: mp.name,
    flag: mp.flag,
    currency: mp.currency
  }));

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
            <CustomSelect
              value={locale}
              options={languageOptions}
              onChange={(val) => setLocale(val as any)}
              label="Language"
              icon={Globe}
            />
            <CustomSelect
              value={marketplace.id}
              options={marketplaceOptions}
              onChange={(val) => setMarketplace(MARKETPLACES.find(m => m.id === val) || MARKETPLACES[0])}
              label="Marketplace"
            />
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
            
            {priceHistory.length > 0 && (
              <div className="bg-slate-800/90 rounded-2xl p-6 border border-slate-700/50 mb-8">
                <div className="flex items-center gap-2 mb-4">
                  <Clock className="w-5 h-5 text-emerald-400" />
                  <h3 className="text-lg font-bold text-white">Price Trend (30 Days)</h3>
                </div>
                <div className="h-48">
                  <Line data={chartData} options={chartOptions as any} />
                </div>
              </div>
            )}

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

            {activeListings.length > 0 && (
              <div className="bg-slate-800/90 rounded-2xl p-6 border border-slate-700/50 mb-8">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2">
                    <TrendingRight className="w-5 h-5 text-blue-400" />
                    <h3 className="text-lg font-bold text-white">Active Listings vs Sold Prices</h3>
                  </div>
                  <span className="text-sm text-gray-400 flex items-center gap-1">
                    {marketplace.flag} Searching {marketplace.name}
                  </span>
                </div>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="bg-slate-700/50 rounded-xl p-4 text-center">
                    <p className="text-gray-400 text-sm mb-1">Active Avg</p>
                    <p className="text-xl font-bold text-blue-400">{formatCurrencySimple(activeAvg)}</p>
                  </div>
                  <div className="bg-slate-700/50 rounded-xl p-4 text-center">
                    <p className="text-gray-400 text-sm mb-1">Sold Avg</p>
                    <p className="text-xl font-bold text-emerald-400">{formatConverted(stats.average, stats.currency || 'USD')}</p>
                  </div>
                  <div className="bg-slate-700/50 rounded-xl p-4 text-center">
                    <p className="text-gray-400 text-sm mb-1">Active Items</p>
                    <p className="text-xl font-bold text-white">{activeListings.length}</p>
                  </div>
                  <div className="bg-slate-700/50 rounded-xl p-4 text-center">
                    <p className="text-gray-400 text-sm mb-1">Difference</p>
                    <p className="text-xl font-bold text-purple-400">{formatCurrencySimple(priceDiff)}</p>
                  </div>
                </div>
              </div>
            )}

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
                  <span className="text-sm text-gray-400 flex items-center gap-1">
                    {marketplace.flag} {marketplace.name}
                  </span>
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
