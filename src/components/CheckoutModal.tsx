import React, { useState, useEffect } from 'react';
import { CartItem, Coupon, DeliverySettings, PaymentSettings } from '../types';
import {
  createFirestoreOrder,
  updateProductStockInFirestore,
  getDeliverySettings,
  getPaymentSettings,
  DEFAULT_DELIVERY_SETTINGS,
  DEFAULT_PAYMENT_SETTINGS,
} from '../lib/firebase';
import {
  X,
  CheckCircle2,
  Banknote,
  Copy,
  Check,
  Tag,
  Smartphone,
  Info,
} from 'lucide-react';

interface CheckoutModalProps {
  isOpen: boolean;
  onClose: () => void;
  cartItems: CartItem[];
  subtotal: number;
  appliedCoupon?: Coupon | null;
  onOrderPlaced: (orderId: string, paymentMethod: string) => void;
  onOpenTracking: (orderId: string) => void;
}

const BANGLADESH_CITIES = [
  'Dhaka',
  'Chattogram',
  'Sylhet',
  'Rajshahi',
  'Khulna',
  'Barishal',
  'Rangpur',
  'Mymensingh',
  'Gazipur',
  'Narayanganj',
  'Cumilla',
  'Bogura',
  'Other',
];

export const CheckoutModal: React.FC<CheckoutModalProps> = ({
  isOpen,
  onClose,
  cartItems,
  subtotal,
  appliedCoupon,
  onOrderPlaced,
  onOpenTracking,
}) => {
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [address, setAddress] = useState('');
  const [city, setCity] = useState('Dhaka');
  const [customCity, setCustomCity] = useState('');
  const [area, setArea] = useState('');
  const [paymentMethod, setPaymentMethod] = useState<'Cash on Delivery' | 'bKash'>('Cash on Delivery');
  const [bkashSenderNumber, setBkashSenderNumber] = useState('');
  const [bkashTrxId, setBkashTrxId] = useState('');
  const [copiedBkash, setCopiedBkash] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [copiedId, setCopiedId] = useState(false);

  // Settings loaded from Firestore/Local
  const [deliverySettings, setDeliverySettings] = useState<DeliverySettings>(DEFAULT_DELIVERY_SETTINGS);
  const [paymentSettings, setPaymentSettings] = useState<PaymentSettings>(DEFAULT_PAYMENT_SETTINGS);

  useEffect(() => {
    if (isOpen) {
      getDeliverySettings().then(setDeliverySettings).catch(() => {});
      getPaymentSettings().then(setPaymentSettings).catch(() => {});
    }
  }, [isOpen]);

  // Confirmed Order state
  const [confirmedOrder, setConfirmedOrder] = useState<{
    orderId: string;
    name: string;
    phone: string;
    email: string;
    address: string;
    city: string;
    area: string;
    payment: string;
    bkashTrxId?: string;
    subtotal: number;
    shipping: number;
    discount: number;
    total: number;
    itemsCount: number;
  } | null>(null);

  if (!isOpen) return null;

  const selectedCity = city === 'Other' && customCity.trim() ? customCity.trim() : city;
  const isDhaka = selectedCity.toLowerCase() === 'dhaka';
  const shippingFee = isDhaka ? deliverySettings.insideDhakaFee : deliverySettings.outsideDhakaFee;

  // Discount calculation
  let discountAmount = 0;
  if (appliedCoupon) {
    if (appliedCoupon.discountPercent) {
      discountAmount = Math.round((subtotal * appliedCoupon.discountPercent) / 100);
    } else if (appliedCoupon.fixedDiscount) {
      discountAmount = appliedCoupon.fixedDiscount;
    }
  }

  const totalPayable = Math.max(0, subtotal - discountAmount + shippingFee);

  const handleCopyBkash = () => {
    navigator.clipboard.writeText(paymentSettings.bkashNumber);
    setCopiedBkash(true);
    setTimeout(() => setCopiedBkash(false), 2000);
  };

  const handlePlaceOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    if (!name.trim() || !phone.trim() || !address.trim() || !area.trim() || !selectedCity) {
      setErrorMsg('Please complete all required delivery details: Name, Phone, Address, City, and Area.');
      return;
    }

    if (paymentMethod === 'bKash') {
      if (!bkashSenderNumber.trim() || !bkashTrxId.trim()) {
        setErrorMsg('Please provide your bKash sender number and Transaction ID (TrxID).');
        return;
      }
    }

    setIsSubmitting(true);

    try {
      const orderPayload = {
        customerName: name.trim(),
        phone: phone.trim(),
        email: email.trim(),
        address: `${address.trim()}, ${area.trim()}`,
        city: selectedCity,
        district: selectedCity,
        area: area.trim(),
        products: cartItems.map((item) => ({
          productId: String(item.product.id),
          name: item.product.name,
          category: item.product.category,
          price: Number(item.product.price),
          selectedSize: item.selectedSize,
          selectedColor: item.selectedColor,
          quantity: item.quantity,
          image: item.product.image || '',
        })),
        subtotal: subtotal,
        deliveryCharge: shippingFee,
        shipping: shippingFee,
        discount: discountAmount,
        couponCode: appliedCoupon?.code || undefined,
        total: totalPayable,
        paymentMethod: paymentMethod,
        paymentStatus: 'Pending' as const,
        bkashNumber: paymentMethod === 'bKash' ? bkashSenderNumber.trim() : undefined,
        bkashTrxId: paymentMethod === 'bKash' ? bkashTrxId.trim() : undefined,
        status: 'Pending' as const,
      };

      const orderId = await createFirestoreOrder(orderPayload);

      // Decrement product inventory
      for (const item of cartItems) {
        try {
          const currentStock = item.product.stock || 0;
          const updatedStock = Math.max(0, currentStock - item.quantity);
          await updateProductStockInFirestore(String(item.product.id), updatedStock);
        } catch (stockErr) {
          console.warn('Stock update notice for item:', item.product.id, stockErr);
        }
      }

      setConfirmedOrder({
        orderId,
        name: name.trim(),
        phone: phone.trim(),
        email: email.trim(),
        address: address.trim(),
        city: selectedCity,
        area: area.trim(),
        payment: paymentMethod,
        bkashTrxId: paymentMethod === 'bKash' ? bkashTrxId.trim() : undefined,
        subtotal: subtotal,
        shipping: shippingFee,
        discount: discountAmount,
        total: totalPayable,
        itemsCount: cartItems.reduce((acc, i) => acc + i.quantity, 0),
      });

      onOrderPlaced(orderId, paymentMethod);
    } catch (err: any) {
      console.error('Checkout error:', err);
      setErrorMsg(err.message || 'Failed to place order. Please check your network connection.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCopyId = (id: string) => {
    navigator.clipboard.writeText(id);
    setCopiedId(true);
    setTimeout(() => setCopiedId(false), 2000);
  };

  const handleFinish = () => {
    setConfirmedOrder(null);
    setName('');
    setPhone('');
    setEmail('');
    setAddress('');
    setArea('');
    setCity('Dhaka');
    setCustomCity('');
    setBkashSenderNumber('');
    setBkashTrxId('');
    setErrorMsg(null);
    onClose();
  };

  return (
    <div
      id="checkoutModal"
      className="modal show fixed inset-0 z-50 flex items-end sm:items-center justify-center sm:p-4 bg-black/60 backdrop-blur-xs transition-opacity animate-in fade-in text-[#111111]"
    >
      <div className="modal-content relative bg-white w-full sm:w-[560px] max-w-full rounded-t-3xl sm:rounded-3xl shadow-2xl max-h-[92vh] flex flex-col border border-[#dddddd] overflow-hidden">
        {/* Header Bar */}
        <div className="p-4 sm:p-6 border-b border-[#eeeeee] flex items-center justify-between shrink-0 bg-[#faf8f5]">
          <div>
            <span className="text-[10px] font-extrabold uppercase tracking-widest text-[#777777] block">
              Checkout
            </span>
            <h2 className="text-lg sm:text-2xl font-black tracking-tight text-[#111111] uppercase">
              {confirmedOrder ? 'Order Status' : 'Delivery & Payment'}
            </h2>
          </div>
          <button
            type="button"
            onClick={handleFinish}
            className="close-modal w-9 h-9 rounded-full border border-[#e5e7eb] hover:bg-black/5 flex items-center justify-center text-[#4b5563] transition cursor-pointer"
            title="Close checkout"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Scrollable Form Body */}
        <div className="overflow-y-auto p-4 sm:p-6 flex-1">
        {confirmedOrder ? (
          <div className="py-2 text-center space-y-4 animate-in zoom-in-95 duration-200">
            <div className="w-16 h-16 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center mx-auto ring-8 ring-emerald-50/50">
              <CheckCircle2 className="w-8 h-8" />
            </div>

            <div className="space-y-1">
              <h2 className="text-2xl font-black tracking-tight text-[#111111] uppercase">
                Order Confirmed!
              </h2>
              <p className="text-xs text-[#6b7280]">
                Thank you for ordering with CLOTHIQO. Your trousers are being prepared for dispatch.
              </p>
            </div>

            {/* Order Details Receipt */}
            <div className="bg-[#f8f5ef] border border-[#e8e2d5] rounded-2xl p-4 text-left space-y-2 text-xs">
              <div className="flex justify-between items-center pb-2 border-b border-black/[0.08]">
                <span className="text-[#6b7280]">Order Reference:</span>
                <div className="flex items-center gap-1.5">
                  <strong className="text-[#111111] font-mono tracking-wider text-xs sm:text-sm bg-white px-2 py-0.5 rounded-lg border border-[#dddddd]">
                    #{confirmedOrder.orderId}
                  </strong>
                  <button
                    type="button"
                    onClick={() => handleCopyId(confirmedOrder.orderId)}
                    className="p-1 rounded hover:bg-black/5 text-[#555555] transition cursor-pointer"
                    title="Copy Order ID"
                  >
                    {copiedId ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                  </button>
                </div>
              </div>

              <div className="flex justify-between">
                <span className="text-[#6b7280]">Customer Name:</span>
                <strong className="text-[#111111]">{confirmedOrder.name}</strong>
              </div>

              <div className="flex justify-between">
                <span className="text-[#6b7280]">Contact Phone:</span>
                <strong className="text-[#111111] font-mono">{confirmedOrder.phone}</strong>
              </div>

              <div className="flex justify-between">
                <span className="text-[#6b7280]">Delivery Destination:</span>
                <span className="text-[#111111] font-medium text-right max-w-[240px]">
                  {confirmedOrder.address}, {confirmedOrder.area}, {confirmedOrder.city}
                </span>
              </div>

              <div className="flex justify-between">
                <span className="text-[#6b7280]">Payment Method:</span>
                <span className="font-bold text-amber-900 bg-amber-50 px-2 py-0.5 rounded">
                  {confirmedOrder.payment}
                  {confirmedOrder.bkashTrxId && ` (TrxID: ${confirmedOrder.bkashTrxId})`}
                </span>
              </div>

              <div className="pt-2 border-t border-black/[0.08] flex justify-between font-bold text-sm text-[#111111]">
                <span>Total Amount:</span>
                <span className="font-mono font-black text-base">
                  ৳{confirmedOrder.total.toLocaleString()}
                </span>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="pt-2 flex flex-col sm:flex-row gap-2.5">
              <button
                type="button"
                onClick={() => {
                  const id = confirmedOrder.orderId;
                  handleFinish();
                  onOpenTracking(id);
                }}
                className="flex-1 min-h-[48px] py-3 rounded-xl bg-black text-white text-xs font-black uppercase tracking-wider transition shadow-sm cursor-pointer active:scale-95"
              >
                Track My Order
              </button>

              <button
                type="button"
                onClick={handleFinish}
                className="flex-1 min-h-[48px] py-3 rounded-xl border border-[#cccccc] hover:bg-black/5 text-xs font-bold uppercase tracking-wider text-[#111111] transition cursor-pointer"
              >
                Continue Shopping
              </button>
            </div>
          </div>
        ) : (
          <form id="checkoutForm" onSubmit={handlePlaceOrder} className="space-y-4">
            {/* Sub-headline */}
            <p className="text-xs text-[#666666]">
              Fast nationwide delivery with Cash on Delivery &amp; verified bKash payment.
            </p>

            {/* Error Message Banner */}
            {errorMsg && (
              <div className="p-3 bg-red-50 border border-red-200 text-red-700 text-xs rounded-xl font-medium">
                {errorMsg}
              </div>
            )}

            {/* Order Summary Compact Accordion / Card */}
            <div className="bg-[#f8f5ef] border border-[#e8e2d5] rounded-2xl p-3.5 space-y-2">
              <div className="text-[11px] font-bold uppercase text-[#666666] flex justify-between">
                <span>Selected Trousers ({cartItems.reduce((a, b) => a + b.quantity, 0)})</span>
                <span>Subtotal</span>
              </div>

              <div className="divide-y divide-black/[0.06] max-h-28 overflow-y-auto pr-1">
                {cartItems.map((item) => (
                  <div key={item.id} className="py-1 flex justify-between items-center text-xs">
                    <div className="truncate mr-2">
                      <span className="font-bold text-[#111111]">{item.product.name}</span>
                      <span className="text-[11px] text-[#666666] ml-1.5">
                        ({item.selectedSize}, {item.selectedColor} × {item.quantity})
                      </span>
                    </div>
                    <span className="font-mono font-semibold text-[#111111] shrink-0">
                      ৳{(item.product.price * item.quantity).toLocaleString()}
                    </span>
                  </div>
                ))}
              </div>

              {/* Price Calculations */}
              <div className="pt-2 border-t border-black/[0.06] space-y-1 text-xs text-[#555555]">
                <div className="flex justify-between">
                  <span>Subtotal</span>
                  <span className="font-mono font-bold text-[#111111]">
                    ৳{subtotal.toLocaleString()}
                  </span>
                </div>

                {discountAmount > 0 && (
                  <div className="flex justify-between text-emerald-700 font-semibold">
                    <span className="flex items-center gap-1">
                      <Tag className="w-3 h-3" />
                      <span>Discount ({appliedCoupon?.code})</span>
                    </span>
                    <span className="font-mono">-৳{discountAmount.toLocaleString()}</span>
                  </div>
                )}

                <div className="flex justify-between">
                  <span>Delivery Fee ({selectedCity})</span>
                  <span className="font-mono text-[#111111]">৳{shippingFee}</span>
                </div>

                <div className="flex justify-between font-black text-sm text-[#111111] pt-1 border-t border-black/[0.06]">
                  <span>Total Payable:</span>
                  <span className="font-mono text-base text-black">
                    ৳{totalPayable.toLocaleString()}
                  </span>
                </div>
              </div>
            </div>

            {/* Form Fields: Full Name, Phone Number, Email, Delivery Address, City, Area */}
            {/* Using text-base (16px) on mobile to prevent iOS auto-zoom */}
            <div className="space-y-3">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-[#222222] uppercase block text-xs mb-1">
                    Full Name *
                  </label>
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="e.g. Tanvir Hasan"
                    className="w-full min-h-[44px] px-3.5 py-2.5 rounded-xl border border-[#cccccc] text-base sm:text-xs bg-[#fcfbf9] focus:bg-white focus:border-black focus:outline-none"
                  />
                </div>

                <div>
                  <label className="font-bold text-[#222222] uppercase block text-xs mb-1">
                    Phone Number *
                  </label>
                  <input
                    type="tel"
                    inputMode="tel"
                    required
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="017XXXXXXXX or +8801..."
                    className="w-full min-h-[44px] px-3.5 py-2.5 rounded-xl border border-[#cccccc] text-base sm:text-xs font-mono bg-[#fcfbf9] focus:bg-white focus:border-black focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="font-bold text-[#222222] uppercase block text-xs mb-1">
                  Email Address
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@example.com (for order tracking)"
                  className="w-full min-h-[44px] px-3.5 py-2.5 rounded-xl border border-[#cccccc] text-base sm:text-xs bg-[#fcfbf9] focus:bg-white focus:border-black focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-[#222222] uppercase block text-xs mb-1">
                    City / Division *
                  </label>
                  <select
                    value={city}
                    onChange={(e) => setCity(e.target.value)}
                    className="w-full min-h-[44px] px-3.5 py-2.5 rounded-xl border border-[#cccccc] text-base sm:text-xs bg-[#fcfbf9] font-semibold cursor-pointer focus:border-black focus:outline-none"
                  >
                    {BANGLADESH_CITIES.map((c) => (
                      <option key={c} value={c}>
                        {c} ({c === 'Dhaka' ? `৳${deliverySettings.insideDhakaFee} delivery` : `৳${deliverySettings.outsideDhakaFee} delivery`})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="font-bold text-[#222222] uppercase block text-xs mb-1">
                    Area / Thana *
                  </label>
                  <input
                    type="text"
                    required
                    value={area}
                    onChange={(e) => setArea(e.target.value)}
                    placeholder="e.g. Dhanmondi, Banani, Mirpur"
                    className="w-full min-h-[44px] px-3.5 py-2.5 rounded-xl border border-[#cccccc] text-base sm:text-xs bg-[#fcfbf9] focus:bg-white focus:border-black focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="font-bold text-[#222222] uppercase block text-xs mb-1">
                  Delivery Address *
                </label>
                <textarea
                  required
                  rows={2}
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  placeholder="House number, Road number, Flat / Floor..."
                  className="w-full px-3.5 py-2.5 rounded-xl border border-[#cccccc] text-base sm:text-xs bg-[#fcfbf9] focus:bg-white focus:border-black focus:outline-none"
                />
              </div>
            </div>

            {/* Payment Method Selector */}
            <div className="pt-1">
              <span className="text-[11px] font-bold text-[#333333] uppercase block mb-2">
                Payment Method
              </span>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                {paymentSettings.codEnabled && (
                  <label
                    className={`flex items-center gap-3 p-3.5 rounded-2xl border-2 cursor-pointer transition min-h-[52px] ${
                      paymentMethod === 'Cash on Delivery'
                        ? 'border-black bg-[#faf8f3]'
                        : 'border-[#e0dcd2] bg-white hover:bg-[#faf8f3]'
                    }`}
                  >
                    <input
                      type="radio"
                      name="payment"
                      checked={paymentMethod === 'Cash on Delivery'}
                      onChange={() => setPaymentMethod('Cash on Delivery')}
                      className="accent-black w-4 h-4"
                    />
                    <Banknote className="w-5 h-5 text-emerald-800 shrink-0" />
                    <div className="text-xs">
                      <span className="font-bold text-black block">Cash on Delivery</span>
                      <span className="text-[#666666] text-[11px]">Pay upon delivery</span>
                    </div>
                  </label>
                )}

                {paymentSettings.bkashEnabled && (
                  <label
                    className={`flex items-center gap-3 p-3.5 rounded-2xl border-2 cursor-pointer transition min-h-[52px] ${
                      paymentMethod === 'bKash'
                        ? 'border-[#e2136e] bg-[#fdf2f7]'
                        : 'border-[#e0dcd2] bg-white hover:bg-[#fdf2f7]'
                    }`}
                  >
                    <input
                      type="radio"
                      name="payment"
                      checked={paymentMethod === 'bKash'}
                      onChange={() => setPaymentMethod('bKash')}
                      className="accent-[#e2136e] w-4 h-4"
                    />
                    <Smartphone className="w-5 h-5 text-[#e2136e] shrink-0" />
                    <div className="text-xs">
                      <span className="font-bold text-[#e2136e] block">bKash Payment</span>
                      <span className="text-[#666666] text-[11px]">Send Money &amp; TrxID</span>
                    </div>
                  </label>
                )}
              </div>

              {/* bKash instructions and verification inputs */}
              {paymentMethod === 'bKash' && (
                <div className="mt-3 p-4 rounded-2xl bg-[#fff5f8] border border-[#fbd4e2] space-y-3 text-xs animate-in fade-in">
                  <div className="flex items-start gap-2 text-[#991b48]">
                    <Info className="w-4 h-4 mt-0.5 shrink-0" />
                    <p className="text-[11px] leading-relaxed">
                      {paymentSettings.bkashInstructions ||
                        'Please Send Money to our bKash number below, then provide your bKash mobile number and TrxID.'}
                    </p>
                  </div>

                  {/* Security Assurance: Never ask PIN/OTP */}
                  <div className="p-2.5 rounded-xl bg-amber-50 border border-amber-200 text-amber-900 text-[11px] font-medium flex items-center gap-2">
                    <span className="font-bold">Security Note:</span>
                    <span>CLOTHIQO will NEVER ask for your bKash PIN or OTP. Never share your PIN with anyone.</span>
                  </div>

                  <div className="flex items-center justify-between bg-white p-3 rounded-xl border border-[#f9c2d6]">
                    <div>
                      <span className="text-[10px] font-bold uppercase text-[#888888] block">
                        CLOTHIQO bKash ({paymentSettings.bkashType})
                      </span>
                      <span className="text-sm font-black font-mono text-[#e2136e]">
                        {paymentSettings.bkashNumber}
                      </span>
                    </div>
                    <button
                      type="button"
                      onClick={handleCopyBkash}
                      className="min-h-[40px] flex items-center gap-1 text-xs font-bold px-3 py-1.5 rounded-lg bg-[#fdf2f7] hover:bg-[#fce7f0] text-[#e2136e] border border-[#fbd4e2] transition cursor-pointer"
                    >
                      {copiedBkash ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                      <span>{copiedBkash ? 'Copied' : 'Copy'}</span>
                    </button>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                    <div>
                      <label className="font-bold text-[#333333] uppercase text-[10px] block mb-1">
                        Your bKash Number *
                      </label>
                      <input
                        type="tel"
                        inputMode="tel"
                        required
                        value={bkashSenderNumber}
                        onChange={(e) => setBkashSenderNumber(e.target.value)}
                        placeholder="01XXXXXXXXX"
                        className="w-full min-h-[44px] px-3 py-2 rounded-xl border border-[#d5a5b8] text-base sm:text-xs font-mono bg-white focus:outline-none focus:ring-1 focus:ring-[#e2136e]"
                      />
                    </div>

                    <div>
                      <label className="font-bold text-[#333333] uppercase text-[10px] block mb-1">
                        Transaction ID (TrxID) *
                      </label>
                      <input
                        type="text"
                        required
                        value={bkashTrxId}
                        onChange={(e) => setBkashTrxId(e.target.value.toUpperCase())}
                        placeholder="e.g. BL92KJ831A"
                        className="w-full min-h-[44px] px-3 py-2 rounded-xl border border-[#d5a5b8] text-base sm:text-xs font-mono uppercase bg-white focus:outline-none focus:ring-1 focus:ring-[#e2136e]"
                      />
                    </div>
                  </div>
                </div>
              )}
            </div>
          </form>
        )}
        </div>

        {/* Sticky Fixed Bottom Bar with Safe-Area Insets */}
        {!confirmedOrder && (
          <div className="p-4 sm:p-5 border-t border-[#dddddd] bg-[#faf8f5] shadow-lg shrink-0 pb-safe">
            <button
              type="submit"
              form="checkoutForm"
              disabled={isSubmitting}
              className="w-full min-h-[50px] py-3.5 rounded-2xl bg-[#111111] hover:bg-black text-white font-black text-xs sm:text-sm uppercase tracking-wider transition shadow-lg disabled:opacity-50 flex items-center justify-center gap-2 cursor-pointer active:scale-[0.98]"
            >
              {isSubmitting ? (
                <span>Securing Order...</span>
              ) : (
                <span>PLACE ORDER • ৳{totalPayable.toLocaleString()}</span>
              )}
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
