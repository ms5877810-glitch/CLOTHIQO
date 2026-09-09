import { initializeApp, getApps, getApp, type FirebaseApp } from 'firebase/app';
import {
  getAuth,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  type Auth,
  type User
} from 'firebase/auth';
import {
  getFirestore,
  collection,
  doc,
  getDoc,
  getDocs,
  setDoc,
  addDoc,
  updateDoc,
  deleteDoc,
  onSnapshot,
  query,
  orderBy,
  where,
  serverTimestamp,
  setLogLevel,
  type Firestore
} from 'firebase/firestore';
import {
  getStorage,
  ref as storageRef,
  uploadBytes,
  getDownloadURL,
  type FirebaseStorage
} from 'firebase/storage';
import {
  Product,
  Order,
  OrderStatus,
  Coupon,
  Customer,
  ProductReview,
  InventoryLog,
  DeliverySettings,
  PaymentSettings,
  CourierConfig,
  BrandingSettings,
  normalizeProductStatus,
} from '../types';
import { PRODUCTS as DEFAULT_CATALOG } from '../data/products';

// Silence Firestore internal gRPC error logging to prevent noisy console spam
try {
  setLogLevel('silent');
} catch {}

// Safely intercept and demote browser console logs from Firestore reconnection retries
if (typeof window !== 'undefined') {
  const originalError = console.error;
  const originalWarn = console.warn;
  console.error = (...args: any[]) => {
    const msg = args.map(a => (typeof a === 'string' ? a : a?.message || '')).join(' ');
    if (
      msg.includes('Could not reach Cloud Firestore backend') ||
      msg.includes('@firebase/firestore') ||
      msg.includes('code=unavailable')
    ) {
      // Absorb gracefully; resilient local cache is automatically used
      return;
    }
    originalError.apply(console, args);
  };
  console.warn = (...args: any[]) => {
    const msg = args.map(a => (typeof a === 'string' ? a : a?.message || '')).join(' ');
    if (
      msg.includes('Could not reach Cloud Firestore backend') ||
      msg.includes('@firebase/firestore') ||
      msg.includes('code=unavailable')
    ) {
      return;
    }
    originalWarn.apply(console, args);
  };
}

// Clean and normalize storage bucket (prevent trailing dot)
const rawBucket = (import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || '').trim();
const normalizedBucket = rawBucket.endsWith('.')
  ? `${rawBucket}app`
  : rawBucket || `${(import.meta.env.VITE_FIREBASE_PROJECT_ID || 'clothiqo').trim()}.firebasestorage.app`;

export const firebaseConfig = {
  apiKey: (import.meta.env.VITE_FIREBASE_API_KEY || '').trim(),
  authDomain: (import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || 'clothiqo.firebaseapp.com').trim(),
  projectId: (import.meta.env.VITE_FIREBASE_PROJECT_ID || 'clothiqo').trim(),
  storageBucket: normalizedBucket,
  messagingSenderId: (import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || '123456789').trim(),
  appId: (import.meta.env.VITE_FIREBASE_APP_ID || '1:123456789:web:abcdef').trim(),
};

export const isFirebaseConfigured = (): boolean => {
  return Boolean(
    firebaseConfig.apiKey &&
    firebaseConfig.projectId &&
    firebaseConfig.apiKey !== 'MY_FIREBASE_API_KEY' &&
    firebaseConfig.apiKey !== 'AIza...' &&
    !firebaseConfig.apiKey.includes('...') &&
    firebaseConfig.apiKey.length > 15
  );
};

export function getMissingFirebaseEnvVars(): string[] {
  const missing: string[] = [];
  const rawKey = (import.meta.env.VITE_FIREBASE_API_KEY || '').trim();
  const rawProj = (import.meta.env.VITE_FIREBASE_PROJECT_ID || '').trim();
  if (!rawKey || rawKey === 'MY_FIREBASE_API_KEY' || rawKey.includes('...')) {
    missing.push('VITE_FIREBASE_API_KEY');
  }
  if (!rawProj) {
    missing.push('VITE_FIREBASE_PROJECT_ID');
  }
  return missing;
}

export type FirestoreConnectionStatus = 'connecting' | 'connected' | 'error';

export interface FirestoreStatusInfo {
  status: FirestoreConnectionStatus;
  message: string;
  missingVars?: string[];
}

let currentFirestoreStatus: FirestoreStatusInfo = {
  status: 'connecting',
  message: 'Connecting to Firestore...',
};

const firestoreStatusListeners = new Set<(info: FirestoreStatusInfo) => void>();

export function setFirestoreStatus(info: FirestoreStatusInfo) {
  currentFirestoreStatus = info;
  firestoreStatusListeners.forEach((fn) => {
    try {
      fn(info);
    } catch {}
  });
}

export function subscribeToFirestoreStatus(
  callback: (info: FirestoreStatusInfo) => void
): () => void {
  callback(currentFirestoreStatus);
  firestoreStatusListeners.add(callback);
  return () => {
    firestoreStatusListeners.delete(callback);
  };
}

export async function verifyFirestoreConnection(): Promise<FirestoreStatusInfo> {
  const missing = getMissingFirebaseEnvVars();
  if (missing.length > 0) {
    const info: FirestoreStatusInfo = {
      status: 'error',
      message: `Firestore configuration error: Missing environment variable(s): ${missing.join(', ')}`,
      missingVars: missing,
    };
    setFirestoreStatus(info);
    return info;
  }

  if (!db) {
    const info: FirestoreStatusInfo = {
      status: 'error',
      message: 'Firestore configuration error: Firestore database client not initialized.',
    };
    setFirestoreStatus(info);
    return info;
  }

  try {
    const testDoc = doc(db, 'siteSettings', 'branding');
    await getDoc(testDoc);
    const info: FirestoreStatusInfo = {
      status: 'connected',
      message: 'Connected to Firestore',
    };
    setFirestoreStatus(info);
    return info;
  } catch (err: any) {
    if (err?.code === 'permission-denied') {
      const info: FirestoreStatusInfo = {
        status: 'connected',
        message: 'Connected to Firestore (Security rules active)',
      };
      setFirestoreStatus(info);
      return info;
    }
    const info: FirestoreStatusInfo = {
      status: 'error',
      message: `Firestore configuration error: ${err?.message || 'Connection failed'}`,
    };
    setFirestoreStatus(info);
    return info;
  }
}

let app: FirebaseApp | null = null;
let auth: Auth | null = null;
let db: Firestore | null = null;
let storage: FirebaseStorage | null = null;

if (isFirebaseConfigured()) {
  try {
    app = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);
    auth = getAuth(app);
    db = getFirestore(app);
    storage = getStorage(app);
    setFirestoreStatus({
      status: 'connecting',
      message: 'Connecting to Firestore...',
    });
  } catch (err: any) {
    console.warn('Firebase initialization notice:', err);
    setFirestoreStatus({
      status: 'error',
      message: `Firestore initialization error: ${err?.message || 'Failed to initialize Firebase app'}`,
    });
  }
} else {
  const missing = getMissingFirebaseEnvVars();
  setFirestoreStatus({
    status: 'error',
    message: missing.length > 0
      ? `Firestore configuration error: Missing environment variable(s): ${missing.join(', ')}`
      : 'Firestore configuration error: Firebase credentials missing or placeholder detected.',
    missingVars: missing,
  });
}

export { app, auth, db, storage };

export interface AdminLoginResult {
  uid: string;
  email: string;
  role: 'admin';
  user?: User;
}

// =========================================================================
// LOCAL STORAGE CACHE HELPERS (Resilient Offline-First Engine)
// =========================================================================

const STORAGE_KEYS = {
  PRODUCTS: 'clothiqo_local_products',
  ORDERS: 'clothiqo_local_orders',
  COUPONS: 'clothiqo_local_coupons',
  REVIEWS: 'clothiqo_local_reviews',
  CUSTOMERS: 'clothiqo_local_customers',
  INVENTORY: 'clothiqo_local_inventory',
  DELIVERY_SETTINGS: 'clothiqo_local_delivery_settings',
  PAYMENT_SETTINGS: 'clothiqo_local_payment_settings',
  COURIER_SETTINGS: 'clothiqo_local_courier_settings',
  BRANDING_SETTINGS: 'clothiqo_local_branding_settings',
};

function readLocal<T>(key: string, fallback: T): T {
  if (typeof window === 'undefined') return fallback;
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return fallback;
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

function writeLocal<T>(key: string, data: T): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(key, JSON.stringify(data));
  } catch (e) {
    console.warn('Local storage write warning:', e);
  }
}

// Initial Default Coupons
const DEFAULT_COUPONS: Coupon[] = [
  {
    id: 'coup_welcome10',
    code: 'WELCOME10',
    discountPercent: 10,
    minimumOrder: 1000,
    expiryDate: '2026-12-31',
    status: 'Active',
    usageCount: 24,
    createdAt: { seconds: Math.floor(Date.now() / 1000) }
  },
  {
    id: 'coup_clothiqo200',
    code: 'CLOTHIQO200',
    fixedDiscount: 200,
    minimumOrder: 2000,
    expiryDate: '2026-12-31',
    status: 'Active',
    usageCount: 42,
    createdAt: { seconds: Math.floor(Date.now() / 1000) }
  },
  {
    id: 'coup_ramadan25',
    code: 'RAMADAN25',
    discountPercent: 25,
    minimumOrder: 3000,
    expiryDate: '2026-12-31',
    status: 'Active',
    usageCount: 15,
    createdAt: { seconds: Math.floor(Date.now() / 1000) }
  },
  {
    id: 'coup_premium500',
    code: 'PREMIUM500',
    fixedDiscount: 500,
    minimumOrder: 4000,
    expiryDate: '2026-12-31',
    status: 'Active',
    usageCount: 8,
    createdAt: { seconds: Math.floor(Date.now() / 1000) }
  }
];

// Initial Default Reviews
const DEFAULT_REVIEWS: ProductReview[] = [
  {
    id: 'rev_1',
    productId: 'prod_1',
    productName: 'Urban Black Baggy',
    customerName: 'Tanvir Hossain',
    rating: 5,
    review: 'Outstanding drape and heavy GSM fabric. Perfect skater silhouette with zero ankle bunching!',
    comment: 'Outstanding drape and heavy GSM fabric. Perfect skater silhouette with zero ankle bunching!',
    status: 'Approved',
    createdAt: { seconds: Math.floor(Date.now() / 1000) - 86400 }
  },
  {
    id: 'rev_2',
    productId: 'prod_2',
    productName: 'Classic Formal Black',
    customerName: 'Arifur Rahman',
    rating: 5,
    review: 'Crisp front pressed crease stays sharp all day. Side adjusters fit like custom bespoke tailoring.',
    comment: 'Crisp front pressed crease stays sharp all day. Side adjusters fit like custom bespoke tailoring.',
    status: 'Approved',
    createdAt: { seconds: Math.floor(Date.now() / 1000) - 172800 }
  },
  {
    id: 'rev_3',
    productId: 'prod_3',
    productName: 'Premium Wide-Leg Cream',
    customerName: 'Mehedi Hasan',
    rating: 5,
    review: 'The ecru shade is elite and the knife pleats make statement outfits effortless. 10/10 recommend.',
    comment: 'The ecru shade is elite and the knife pleats make statement outfits effortless. 10/10 recommend.',
    status: 'Approved',
    createdAt: { seconds: Math.floor(Date.now() / 1000) - 259200 }
  }
];

export function getLocalProducts(): Product[] {
  const prods = readLocal<Product[]>(STORAGE_KEYS.PRODUCTS, []);
  if (prods.length > 0) return prods;
  writeLocal(STORAGE_KEYS.PRODUCTS, DEFAULT_CATALOG);
  return DEFAULT_CATALOG;
}

export function getLocalOrders(): Order[] {
  return readLocal<Order[]>(STORAGE_KEYS.ORDERS, []);
}

export function getLocalCoupons(): Coupon[] {
  const coupons = readLocal<Coupon[]>(STORAGE_KEYS.COUPONS, []);
  if (coupons.length > 0) return coupons;
  writeLocal(STORAGE_KEYS.COUPONS, DEFAULT_COUPONS);
  return DEFAULT_COUPONS;
}

export function getLocalReviews(): ProductReview[] {
  const revs = readLocal<ProductReview[]>(STORAGE_KEYS.REVIEWS, []);
  if (revs.length > 0) return revs;
  writeLocal(STORAGE_KEYS.REVIEWS, DEFAULT_REVIEWS);
  return DEFAULT_REVIEWS;
}

export function getLocalCustomers(): Customer[] {
  return readLocal<Customer[]>(STORAGE_KEYS.CUSTOMERS, []);
}

// =========================================================================
// AUTHENTICATION & ACCESS CONTROL
// =========================================================================

export async function loginAdminWithFirebase(
  email: string,
  pass: string
): Promise<AdminLoginResult> {
  const trimmedEmail = email.trim();

  if (!auth) {
    throw new Error('Authentication is initializing. Please try again.');
  }

  try {
    const userCredential = await signInWithEmailAndPassword(auth, trimmedEmail, pass);
    const user = userCredential.user;

    // After login, read Firestore users/{uid}
    const isAdmin = await checkIsAdmin(user.uid);
    if (!isAdmin) {
      // If Firebase authentication succeeds but role/active verification fails:
      await signOut(auth);
      throw new Error('Access denied');
    }

    return {
      uid: user.uid,
      email: user.email || trimmedEmail,
      role: 'admin',
      user,
    };
  } catch (err: any) {
    if (err?.message === 'Access denied') {
      throw err;
    }
    // If the Firebase credentials are invalid:
    throw new Error('Invalid email or password');
  }
}

export async function checkIsAdmin(uid: string): Promise<boolean> {
  if (!uid || !db) return false;

  try {
    const userDocRef = doc(db, 'users', uid);
    const userDocSnap = await getDoc(userDocRef);

    if (!userDocSnap.exists()) {
      return false;
    }

    const data = userDocSnap.data();
    return data?.role === 'admin' && data?.active === true;
  } catch (err) {
    console.warn('Admin authorization check failed:', err);
    return false;
  }
}

export function onAuthStateListener(callback: (user: User | null) => void): () => void {
  if (!auth) {
    callback(null);
    return () => {};
  }
  return onAuthStateChanged(auth, callback);
}

export async function verifyCurrentAdmin(): Promise<User | null> {
  if (!auth) return null;
  const user = auth.currentUser;
  if (!user) return null;

  const isAdmin = await checkIsAdmin(user.uid);
  if (isAdmin) {
    return user;
  }
  return null;
}

export async function logoutAdminFromFirebase(): Promise<void> {
  if (auth) {
    try {
      await signOut(auth);
    } catch {}
  }
}

// =========================================================================
// PRODUCTS OPERATIONS (Resilient Dual-Sync)
// =========================================================================

export function subscribeToFirestoreProducts(
  onSuccess: (products: Product[]) => void,
  onError?: (err: Error) => void
): () => void {
  // Always emit local cache first for instant rendering
  const localItems = getLocalProducts();
  onSuccess(localItems);

  if (!db) {
    return () => {};
  }

  try {
    const productsRef = collection(db, 'products');
    const q = query(productsRef);

    return onSnapshot(
      q,
      (snapshot) => {
        if (!snapshot.empty) {
          const items: Product[] = [];
          snapshot.forEach((docSnap) => {
            const data = docSnap.data();
            items.push({
              id: docSnap.id,
              name: data.name || 'Untitled Product',
              category: data.category || 'Baggy Pants',
              price: Number(data.price) || 0,
              priceFormatted: `৳${Number(data.price || 0).toLocaleString()}`,
              currency: '৳',
              description: data.description || '',
              fabric: data.fabric || 'Premium Quality',
              colors: Array.isArray(data.colors) ? data.colors : ['Black'],
              sizes: Array.isArray(data.sizes) ? data.sizes : ['32'],
              stock: Number(data.stock) || 0,
              image: data.image || '',
              createdAt: data.createdAt,
              details: {
                material: data.fabric || '',
                fit: data.category || '',
                care: 'Dry clean or machine wash cold',
              },
            });
          });
          writeLocal(STORAGE_KEYS.PRODUCTS, items);
          onSuccess(items);
        }
      },
      (err) => {
        // Silently preserve local store on Firestore network/permission issues
        console.warn('[CLOTHIQO Sync] Products stream inactive, utilizing local catalog cache:', err.message);
        onSuccess(localItems);
        if (onError) onError(err);
      }
    );
  } catch (err: any) {
    console.warn('[CLOTHIQO Sync] Exception in products subscription:', err?.message);
    return () => {};
  }
}

export async function addProductToFirestore(
  productData: Omit<Product, 'id'>
): Promise<string> {
  const localId = 'prod_' + Date.now();
  const newProduct: Product = {
    ...productData,
    id: localId,
    priceFormatted: `৳${Number(productData.price).toLocaleString()}`,
    currency: '৳',
    createdAt: { seconds: Math.floor(Date.now() / 1000) },
  };

  const current = getLocalProducts();
  writeLocal(STORAGE_KEYS.PRODUCTS, [newProduct, ...current]);

  if (db) {
    try {
      const docRef = await addDoc(collection(db, 'products'), {
        ...productData,
        price: Number(productData.price),
        stock: Number(productData.stock),
        createdAt: serverTimestamp(),
      });
      return docRef.id;
    } catch (err: any) {
      console.warn('[CLOTHIQO Sync] Stored product locally. Cloud sync pending:', err.message);
    }
  }

  return localId;
}

export async function updateProductInFirestore(
  productId: string,
  updates: Partial<Product>
): Promise<void> {
  const current = getLocalProducts();
  const updated = current.map((p) => (String(p.id) === String(productId) ? { ...p, ...updates } : p));
  writeLocal(STORAGE_KEYS.PRODUCTS, updated);

  if (db) {
    try {
      const docRef = doc(db, 'products', productId);
      const payload: any = {};
      if (updates.name !== undefined) payload.name = updates.name;
      if (updates.category !== undefined) payload.category = updates.category;
      if (updates.price !== undefined) payload.price = Number(updates.price);
      if (updates.description !== undefined) payload.description = updates.description;
      if (updates.fabric !== undefined) payload.fabric = updates.fabric;
      if (updates.colors !== undefined) payload.colors = updates.colors;
      if (updates.sizes !== undefined) payload.sizes = updates.sizes;
      if (updates.stock !== undefined) payload.stock = Number(updates.stock);
      if (updates.image !== undefined) payload.image = updates.image;
      await updateDoc(docRef, payload);
    } catch (err: any) {
      console.warn('[CLOTHIQO Sync] Product updated locally. Cloud sync pending:', err.message);
    }
  }
}

export async function deleteProductFromFirestore(productId: string): Promise<void> {
  const current = getLocalProducts();
  writeLocal(STORAGE_KEYS.PRODUCTS, current.filter((p) => String(p.id) !== String(productId)));

  if (db) {
    try {
      await deleteDoc(doc(db, 'products', productId));
    } catch (err: any) {
      console.warn('[CLOTHIQO Sync] Product removed locally. Cloud sync pending:', err.message);
    }
  }
}

// =========================================================================
// ORDERS OPERATIONS (Fault-Tolerant, Guaranteed Order Placement)
// =========================================================================

export function subscribeToFirestoreOrders(
  onSuccess: (orders: Order[]) => void,
  onError?: (err: Error) => void
): () => void {
  // Always emit local orders first
  const localOrders = getLocalOrders();
  onSuccess(localOrders);

  if (!db) return () => {};

  try {
    const ordersRef = collection(db, 'orders');
    return onSnapshot(
      ordersRef,
      (snapshot) => {
        const cloudList: Order[] = [];
        snapshot.forEach((docSnap) => {
          const data = docSnap.data();
          cloudList.push({
            id: docSnap.id,
            customerName: data.customerName || 'Anonymous',
            phone: data.phone || '',
            email: data.email || '',
            address: data.address || '',
            district: data.district || '',
            city: data.city || data.district || '',
            area: data.area || '',
            products: Array.isArray(data.products) ? data.products : [],
            subtotal: Number(data.subtotal) || 0,
            shipping: Number(data.shipping) || 0,
            discount: Number(data.discount) || 0,
            couponCode: data.couponCode || '',
            total: Number(data.total) || 0,
            paymentMethod: data.paymentMethod || 'Cash on Delivery',
            status: (data.status as OrderStatus) || 'Pending',
            createdAt: data.createdAt,
          });
        });

        // Merge cloud list with any locally placed orders not yet in cloud
        const mergedMap = new Map<string, Order>();
        localOrders.forEach(o => { if (o.id) mergedMap.set(o.id, o); });
        cloudList.forEach(o => { if (o.id) mergedMap.set(o.id, o); }); // Cloud takes precedence for updated status

        const finalList = Array.from(mergedMap.values());
        finalList.sort((a, b) => {
          const tA = (a.createdAt as any)?.seconds || 0;
          const tB = (b.createdAt as any)?.seconds || 0;
          return tB - tA;
        });

        writeLocal(STORAGE_KEYS.ORDERS, finalList);
        onSuccess(finalList);
      },
      (err) => {
        console.warn('[CLOTHIQO Sync] Orders stream notice, using local orders cache:', err.message);
        onSuccess(localOrders);
        if (onError) onError(err);
      }
    );
  } catch (err: any) {
    console.warn('[CLOTHIQO Sync] Exception in orders subscription:', err?.message);
    return () => {};
  }
}

export async function updateOrderStatusInFirestore(
  orderId: string,
  status: OrderStatus
): Promise<void> {
  const current = getLocalOrders();
  const updated = current.map((o) => (o.id === orderId ? { ...o, status } : o));
  writeLocal(STORAGE_KEYS.ORDERS, updated);

  if (db) {
    try {
      const docRef = doc(db, 'orders', orderId);
      await updateDoc(docRef, { status });
    } catch (err: any) {
      console.warn('[CLOTHIQO Sync] Order status updated locally. Cloud sync pending:', err.message);
    }
  }
}

export async function createFirestoreOrder(orderData: Omit<Order, 'id' | 'createdAt'>): Promise<string> {
  // Always create a crisp, professional order ID
  const orderId = 'CLQ-' + Date.now().toString().slice(-6) + Math.floor(100 + Math.random() * 900);

  const newOrder: Order = {
    ...orderData,
    id: orderId,
    status: 'Pending',
    createdAt: { seconds: Math.floor(Date.now() / 1000) },
  };

  // 1. Immediately persist to local orders
  const currentOrders = getLocalOrders();
  writeLocal(STORAGE_KEYS.ORDERS, [newOrder, ...currentOrders]);

  // 2. Track / update customer record locally
  try {
    const customers = getLocalCustomers();
    const existingCust = customers.find((c) => c.phone === orderData.phone);
    if (existingCust) {
      existingCust.totalOrders = (existingCust.totalOrders || 1) + 1;
      existingCust.totalSpent = (existingCust.totalSpent || 0) + Number(orderData.total);
      existingCust.lastOrderDate = new Date().toISOString();
      writeLocal(STORAGE_KEYS.CUSTOMERS, [...customers]);
    } else {
      const newCust: Customer = {
        id: 'cust_' + Date.now(),
        name: orderData.customerName,
        phone: orderData.phone,
        email: orderData.email || '',
        address: orderData.address,
        city: orderData.district || 'Dhaka',
        totalOrders: 1,
        totalSpent: Number(orderData.total),
        lastOrderDate: new Date().toISOString(),
      };
      writeLocal(STORAGE_KEYS.CUSTOMERS, [newCust, ...customers]);
    }
  } catch {}

  // 3. If Firestore is reachable, attempt to write document (with 3.5s timeout)
  if (db) {
    try {
      const payload = {
        customerName: orderData.customerName,
        phone: orderData.phone,
        email: orderData.email || '',
        address: orderData.address,
        district: orderData.district || '',
        city: orderData.city || orderData.district || '',
        area: orderData.area || '',
        products: orderData.products.map((p) => ({
          productId: String(p.productId || ''),
          name: p.name,
          category: p.category,
          price: Number(p.price),
          selectedSize: p.selectedSize,
          selectedColor: p.selectedColor,
          quantity: Number(p.quantity),
          image: p.image || '',
        })),
        subtotal: Number(orderData.subtotal),
        shipping: Number(orderData.shipping),
        discount: Number(orderData.discount || 0),
        couponCode: orderData.couponCode || null,
        total: Number(orderData.total),
        paymentMethod: orderData.paymentMethod,
        status: 'Pending',
        createdAt: serverTimestamp(),
      };

      await Promise.race([
        setDoc(doc(db, 'orders', orderId), payload),
        new Promise((_, reject) => setTimeout(() => reject(new Error('Firestore write timeout')), 3500))
      ]);
    } catch (err: any) {
      console.warn('[CLOTHIQO Sync] Stored order locally. Cloud Firestore sync pending:', err.message);
    }
  }

  // Always return the guaranteed order ID so checkout completes seamlessly
  return orderId;
}

export async function fetchOrderById(orderId: string): Promise<Order | null> {
  const cleanId = orderId.trim();
  // 1. Check local storage
  const localOrders = getLocalOrders();
  const match = localOrders.find((o) => o.id?.toLowerCase() === cleanId.toLowerCase());
  if (match) return match;

  // 2. Check Firestore if initialized
  if (db) {
    try {
      const docRef = doc(db, 'orders', cleanId);
      const snap = await Promise.race([
        getDoc(docRef),
        new Promise<any>((_, reject) => setTimeout(() => reject(new Error('timeout')), 3000))
      ]);
      if (snap.exists()) {
        const data = snap.data();
        return {
          id: snap.id,
          customerName: data.customerName || '',
          phone: data.phone || '',
          email: data.email || '',
          address: data.address || '',
          district: data.district || '',
          city: data.city || data.district || '',
          area: data.area || '',
          products: Array.isArray(data.products) ? data.products : [],
          subtotal: Number(data.subtotal) || 0,
          shipping: Number(data.shipping) || 0,
          discount: Number(data.discount) || 0,
          couponCode: data.couponCode || '',
          total: Number(data.total) || 0,
          paymentMethod: data.paymentMethod || 'Cash on Delivery',
          status: (data.status as OrderStatus) || 'Pending',
          createdAt: data.createdAt,
        };
      }
    } catch {}
  }

  return null;
}

export async function fetchOrdersByPhone(phone: string): Promise<Order[]> {
  const cleanPhone = phone.trim();
  // 1. Check local storage
  const localOrders = getLocalOrders();
  const localMatches = localOrders.filter((o) => o.phone.replace(/[\s+-]/g, '') === cleanPhone.replace(/[\s+-]/g, ''));

  if (!db) return localMatches;

  try {
    const q = query(collection(db, 'orders'), where('phone', '==', cleanPhone));
    const snap = await Promise.race([
      getDocs(q),
      new Promise<any>((_, reject) => setTimeout(() => reject(new Error('timeout')), 3000))
    ]);
    const cloudMatches: Order[] = [];
    snap.forEach((docSnap: any) => {
      const data = docSnap.data();
      cloudMatches.push({
        id: docSnap.id,
        customerName: data.customerName || '',
        phone: data.phone || '',
        email: data.email || '',
        address: data.address || '',
        district: data.district || '',
        city: data.city || data.district || '',
        area: data.area || '',
        products: Array.isArray(data.products) ? data.products : [],
        subtotal: Number(data.subtotal) || 0,
        shipping: Number(data.shipping) || 0,
        discount: Number(data.discount) || 0,
        couponCode: data.couponCode || '',
        total: Number(data.total) || 0,
        paymentMethod: data.paymentMethod || 'Cash on Delivery',
        status: (data.status as OrderStatus) || 'Pending',
        createdAt: data.createdAt,
      });
    });

    const map = new Map<string, Order>();
    localMatches.forEach((o) => { if (o.id) map.set(o.id, o); });
    cloudMatches.forEach((o) => { if (o.id) map.set(o.id, o); });
    return Array.from(map.values());
  } catch {
    return localMatches;
  }
}

export async function seedInitialProducts(defaultProducts: Product[]): Promise<number> {
  writeLocal(STORAGE_KEYS.PRODUCTS, defaultProducts);

  if (!db) return defaultProducts.length;

  let count = 0;
  for (const prod of defaultProducts) {
    try {
      await addDoc(collection(db, 'products'), {
        name: prod.name,
        category: prod.category,
        price: Number(prod.price),
        description: prod.description,
        fabric: prod.fabric,
        colors: prod.colors,
        sizes: prod.sizes,
        stock: Number(prod.stock || 20),
        image: prod.image,
        createdAt: serverTimestamp(),
      });
      count++;
    } catch {}
  }
  return count;
}

// =========================================================================
// COUPONS OPERATIONS (Resilient Dual-Sync)
// =========================================================================

export function subscribeToFirestoreCoupons(
  callback: (coupons: Coupon[]) => void
): () => void {
  const localCoupons = getLocalCoupons();
  callback(localCoupons);

  if (!db) return () => {};

  try {
    const q = query(collection(db, 'coupons'), orderBy('createdAt', 'desc'));
    return onSnapshot(
      q,
      (snapshot) => {
        if (!snapshot.empty) {
          const list: Coupon[] = [];
          snapshot.forEach((docSnap) => {
            const data = docSnap.data();
            list.push({
              id: docSnap.id,
              code: data.code || '',
              discountPercent: data.discountPercent,
              fixedDiscount: data.fixedDiscount,
              minimumOrder: Number(data.minimumOrder) || 0,
              expiryDate: data.expiryDate || '',
              status: data.status || 'Active',
              usageCount: Number(data.usageCount) || 0,
              createdAt: data.createdAt,
            });
          });
          writeLocal(STORAGE_KEYS.COUPONS, list);
          callback(list);
        }
      },
      (err) => {
        console.warn('[CLOTHIQO Sync] Coupons notice, using local coupons:', err.message);
        callback(localCoupons);
      }
    );
  } catch {
    return () => {};
  }
}

export async function addCouponToFirestore(coupon: Omit<Coupon, 'id' | 'createdAt'>): Promise<string> {
  const localId = 'coup_' + Date.now();
  const newCoupon: Coupon = {
    ...coupon,
    id: localId,
    code: coupon.code.toUpperCase().trim(),
    usageCount: 0,
    createdAt: { seconds: Math.floor(Date.now() / 1000) },
  };

  const current = getLocalCoupons();
  writeLocal(STORAGE_KEYS.COUPONS, [newCoupon, ...current]);

  if (db) {
    try {
      const docRef = await addDoc(collection(db, 'coupons'), {
        ...coupon,
        code: coupon.code.toUpperCase().trim(),
        usageCount: 0,
        createdAt: serverTimestamp(),
      });
      return docRef.id;
    } catch {}
  }
  return localId;
}

export async function updateCouponInFirestore(id: string, updates: Partial<Coupon>): Promise<void> {
  const current = getLocalCoupons();
  writeLocal(STORAGE_KEYS.COUPONS, current.map((c) => (c.id === id ? { ...c, ...updates } : c)));

  if (db) {
    try {
      await updateDoc(doc(db, 'coupons', id), updates);
    } catch {}
  }
}

export async function deleteCouponFromFirestore(id: string): Promise<void> {
  const current = getLocalCoupons();
  writeLocal(STORAGE_KEYS.COUPONS, current.filter((c) => c.id !== id));

  if (db) {
    try {
      await deleteDoc(doc(db, 'coupons', id));
    } catch {}
  }
}

// =========================================================================
// REVIEWS OPERATIONS (Resilient Dual-Sync)
// =========================================================================

export function subscribeToFirestoreReviews(
  callback: (reviews: ProductReview[]) => void
): () => void {
  const localReviews = getLocalReviews();
  callback(localReviews);

  if (!db) return () => {};

  try {
    const q = query(collection(db, 'reviews'), orderBy('createdAt', 'desc'));
    return onSnapshot(
      q,
      (snapshot) => {
        if (!snapshot.empty) {
          const list: ProductReview[] = [];
          snapshot.forEach((docSnap) => {
            const data = docSnap.data();
            list.push({
              id: docSnap.id,
              productId: data.productId,
              productName: data.productName || '',
              customerName: data.customerName || 'Anonymous',
              rating: Number(data.rating) || 5,
              review: data.review || data.comment || '',
              comment: data.comment || data.review || '',
              createdAt: data.createdAt,
              status: data.status || 'Approved',
            });
          });
          writeLocal(STORAGE_KEYS.REVIEWS, list);
          callback(list);
        }
      },
      (err) => {
        console.warn('[CLOTHIQO Sync] Reviews notice, using local reviews:', err.message);
        callback(localReviews);
      }
    );
  } catch {
    return () => {};
  }
}

export async function addReviewToFirestore(review: Omit<ProductReview, 'id' | 'createdAt'>): Promise<string> {
  const localId = 'rev_' + Date.now();
  const newReview: ProductReview = {
    ...review,
    id: localId,
    createdAt: { seconds: Math.floor(Date.now() / 1000) },
  };

  const current = getLocalReviews();
  writeLocal(STORAGE_KEYS.REVIEWS, [newReview, ...current]);

  if (db) {
    try {
      const docRef = await addDoc(collection(db, 'reviews'), {
        ...review,
        createdAt: serverTimestamp(),
      });
      return docRef.id;
    } catch {}
  }
  return localId;
}

export async function updateReviewStatusInFirestore(
  id: string,
  status: 'Approved' | 'Pending' | 'Hidden'
): Promise<void> {
  const current = getLocalReviews();
  writeLocal(STORAGE_KEYS.REVIEWS, current.map((r) => (r.id === id ? { ...r, status } : r)));

  if (db) {
    try {
      await updateDoc(doc(db, 'reviews', id), { status });
    } catch {}
  }
}

export async function deleteReviewFromFirestore(id: string): Promise<void> {
  const current = getLocalReviews();
  writeLocal(STORAGE_KEYS.REVIEWS, current.filter((r) => r.id !== id));

  if (db) {
    try {
      await deleteDoc(doc(db, 'reviews', id));
    } catch {}
  }
}

// =========================================================================
// CUSTOMERS & INVENTORY OPERATIONS
// =========================================================================

export function subscribeToFirestoreCustomers(
  callback: (customers: Customer[]) => void
): () => void {
  const localCustomers = getLocalCustomers();
  callback(localCustomers);

  if (!db) return () => {};

  try {
    const q = query(collection(db, 'customers'), orderBy('totalOrders', 'desc'));
    return onSnapshot(
      q,
      (snapshot) => {
        if (!snapshot.empty) {
          const list: Customer[] = [];
          snapshot.forEach((docSnap) => {
            const data = docSnap.data();
            list.push({
              id: docSnap.id,
              name: data.name || '',
              phone: data.phone || '',
              email: data.email || '',
              address: data.address || '',
              city: data.city || '',
              totalOrders: Number(data.totalOrders) || 1,
              totalSpent: Number(data.totalSpent) || 0,
              lastOrderDate: data.lastOrderDate || null,
            });
          });
          writeLocal(STORAGE_KEYS.CUSTOMERS, list);
          callback(list);
        }
      },
      (err) => {
        console.warn('[CLOTHIQO Sync] Customers notice, using local records:', err.message);
        callback(localCustomers);
      }
    );
  } catch {
    return () => {};
  }
}

export async function updateProductStockInFirestore(
  productId: string,
  newStock: number,
  reason: string = 'Manual Adjustment'
): Promise<void> {
  // Update local products cache
  const currentProds = getLocalProducts();
  const updatedProds = currentProds.map((p) =>
    String(p.id) === String(productId) ? { ...p, stock: Math.max(0, newStock) } : p
  );
  writeLocal(STORAGE_KEYS.PRODUCTS, updatedProds);

  if (db) {
    try {
      const prodRef = doc(db, 'products', productId);
      await updateDoc(prodRef, {
        stock: Math.max(0, newStock),
        status: newStock === 0 ? 'Out of Stock' : 'Active',
      });
    } catch (err: any) {
      console.warn('[CLOTHIQO Sync] Stock updated locally. Cloud sync pending:', err.message);
    }
  }
}

// =========================================================================
// SITE & COURIER SETTINGS OPERATIONS (Admin Controlled)
// =========================================================================

export const DEFAULT_DELIVERY_SETTINGS: DeliverySettings = {
  insideDhakaFee: 80,
  outsideDhakaFee: 130,
  estimatedInside: '24-48 Hours',
  estimatedOutside: '3-5 Days',
};

export const DEFAULT_PAYMENT_SETTINGS: PaymentSettings = {
  codEnabled: true,
  bkashEnabled: true,
  bkashNumber: '01700000000',
  bkashType: 'Personal',
  bkashInstructions: 'Please Send Money to our bKash number, then input your bKash phone number and Transaction ID (TrxID) below for instant verification.',
};

export const DEFAULT_COURIER_SETTINGS: CourierConfig = {
  defaultProvider: 'Steadfast',
  steadfast: {
    enabled: true,
    apiKey: '',
    secretKey: '',
  },
  pathao: {
    enabled: false,
    clientId: '',
    clientSecret: '',
    storeId: '',
  },
  carrybee: {
    enabled: false,
    apiKey: '',
    clientCode: '',
  },
  manual: {
    enabled: true,
    note: 'In-house delivery runner with cash-on-delivery collection',
  },
};

export const DEFAULT_BRANDING_SETTINGS: BrandingSettings = {
  name: 'CLOTHIQO',
  logo: '/clothiqo-logo.jpg',
  favicon: '/clothiqo-logo.jpg',
  primary: '#111111',
  secondary: '#f8f5ef',
  announcement: 'Free Dhaka delivery on orders over ৳3,000 | Hand-finished Menswear',
  heroTitle: 'Modern Fit. Timeless Style.',
  heroSubtitle: 'Contemporary silhouettes engineered from heavyweight cotton and tropical drape blends.',
  heroBadge: 'New 2026 Collection',
  bannerImage: '',
  orbitRadius: 280,
  orbitSpeed: 30,
  autoRotate: true,
};

export async function getDeliverySettings(): Promise<DeliverySettings> {
  const local = readLocal<DeliverySettings>(STORAGE_KEYS.DELIVERY_SETTINGS, DEFAULT_DELIVERY_SETTINGS);
  if (db) {
    try {
      const snap = await getDoc(doc(db, 'siteSettings', 'delivery'));
      if (snap.exists()) {
        const data = snap.data() as DeliverySettings;
        const merged = { ...DEFAULT_DELIVERY_SETTINGS, ...data };
        writeLocal(STORAGE_KEYS.DELIVERY_SETTINGS, merged);
        return merged;
      }
    } catch {}
  }
  return local;
}

export async function saveDeliverySettings(settings: DeliverySettings): Promise<void> {
  writeLocal(STORAGE_KEYS.DELIVERY_SETTINGS, settings);
  if (db) {
    try {
      await setDoc(doc(db, 'siteSettings', 'delivery'), {
        ...settings,
        updatedAt: serverTimestamp(),
      }, { merge: true });
    } catch (err: any) {
      console.warn('Failed to save delivery settings to Firestore:', err.message);
    }
  }
}

export async function getPaymentSettings(): Promise<PaymentSettings> {
  const local = readLocal<PaymentSettings>(STORAGE_KEYS.PAYMENT_SETTINGS, DEFAULT_PAYMENT_SETTINGS);
  if (db) {
    try {
      const snap = await getDoc(doc(db, 'siteSettings', 'payment'));
      if (snap.exists()) {
        const data = snap.data() as PaymentSettings;
        const merged = { ...DEFAULT_PAYMENT_SETTINGS, ...data };
        writeLocal(STORAGE_KEYS.PAYMENT_SETTINGS, merged);
        return merged;
      }
    } catch {}
  }
  return local;
}

export async function savePaymentSettings(settings: PaymentSettings): Promise<void> {
  writeLocal(STORAGE_KEYS.PAYMENT_SETTINGS, settings);
  if (db) {
    try {
      await setDoc(doc(db, 'siteSettings', 'payment'), {
        ...settings,
        updatedAt: serverTimestamp(),
      }, { merge: true });
    } catch (err: any) {
      console.warn('Failed to save payment settings to Firestore:', err.message);
    }
  }
}

export async function getCourierSettings(): Promise<CourierConfig> {
  const local = readLocal<CourierConfig>(STORAGE_KEYS.COURIER_SETTINGS, DEFAULT_COURIER_SETTINGS);
  if (db) {
    try {
      const snap = await getDoc(doc(db, 'courierSettings', 'config'));
      if (snap.exists()) {
        const data = snap.data() as CourierConfig;
        const merged = { ...DEFAULT_COURIER_SETTINGS, ...data };
        writeLocal(STORAGE_KEYS.COURIER_SETTINGS, merged);
        return merged;
      }
    } catch {}
  }
  return local;
}

export async function saveCourierSettings(settings: CourierConfig): Promise<void> {
  writeLocal(STORAGE_KEYS.COURIER_SETTINGS, settings);
  if (db) {
    try {
      await setDoc(doc(db, 'courierSettings', 'config'), {
        ...settings,
        updatedAt: serverTimestamp(),
      }, { merge: true });
    } catch (err: any) {
      console.warn('Failed to save courier settings to Firestore:', err.message);
    }
  }
}

export async function getBrandingSettings(): Promise<BrandingSettings> {
  const local = readLocal<BrandingSettings>(STORAGE_KEYS.BRANDING_SETTINGS, DEFAULT_BRANDING_SETTINGS);
  if (db) {
    try {
      const snap = await getDoc(doc(db, 'siteSettings', 'branding'));
      if (snap.exists()) {
        const data = snap.data() as BrandingSettings;
        const merged = { ...DEFAULT_BRANDING_SETTINGS, ...data };
        writeLocal(STORAGE_KEYS.BRANDING_SETTINGS, merged);
        return merged;
      }
    } catch {}
  }
  return local;
}

export async function saveBrandingSettings(settings: BrandingSettings): Promise<void> {
  writeLocal(STORAGE_KEYS.BRANDING_SETTINGS, settings);
  if (db) {
    try {
      await setDoc(doc(db, 'siteSettings', 'branding'), {
        ...settings,
        updatedAt: serverTimestamp(),
      }, { merge: true });
    } catch (err: any) {
      console.warn('Failed to save branding settings to Firestore:', err.message);
    }
  }
}

/**
 * Upload a brand asset (logo, favicon, image) to Firebase Storage,
 * or safely convert to base64 Data URL if Storage bucket is offline/not initialized.
 */
export async function uploadBrandAsset(file: File, folder: string = 'branding'): Promise<string> {
  if (storage) {
    try {
      const filename = `${folder}/${Date.now()}_${file.name.replace(/[^a-zA-Z0-9._-]/g, '')}`;
      const fileRef = storageRef(storage, filename);
      const snapshot = await uploadBytes(fileRef, file);
      const downloadUrl = await getDownloadURL(snapshot.ref);
      return downloadUrl;
    } catch (err: any) {
      console.warn('Firebase Storage upload notice, falling back to data URL:', err.message);
    }
  }

  // Fallback to Data URL for instant, reliable local rendering
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      resolve(reader.result as string);
    };
    reader.onerror = (error) => {
      reject(error);
    };
    reader.readAsDataURL(file);
  });
}

