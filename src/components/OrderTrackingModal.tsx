import React, { useState } from 'react';
import { Order, OrderStatus, ORDER_STATUSES } from '../types';
import { fetchOrderById, fetchOrdersByPhone } from '../lib/firebase';
import { X, Search, PackageCheck, Clock, Truck, CheckCircle2, AlertCircle, Phone, MapPin, ChevronRight } from 'lucide-react';

interface OrderTrackingModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialOrderId?: string;
}

const STATUS_STEPS: OrderStatus[] = [
  'Pending',
  'Confirmed',
  'Processing',
  'Shipped',
  'Delivered',
];

export const OrderTrackingModal: React.FC<OrderTrackingModalProps> = ({
  isOpen,
  onClose,
  initialOrderId,
}) => {
  const [searchTerm, setSearchTerm] = useState(initialOrderId || '');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [foundOrders, setFoundOrders] = useState<Order[]>([]);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);

  if (!isOpen) return null;

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    const term = searchTerm.trim();
    if (!term) return;

    setLoading(true);
    setError(null);
    setSelectedOrder(null);
    setFoundOrders([]);

    try {
      // 1. Check if looks like a phone number (digits)
      const isPhone = /^[0-9+-\s]{8,15}$/.test(term);
      if (isPhone) {
        const orders = await fetchOrdersByPhone(term);
        if (orders.length > 0) {
          setFoundOrders(orders);
          setSelectedOrder(orders[0]);
        } else {
          setError(`No orders found matching phone number "${term}".`);
        }
      } else {
        // 2. Try as Order ID
        const order = await fetchOrderById(term);
        if (order) {
          setSelectedOrder(order);
          setFoundOrders([order]);
        } else {
          setError(`No order found matching ID "${term}". Please verify your Order ID from confirmation.`);
        }
      }
    } catch (err: any) {
      console.error('Track order error:', err);
      setError(err.message || 'Could not look up order. Make sure Firestore is connected.');
    } finally {
      setLoading(false);
    }
  };

  const getStepIndex = (status: OrderStatus) => {
    if (status === 'Cancelled') return -1;
    return STATUS_STEPS.indexOf(status);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center sm:p-4 bg-black/50 backdrop-blur-xs animate-in fade-in text-[#111111]">
      <div className="bg-[#f8f5ef] w-full sm:max-w-2xl max-h-[92vh] rounded-t-3xl sm:rounded-2xl shadow-2xl border border-[#dddddd] flex flex-col overflow-hidden">
        {/* Header */}
        <div className="p-4 sm:p-6 border-b border-[#dddddd] flex items-center justify-between bg-[#f8f5ef] shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#111111] text-white flex items-center justify-center font-bold shrink-0">
              <PackageCheck className="w-5 h-5 text-amber-300" />
            </div>
            <div>
              <h3 className="font-extrabold text-base sm:text-lg text-[#111111]">
                Track Your CLOTHIQO Order
              </h3>
              <p className="text-xs text-[#666666]">
                Enter Order ID or phone number
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-9 h-9 rounded-full border border-[#cccccc] hover:bg-black/5 flex items-center justify-center text-[#111111] transition cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Search Bar */}
        <div className="p-4 sm:p-6 border-b border-[#dddddd] bg-white shrink-0">
          <form onSubmit={handleSearch} className="flex gap-2">
            <div className="relative flex-1">
              <Search className="w-4 h-4 text-[#888888] absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Order ID or +88017..."
                required
                className="w-full pl-10 pr-3.5 py-2.5 min-h-[44px] rounded-xl border border-[#cccccc] bg-[#fbfbfb] text-base sm:text-sm text-[#111111] focus:bg-white focus:border-black outline-hidden"
              />
            </div>
            <button
              type="submit"
              disabled={loading}
              className="min-h-[44px] px-5 py-2.5 rounded-xl bg-[#111111] hover:bg-black text-white text-xs font-bold transition flex items-center gap-1.5 cursor-pointer disabled:opacity-50 active:scale-95"
            >
              {loading ? 'Searching...' : 'Track'}
            </button>
          </form>

          {error && (
            <div className="mt-3 p-3 rounded-lg bg-red-50 border border-red-200 text-red-700 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}
        </div>

        {/* Results Body */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-5">
          {/* Multiple orders found selector */}
          {foundOrders.length > 1 && (
            <div className="space-y-1.5">
              <span className="text-xs font-bold text-[#666666] uppercase">Orders with this phone:</span>
              <div className="flex flex-wrap gap-2">
                {foundOrders.map((o) => (
                  <button
                    key={o.id}
                    onClick={() => setSelectedOrder(o)}
                    className={`px-3 py-2 min-h-[40px] rounded-lg text-xs font-semibold border cursor-pointer ${
                      selectedOrder?.id === o.id
                        ? 'bg-[#111111] text-white border-[#111111]'
                        : 'bg-white text-[#111111] border-[#dddddd] hover:border-black'
                    }`}
                  >
                    #{o.id?.slice(0, 8)} • ৳{o.total.toLocaleString()} ({o.status})
                  </button>
                ))}
              </div>
            </div>
          )}

          {selectedOrder ? (
            <div className="space-y-5">
              {/* Order Status Banner */}
              <div className="p-4 rounded-xl bg-white border border-[#dddddd] flex items-center justify-between shadow-xs">
                <div>
                  <span className="text-[11px] font-bold text-[#888888] uppercase tracking-wider block font-mono">
                    Order ID: #{selectedOrder.id}
                  </span>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="text-sm sm:text-base font-extrabold text-[#111111]">
                      Status:
                    </span>
                    <span
                      className={`text-xs font-bold px-3 py-1 rounded-full uppercase tracking-wider ${
                        selectedOrder.status === 'Delivered'
                          ? 'bg-emerald-100 text-emerald-800'
                          : selectedOrder.status === 'Cancelled'
                          ? 'bg-red-100 text-red-800'
                          : selectedOrder.status === 'Shipped'
                          ? 'bg-blue-100 text-blue-800'
                          : 'bg-amber-100 text-amber-800'
                      }`}
                    >
                      {selectedOrder.status}
                    </span>
                  </div>
                </div>

                <div className="text-right">
                  <span className="text-xs text-[#666666] block">Total Amount</span>
                  <span className="text-base sm:text-lg font-black text-[#111111] font-mono">
                    ৳{selectedOrder.total.toLocaleString()}
                  </span>
                </div>
              </div>

              {/* Courier Dispatch Card if assigned */}
              {selectedOrder.courierProvider && (
                <div className="p-3.5 rounded-xl bg-[#f0f7ff] border border-[#cce3fe] flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-lg bg-blue-600 text-white flex items-center justify-center shrink-0">
                      <Truck className="w-4 h-4" />
                    </div>
                    <div>
                      <span className="font-bold text-[#1e3a8a] block">
                        Courier: {selectedOrder.courierProvider}
                      </span>
                      <span className="text-[11px] text-[#2563eb] font-mono">
                        Tracking Code: {selectedOrder.courierTrackingId || selectedOrder.consignmentId || 'In Transit'}
                      </span>
                    </div>
                  </div>
                  <span className="text-[10px] uppercase font-bold bg-blue-100 text-blue-800 px-2.5 py-1 rounded-full shrink-0">
                    Dispatched
                  </span>
                </div>
              )}

              {/* Visual Progress Stepper - Horizontal on Tablet/Desktop, Vertical on Mobile */}
              {selectedOrder.status !== 'Cancelled' ? (
                <div className="bg-white p-4 sm:p-5 rounded-xl border border-[#dddddd] shadow-xs">
                  <span className="text-xs font-bold uppercase tracking-wider text-[#666666] block mb-3 sm:mb-4">
                    Fulfillment Progress (2–5 working days)
                  </span>

                  {/* Desktop / Tablet Horizontal Stepper */}
                  <div className="hidden sm:block relative py-2">
                    <div className="relative flex items-center justify-between">
                      {/* Connecting Line */}
                      <div className="absolute left-0 right-0 top-1/2 -translate-y-1/2 h-1 bg-[#eeeeee] z-0" />
                      <div
                        className="absolute left-0 top-1/2 -translate-y-1/2 h-1 bg-[#111111] z-0 transition-all duration-500"
                        style={{
                          width: `${Math.max(
                            0,
                            (getStepIndex(selectedOrder.status) / (STATUS_STEPS.length - 1)) * 100
                          )}%`,
                        }}
                      />

                      {STATUS_STEPS.map((step, idx) => {
                        const currentIdx = getStepIndex(selectedOrder.status);
                        const isCompleted = idx <= currentIdx;
                        const isCurrent = idx === currentIdx;

                        return (
                          <div key={step} className="relative z-10 flex flex-col items-center">
                            <div
                              className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold transition-all ${
                                isCurrent
                                  ? 'bg-[#111111] text-white ring-4 ring-black/10 scale-110'
                                  : isCompleted
                                  ? 'bg-[#111111] text-white'
                                  : 'bg-white border-2 border-[#cccccc] text-[#888888]'
                              }`}
                            >
                              {isCompleted ? <CheckCircle2 className="w-3.5 h-3.5" /> : idx + 1}
                            </div>
                            <span
                              className={`text-[10px] mt-1.5 font-bold ${
                                isCurrent ? 'text-[#111111]' : isCompleted ? 'text-[#444444]' : 'text-[#aaaaaa]'
                              }`}
                            >
                              {step}
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {/* Mobile Vertical Timeline */}
                  <div className="sm:hidden space-y-3 pt-1">
                    {STATUS_STEPS.map((step, idx) => {
                      const currentIdx = getStepIndex(selectedOrder.status);
                      const isCompleted = idx <= currentIdx;
                      const isCurrent = idx === currentIdx;

                      return (
                        <div key={step} className="flex items-center gap-3">
                          <div className="flex flex-col items-center">
                            <div
                              className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold shrink-0 ${
                                isCurrent
                                  ? 'bg-[#111111] text-white ring-4 ring-black/10'
                                  : isCompleted
                                  ? 'bg-[#111111] text-white'
                                  : 'bg-white border-2 border-[#cccccc] text-[#888888]'
                              }`}
                            >
                              {isCompleted ? <CheckCircle2 className="w-3.5 h-3.5" /> : idx + 1}
                            </div>
                            {idx < STATUS_STEPS.length - 1 && (
                              <div
                                className={`w-0.5 h-4 mt-1 ${
                                  idx < currentIdx ? 'bg-[#111111]' : 'bg-[#eeeeee]'
                                }`}
                              />
                            )}
                          </div>
                          <div>
                            <span
                              className={`text-xs font-bold block ${
                                isCurrent
                                  ? 'text-[#111111]'
                                  : isCompleted
                                  ? 'text-[#444444]'
                                  : 'text-[#aaaaaa]'
                              }`}
                            >
                              {step}
                            </span>
                            {isCurrent && (
                              <span className="text-[10px] text-amber-700 font-medium">Current Status</span>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              ) : (
                <div className="p-4 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs">
                  This order was marked as <strong>Cancelled</strong>. If you believe this is an error, please contact customer support at <strong>3218.clothiqo@gmail.com</strong> or <strong>+8801602954526</strong>.
                </div>
              )}

              {/* Order Breakdown */}
              <div className="bg-white rounded-xl border border-[#dddddd] p-4 sm:p-5 space-y-4 shadow-xs">
                <h4 className="text-xs font-bold uppercase tracking-wider text-[#111111]">
                  Items in this order
                </h4>

                <div className="divide-y divide-[#eeeeee]">
                  {selectedOrder.products.map((p, i) => (
                    <div key={i} className="py-2.5 flex items-center justify-between gap-3">
                      <div className="flex items-center gap-3 min-w-0">
                        {p.image ? (
                          <img
                            src={p.image}
                            alt={p.name}
                            className="w-12 h-12 rounded-lg object-cover bg-[#eeeeee] shrink-0"
                          />
                        ) : (
                          <div className="w-12 h-12 rounded-lg bg-black text-white flex items-center justify-center text-xs font-bold shrink-0">
                            CLQ
                          </div>
                        )}
                        <div className="truncate">
                          <p className="font-bold text-xs text-[#111111] truncate">{p.name}</p>
                          <p className="text-[11px] text-[#666666]">
                            Size: {p.selectedSize} • Colour: {p.selectedColor} • Qty: {p.quantity}
                          </p>
                        </div>
                      </div>
                      <span className="text-xs font-bold text-[#111111] shrink-0 font-mono">
                        ৳{(p.price * p.quantity).toLocaleString()}
                      </span>
                    </div>
                  ))}
                </div>

                {/* Delivery address info */}
                <div className="pt-3 border-t border-[#eeeeee] grid sm:grid-cols-2 gap-3 text-xs text-[#555555]">
                  <div>
                    <span className="text-[11px] text-[#888888] font-bold uppercase block mb-0.5">
                      Delivery Address
                    </span>
                    <p className="text-[#111111] font-semibold">{selectedOrder.customerName}</p>
                    <p>{selectedOrder.address}, {selectedOrder.district}</p>
                    <p className="text-[11px] font-mono">{selectedOrder.phone}</p>
                  </div>

                  <div>
                    <span className="text-[11px] text-[#888888] font-bold uppercase block mb-0.5">
                      Payment & Shipping
                    </span>
                    <p>Method: <strong className="text-[#111111]">{selectedOrder.paymentMethod}</strong></p>
                    <p>Delivery: Nationwide (2–5 working days)</p>
                    <p>Shipping Cost: ৳{selectedOrder.shipping}</p>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="text-center py-8 text-xs text-[#777777] space-y-2">
              <PackageCheck className="w-12 h-12 mx-auto text-[#bbbbbb]" />
              <p className="font-bold text-sm text-[#111111]">Enter an Order ID to begin</p>
              <p className="max-w-xs mx-auto">
                Track real-time fulfillment status directly from our Cloud Firestore dispatch database.
              </p>
            </div>
          )}
        </div>

        {/* Footer with pb-safe */}
        <div className="p-4 border-t border-[#dddddd] bg-[#f8f5ef] flex items-center justify-between text-xs text-[#666666] shrink-0 pb-safe">
          <span className="text-[11px]">Help: +8801602954526</span>
          <button
            onClick={onClose}
            className="px-5 py-2.5 min-h-[40px] rounded-xl bg-[#111111] hover:bg-black text-white font-bold transition cursor-pointer active:scale-95"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
};
