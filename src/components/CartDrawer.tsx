import React, { useState } from 'react';
import { CartItem, Coupon } from '../types';
import {
  X,
  Trash2,
  Plus,
  Minus,
  ArrowRight,
  ShoppingBag,
  Tag,
  CheckCircle2,
  AlertCircle,
  Truck,
} from 'lucide-react';

interface CartDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  cartItems: CartItem[];
  onUpdateQuantity: (id: string, delta: number) => void;
  onRemoveItem: (id: string) => void;
  onClearCart?: () => void;
  brandName: string;
  onOpenCheckout: () => void;
  appliedCoupon?: Coupon | null;
  onApplyCoupon?: (coupon: Coupon | null) => void;
}

export const CartDrawer: React.FC<CartDrawerProps> = ({
  isOpen,
  onClose,
  cartItems,
  onUpdateQuantity,
  onRemoveItem,
  brandName,
  onOpenCheckout,
  appliedCoupon: parentAppliedCoupon,
  onApplyCoupon: parentOnApplyCoupon,
}) => {
  const [couponCode, setCouponCode] = useState('');
  const [couponLoading, setCouponLoading] = useState(false);
  const [couponError, setCouponError] = useState<string | null>(null);
  const [localCoupon, setLocalCoupon] = useState<Coupon | null>(null);

  const activeCoupon = parentAppliedCoupon !== undefined ? parentAppliedCoupon : localCoupon;

  const subtotal = cartItems.reduce(
    (acc, item) => acc + item.product.price * item.quantity,
    0
  );

  const totalItems = cartItems.reduce((acc, item) => acc + item.quantity, 0);

  // Delivery charge estimate (standard Dhaka: ৳80)
  const deliveryCharge = totalItems > 0 ? 80 : 0;

  // Calculate discount
  let discountAmount = 0;
  if (activeCoupon) {
    if (activeCoupon.discountPercent) {
      discountAmount = Math.round((subtotal * activeCoupon.discountPercent) / 100);
    } else if (activeCoupon.fixedDiscount) {
      discountAmount = activeCoupon.fixedDiscount;
    }
  }

  const grandTotal = Math.max(0, subtotal - discountAmount + deliveryCharge);

  const handleApplyCoupon = async (e: React.FormEvent) => {
    e.preventDefault();
    setCouponError(null);
    if (!couponCode.trim()) return;

    setCouponLoading(true);
    try {
      const res = await fetch('/api/coupons/validate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          code: couponCode.trim().toUpperCase(),
          cartTotal: subtotal,
        }),
      });
      const data = await res.json();

      if (data.valid) {
        const c: Coupon = {
          code: data.code,
          discountPercent: data.discountPercent,
          fixedDiscount: data.fixedDiscount,
          minimumOrder: 1000,
          status: 'Active',
        };
        if (parentOnApplyCoupon) parentOnApplyCoupon(c);
        setLocalCoupon(c);
        setCouponCode('');
      } else {
        // Fallback local check for offline/mock cases
        const code = couponCode.trim().toUpperCase();
        if (code === 'WELCOME10') {
          const c: Coupon = { code: 'WELCOME10', discountPercent: 10, minimumOrder: 1000, status: 'Active' };
          if (parentOnApplyCoupon) parentOnApplyCoupon(c);
          setLocalCoupon(c);
        } else if (code === 'CLOTHIQO200') {
          const c: Coupon = { code: 'CLOTHIQO200', fixedDiscount: 200, minimumOrder: 2000, status: 'Active' };
          if (parentOnApplyCoupon) parentOnApplyCoupon(c);
          setLocalCoupon(c);
        } else {
          setCouponError(data.error || 'Invalid or expired coupon code');
        }
      }
    } catch {
      // Offline fallback
      const code = couponCode.trim().toUpperCase();
      if (code === 'WELCOME10') {
        const c: Coupon = { code: 'WELCOME10', discountPercent: 10, minimumOrder: 1000, status: 'Active' };
        if (parentOnApplyCoupon) parentOnApplyCoupon(c);
        setLocalCoupon(c);
      } else {
        setCouponError('Invalid coupon code');
      }
    } finally {
      setCouponLoading(false);
    }
  };

  const handleRemoveCoupon = () => {
    if (parentOnApplyCoupon) parentOnApplyCoupon(null);
    setLocalCoupon(null);
  };

  if (!isOpen) return null;

  return (
    <div id="cart" className={`cart ${isOpen ? 'active' : ''} fixed inset-0 z-50 flex justify-end`}>
      {/* Dimmed Overlay */}
      <div
        onClick={onClose}
        className="fixed inset-0 bg-black/40 backdrop-blur-xs transition-opacity animate-in fade-in"
      />

      {/* Drawer Panel */}
      <div
        id="cart-drawer-panel"
        className="relative w-full max-w-md bg-[#f8f5ef] h-full shadow-2xl flex flex-col z-10 animate-in slide-in-from-right duration-300 text-[#111111]"
      >
        {/* Header */}
        <div className="cart-header p-5 sm:p-6 border-b border-[#dddddd] flex items-center justify-between bg-[#f8f5ef]">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-black text-white flex items-center justify-center font-bold">
              <ShoppingBag className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-extrabold text-lg text-[#111111]">
                Shopping Cart
              </h3>
              <p className="text-xs text-[#666666]">
                {totalItems} {totalItems === 1 ? 'item' : 'items'} in {brandName}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-9 h-9 rounded-full border border-[#cccccc] hover:bg-black/5 flex items-center justify-center text-[#111111] transition cursor-pointer"
            title="Close cart"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Cart Items List */}
        <div id="cartItems" className="cart-items flex-1 overflow-y-auto p-5 sm:p-6 space-y-3.5">
          {cartItems.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-center p-4 space-y-3">
              <div className="w-14 h-14 rounded-full bg-black/5 text-[#888888] flex items-center justify-center">
                <ShoppingBag className="w-6 h-6" />
              </div>
              <h3 className="text-base font-bold text-[#111111]">
                Your cart is currently empty
              </h3>
              <p className="text-xs text-[#666666] max-w-xs leading-relaxed">
                Add modern fit pants from our collection to begin checkout.
              </p>
              <button
                type="button"
                onClick={onClose}
                className="mt-2 px-4 py-2 rounded-xl bg-black text-white text-xs font-bold uppercase tracking-wider cursor-pointer"
              >
                Continue Shopping
              </button>
            </div>
          ) : (
            cartItems.map((item) => (
              <div
                key={item.id}
                className="flex items-center gap-3.5 p-3.5 rounded-2xl border border-[#dddddd] bg-white shadow-2xs hover:border-[#bbbbbb] transition"
              >
                {/* Thumbnail */}
                <div className="w-16 h-18 rounded-xl overflow-hidden flex items-center justify-center bg-[#eeeeee] shrink-0 border border-[#e5e0d3]">
                  {item.product.image ? (
                    <img
                      src={item.product.image}
                      alt={item.product.name}
                      referrerPolicy="no-referrer"
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <span className="font-bold text-sm">{item.product.icon}</span>
                  )}
                </div>

                {/* Details */}
                <div className="flex-1 min-w-0">
                  <h4 className="font-bold text-xs text-[#111111] truncate">
                    {item.product.name}
                  </h4>
                  <p className="text-[11px] text-[#666666] font-medium mt-0.5">
                    Size: <strong>{item.selectedSize}</strong> • Colour: <strong>{item.selectedColor}</strong>
                  </p>
                  <p className="font-mono font-bold text-xs text-black mt-1">
                    ৳{item.product.price.toLocaleString()}
                  </p>

                  {/* Quantity Controls & Remove */}
                  <div className="flex items-center justify-between gap-2 mt-2 pt-1 border-t border-[#f0eae0]">
                    <div className="flex items-center border border-[#cccccc] rounded-xl overflow-hidden bg-[#fafafa]">
                      <button
                        type="button"
                        onClick={() => onUpdateQuantity(item.id, -1)}
                        className="min-w-[44px] min-h-[44px] flex items-center justify-center hover:bg-black/5 text-[#555555] active:bg-black/10 cursor-pointer"
                        aria-label="Decrease quantity"
                      >
                        <Minus className="w-3.5 h-3.5" />
                      </button>
                      <span className="w-8 text-center text-xs font-mono font-bold text-[#111111]">
                        {item.quantity}
                      </span>
                      <button
                        type="button"
                        onClick={() => onUpdateQuantity(item.id, 1)}
                        className="min-w-[44px] min-h-[44px] flex items-center justify-center hover:bg-black/5 text-[#555555] active:bg-black/10 cursor-pointer"
                        aria-label="Increase quantity"
                      >
                        <Plus className="w-3.5 h-3.5" />
                      </button>
                    </div>

                    <button
                      type="button"
                      onClick={() => onRemoveItem(item.id)}
                      className="min-w-[44px] min-h-[44px] flex items-center justify-center text-[#888888] hover:text-red-600 active:scale-90 transition cursor-pointer rounded-xl hover:bg-red-50"
                      title="Remove item"
                      aria-label="Remove item"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Footer & Checkout Summary respecting env(safe-area-inset-bottom) */}
        {cartItems.length > 0 && (
          <div className="p-4 sm:p-6 border-t border-[#dddddd] bg-white space-y-3.5 shrink-0 pb-safe shadow-lg">
            {/* Coupon Code Input */}
            <div>
              {activeCoupon ? (
                <div className="flex items-center justify-between p-2.5 rounded-xl bg-emerald-50 border border-emerald-200 text-xs">
                  <div className="flex items-center gap-1.5 text-emerald-800 font-bold">
                    <Tag className="w-3.5 h-3.5" />
                    <span>Coupon {activeCoupon.code} applied!</span>
                  </div>
                  <button
                    type="button"
                    onClick={handleRemoveCoupon}
                    className="text-[11px] font-bold text-red-600 hover:underline cursor-pointer"
                  >
                    Remove
                  </button>
                </div>
              ) : (
                <form onSubmit={handleApplyCoupon} className="space-y-1">
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={couponCode}
                      onChange={(e) => setCouponCode(e.target.value.toUpperCase())}
                      placeholder="Coupon (e.g. WELCOME10)"
                      className="flex-1 px-3 py-2 rounded-xl border border-[#cccccc] text-xs font-mono uppercase bg-[#fcfbf9]"
                    />
                    <button
                      type="submit"
                      disabled={couponLoading || !couponCode.trim()}
                      className="min-h-[44px] px-4 py-2 rounded-xl bg-black text-white text-xs font-bold uppercase tracking-wider disabled:opacity-50 cursor-pointer active:scale-95"
                    >
                      {couponLoading ? '...' : 'Apply'}
                    </button>
                  </div>
                  {couponError && (
                    <p className="text-[11px] text-red-600 font-semibold flex items-center gap-1">
                      <AlertCircle className="w-3 h-3" />
                      <span>{couponError}</span>
                    </p>
                  )}
                </form>
              )}
            </div>

            {/* Calculations Breakdown */}
            <div className="space-y-1.5 text-xs text-[#555555]">
              <div className="flex justify-between">
                <span>Subtotal</span>
                <span className="font-mono font-bold text-[#111111]">
                  ৳{subtotal.toLocaleString()}
                </span>
              </div>

              {discountAmount > 0 && (
                <div className="flex justify-between text-emerald-700 font-semibold">
                  <span>Discount</span>
                  <span className="font-mono">-৳{discountAmount.toLocaleString()}</span>
                </div>
              )}

              <div className="flex justify-between">
                <span>Estimated Delivery (Dhaka)</span>
                <span className="font-mono text-[#111111]">৳{deliveryCharge}</span>
              </div>

              <div className="pt-2 border-t border-[#f0eae0] flex justify-between text-sm font-bold text-[#111111]">
                <span>Total Payable</span>
                <span className="font-mono font-black text-base text-black">
                  ৳{grandTotal.toLocaleString()}
                </span>
              </div>
            </div>

            {/* Actions: Checkout & Continue Shopping */}
            <div className="space-y-2 pt-1">
              <button
                type="button"
                onClick={() => {
                  onClose();
                  onOpenCheckout();
                }}
                className="w-full min-h-[48px] py-3.5 rounded-2xl bg-[#111111] hover:bg-black text-white font-black text-xs uppercase tracking-wider flex items-center justify-center gap-2 shadow-md transition cursor-pointer active:scale-[0.98]"
              >
                <span>Proceed to Checkout</span>
                <ArrowRight className="w-4 h-4" />
              </button>

              <button
                type="button"
                onClick={onClose}
                className="w-full min-h-[44px] py-2 text-center text-xs font-bold text-[#666666] hover:text-black cursor-pointer flex items-center justify-center"
              >
                Continue Shopping
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
