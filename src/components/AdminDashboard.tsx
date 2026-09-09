import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Product,
  Order,
  OrderStatus,
  AdminUser,
  Coupon,
  Customer,
  ProductReview,
} from '../types';
import {
  subscribeToFirestoreProducts,
  addProductToFirestore,
  updateProductInFirestore,
  deleteProductFromFirestore,
  subscribeToFirestoreOrders,
  updateOrderStatusInFirestore,
  subscribeToFirestoreCustomers,
  subscribeToFirestoreCoupons,
  addCouponToFirestore,
  updateCouponInFirestore,
  deleteCouponFromFirestore,
  subscribeToFirestoreReviews,
  updateReviewStatusInFirestore,
  deleteReviewFromFirestore,
  updateProductStockInFirestore,
  seedInitialProducts,
  isFirebaseConfigured,
  getLocalProducts,
  getLocalOrders,
  getLocalCoupons,
  getLocalReviews,
  getLocalCustomers,
  logoutAdminFromFirebase,
} from '../lib/firebase';
import { PRODUCTS as DEFAULT_PRODUCTS } from '../data/products';
import {
  LayoutDashboard,
  ShoppingBag,
  Package,
  Layers,
  Users,
  Tag,
  Star,
  LogOut,
  ExternalLink,
  ShieldCheck,
  Sparkles,
  Database,
  Truck,
  Send,
  Palette,
  PlusCircle,
  ClipboardList,
  Globe,
  CreditCard,
  Settings,
  Menu,
  X,
  ChevronDown,
} from 'lucide-react';

import { AdminOverview } from './admin/AdminOverview';
import { AdminProducts } from './admin/AdminProducts';
import { AdminInventory } from './admin/AdminInventory';
import { AdminOrders } from './admin/AdminOrders';
import { AdminCustomers } from './admin/AdminCustomers';
import { AdminCoupons } from './admin/AdminCoupons';
import { AdminReviews } from './admin/AdminReviews';
import { AdminDeliveryPayment } from './admin/AdminDeliveryPayment';
import { AdminCourier } from './admin/AdminCourier';
import { AdminBranding } from './admin/AdminBranding';
import { AdminCategories } from './admin/AdminCategories';
import { AdminWebsiteContent } from './admin/AdminWebsiteContent';
import { AdminAiSettings } from './admin/AdminAiSettings';
import { AdminStoreSettings } from './admin/AdminStoreSettings';
import { AdminAuditLog } from './admin/AdminAuditLog';

interface AdminDashboardProps {
  admin?: AdminUser | null;
  adminEmail?: string;
  onLogout?: () => void;
  onExit?: () => void;
  onOpenStorefront?: () => void;
}

export type AdminTab =
  | 'overview'
  | 'dashboard'
  | 'products'
  | 'add-product'
  | 'categories'
  | 'inventory'
  | 'orders'
  | 'customers'
  | 'website-content'
  | 'branding'
  | 'payments'
  | 'delivery'
  | 'couriers'
  | 'courier'
  | 'coupons'
  | 'ai-stylist'
  | 'store-settings'
  | 'audit-log'
  | 'reviews';

const VALID_ADMIN_TABS: AdminTab[] = [
  'overview',
  'dashboard',
  'products',
  'add-product',
  'categories',
  'inventory',
  'orders',
  'customers',
  'website-content',
  'branding',
  'payments',
  'delivery',
  'couriers',
  'courier',
  'coupons',
  'ai-stylist',
  'store-settings',
  'audit-log',
  'reviews',
];

export const AdminDashboard: React.FC<AdminDashboardProps> = ({
  admin,
  adminEmail,
  onLogout,
  onExit,
  onOpenStorefront,
}) => {
  const currentAdminEmail = admin?.email || adminEmail || 'Admin Session';
  const handleExitToStore = onOpenStorefront || onExit || (() => { window.location.href = '/'; });

  const { tab } = useParams<{ tab?: string }>();
  const navigate = useNavigate();

  const [activeTab, setActiveTab] = useState<AdminTab>(() => {
    if (tab && (VALID_ADMIN_TABS as string[]).includes(tab)) {
      return tab as AdminTab;
    }
    return 'dashboard';
  });
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    if (tab && (VALID_ADMIN_TABS as string[]).includes(tab)) {
      setActiveTab(tab as AdminTab);
    }
  }, [tab]);

  const handleSelectTab = (newTab: AdminTab) => {
    setActiveTab(newTab);
    setMobileMenuOpen(false);
    navigate(`/admin/${newTab}`);
  };

  // Resilient Real-Time States with Local-First Initialization
  const [products, setProducts] = useState<Product[]>(() => getLocalProducts());
  const [orders, setOrders] = useState<Order[]>(() => getLocalOrders());
  const [customers, setCustomers] = useState<Customer[]>(() => getLocalCustomers());
  const [coupons, setCoupons] = useState<Coupon[]>(() => getLocalCoupons());
  const [reviews, setReviews] = useState<ProductReview[]>(() => getLocalReviews());
  const [loading, setLoading] = useState(false);
  const [isSeeding, setIsSeeding] = useState(false);

  // Subscriptions to Firestore with instant local-first delivery
  useEffect(() => {
    const unsubProducts = subscribeToFirestoreProducts(
      (items) => {
        if (items && items.length > 0) {
          setProducts(items);
        }
      },
      (err) => console.warn('Products sync note:', err)
    );

    const unsubOrders = subscribeToFirestoreOrders(
      (items) => {
        setOrders(items);
        setLoading(false);
      },
      (err) => {
        console.warn('Orders sync note:', err);
        setLoading(false);
      }
    );

    const unsubCustomers = subscribeToFirestoreCustomers((items) => {
      setCustomers(items);
    });

    const unsubCoupons = subscribeToFirestoreCoupons((items) => {
      setCoupons(items);
    });

    const unsubReviews = subscribeToFirestoreReviews((items) => {
      setReviews(items);
    });

    return () => {
      unsubProducts();
      unsubOrders();
      unsubCustomers();
      unsubCoupons();
      unsubReviews();
    };
  }, []);

  // Handlers for Product Management
  const handleAddProduct = async (productData: Partial<Product>) => {
    try {
      await addProductToFirestore(productData as Omit<Product, 'id' | 'createdAt'>);
    } catch {
      // Local fallback
      const newProd: Product = {
        id: Date.now(),
        name: productData.name || 'New Trouser',
        category: productData.category || 'Baggy Pants',
        price: productData.price || 1890,
        image: productData.image || DEFAULT_PRODUCTS[0].image,
        description: productData.description || '',
        fabric: productData.fabric || '340 GSM Cotton',
        colors: productData.colors || ['Black'],
        sizes: productData.sizes || ['30', '32', '34'],
        stock: productData.stock || 25,
        ...productData,
      };
      setProducts((prev) => [newProd, ...prev]);
    }
  };

  const handleUpdateProduct = async (id: string | number, updates: Partial<Product>) => {
    try {
      await updateProductInFirestore(String(id), updates);
    } catch {
      setProducts((prev) =>
        prev.map((p) => (p.id === id ? { ...p, ...updates } : p))
      );
    }
  };

  const handleDeleteProduct = async (id: string | number) => {
    try {
      await deleteProductFromFirestore(String(id));
    } catch {
      setProducts((prev) => prev.filter((p) => p.id !== id));
    }
  };

  const handleBulkDelete = async (ids: (string | number)[]) => {
    for (const id of ids) {
      await handleDeleteProduct(id);
    }
  };

  // Handlers for Stock Adjustment
  const handleUpdateStock = async (productId: string | number, newStock: number) => {
    try {
      await updateProductStockInFirestore(String(productId), newStock);
    } catch {
      setProducts((prev) =>
        prev.map((p) => (p.id === productId ? { ...p, stock: newStock } : p))
      );
    }
  };

  // Handlers for Order Status
  const handleUpdateOrderStatus = async (orderId: string, status: OrderStatus) => {
    try {
      await updateOrderStatusInFirestore(orderId, status);
    } catch {
      setOrders((prev) =>
        prev.map((o) => (o.id === orderId ? { ...o, status } : o))
      );
    }
  };

  // Seed Catalog helper
  const handleSeedCatalog = async () => {
    if (confirm('Initialize CLOTHIQO catalog into Firestore?')) {
      setIsSeeding(true);
      try {
        await seedInitialProducts(DEFAULT_PRODUCTS);
      } finally {
        setIsSeeding(false);
      }
    }
  };

  // Logout handler
  const handleLogout = async () => {
    try {
      await logoutAdminFromFirebase();
    } catch {}
    if (onLogout) {
      onLogout();
    } else {
      navigate('/admin');
    }
  };

  const navItems = [
    { id: 'overview', label: 'Overview', icon: LayoutDashboard },
    { id: 'products', label: 'Products', icon: ShoppingBag, count: products.length },
    { id: 'add-product', label: 'Add Product', icon: PlusCircle },
    { id: 'categories', label: 'Categories', icon: Layers },
    { id: 'inventory', label: 'Inventory', icon: Package, count: products.filter(p => p.stock < 10).length },
    { id: 'orders', label: 'Orders', icon: ClipboardList, count: orders.length },
    { id: 'customers', label: 'Customers', icon: Users, count: customers.length },
    { id: 'website-content', label: 'Website Content', icon: Globe },
    { id: 'branding', label: 'Branding & Design', icon: Palette },
    { id: 'payments', label: 'Payments', icon: CreditCard },
    { id: 'delivery', label: 'Delivery', icon: Truck },
    { id: 'couriers', label: 'Couriers', icon: Send },
    { id: 'coupons', label: 'Coupons', icon: Tag, count: coupons.length },
    { id: 'ai-stylist', label: 'AI Stylist Settings', icon: Sparkles },
    { id: 'store-settings', label: 'Store Settings', icon: Settings },
    { id: 'audit-log', label: 'Audit Log', icon: ShieldCheck },
  ];

  return (
    <div className="min-h-screen bg-[#f7f5ee] text-[#111111] flex flex-col font-sans">
      {/* Top Header Bar */}
      <header className="bg-white border-b border-[#e8e2d5] sticky top-0 z-30 shadow-xs">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <h1 className="text-xl font-black tracking-tight text-[#111111] uppercase">
              CLOTHIQO
            </h1>
            <span className="hidden sm:inline-block px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-800 text-[10px] font-extrabold uppercase border border-emerald-200">
              Admin Gateway
            </span>
          </div>

          <div className="flex items-center gap-3">
            <div className="hidden md:flex items-center gap-2 text-xs font-medium text-[#666666] bg-[#f8f6f0] px-3 py-1.5 rounded-xl border border-[#ece7dc]">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-700" />
              <span>{currentAdminEmail}</span>
            </div>

            <button
              type="button"
              onClick={handleExitToStore}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-[#d5cfc0] hover:bg-[#f8f6f0] text-xs font-bold transition text-[#333333] cursor-pointer"
            >
              <ExternalLink className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Storefront</span>
            </button>

            <button
              type="button"
              onClick={handleLogout}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#111111] hover:bg-black text-white text-xs font-bold transition shadow-xs cursor-pointer"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span>Logout</span>
            </button>
          </div>
        </div>
      </header>

      {/* Mobile Navigation Header & Quick Tabs */}
      <div className="md:hidden bg-white border-b border-[#e8e2d5] px-4 py-2.5">
        <div className="flex items-center justify-between mb-2">
          <button
            type="button"
            onClick={() => setMobileMenuOpen(true)}
            className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-[#111111] text-white text-xs font-bold transition shadow-xs cursor-pointer active:scale-95"
          >
            <Menu className="w-3.5 h-3.5" />
            <span>Navigation Menu</span>
            <ChevronDown className="w-3 h-3 text-[#aaaaaa]" />
          </button>

          <span className="text-xs font-bold text-[#555555] uppercase tracking-wider capitalize">
            Tab: <strong className="text-black">{activeTab.replace('-', ' ')}</strong>
          </span>
        </div>

        {/* Quick Tabs Scrollable Bar */}
        <div className="flex items-center gap-1.5 overflow-x-auto scrollbar-none pb-1">
          {[
            { id: 'overview', label: 'Overview' },
            { id: 'orders', label: 'Orders', count: orders.length },
            { id: 'products', label: 'Products', count: products.length },
            { id: 'add-product', label: '+ Add' },
            { id: 'inventory', label: 'Inventory' },
            { id: 'payments', label: 'Payments' },
            { id: 'delivery', label: 'Delivery' },
            { id: 'store-settings', label: 'Settings' },
          ].map((item) => {
            const isActive = activeTab === item.id || (item.id === 'overview' && activeTab === 'dashboard');
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => handleSelectTab(item.id as AdminTab)}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold whitespace-nowrap transition cursor-pointer shrink-0 ${
                  isActive
                    ? 'bg-black text-white'
                    : 'bg-[#f4efe4] text-[#444444] hover:bg-[#eae3d5]'
                }`}
              >
                {item.label}
                {item.count !== undefined && item.count > 0 && ` (${item.count})`}
              </button>
            );
          })}
        </div>
      </div>

      {/* Mobile Full Navigation Sheet */}
      {mobileMenuOpen && (
        <div className="fixed inset-0 z-50 flex flex-col justify-end bg-black/60 backdrop-blur-xs md:hidden animate-in fade-in">
          <div
            className="fixed inset-0"
            onClick={() => setMobileMenuOpen(false)}
          />
          <div className="relative bg-white rounded-t-3xl shadow-2xl max-h-[85vh] flex flex-col z-10 animate-in slide-in-from-bottom duration-200">
            <div className="p-4 border-b border-[#e8e2d5] flex items-center justify-between bg-[#faf8f5] rounded-t-3xl">
              <div>
                <span className="text-[10px] font-extrabold uppercase tracking-widest text-[#777777] block">
                  Admin Gateway
                </span>
                <h3 className="font-extrabold text-base text-[#111111]">
                  Management Sections
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setMobileMenuOpen(false)}
                className="w-9 h-9 rounded-full border border-[#cccccc] hover:bg-black/5 flex items-center justify-center text-[#111111] transition cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-3 overflow-y-auto space-y-1 divide-y divide-[#f0eae0] flex-1">
              <div className="space-y-1">
                {navItems.map((item) => {
                  const Icon = item.icon;
                  const isActive =
                    activeTab === item.id ||
                    (item.id === 'overview' && activeTab === 'dashboard') ||
                    (item.id === 'couriers' && activeTab === 'courier');
                  return (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => handleSelectTab(item.id as AdminTab)}
                      className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-bold transition cursor-pointer ${
                        isActive
                          ? 'bg-[#111111] text-white shadow-xs'
                          : 'text-[#555555] hover:bg-[#f8f6f0] hover:text-[#111111]'
                      }`}
                    >
                      <div className="flex items-center gap-2.5">
                        <Icon className="w-4 h-4" />
                        <span>{item.label}</span>
                      </div>
                      {item.count !== undefined && item.count > 0 && (
                        <span
                          className={`px-1.5 py-0.2 rounded-md text-[10px] font-mono font-bold ${
                            isActive
                              ? 'bg-white/20 text-white'
                              : 'bg-[#f0eae0] text-[#555555]'
                          }`}
                        >
                          {item.count}
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>

              <div className="pt-2">
                <button
                  type="button"
                  onClick={handleLogout}
                  className="w-full flex items-center gap-2 px-3.5 py-2.5 rounded-xl text-xs font-bold text-red-600 hover:bg-red-50 transition cursor-pointer"
                >
                  <LogOut className="w-4 h-4 text-red-500" />
                  <span>Logout from Admin</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Main Body with Sidebar Tabs */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6 w-full flex-1 flex flex-col md:flex-row gap-6">
        {/* Navigation Sidebar (Desktop only) */}
        <aside className="hidden md:block w-64 shrink-0">
          <div className="bg-white rounded-2xl border border-[#ece7dc] p-2.5 shadow-sm space-y-1 sticky top-24">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeTab === item.id || (item.id === 'overview' && activeTab === 'dashboard') || (item.id === 'couriers' && activeTab === 'courier');
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => handleSelectTab(item.id as AdminTab)}
                  className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-bold transition cursor-pointer ${
                    isActive
                      ? 'bg-[#111111] text-white shadow-xs'
                      : 'text-[#555555] hover:bg-[#f8f6f0] hover:text-[#111111]'
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <Icon className="w-4 h-4" />
                    <span>{item.label}</span>
                  </div>
                  {item.count !== undefined && item.count > 0 && (
                    <span
                      className={`px-1.5 py-0.2 rounded-md text-[10px] font-mono font-bold ${
                        isActive
                          ? 'bg-white/20 text-white'
                          : 'bg-[#f0eae0] text-[#555555]'
                      }`}
                    >
                      {item.count}
                    </span>
                  )}
                </button>
              );
            })}

            {/* Sidebar Logout Button */}
            <div className="pt-2 mt-2 border-t border-[#f0eae0]">
              <button
                type="button"
                onClick={handleLogout}
                className="w-full flex items-center gap-2 px-3.5 py-2.5 rounded-xl text-xs font-bold text-red-600 hover:bg-red-50 transition cursor-pointer"
              >
                <LogOut className="w-4 h-4 text-red-500" />
                <span>Logout</span>
              </button>
            </div>

            {/* Seed Database Option */}
            <div className="pt-2 border-t border-[#f0eae0]">
              <button
                type="button"
                onClick={handleSeedCatalog}
                disabled={isSeeding}
                className="w-full flex items-center gap-2 px-3 py-2 rounded-xl text-[11px] font-bold text-[#666666] hover:text-black hover:bg-[#f8f6f0] cursor-pointer"
              >
                <Database className="w-3.5 h-3.5 text-amber-600" />
                <span>{isSeeding ? 'Seeding Catalog...' : 'Seed Catalog Data'}</span>
              </button>
            </div>
          </div>
        </aside>

        {/* Tab Content Area */}
        <main className="flex-1 min-w-0">
          {(activeTab === 'overview' || activeTab === 'dashboard') && (
            <AdminOverview
              products={products}
              orders={orders}
              customers={customers}
              onNavigateTab={(tab) => setActiveTab(tab)}
              onOpenAddProduct={() => setActiveTab('add-product')}
              onQuickRestock={(id, current) => handleUpdateStock(id, current + 20)}
            />
          )}

          {activeTab === 'products' && (
            <AdminProducts
              products={products}
              onAddProduct={handleAddProduct}
              onUpdateProduct={handleUpdateProduct}
              onDeleteProduct={handleDeleteProduct}
              onBulkDelete={handleBulkDelete}
              initialOpenModal={false}
            />
          )}

          {activeTab === 'add-product' && (
            <AdminProducts
              products={products}
              onAddProduct={handleAddProduct}
              onUpdateProduct={handleUpdateProduct}
              onDeleteProduct={handleDeleteProduct}
              onBulkDelete={handleBulkDelete}
              initialOpenModal={true}
            />
          )}

          {activeTab === 'categories' && (
            <AdminCategories
              products={products}
              onSelectCategory={() => handleSelectTab('products')}
            />
          )}

          {activeTab === 'inventory' && (
            <AdminInventory
              products={products}
              onUpdateStock={handleUpdateStock}
            />
          )}

          {activeTab === 'orders' && (
            <AdminOrders
              orders={orders}
              onUpdateOrderStatus={handleUpdateOrderStatus}
            />
          )}

          {activeTab === 'customers' && (
            <AdminCustomers
              customers={customers}
              orders={orders}
            />
          )}

          {activeTab === 'website-content' && (
            <AdminWebsiteContent />
          )}

          {activeTab === 'branding' && (
            <AdminBranding />
          )}

          {activeTab === 'payments' && (
            <AdminDeliveryPayment mode="payments" />
          )}

          {activeTab === 'delivery' && (
            <AdminDeliveryPayment mode="delivery" />
          )}

          {(activeTab === 'couriers' || activeTab === 'courier') && (
            <AdminCourier />
          )}

          {activeTab === 'coupons' && (
            <AdminCoupons
              coupons={coupons}
              onAddCoupon={addCouponToFirestore}
              onUpdateCoupon={updateCouponInFirestore}
              onDeleteCoupon={deleteCouponFromFirestore}
            />
          )}

          {activeTab === 'ai-stylist' && (
            <AdminAiSettings />
          )}

          {activeTab === 'store-settings' && (
            <AdminStoreSettings />
          )}

          {activeTab === 'audit-log' && (
            <AdminAuditLog />
          )}

          {activeTab === 'reviews' && (
            <AdminReviews
              reviews={reviews}
              onUpdateStatus={updateReviewStatusInFirestore}
              onDeleteReview={deleteReviewFromFirestore}
            />
          )}
        </main>
      </div>
    </div>
  );
};
