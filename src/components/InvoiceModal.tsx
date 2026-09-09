import React from 'react';
import { Order } from '../types';
import { X, Printer, CheckCircle, Package } from 'lucide-react';

interface InvoiceModalProps {
  isOpen: boolean;
  order: Order | null;
  onClose: () => void;
  brandName?: string;
}

export const InvoiceModal: React.FC<InvoiceModalProps> = ({
  isOpen,
  order,
  onClose,
  brandName = 'CLOTHIQO',
}) => {
  if (!isOpen || !order) return null;

  const handlePrint = () => {
    window.print();
  };

  const formattedDate = order.createdAt?.toDate
    ? order.createdAt.toDate().toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      })
    : new Date().toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      });

  const orderId = order.id || 'CLT-PENDING';
  const delivery = order.deliveryCharge ?? order.shipping ?? 120;
  const discount = order.discount ?? 0;
  const subtotal = order.subtotal || 0;
  const grandTotal = order.total || subtotal + delivery - discount;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm overflow-y-auto animate-in fade-in duration-200">
      <div className="relative w-full max-w-2xl bg-white rounded-2xl shadow-2xl overflow-hidden my-8 border border-[#e5e0d3]">
        {/* Header Action Bar (Hidden when printing) */}
        <div className="print:hidden flex items-center justify-between px-6 py-4 bg-[#f8f6f0] border-b border-[#e5e0d3]">
          <div className="flex items-center gap-2">
            <Package className="w-5 h-5 text-[#111111]" />
            <span className="text-xs font-extrabold uppercase tracking-widest text-[#111111]">
              Invoice Preview
            </span>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handlePrint}
              className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-[#111111] hover:bg-black text-white text-xs font-bold transition shadow-sm cursor-pointer"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Print Invoice</span>
            </button>
            <button
              type="button"
              onClick={onClose}
              className="p-1.5 rounded-lg hover:bg-[#eae4d5] text-[#666666] hover:text-[#111111] transition cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Invoice Printable Area */}
        <div id="printable-invoice" className="p-8 sm:p-10 text-left font-sans text-[#111111] bg-white">
          {/* Top Brand & Invoice Title */}
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center pb-6 border-b-2 border-black gap-4">
            <div>
              <h1 className="text-3xl font-black tracking-widest uppercase text-[#111111] leading-none">
                {brandName}
              </h1>
              <p className="text-xs font-semibold text-[#666666] tracking-wider uppercase mt-1">
                Premium Fashion &amp; Atelier
              </p>
              <p className="text-[11px] text-[#888888] mt-0.5">
                support@clothiqo.com | +880 1700-000000
              </p>
            </div>
            <div className="sm:text-right">
              <span className="text-xs font-black tracking-widest uppercase bg-black text-white px-2.5 py-1 rounded">
                TAX INVOICE
              </span>
              <p className="font-mono text-sm font-bold text-[#111111] mt-2">
                Order #{orderId}
              </p>
              <p className="text-xs text-[#666666] mt-0.5">
                Date: {formattedDate}
              </p>
            </div>
          </div>

          {/* Customer & Shipping Details */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 py-6 border-b border-[#ece7dc] text-xs">
            <div>
              <span className="font-bold text-[#888888] uppercase tracking-wider block mb-1.5 text-[10px]">
                BILLED &amp; SHIPPED TO
              </span>
              <p className="font-bold text-sm text-[#111111]">{order.customerName}</p>
              <p className="text-[#555555] mt-0.5">{order.phone}</p>
              {order.email && <p className="text-[#555555]">{order.email}</p>}
              <p className="text-[#555555] mt-1 leading-relaxed">
                {order.address}
                {order.area ? `, ${order.area}` : ''}
                {order.city ? `, ${order.city}` : (order.district ? `, ${order.district}` : '')}
              </p>
            </div>
            <div className="sm:text-right">
              <span className="font-bold text-[#888888] uppercase tracking-wider block mb-1.5 text-[10px]">
                ORDER INFORMATION
              </span>
              <p className="text-[#555555]">
                <span className="font-semibold text-[#111111]">Payment Method:</span>{' '}
                {order.paymentMethod}
              </p>
              <p className="text-[#555555] mt-1">
                <span className="font-semibold text-[#111111]">Payment Status:</span>{' '}
                <span className="font-bold text-emerald-700">{order.paymentStatus || 'Pending (COD)'}</span>
              </p>
              <p className="text-[#555555] mt-1">
                <span className="font-semibold text-[#111111]">Order Status:</span>{' '}
                <span className="font-bold text-black uppercase">{order.status}</span>
              </p>
            </div>
          </div>

          {/* Itemized Products Table */}
          <div className="py-6">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-black text-[#555555] uppercase text-[10px] tracking-wider font-bold">
                  <th className="py-2.5">Item Description</th>
                  <th className="py-2.5 text-center">Size</th>
                  <th className="py-2.5 text-center">Colour</th>
                  <th className="py-2.5 text-center">Qty</th>
                  <th className="py-2.5 text-right">Unit Price</th>
                  <th className="py-2.5 text-right">Total</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#f0eae0]">
                {order.products.map((item, idx) => (
                  <tr key={idx} className="text-[#222222]">
                    <td className="py-3 font-semibold text-[#111111]">
                      {item.name}
                      <span className="block text-[10px] font-normal text-[#777777]">{item.category}</span>
                    </td>
                    <td className="py-3 text-center font-mono font-medium">{item.selectedSize}</td>
                    <td className="py-3 text-center">{item.selectedColor}</td>
                    <td className="py-3 text-center font-bold">{item.quantity}</td>
                    <td className="py-3 text-right font-mono">৳{item.price.toLocaleString()}</td>
                    <td className="py-3 text-right font-mono font-bold">
                      ৳{(item.price * item.quantity).toLocaleString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Pricing Calculation Summary */}
          <div className="pt-4 border-t border-black flex justify-end">
            <div className="w-64 space-y-2 text-xs">
              <div className="flex justify-between text-[#555555]">
                <span>Subtotal:</span>
                <span className="font-mono font-semibold text-[#111111]">৳{subtotal.toLocaleString()}</span>
              </div>
              <div className="flex justify-between text-[#555555]">
                <span>Delivery Charge:</span>
                <span className="font-mono font-semibold text-[#111111]">৳{delivery.toLocaleString()}</span>
              </div>
              {discount > 0 && (
                <div className="flex justify-between text-emerald-700 font-semibold">
                  <span>Discount {order.couponCode ? `(${order.couponCode})` : ''}:</span>
                  <span className="font-mono">-৳{discount.toLocaleString()}</span>
                </div>
              )}
              <div className="flex justify-between pt-2 border-t-2 border-black text-sm font-black text-[#111111]">
                <span className="uppercase tracking-wider">Grand Total:</span>
                <span className="font-mono">৳{grandTotal.toLocaleString()}</span>
              </div>
            </div>
          </div>

          {/* Footer Notes & Guarantee */}
          <div className="mt-10 pt-6 border-t border-[#ece7dc] text-center text-[10px] text-[#777777]">
            <div className="flex items-center justify-center gap-1.5 text-emerald-800 font-semibold mb-1">
              <CheckCircle className="w-3.5 h-3.5" />
              <span>Verified Authentic CLOTHIQO Product</span>
            </div>
            <p>Thank you for shopping with CLOTHIQO. For exchange or queries within 7 days, contact us with your order ID.</p>
          </div>
        </div>
      </div>
    </div>
  );
};
