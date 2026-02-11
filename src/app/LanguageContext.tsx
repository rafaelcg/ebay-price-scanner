'use client';

import {createContext, useContext, useState, useEffect, ReactNode} from 'react';

type Locale = 'en' | 'pt-BR' | 'es' | 'fr' | 'it';

interface Translations {
  app: {
    title: string;
    tagline: string;
    subtitle: string;
    searchPlaceholder: string;
    searchButton: string;
    orType: string;
    modeBarcode: string;
    modeText: string;
    scan: string;
    scanning: string;
    pointCamera: string;
  };
  features: {
    instant: { title: string; desc: string };
    accurate: { title: string; desc: string };
    easy: { title: string; desc: string };
  };
  stats: {
    average: string;
    median: string;
    lowest: string;
    highest: string;
    itemsAnalyzed: string;
  };
  listings: {
    title: string;
    noResults: string;
  };
  footer: {
    credit: string;
  };
  errors: {
    noQuery: string;
    apiError: string;
    cameraDenied: string;
  };
  marketplace: {
    label: string;
  };
}

const translations: Record<Locale, Translations> = {
  en: {
    app: {
      title: 'PriceScan',
      tagline: "Know What It's Really Worth",
      subtitle: 'Scan any barcode or search any product to instantly see eBay sold prices. Min, max, average, and median market values — all in one tap.',
      searchPlaceholder: 'Search any product...',
      searchButton: 'Search',
      orType: 'Or type product name...',
      modeBarcode: 'Barcode',
      modeText: 'Text Search',
      scan: 'Scan',
      scanning: 'Scanning...',
      pointCamera: 'Point camera at a barcode'
    },
    features: {
      instant: { title: 'Instant Results', desc: 'Real-time eBay sold data' },
      accurate: { title: 'Accurate Data', desc: 'Millions of sales analyzed' },
      easy: { title: 'Easy to Use', desc: 'Scan or search instantly' }
    },
    stats: {
      average: 'AVERAGE',
      median: 'MEDIAN',
      lowest: 'LOWEST',
      highest: 'HIGHEST',
      itemsAnalyzed: 'items analyzed'
    },
    listings: {
      title: 'Recent Sold Listings',
      noResults: 'No sold listings found for this product'
    },
    footer: {
      credit: 'Data sourced from eBay sold listings • Results may vary'
    },
    errors: {
      noQuery: 'Please enter a search term',
      apiError: 'Failed to fetch eBay data',
      cameraDenied: 'Camera access denied. Please allow camera permissions.'
    },
    marketplace: {
      label: 'Marketplace'
    }
  },
  'pt-BR': {
    app: {
      title: 'PriceScan',
      tagline: 'Descubra o Verdadeiro Valor',
      subtitle: 'Escaneie qualquer codigo de barras ou busque qualquer produto para ver instantaneamente os precos de venda no eBay. Valores minimo, maximo, medio e mediano — tudo em um toque.',
      searchPlaceholder: 'Buscar qualquer produto...',
      searchButton: 'Buscar',
      orType: 'Ou digite o nome do produto...',
      modeBarcode: 'Codigo de Barras',
      modeText: 'Buscar Texto',
      scan: 'Escanear',
      scanning: 'Escaneando...',
      pointCamera: 'Aponte a camera para um codigo de barras'
    },
    features: {
      instant: { title: 'Resultados Instantaneos', desc: 'Dados de vendas do eBay em tempo real' },
      accurate: { title: 'Dados Precisos', desc: 'Milhoes de vendas analisadas' },
      easy: { title: 'Facil de Usar', desc: 'Escaneie ou busque instantaneamente' }
    },
    stats: {
      average: 'MEDIA',
      median: 'MEDIANA',
      lowest: 'MENOR',
      highest: 'MAIOR',
      itemsAnalyzed: 'itens analisados'
    },
    listings: {
      title: 'Vendas Recentes',
      noResults: 'Nenhuma venda encontrada para este produto'
    },
    footer: {
      credit: 'Dados do eBay • Resultados podem variar'
    },
    errors: {
      noQuery: 'Por favor, digite um termo de busca',
      apiError: 'Falha ao buscar dados do eBay',
      cameraDenied: 'Acesso a camera negado. Por favor, permita as permissoes.'
    },
    marketplace: {
      label: 'Mercado'
    }
  },
  es: {
    app: {
      title: 'PriceScan',
      tagline: 'Descubre el Verdadero Valor',
      subtitle: 'Escanea cualquier codigo de barras o busca cualquier producto para ver instantaneamente los precios de venta en eBay. Valores minimo, maximo, promedio y mediano — todo en un toque.',
      searchPlaceholder: 'Buscar cualquier producto...',
      searchButton: 'Buscar',
      orType: 'O escribe el nombre del producto...',
      modeBarcode: 'Codigo de Barras',
      modeText: 'Buscar Texto',
      scan: 'Escanear',
      scanning: 'Escaneando...',
      pointCamera: 'Apunta la camara a un codigo de barras'
    },
    features: {
      instant: { title: 'Resultados Instantaneos', desc: 'Datos de ventas de eBay en tiempo real' },
      accurate: { title: 'Datos Precisos', desc: 'Millones de ventas analizadas' },
      easy: { title: 'Facil de Usar', desc: 'Escanea o busca instantaneamente' }
    },
    stats: {
      average: 'PROMEDIO',
      median: 'MEDIANA',
      lowest: 'MENOR',
      highest: 'MAYOR',
      itemsAnalyzed: 'articulos analizados'
    },
    listings: {
      title: 'Ventas Recientes',
      noResults: 'No se encontraron ventas para este producto'
    },
    footer: {
      credit: 'Datos de eBay • Los resultados pueden variar'
    },
    errors: {
      noQuery: 'Por favor, ingresa un termino de busqueda',
      apiError: 'Error al obtener datos de eBay',
      cameraDenied: 'Acceso a camara denegado. Por favor, permite los permisos.'
    },
    marketplace: {
      label: 'Mercado'
    }
  },
  fr: {
    app: {
      title: 'PriceScan',
      tagline: 'Decouvrez la Vraie Valeur',
      subtitle: 'Scannez nimporte quel code-barres ou recherchez nimporte quel produit pour voir instantanement les prix de vente sur eBay. Valeurs min, max, moyenne et mediane — tout en un tap.',
      searchPlaceholder: 'Rechercher un produit...',
      searchButton: 'Rechercher',
      orType: 'Ou tapez le nom du produit...',
      modeBarcode: 'Code-barres',
      modeText: 'Recherche Texte',
      scan: 'Scanner',
      scanning: 'Scan en cours...',
      pointCamera: 'Pointez la camera vers un code-barres'
    },
    features: {
      instant: { title: 'Resultats Instantanes', desc: 'Donnees de ventes eBay en temps reel' },
      accurate: { title: 'Donnees Precises', desc: 'Millions de ventes analysee' },
      easy: { title: 'Facile a Utiliser', desc: 'Scannez ou recherchez instantanement' }
    },
    stats: {
      average: 'MOYENNE',
      median: 'MEDIANE',
      lowest: 'MINIMUM',
      highest: 'MAXIMUM',
      itemsAnalyzed: 'articles analyses'
    },
    listings: {
      title: 'Ventes Recentes',
      noResults: 'Aucune vente trouvee pour ce produit'
    },
    footer: {
      credit: 'Donnees eBay • Les resultats peuvent varier'
    },
    errors: {
      noQuery: 'Veuillez entrer un terme de recherche',
      apiError: 'Echec de la recuperation des donnees eBay',
      cameraDenied: 'Acces camera refuse. Veuillez autoriser les permissions.'
    },
    marketplace: {
      label: 'Marche'
    }
  },
  it: {
    app: {
      title: 'PriceScan',
      tagline: 'Scopri il Vero Valore',
      subtitle: 'Scansiona qualsiasi codice a barre o cerca qualsiasi prodotto per vedere istantaneamente i prezzi di vendita su eBay. Valori min, max, medio e mediano — tutto in un tap.',
      searchPlaceholder: 'Cerca un prodotto...',
      searchButton: 'Cerca',
      orType: 'Oppure digita il nome del prodotto...',
      modeBarcode: 'Codice a Barre',
      modeText: 'Cerca Testo',
      scan: 'Scansiona',
      scanning: 'Scansione in corso...',
      pointCamera: 'Punta la fotocamera verso un codice a barre'
    },
    features: {
      instant: { title: 'Risultati Istantanei', desc: 'Dati vendite eBay in tempo reale' },
      accurate: { title: 'Dati Precisi', desc: 'Milioni di vendite analizzate' },
      easy: { title: 'Facile da Usare', desc: 'Scansiona o cerca istantaneamente' }
    },
    stats: {
      average: 'MEDIA',
      median: 'MEDIANA',
      lowest: 'MINIMO',
      highest: 'MASSIMO',
      itemsAnalyzed: 'articoli analizzati'
    },
    listings: {
      title: 'Vendite Recenti',
      noResults: 'Nessuna vendita trovata per questo prodotto'
    },
    footer: {
      credit: 'Dati eBay • I risultati possono variare'
    },
    errors: {
      noQuery: 'Inserisci un termine di ricerca',
      apiError: 'Errore nel recupero dati eBay',
      cameraDenied: 'Accesso fotocamera negato. Per favore, consenti i permessi.'
    },
    marketplace: {
      label: 'Mercato'
    }
  }
};

interface Marketplace {
  id: string;
  name: string;
  currency: string;
  flag: string;
  locale: string;
}

interface LanguageContextType {
  locale: Locale;
  setLocale: (locale: Locale) => void;
  marketplace: Marketplace;
  setMarketplace: (mp: Marketplace) => void;
  t: Translations;
}

const LanguageContext = createContext<LanguageContextType | null>(null);

export const MARKETPLACES: Marketplace[] = [
  { id: 'GB', name: 'UK', currency: 'GBP', flag: '🇬🇧', locale: 'en' },
  { id: 'US', name: 'US', currency: 'USD', flag: '🇺🇸', locale: 'en' },
  { id: 'CA', name: 'Canada', currency: 'CAD', flag: '🇨🇦', locale: 'en' },
  { id: 'AU', name: 'Australia', currency: 'AUD', flag: '🇦🇺', locale: 'en' },
  { id: 'PT', name: 'Brasil', currency: 'BRL', flag: '🇧🇷', locale: 'pt-BR' },
  { id: 'ES', name: 'Espana', currency: 'EUR', flag: '🇪🇸', locale: 'es' },
  { id: 'FR', name: 'France', currency: 'EUR', flag: '🇫🇷', locale: 'fr' },
  { id: 'IT', name: 'Italia', currency: 'EUR', flag: '🇮🇹', locale: 'it' },
];

export function LanguageProvider({children}: {children: ReactNode}) {
  const [locale, setLocale] = useState<Locale>('en');
  const [marketplace, setMarketplace] = useState<Marketplace>(MARKETPLACES[0]);

  useEffect(() => {
    const browserLang = navigator.language.split('-')[0];
    const supportedLangs: Locale[] = ['en', 'pt-BR', 'es', 'fr', 'it'];
    const savedLocale = localStorage.getItem('locale') as Locale;
    const savedMarketplace = localStorage.getItem('marketplace');

    if (savedLocale && supportedLangs.includes(savedLocale)) {
      setLocale(savedLocale);
    } else if (supportedLangs.includes(browserLang as Locale)) {
      if (browserLang === 'pt') {
        setLocale('pt-BR');
      } else {
        setLocale(browserLang as Locale);
      }
    }

    if (savedMarketplace) {
      const mp = MARKETPLACES.find(m => m.id === savedMarketplace);
      if (mp) {
        setMarketplace(mp);
      }
    }
  }, []);

  const value: LanguageContextType = {
    locale,
    setLocale: (l: Locale) => {
      setLocale(l);
      localStorage.setItem('locale', l);
    },
    marketplace,
    setMarketplace: (mp: Marketplace) => {
      setMarketplace(mp);
      localStorage.setItem('marketplace', mp.id);
    },
    t: translations[locale]
  };

  return (
    <LanguageContext.Provider value={value}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
}

export const LANGUAGES: {id: Locale; name: string; flag: string}[] = [
  {id: 'en', name: 'English', flag: '🇺🇸'},
  {id: 'pt-BR', name: 'Portugues', flag: '🇧🇷'},
  {id: 'es', name: 'Espanol', flag: '🇪🇸'},
  {id: 'fr', name: 'Francais', flag: '🇫🇷'},
  {id: 'it', name: 'Italiano', flag: '🇮🇹'},
];
