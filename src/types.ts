export type AllowedCategory = 'Baggy Pants' | 'Formal Pants' | 'Wide-Leg Pants';

export const ALLOWED_CATEGORIES: AllowedCategory[] = [
  'Baggy Pants',
  'Formal Pants',
  'Wide-Leg Pants'
];

export const ALLOWED_SIZES = ['28', '30', '32', '34', '36', '38', '40', '42'];

export type ProductStatus = 'published' | 'draft' | 'out_of_stock' | 'archived';

export function normalizeProductStatus(status?: string, stock?: number): ProductStatus {
  if (stock !== undefined && stock <= 0) {
    return 'out_of_stock';
  }
  if (!status) {
    return 'published';
  }
  const s = status.toLowerCase().trim().replace(/[\s-]+/g, '_');
  if (s === 'published' || s === 'active') return 'published';
  if (s === 'draft') return 'draft';
  if (s === 'out_of_stock' || s === 'outofstock') return 'out_of_stock';
  if (s === 'archived') return 'archived';
  return 'published';
}

export interface Product {
  id: string | number;
  name: string;
  category: AllowedCategory;
  price: number;
  discountPrice?: number;
  priceFormatted?: string;
  currency?: string;
  sku?: string;
  image: string;
  images?: string[];
  icon?: string;
  tag?: string;
  description: string;
  fabric: string;
  colors: string[];
  sizes: string[];
  stock: number;
  featured?: boolean;
  bestseller?: boolean;
  sale?: boolean;
  status?: ProductStatus | 'Active' | 'Draft' | 'Out of Stock';
  isFeatured?: boolean;
  isBestseller?: boolean;
  isSale?: boolean;
  originalPrice?: number;
  rating?: number;
  reviewCount?: number;
  sizeStock?: Record<string, number>;
  colorStock?: Record<string, number>;
  createdAt?: any;
  details?: {
    material?: string;
    fit?: string;
    weight?: string;
    waistband?: string;
    care?: string;
  };
  accentGradient?: string;
}

export interface CartItem {
  id: string; // unique key e.g. `${product.id}-${size}-${color}`
  product: Product;
  selectedSize: string;
  selectedColor: string;
  quantity: number;
}

export interface FirestoreOrderProduct {
  productId?: string | number;
  name: string;
  category: string;
  price: number;
  selectedSize: string;
  selectedColor: string;
  quantity: number;
  image?: string;
}

export type OrderStatus =
  | 'Pending'
  | 'Confirmed'
  | 'Processing'
  | 'Shipped'
  | 'Delivered'
  | 'Cancelled';

export const ORDER_STATUSES: OrderStatus[] = [
  'Pending',
  'Confirmed',
  'Processing',
  'Shipped',
  'Delivered',
  'Cancelled'
];

export type CourierProvider = 'Steadfast' | 'Pathao' | 'Carrybee' | 'Manual';

export interface Order {
  id?: string;
  customerName: string;
  phone: string;
  email?: string;
  address: string;
  district?: string;
  city?: string;
  area?: string;
  products: FirestoreOrderProduct[];
  subtotal: number;
  shipping: number;
  deliveryCharge?: number;
  discount?: number;
  couponCode?: string;
  total: number;
  paymentMethod: 'Cash on Delivery' | 'bKash' | 'Online Payment';
  paymentStatus?: 'Pending' | 'Paid' | 'Refunded';
  bkashNumber?: string;
  bkashTrxId?: string;
  courierProvider?: CourierProvider;
  courierTrackingId?: string;
  consignmentId?: string;
  status: OrderStatus;
  statusTimeline?: Array<{
    status: OrderStatus;
    timestamp: any;
    note?: string;
  }>;
  createdAt: any;
  updatedAt?: any;
}

export interface DeliverySettings {
  insideDhakaFee: number;
  outsideDhakaFee: number;
  estimatedInside?: string;
  estimatedOutside?: string;
}

export interface PaymentSettings {
  codEnabled: boolean;
  bkashEnabled: boolean;
  bkashNumber: string;
  bkashType: 'Personal' | 'Merchant' | 'Agent';
  bkashInstructions?: string;
}

export interface CourierConfig {
  defaultProvider: CourierProvider;
  steadfast: {
    enabled: boolean;
    apiKey?: string;
    secretKey?: string;
  };
  pathao: {
    enabled: boolean;
    clientId?: string;
    clientSecret?: string;
    storeId?: string;
  };
  carrybee: {
    enabled: boolean;
    apiKey?: string;
    clientCode?: string;
  };
  manual: {
    enabled: boolean;
    note?: string;
  };
}

export interface BrandingSettings {
  name: string;
  logo: string;
  favicon?: string;
  primary: string;
  secondary: string;
  announcement?: string;
  heroTitle?: string;
  heroSubtitle?: string;
  heroBadge?: string;
  bannerImage?: string;
  orbitRadius?: number;
  orbitSpeed?: number;
  autoRotate?: boolean;
}

export interface Coupon {
  id?: string;
  code: string;
  discountPercent?: number;
  fixedDiscount?: number;
  minimumOrder: number;
  expiryDate?: string;
  status: 'Active' | 'Inactive';
  usageCount?: number;
  createdAt?: any;
}

export interface Customer {
  id?: string;
  name: string;
  phone: string;
  email?: string;
  address: string;
  city?: string;
  totalOrders: number;
  totalSpent: number;
  lastOrderDate: any;
}

export interface ProductReview {
  id?: string;
  productId: string | number;
  productName: string;
  customerName: string;
  rating: number; // 1-5
  review: string;
  comment?: string;
  createdAt: any;
  status: 'Approved' | 'Pending' | 'Hidden';
}

export interface InventoryLog {
  id?: string;
  productId: string | number;
  productName: string;
  change: number;
  previousStock: number;
  newStock: number;
  reason: string;
  timestamp: any;
}

export interface AdminUser {
  uid: string;
  email: string | null;
  role: 'admin';
}

export interface BrandConfig {
  name: string;
  logo: string;
  primary: string;
  secondary: string;
}

export type ViewMode = 'circle' | 'grid';

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;
  suggestedProducts?: Product[];
}

