import React, { useState } from 'react';
import { Order, OrderStatus, ORDER_STATUSES, CourierProvider } from '../../types';
import {
  Search,
  Filter,
  Eye,
  Printer,
  XCircle,
  CheckCircle,
  Clock,
  Truck,
  Package,
  Copy,
  Check,
  Send,
  Smartphone,
  AlertCircle,
} from 'lucide-react';
import { InvoiceModal } from '../InvoiceModal';
import { updateDoc, doc } from 'firebase/firestore';
import { db, getCourierSettings } from '../../lib/firebase';

interface AdminOrdersProps {
  orders: Order[];
  onUpdateOrderStatus: (orderId: string, status: OrderStatus) => Promise<void>;
  onUpdatePaymentStatus?: (orderId: string, paymentStatus: 'Pending' | 'Paid' | 'Refunded') => Promise<void>;
}

export const AdminOrders: React.FC<AdminOrdersProps> = ({
  orders,
  onUpdateOrderStatus,
  onUpdatePaymentStatus,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('All');
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // Modals
  const [selectedOrderForInvoice, setSelectedOrderForInvoice] = useState<Order | null>(null);
  const [selectedOrderDetails, setSelectedOrderDetails] = useState<Order | null>(null);
  const [dispatchingOrder, setDispatchingOrder] = useState<Order | null>(null);
  const [selectedProvider, setSelectedProvider] = useState<CourierProvider>('Steadfast');
  const [dispatchLoading, setDispatchLoading] = useState(false);
  const [dispatchError, setDispatchError] = useState<string | null>(null);

  const filteredOrders = orders.filter((o) => {
    const matchesSearch =
      (o.id && o.id.toLowerCase().includes(searchTerm.toLowerCase())) ||
      o.customerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      o.phone.includes(searchTerm) ||
      (o.email && o.email.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (o.bkashTrxId && o.bkashTrxId.toLowerCase().includes(searchTerm.toLowerCase()));
    const matchesStatus = statusFilter === 'All' || o.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const handleCopy = (text: string) => {
    navigator.clipboard?.writeText(text);
    setCopiedId(text);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleConfirmDispatch = async () => {
    if (!dispatchingOrder || !dispatchingOrder.id) return;
    setDispatchLoading(true);
    setDispatchError(null);

    try {
      const courierConfig = await getCourierSettings();

      const res = await fetch('/api/courier/dispatch', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          orderId: dispatchingOrder.id,
          provider: selectedProvider,
          customerName: dispatchingOrder.customerName,
          phone: dispatchingOrder.phone,
          address: dispatchingOrder.address,
          total: dispatchingOrder.total,
          deliveryCharge: dispatchingOrder.deliveryCharge || dispatchingOrder.shipping,
          city: dispatchingOrder.city || dispatchingOrder.district,
          courierConfig,
        }),
      });

      const data = await res.json();
      if (!data.success) {
        throw new Error(data.error || 'Courier gateway reported dispatch error');
      }

      // Update Firestore order
      if (db) {
        try {
          const ordRef = doc(db, 'orders', dispatchingOrder.id);
          await updateDoc(ordRef, {
            courierProvider: selectedProvider,
            courierTrackingId: data.trackingCode || data.consignmentId,
            consignmentId: data.consignmentId,
            status: 'Shipped',
          });
        } catch (dbErr: any) {
          console.warn('Firestore order dispatch update notice:', dbErr.message);
        }
      }

      await onUpdateOrderStatus(dispatchingOrder.id, 'Shipped');
      setDispatchingOrder(null);
    } catch (err: any) {
      setDispatchError(err.message || 'Failed to dispatch order');
    } finally {
      setDispatchLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Header & Search/Filter Bar */}
      <div className="bg-white p-5 rounded-2xl border border-[#ece7dc] shadow-sm space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h2 className="text-lg font-black uppercase tracking-tight text-[#111111]">
              Orders Management ({orders.length})
            </h2>
            <p className="text-xs text-[#777777]">
              Track customer purchases, bKash TrxID verification, print invoices &amp; 1-click courier dispatch
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 pt-2">
          {/* Search Input */}
          <div className="relative">
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search by Order ID, Name, Phone, TrxID..."
              className="w-full pl-9 pr-3 py-2 rounded-xl border border-[#d5cfc0] text-xs bg-[#fcfbf9] focus:bg-white"
            />
            <Search className="w-3.5 h-3.5 text-[#888888] absolute left-3 top-3" />
          </div>

          {/* Status Filter */}
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="w-full px-3 py-2 rounded-xl border border-[#d5cfc0] text-xs bg-[#fcfbf9] text-[#111111] font-semibold cursor-pointer"
          >
            <option value="All">All Order Statuses ({orders.length})</option>
            {ORDER_STATUSES.map((st) => (
              <option key={st} value={st}>
                {st} ({orders.filter((o) => o.status === st).length})
              </option>
            ))}
          </select>

          {/* Order count label */}
          <div className="flex items-center justify-end text-xs text-[#777777] font-semibold">
            <span>Showing {filteredOrders.length} matching orders</span>
          </div>
        </div>
      </div>

      {/* Orders Table */}
      <div className="bg-white rounded-2xl border border-[#ece7dc] shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="bg-[#f8f6f0] border-b border-[#ece7dc] text-[#666666] uppercase text-[10px] tracking-wider font-bold">
                <th className="p-3.5">Order ID &amp; Date</th>
                <th className="p-3.5">Customer</th>
                <th className="p-3.5">Products Ordered</th>
                <th className="p-3.5 text-right">Total (৳)</th>
                <th className="p-3.5 text-center">Payment Details</th>
                <th className="p-3.5 text-center">Logistics / Courier</th>
                <th className="p-3.5 text-center">Order Status</th>
                <th className="p-3.5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#f3eee4]">
              {filteredOrders.length === 0 ? (
                <tr>
                  <td colSpan={8} className="p-8 text-center text-xs text-[#888888]">
                    No orders found matching the filter criteria.
                  </td>
                </tr>
              ) : (
                filteredOrders.map((ord) => {
                  const formattedDate = ord.createdAt?.toDate
                    ? ord.createdAt.toDate().toLocaleDateString('en-US', {
                        month: 'short',
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit',
                      })
                    : 'Recent';

                  return (
                    <tr key={ord.id} className="hover:bg-[#faf8f3] transition">
                      {/* Order ID & Date */}
                      <td className="p-3.5">
                        <div className="flex items-center gap-1.5 font-mono font-bold text-xs text-[#111111]">
                          <span>#{ord.id?.slice(0, 10) || 'CLT-ORD'}</span>
                          <button
                            type="button"
                            onClick={() => handleCopy(ord.id || '')}
                            title="Copy Order ID"
                            className="text-[#888888] hover:text-black cursor-pointer"
                          >
                            {copiedId === ord.id ? (
                              <Check className="w-3 h-3 text-emerald-600" />
                            ) : (
                              <Copy className="w-3 h-3" />
                            )}
                          </button>
                        </div>
                        <span className="text-[10px] text-[#777777] block mt-0.5">
                          {formattedDate}
                        </span>
                      </td>

                      {/* Customer */}
                      <td className="p-3.5">
                        <span className="font-bold text-[#111111] block">{ord.customerName}</span>
                        <span className="text-[11px] font-mono text-[#666666] block">
                          {ord.phone}
                        </span>
                        <span className="text-[10px] text-[#888888] block truncate max-w-[140px]">
                          {ord.city || ord.district || ord.address}
                        </span>
                      </td>

                      {/* Products Ordered */}
                      <td className="p-3.5">
                        <div className="space-y-1">
                          {ord.products?.map((item, idx) => (
                            <div key={idx} className="flex items-center gap-1 text-[11px] text-[#222222]">
                              <span className="font-bold">{item.quantity}x</span>
                              <span className="font-medium truncate max-w-[120px]">{item.name}</span>
                              <span className="text-[#888888] font-mono text-[10px]">
                                ({item.selectedSize} / {item.selectedColor})
                              </span>
                            </div>
                          ))}
                        </div>
                      </td>

                      {/* Subtotal & Total */}
                      <td className="p-3.5 text-right">
                        <span className="font-mono font-black text-sm text-[#111111] block">
                          ৳{(ord.total || 0).toLocaleString()}
                        </span>
                        <span className="text-[10px] text-[#777777] block">
                          Delivery: ৳{(ord.deliveryCharge ?? ord.shipping ?? 80).toLocaleString()}
                        </span>
                      </td>

                      {/* Payment Method & Status */}
                      <td className="p-3.5 text-center">
                        {ord.paymentMethod === 'bKash' ? (
                          <div className="space-y-0.5">
                            <span className="font-bold text-[11px] text-[#e2136e] flex items-center justify-center gap-1">
                              <Smartphone className="w-3.5 h-3.5 text-[#e2136e]" />
                              <span>bKash</span>
                            </span>
                            {ord.bkashTrxId && (
                              <span
                                className="font-mono text-[10px] text-[#991b48] bg-pink-50 px-1.5 py-0.5 rounded border border-pink-200 block truncate max-w-[130px] mx-auto cursor-pointer"
                                onClick={() => handleCopy(ord.bkashTrxId || '')}
                                title={`Click to copy TrxID: ${ord.bkashTrxId} (Sender: ${ord.bkashNumber || 'N/A'})`}
                              >
                                {ord.bkashTrxId}
                              </span>
                            )}
                          </div>
                        ) : (
                          <div>
                            <span className="font-semibold text-[11px] text-[#333333] block">
                              Cash on Delivery
                            </span>
                            <span className="inline-block mt-0.5 px-2 py-0.5 rounded text-[10px] font-bold bg-amber-50 text-amber-800">
                              Pending Handover
                            </span>
                          </div>
                        )}
                      </td>

                      {/* Courier Logistics */}
                      <td className="p-3.5 text-center">
                        {ord.courierProvider ? (
                          <div className="space-y-0.5">
                            <span className="inline-flex items-center gap-1 text-[10px] font-bold text-blue-800 bg-blue-50 border border-blue-200 px-2 py-0.5 rounded-md">
                              <Truck className="w-3 h-3 text-blue-600" />
                              <span>{ord.courierProvider}</span>
                            </span>
                            {(ord.courierTrackingId || ord.consignmentId) && (
                              <span className="block text-[9px] font-mono text-[#666666]">
                                #{ord.courierTrackingId || ord.consignmentId}
                              </span>
                            )}
                          </div>
                        ) : (
                          <button
                            type="button"
                            onClick={() => setDispatchingOrder(ord)}
                            className="px-2.5 py-1 rounded-lg border border-blue-200 bg-blue-50 hover:bg-blue-100 text-blue-700 transition flex items-center gap-1 text-[11px] font-bold mx-auto cursor-pointer"
                          >
                            <Truck className="w-3 h-3 text-blue-600" />
                            <span>Dispatch</span>
                          </button>
                        )}
                      </td>

                      {/* Status Dropdown */}
                      <td className="p-3.5 text-center">
                        <select
                          value={ord.status}
                          onChange={(e: any) => {
                            if (ord.id) {
                              onUpdateOrderStatus(ord.id, e.target.value as OrderStatus);
                            }
                          }}
                          className={`px-2.5 py-1.5 rounded-xl text-xs font-bold uppercase cursor-pointer border ${
                            ord.status === 'Delivered'
                              ? 'bg-emerald-50 text-emerald-800 border-emerald-300'
                              : ord.status === 'Pending'
                              ? 'bg-amber-50 text-amber-800 border-amber-300'
                              : ord.status === 'Cancelled'
                              ? 'bg-red-50 text-red-800 border-red-300'
                              : 'bg-blue-50 text-blue-800 border-blue-300'
                          }`}
                        >
                          {ORDER_STATUSES.map((st) => (
                            <option key={st} value={st}>
                              {st}
                            </option>
                          ))}
                        </select>
                      </td>

                      {/* Actions */}
                      <td className="p-3.5 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            type="button"
                            onClick={() => setSelectedOrderDetails(ord)}
                            title="View Order Details"
                            className="p-1.5 rounded-lg border border-[#e5e0d3] hover:bg-white text-[#555555] hover:text-black transition cursor-pointer"
                          >
                            <Eye className="w-3.5 h-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={() => setSelectedOrderForInvoice(ord)}
                            title="Print Tax Invoice"
                            className="p-1.5 rounded-lg border border-[#e5e0d3] hover:bg-white text-[#555555] hover:text-black transition cursor-pointer"
                          >
                            <Printer className="w-3.5 h-3.5" />
                          </button>
                          {ord.status !== 'Cancelled' && (
                            <button
                              type="button"
                              onClick={() => {
                                if (confirm(`Cancel order #${ord.id}?`)) {
                                  if (ord.id) onUpdateOrderStatus(ord.id, 'Cancelled');
                                }
                              }}
                              title="Cancel Order"
                              className="p-1.5 rounded-lg border border-red-200 hover:bg-red-50 text-red-600 transition cursor-pointer"
                            >
                              <XCircle className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Dispatch Courier Modal */}
      {dispatchingOrder && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="relative w-full max-w-md bg-white rounded-3xl shadow-2xl p-6 border border-[#ece7dc] space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-[#ece7dc]">
              <div className="flex items-center gap-2">
                <Truck className="w-5 h-5 text-blue-700" />
                <h3 className="font-extrabold text-base text-[#111111]">
                  Dispatch via Courier
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setDispatchingOrder(null)}
                className="p-1 rounded-lg hover:bg-gray-100 text-gray-500"
              >
                ✕
              </button>
            </div>

            {dispatchError && (
              <div className="p-3 bg-red-50 border border-red-200 text-red-700 text-xs rounded-xl flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{dispatchError}</span>
              </div>
            )}

            <div className="p-3 rounded-xl bg-[#faf8f4] border border-[#e8e2d5] text-xs space-y-1">
              <div>
                <span className="text-[#777777]">Order ID: </span>
                <strong className="font-mono">#{dispatchingOrder.id}</strong>
              </div>
              <div>
                <span className="text-[#777777]">Recipient: </span>
                <strong>{dispatchingOrder.customerName} ({dispatchingOrder.phone})</strong>
              </div>
              <div>
                <span className="text-[#777777]">Destination: </span>
                <span>{dispatchingOrder.address}</span>
              </div>
              <div>
                <span className="text-[#777777]">Collectable Amount: </span>
                <strong className="font-mono">
                  ৳{dispatchingOrder.paymentMethod === 'Cash on Delivery' ? (dispatchingOrder.total || 0).toLocaleString() : '0 (Paid via bKash)'}
                </strong>
              </div>
            </div>

            <div>
              <label className="text-[11px] font-bold uppercase text-[#555555] block mb-1.5">
                Select Courier Partner
              </label>
              <div className="grid grid-cols-2 gap-2">
                {(['Steadfast', 'Pathao', 'Carrybee', 'Manual'] as const).map((prov) => (
                  <button
                    type="button"
                    key={prov}
                    onClick={() => setSelectedProvider(prov)}
                    className={`p-2.5 rounded-xl border text-xs font-bold transition flex items-center justify-center gap-1.5 cursor-pointer ${
                      selectedProvider === prov
                        ? 'border-blue-600 bg-blue-50 text-blue-900'
                        : 'border-[#d5cfc0] bg-white text-[#444444] hover:border-black'
                    }`}
                  >
                    <Truck className="w-3.5 h-3.5" />
                    <span>{prov}</span>
                  </button>
                ))}
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setDispatchingOrder(null)}
                className="px-4 py-2 rounded-xl border border-[#d5cfc0] hover:bg-black/5 text-xs font-bold text-[#333333]"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={dispatchLoading}
                onClick={handleConfirmDispatch}
                className="px-5 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-black uppercase tracking-wider transition shadow flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
              >
                <Send className="w-3.5 h-3.5" />
                <span>{dispatchLoading ? 'Dispatching...' : `Dispatch via ${selectedProvider}`}</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* View Order Details Modal */}
      {selectedOrderDetails && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="relative w-full max-w-lg bg-white rounded-3xl shadow-2xl p-6 sm:p-8 border border-[#e5e0d3] text-left">
            <div className="flex items-center justify-between pb-4 border-b border-[#f0eae0]">
              <div>
                <span className="text-[10px] font-bold uppercase tracking-widest text-[#777777]">
                  Order Details
                </span>
                <h3 className="text-lg font-black text-[#111111] font-mono">
                  #{selectedOrderDetails.id}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setSelectedOrderDetails(null)}
                className="p-1.5 rounded-lg hover:bg-gray-100 text-[#777777] cursor-pointer"
              >
                ✕
              </button>
            </div>

            <div className="mt-4 space-y-4 text-xs">
              <div className="bg-[#f8f6f0] p-3.5 rounded-xl border border-[#e5e0d3]">
                <span className="font-bold text-[#333333] uppercase block mb-1">
                  Customer &amp; Shipping Address
                </span>
                <p className="font-bold text-sm text-[#111111]">{selectedOrderDetails.customerName}</p>
                <p className="text-[#555555] font-mono">{selectedOrderDetails.phone}</p>
                <p className="text-[#666666] mt-1">{selectedOrderDetails.address}</p>
              </div>

              {selectedOrderDetails.paymentMethod === 'bKash' && (
                <div className="bg-[#fff5f8] p-3.5 rounded-xl border border-[#fbd4e2]">
                  <span className="font-bold text-[#e2136e] uppercase block mb-1">
                    bKash Payment Verification
                  </span>
                  <p className="text-xs">
                    Sender Phone: <strong className="font-mono">{selectedOrderDetails.bkashNumber || selectedOrderDetails.phone}</strong>
                  </p>
                  <p className="text-xs">
                    Transaction ID (TrxID): <strong className="font-mono text-[#991b48]">{selectedOrderDetails.bkashTrxId || 'N/A'}</strong>
                  </p>
                </div>
              )}

              <div>
                <span className="font-bold text-[#333333] uppercase block mb-2">
                  Items Ordered
                </span>
                <div className="divide-y divide-[#f0eae0] border-y border-[#f0eae0]">
                  {selectedOrderDetails.products.map((p, i) => (
                    <div key={i} className="py-2.5 flex items-center justify-between">
                      <div>
                        <span className="font-bold text-[#111111] block">{p.name}</span>
                        <span className="text-[#777777] text-[11px]">
                          Size: {p.selectedSize} | Colour: {p.selectedColor} | Qty: {p.quantity}
                        </span>
                      </div>
                      <span className="font-mono font-bold text-[#111111]">
                        ৳{(p.price * p.quantity).toLocaleString()}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="pt-2 flex justify-between font-bold text-sm border-t border-black">
                <span>Grand Total:</span>
                <span className="font-mono font-black">৳{(selectedOrderDetails.total || 0).toLocaleString()}</span>
              </div>
            </div>

            <div className="mt-6 flex justify-end gap-3">
              <button
                type="button"
                onClick={() => {
                  setSelectedOrderForInvoice(selectedOrderDetails);
                  setSelectedOrderDetails(null);
                }}
                className="px-4 py-2 rounded-xl bg-black text-white font-bold text-xs flex items-center gap-1.5 cursor-pointer"
              >
                <Printer className="w-3.5 h-3.5" />
                <span>Open Invoice</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Printable Tax Invoice Modal */}
      <InvoiceModal
        isOpen={!!selectedOrderForInvoice}
        order={selectedOrderForInvoice}
        onClose={() => setSelectedOrderForInvoice(null)}
      />
    </div>
  );
};
