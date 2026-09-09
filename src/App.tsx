import { useState, useEffect } from 'react';
import {
  Routes,
  Route,
  Navigate,
  useLocation,
} from 'react-router-dom';

import {
  Product,
  CartItem,
  BrandConfig,
  ViewMode,
  Coupon,
} from './types';

import { INITIAL_BRAND, PRODUCTS } from './data/products';

import { Topbar } from './components/Topbar';
import { CircleView } from './components/CircleView';
import { GridView } from './components/GridView';
import { ProductDrawer } from './components/ProductDrawer';
import { CartDrawer } from './components/CartDrawer';
import { CheckoutModal } from './components/CheckoutModal';
import { AiAssistantDrawer } from './components/AiAssistantDrawer';
import { AdminGateway } from './components/AdminGateway';
import { OrderTrackingModal } from './components/OrderTrackingModal';
import { FirebaseGuideModal } from './components/FirebaseGuideModal';

import {
  isFirebaseConfigured,
  subscribeToFirestoreProducts,
  getBrandingSettings,
} from './lib/firebase';

import { Check, Database } from 'lucide-react';

export default function App() {
  const [brand, setBrand] = useState<BrandConfig>(() => {
    const saved = localStorage.getItem(
      'clothiqo_brand_config'
    );

    if (saved) {
      try {
        const parsed = JSON.parse(saved);

        if (parsed) {
          return {
            ...INITIAL_BRAND,
            ...parsed,
          };
        }
      } catch {
        // Use default branding.
      }
    }

    return INITIAL_BRAND;
  });

  const [products, setProducts] =
    useState<Product[]>(PRODUCTS);

  const [currentMode, setCurrentMode] =
    useState<ViewMode>('grid');

  const [selectedProduct, setSelectedProduct] =
    useState<Product>(PRODUCTS[0]);

  const [selectedSize, setSelectedSize] =
    useState<string>(
      PRODUCTS[0].sizes[0] || '32'
    );

  const [selectedColor, setSelectedColor] =
    useState<string>(
      PRODUCTS[0].colors[0] || 'Black'
    );

  const [isDrawerOpen, setIsDrawerOpen] =
    useState(false);

  const [cartItems, setCartItems] =
    useState<CartItem[]>([]);

  const [isCartOpen, setIsCartOpen] =
    useState(false);

  const [isCheckoutOpen, setIsCheckoutOpen] =
    useState(false);

  const [isAiModalOpen, setIsAiModalOpen] =
    useState(false);

  const [aiPrompt, setAiPrompt] =
    useState('');

  const [toastMessage, setToastMessage] =
    useState<string | null>(null);

  const [appliedCoupon, setAppliedCoupon] =
    useState<Coupon | null>(null);

  const [isTrackingOpen, setIsTrackingOpen] =
    useState(false);

  const [trackingOrderId, setTrackingOrderId] =
    useState('');

  const [
    isFirebaseGuideOpen,
    setIsFirebaseGuideOpen,
  ] = useState(false);

  const [
    hasFirebaseConfig,
    setHasFirebaseConfig,
  ] = useState(isFirebaseConfigured());

  const location = useLocation();

  /*
   * ------------------------------------------------------------------
   * BRANDING
   * ------------------------------------------------------------------
   */

  useEffect(() => {
    async function loadBranding() {
      try {
        const saved =
          await getBrandingSettings();

        if (!saved) return;

        setBrand((prev) => ({
          ...prev,
          name: saved.name || prev.name,
          logo: saved.logo || prev.logo,
          primary:
            saved.primary || prev.primary,
          secondary:
            saved.secondary || prev.secondary,
          announcement:
            saved.announcement ||
            prev.announcement,
        }));

        if (saved.favicon) {
          const link =
            document.querySelector(
              "link[rel*='icon']"
            ) as HTMLLinkElement | null;

          if (link) {
            link.href = saved.favicon;
          }
        }

        if (saved.name) {
          document.title =
            `${saved.name} | Modern Fit. Timeless Style`;
        }
      } catch (error) {
        console.warn(
          'Branding load failed:',
          error
        );
      }
    }

    loadBranding();
  }, []);

  useEffect(() => {
    document.documentElement.style.setProperty(
      '--brand',
      brand.primary
    );

    document.documentElement.style.setProperty(
      '--brand-2',
      brand.secondary
    );

    localStorage.setItem(
      'clothiqo_brand_config',
      JSON.stringify(brand)
    );
  }, [brand]);

  /*
   * ------------------------------------------------------------------
   * FIREBASE STATUS
   * ------------------------------------------------------------------
   *
   * Important:
   * App.tsx DOES NOT manage admin authentication.
   *
   * AdminGateway is the single controller for:
   * Firebase Auth -> Firestore role -> AdminDashboard.
   */

  useEffect(() => {
    setHasFirebaseConfig(
      isFirebaseConfigured()
    );
  }, []);

  /*
   * ------------------------------------------------------------------
   * PRODUCTS
   * ------------------------------------------------------------------
   */

  useEffect(() => {
    if (!isFirebaseConfigured()) {
      return;
    }

    try {
      const unsubscribe =
        subscribeToFirestoreProducts(
          (firestoreProducts) => {
            if (
              !firestoreProducts ||
              firestoreProducts.length === 0
            ) {
              return;
            }

            setProducts(firestoreProducts);

            setSelectedProduct((prev) => {
              const match =
                firestoreProducts.find(
                  (product) =>
                    String(product.id) ===
                    String(prev.id)
                );

              return (
                match ||
                firestoreProducts[0]
              );
            });
          }
        );

      return () => unsubscribe();
    } catch (error) {
      console.warn(
        'Firestore products subscription notice:',
        error
      );
    }
  }, []);

  /*
   * ------------------------------------------------------------------
   * STORE ACTIONS
   * ------------------------------------------------------------------
   */

  const showToast = (
    message: string
  ) => {
    setToastMessage(message);

    window.setTimeout(() => {
      setToastMessage(null);
    }, 3000);
  };

  const handleOpenProduct = (
    product: Product
  ) => {
    setSelectedProduct(product);

    setSelectedSize(
      product.sizes[0] || '32'
    );

    setSelectedColor(
      product.colors[0] || 'Black'
    );

    setIsDrawerOpen(true);
  };

  const handleAddToCart = (
    product: Product,
    size: string,
    color?: string,
    quantity: number = 1
  ) => {
    const finalSize =
      size ||
      product.sizes[0] ||
      '32';

    const finalColor =
      color ||
      product.colors[0] ||
      'Black';

    const qtyToAdd =
      Math.max(1, quantity);

    const key =
      `${product.id}-${finalSize}-${finalColor}`;

    setCartItems((prev) => {
      const existing = prev.find(
        (item) => item.id === key
      );

      if (existing) {
        return prev.map((item) =>
          item.id === key
            ? {
                ...item,
                quantity:
                  item.quantity +
                  qtyToAdd,
              }
            : item
        );
      }

      return [
        ...prev,
        {
          id: key,
          product,
          selectedSize: finalSize,
          selectedColor: finalColor,
          quantity: qtyToAdd,
        },
      ];
    });

    showToast(
      `Added ${product.name} (${finalSize}, ${finalColor}) to cart`
    );
  };

  const handleBuyNow = (
    product: Product,
    size: string,
    color?: string,
    quantity: number = 1
  ) => {
    handleAddToCart(
      product,
      size,
      color,
      quantity
    );

    setIsDrawerOpen(false);
    setIsCheckoutOpen(true);
  };

  const handleUpdateQuantity = (
    id: string,
    delta: number
  ) => {
    setCartItems((prev) =>
      prev
        .map((item) => {
          if (item.id !== id) {
            return item;
          }

          const nextQty =
            item.quantity + delta;

          return nextQty > 0
            ? {
                ...item,
                quantity: nextQty,
              }
            : null;
        })
        .filter(Boolean) as CartItem[]
    );
  };

  const handleRemoveItem = (
    id: string
  ) => {
    setCartItems((prev) =>
      prev.filter(
        (item) => item.id !== id
      )
    );
  };

  const handleClearCart = () => {
    setCartItems([]);
  };

  const handleOrderPlaced = (
    orderId: string,
    _paymentMethod: string
  ) => {
    setCartItems([]);

    showToast(
      `Order confirmed! ID: ${orderId}`
    );
  };

  const handleAskAiAboutProduct = (
    product: Product
  ) => {
    setAiPrompt(
      `What should I pair with the ${product.name} (${selectedColor}), and what are its key styling points?`
    );

    setIsAiModalOpen(true);
  };

  const handleOpenOrderTracking = (
    orderId?: string
  ) => {
    if (orderId) {
      setTrackingOrderId(orderId);
    }

    setIsTrackingOpen(true);
  };

  const totalCartCount =
    cartItems.reduce(
      (total, item) =>
        total + item.quantity,
      0
    );

  const cartSubtotal =
    cartItems.reduce(
      (total, item) =>
        total +
        item.product.price *
          item.quantity,
      0
    );

  /*
   * ------------------------------------------------------------------
   * STOREFRONT
   * ------------------------------------------------------------------
   */

  const storefrontContent = (
    <div className="h-screen w-screen flex flex-col bg-[#f8f5ef] text-[#111111] overflow-hidden select-none font-sans">

      {brand.announcement && (
        <div className="bg-[#111111] text-[#f7f5ee] text-[11px] sm:text-xs font-semibold py-1.5 px-4 text-center tracking-wide z-40 shrink-0 border-b border-black/10">
          {brand.announcement}
        </div>
      )}

      <Topbar
        brand={brand}
        currentMode={currentMode}
        onSelectMode={
          setCurrentMode
        }
        cartCount={
          totalCartCount
        }
        onOpenCart={() =>
          setIsCartOpen(true)
        }
        onOpenAi={() => {
          setAiPrompt('');
          setIsAiModalOpen(true);
        }}
        onOpenTracking={() =>
          handleOpenOrderTracking()
        }
      />

      <main className="relative flex-1 flex overflow-hidden">
        <section className="stage relative flex-1 overflow-hidden">

          {currentMode ===
          'circle' ? (
            <CircleView
              products={products}
              selectedProduct={
                selectedProduct
              }
              onSelectProduct={
                setSelectedProduct
              }
              onOpenDrawer={
                handleOpenProduct
              }
              brandName={
                brand.name
              }
            />
          ) : (
            <GridView
              products={products}
              selectedProduct={
                selectedProduct
              }
              onOpenProduct={
                handleOpenProduct
              }
              onAddToCart={
                handleAddToCart
              }
              onOpenCart={() =>
                setIsCartOpen(true)
              }
              onOpenTracking={() =>
                handleOpenOrderTracking()
              }
            />
          )}

        </section>

        <ProductDrawer
          isOpen={isDrawerOpen}
          product={
            selectedProduct
          }
          allProducts={products}
          selectedSize={
            selectedSize
          }
          selectedColor={
            selectedColor
          }
          onSelectSize={
            setSelectedSize
          }
          onSelectColor={
            setSelectedColor
          }
          onClose={() =>
            setIsDrawerOpen(false)
          }
          onAddToCart={
            handleAddToCart
          }
          onBuyNow={
            handleBuyNow
          }
          onSelectRelatedProduct={
            handleOpenProduct
          }
          onAskAiAboutProduct={
            handleAskAiAboutProduct
          }
        />
      </main>

      <CartDrawer
        isOpen={isCartOpen}
        onClose={() =>
          setIsCartOpen(false)
        }
        cartItems={cartItems}
        onUpdateQuantity={
          handleUpdateQuantity
        }
        onRemoveItem={
          handleRemoveItem
        }
        onClearCart={
          handleClearCart
        }
        brandName={brand.name}
        onOpenCheckout={() =>
          setIsCheckoutOpen(true)
        }
        appliedCoupon={
          appliedCoupon
        }
        onApplyCoupon={
          setAppliedCoupon
        }
      />

      <CheckoutModal
        isOpen={
          isCheckoutOpen
        }
        onClose={() =>
          setIsCheckoutOpen(false)
        }
        cartItems={cartItems}
        subtotal={cartSubtotal}
        appliedCoupon={
          appliedCoupon
        }
        onOrderPlaced={
          handleOrderPlaced
        }
        onOpenTracking={
          handleOpenOrderTracking
        }
      />

      <OrderTrackingModal
        isOpen={
          isTrackingOpen
        }
        onClose={() =>
          setIsTrackingOpen(false)
        }
        initialOrderId={
          trackingOrderId
        }
      />

      <FirebaseGuideModal
        isOpen={
          isFirebaseGuideOpen
        }
        onClose={() =>
          setIsFirebaseGuideOpen(false)
        }
      />

      <AiAssistantDrawer
        isOpen={
          isAiModalOpen
        }
        onClose={() =>
          setIsAiModalOpen(false)
        }
        brandName={brand.name}
        products={products}
        currentProduct={
          selectedProduct
        }
        onSelectProduct={(product) => {
          setSelectedProduct(
            product
          );

          setSelectedSize(
            product.sizes[0] ||
              '32'
          );

          setSelectedColor(
            product.colors[0] ||
              'Black'
          );

          setIsDrawerOpen(true);
        }}
        initialPrompt={
          aiPrompt
        }
      />

      <div className="fixed bottom-4 left-4 z-30 hidden sm:flex items-center gap-2 bg-white/90 backdrop-blur-md px-3 py-1.5 rounded-full border border-[#dddddd] shadow-sm text-[11px] text-[#555555]">
        <Database
          className={`w-3.5 h-3.5 ${
            hasFirebaseConfig
              ? 'text-emerald-600'
              : 'text-amber-500'
          }`}
        />

        <span>
          {hasFirebaseConfig
            ? 'Firebase Firestore Connected'
            : 'Firebase Ready'}
        </span>

        <button
          onClick={() =>
            setIsFirebaseGuideOpen(
              true
            )
          }
          className="underline hover:text-black font-semibold ml-1"
        >
          Setup Details
        </button>
      </div>

      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 flex items-center gap-2.5 bg-[#111111] text-white px-4 py-3 rounded-2xl shadow-xl text-xs font-semibold">
          <div className="w-5 h-5 rounded-full bg-emerald-500 text-white flex items-center justify-center">
            <Check className="w-3 h-3" />
          </div>

          <span>
            {toastMessage}
          </span>
        </div>
      )}
    </div>
  );

  /*
   * ------------------------------------------------------------------
   * ROUTING
   * ------------------------------------------------------------------
   */

  return (
    <Routes>
      <Route
        path="/admin"
        element={
          <AdminGateway />
        }
      />

      <Route
        path="/admin/login"
        element={
          <AdminGateway />
        }
      />

      <Route
        path="/admin/dashboard"
        element={
          <AdminGateway />
        }
      />

      <Route
        path="/admin/:tab"
        element={
          <AdminGateway />
        }
      />

      <Route
        path="/admin/*"
        element={
          <AdminGateway />
        }
      />

      <Route
        path="/"
        element={
          storefrontContent
        }
      />

      <Route
        path="*"
        element={
          <Navigate
            to="/"
            replace
          />
        }
      />
    </Routes>
  );
}
