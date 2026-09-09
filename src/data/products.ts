import { Product, BrandConfig } from '../types';

export const INITIAL_BRAND: BrandConfig = {
  name: "CLOTHIQO",
  logo: "/clothiqo-logo.jpg",
  primary: "#111111",
  secondary: "#444444"
};

export const BRAND_PRESETS = [
  {
    name: "CLOTHIQO Signature",
    brandName: "CLOTHIQO",
    logo: "/clothiqo-logo.jpg",
    primary: "#111111",
    secondary: "#444444",
  },
  {
    name: "Clothiqo Atelier",
    brandName: "CLOTHIQO",
    logo: "/clothiqo-logo.jpg",
    primary: "#78162b",
    secondary: "#c5a880",
  },
  {
    name: "Royal Violet",
    brandName: "Nova Store",
    logo: "",
    primary: "#7c3aed",
    secondary: "#a78bfa",
  },
  {
    name: "Cyber Cobalt",
    brandName: "Cobalt Supply",
    logo: "",
    primary: "#2563eb",
    secondary: "#60a5fa",
  },
  {
    name: "Emerald Studio",
    brandName: "Emerald Atelier",
    logo: "",
    primary: "#059669",
    secondary: "#34d399",
  },
  {
    name: "Monochrome Luxe",
    brandName: "CLOTHIQO Noir",
    logo: "",
    primary: "#18181b",
    secondary: "#71717a",
  }
];

export const PRODUCTS: Product[] = [
  {
    id: "prod_1",
    name: "Urban Black Baggy",
    price: 1890,
    priceFormatted: "৳1,890",
    currency: "৳",
    icon: "UB",
    category: "Baggy Pants",
    tag: "Street Classic",
    image: "https://images.unsplash.com/photo-1624378439575-d8705ad7ae80",
    description: "Heavyweight cotton baggy silhouette featuring dropped inseam, articulated knee tucks, and deep streetwear front slash pockets.",
    fabric: "100% Heavyweight Cotton Twill (360 GSM)",
    colors: ["Black", "Grey"],
    sizes: ["28", "30", "32", "34", "36", "38", "40"],
    stock: 25,
    details: {
      material: "100% Heavyweight Cotton Twill (360 GSM)",
      fit: "Relaxed baggy cut with wide leg opening",
      weight: "Heavyweight structural drape",
      waistband: "Belt loops with internal hidden drawcord",
      care: "Machine wash cold inside out, hang dry"
    }
  },
  {
    id: "prod_2",
    name: "Classic Formal Black",
    price: 2190,
    priceFormatted: "৳2,190",
    currency: "৳",
    icon: "CF",
    category: "Formal Pants",
    tag: "Atelier Tailored",
    image: "https://images.unsplash.com/photo-1594633312681-425c7b97ccd1",
    description: "Sharp pressed crease formal trousers with tailored waistband side adjusters, double besom back pockets, and non-crease tropical blend.",
    fabric: "Tropical Poly-Viscose Worsted Blend with 2% Elastane",
    colors: ["Black", "Navy"],
    sizes: ["28", "30", "32", "34", "36", "38", "40", "42"],
    stock: 30,
    details: {
      material: "Tropical Poly-Viscose Worsted Blend with 2% Elastane",
      fit: "Tailored straight leg with crisp razor crease",
      weight: "Medium-weight breathable year-round drape",
      waistband: "Extended tab hook & bar with brass side adjusters",
      care: "Dry clean or gentle cold cycle"
    }
  },
  {
    id: "prod_3",
    name: "Premium Wide-Leg Cream",
    price: 2290,
    priceFormatted: "৳2,290",
    currency: "৳",
    icon: "PW",
    category: "Wide-Leg Pants",
    tag: "Editor's Pick",
    image: "https://images.unsplash.com/photo-1551488831-00ddcb6c6bd3",
    description: "Warm ecru cream wide-leg trouser with double front knife pleats, room through the thighs, and pristine clean hems.",
    fabric: "Organic Heavyweight Cotton Canvas with soft-wash finish",
    colors: ["Cream", "Beige"],
    sizes: ["28", "30", "32", "34", "36", "38", "40", "42"],
    stock: 18,
    details: {
      material: "Organic Heavyweight Cotton Canvas with soft-wash finish",
      fit: "Double pleated wide cut falling straight to floor",
      weight: "Substantial clean drape without transparency",
      waistband: "Continuous clean waistband with hidden hook",
      care: "Machine wash cold with mild detergent"
    }
  },
  {
    id: "prod_4",
    name: "Oversized Grey Baggy",
    price: 1990,
    priceFormatted: "৳1,990",
    currency: "৳",
    icon: "OG",
    category: "Baggy Pants",
    tag: "Oversized",
    image: "https://images.unsplash.com/photo-1515886657613-9f3515b0c78f",
    description: "Contemporary skater baggy cut in washed ash grey with bar-tack reinforced stress points and drawstring hidden internal waist.",
    fabric: "Washed Brushed Bull Denim (380 GSM)",
    colors: ["Grey", "Black"],
    sizes: ["30", "32", "34", "36", "38", "40", "42"],
    stock: 22,
    details: {
      material: "Washed Brushed Bull Denim (380 GSM)",
      fit: "Extra roomy loose thigh with slight taper at ankle",
      weight: "Rugged durable heavyweight cotton",
      waistband: "Double-reinforced waistband with heavy-duty YKK zip",
      care: "Wash with similar darks, tumble dry low"
    }
  },
  {
    id: "prod_5",
    name: "Executive Formal Trouser",
    price: 2490,
    priceFormatted: "৳2,490",
    currency: "৳",
    icon: "EF",
    category: "Formal Pants",
    tag: "Signature Luxe",
    image: "https://images.unsplash.com/photo-1598032895397-b9472444bf93",
    description: "Executive-grade formal trouser crafted with extended tab closure, silk-lined waistband curtain, and structured drape.",
    fabric: "Italian Style Fine Worsted Twill (320 GSM)",
    colors: ["Black", "Charcoal"],
    sizes: ["28", "30", "32", "34", "36", "38", "40"],
    stock: 15,
    details: {
      material: "Italian Style Fine Worsted Twill (320 GSM)",
      fit: "Slim-tailored modern executive cut",
      weight: "High-density premium hand-feel",
      waistband: "Curtain waistband lining with split back seam",
      care: "Dry clean recommended for crisp finish"
    }
  },
  {
    id: "prod_6",
    name: "Relaxed Wide-Leg",
    price: 2090,
    priceFormatted: "৳2,090",
    currency: "৳",
    icon: "RW",
    category: "Wide-Leg Pants",
    tag: "Best Seller",
    image: "https://images.unsplash.com/photo-1506629905607-d9c297d0e0e6",
    description: "Effortlessly fluid relaxed wide leg cut tailored from fluid twill drape, providing modern volume with ankle break drape.",
    fabric: "Premium Fluid Lyocell-Cotton Blend (300 GSM)",
    colors: ["Black", "Brown"],
    sizes: ["28", "30", "32", "34", "36", "38", "40"],
    stock: 20,
    details: {
      material: "Premium Fluid Lyocell-Cotton Blend (300 GSM)",
      fit: "High-waisted relaxed wide leg through hem",
      weight: "Supple flowing drape with elegant movement",
      waistband: "Structured waistband with rear elastic inset",
      care: "Cold delicate wash, warm iron if needed"
    }
  }
];
