// Popular product categories for SEO landing pages
export const CATEGORIES = [
  {
    slug: "electronics",
    name: "Electronics",
    description: "Check eBay prices for smartphones, laptops, cameras, and electronics",
    keywords: ["iPhone", "Samsung", "laptop", "camera", "headphones", "gaming console"],
    searchVolume: "high",
    subcategories: ["phones", "laptops", "cameras", "gaming", "audio"]
  },
  {
    slug: "collectibles",
    name: "Collectibles",
    description: "Find market values for trading cards, coins, stamps, and collectibles",
    keywords: ["Pokemon cards", "sports cards", "coins", "vintage toys", "comics"],
    searchVolume: "high",
    subcategories: ["trading-cards", "coins", "toys", "memorabilia"]
  },
  {
    slug: "fashion",
    name: "Fashion",
    description: "Check sold prices for designer clothes, shoes, handbags, and accessories",
    keywords: ["Nike", "Adidas", "Louis Vuitton", "Gucci", "Jordan", "Yeezy"],
    searchVolume: "high",
    subcategories: ["sneakers", "handbags", "watches", "clothing"]
  },
  {
    slug: "home-garden",
    name: "Home & Garden",
    description: "Compare prices for furniture, appliances, tools, and home decor",
    keywords: ["furniture", "appliances", "tools", "kitchen", "outdoor"],
    searchVolume: "medium",
    subcategories: ["furniture", "appliances", "tools", "decor"]
  },
  {
    slug: "sports",
    name: "Sporting Goods",
    description: "Check market values for exercise equipment, bikes, and sports gear",
    keywords: ["golf clubs", "bicycle", "treadmill", "kayak", "fishing"],
    searchVolume: "medium",
    subcategories: ["exercise", "outdoor", "golf", "cycling"]
  },
  {
    slug: "jewelry",
    name: "Jewelry & Watches",
    description: "Find eBay prices for gold, silver, diamonds, and luxury watches",
    keywords: ["Rolex", "gold chain", "diamond ring", "silver", "Omega"],
    searchVolume: "high",
    subcategories: ["watches", "gold", "silver", "diamonds"]
  },
  {
    slug: "automotive",
    name: "Automotive",
    description: "Check prices for car parts, accessories, and tools",
    keywords: ["car parts", "tires", "wheels", "tools", "GPS"],
    searchVolume: "medium",
    subcategories: ["parts", "accessories", "tools", "electronics"]
  },
  {
    slug: "musical-instruments",
    name: "Musical Instruments",
    description: "Find market values for guitars, keyboards, drums, and pro audio",
    keywords: ["guitar", "Fender", "Gibson", "piano", "drums", "microphone"],
    searchVolume: "medium",
    subcategories: ["guitars", "keyboards", "drums", "audio"]
  }
];

// Popular brands for SEO
export const BRANDS = [
  { slug: "apple", name: "Apple", category: "electronics", popular: ["iPhone", "iPad", "MacBook", "AirPods", "Apple Watch"] },
  { slug: "samsung", name: "Samsung", category: "electronics", popular: ["Galaxy", "TV", "monitor", "tablet"] },
  { slug: "sony", name: "Sony", category: "electronics", popular: ["PlayStation", "headphones", "camera", "TV"] },
  { slug: "nike", name: "Nike", category: "fashion", popular: ["Air Jordan", "Air Max", "Dunk", " hoodie", "tech fleece"] },
  { slug: "adidas", name: "Adidas", category: "fashion", popular: ["Yeezy", "Ultraboost", "NMD", "tracksuit"] },
  { slug: "louis-vuitton", name: "Louis Vuitton", category: "fashion", popular: ["bag", "wallet", "belt", "shoes"] },
  { slug: "gucci", name: "Gucci", category: "fashion", popular: ["bag", "belt", "shoes", "wallet"] },
  { slug: "rolex", name: "Rolex", category: "jewelry", popular: ["Submariner", "Daytona", "Datejust", "GMT"] },
  { slug: "nintendo", name: "Nintendo", category: "electronics", popular: ["Switch", "games", "Game Boy", "retro"] },
  { slug: "lego", name: "LEGO", category: "collectibles", popular: ["Star Wars", "Technic", "Modular", "retired"] },
  { slug: "fender", name: "Fender", category: "musical-instruments", popular: ["Stratocaster", "Telecaster", "amp"] },
  { slug: "gibson", name: "Gibson", category: "musical-instruments", popular: ["Les Paul", "SG", "acoustic"] },
  { slug: "pokemon", name: "Pokemon", category: "collectibles", popular: ["cards", "sealed", "vintage", "booster"] },
  { slug: "yamaha", name: "Yamaha", category: "musical-instruments", popular: ["piano", "keyboard", "guitar", "motorcycle"] },
  { slug: "canon", name: "Canon", category: "electronics", popular: ["camera", "lens", "printer", "EOS"] }
];

// Generate static paths for categories
export function generateCategoryPaths() {
  return CATEGORIES.map(cat => ({ slug: cat.slug }));
}

// Generate static paths for brands  
export function generateBrandPaths() {
  return BRANDS.map(brand => ({ slug: brand.slug }));
}
