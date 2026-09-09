import React, { useState } from 'react';
import { Customer, Order } from '../../types';
import { Search, Users, Phone, MapPin, ShoppingBag, Eye, Calendar, DollarSign } from 'lucide-react';

interface AdminCustomersProps {
  customers: Customer[];
  orders: Order[];
}

export const AdminCustomers: React.FC<AdminCustomersProps> = ({
  customers,
  orders,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);

  // Aggregate customers from existing orders and customers collection
  const customerMap = new Map<string, Customer>();

  // Add recorded customers
  customers.forEach((c) => {
    customerMap.set(c.phone.trim(), { ...c });
  });

  // Supplement from orders
  orders.forEach((o) => {
    const phone = o.phone?.trim();
    if (!phone) return;

    if (!customerMap.has(phone)) {
      customerMap.set(phone, {
        id: phone,
        name: o.customerName || 'Customer',
        phone: phone,
        email: o.email || '',
        address: o.address || '',
        city: o.city || o.district || '',
        totalOrders: 1,
        totalSpent: o.total || 0,
        lastOrderDate: o.createdAt,
      });
    } else {
      const existing = customerMap.get(phone)!;
      existing.totalOrders += 1;
      existing.totalSpent += o.total || 0;
      if (!existing.address && o.address) existing.address = o.address;
    }
  });

  const customerList = Array.from(customerMap.values());

  const filtered = customerList.filter(
    (c) =>
      c.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      c.phone.includes(searchTerm) ||
      (c.email && c.email.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (c.address && c.address.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  const customerOrders = selectedCustomer
    ? orders.filter((o) => o.phone?.trim() === selectedCustomer.phone.trim())
    : [];

  return (
    <div className="space-y-6">
      {/* Top Header & Search Bar */}
      <div className="bg-white p-5 rounded-2xl border border-[#ece7dc] shadow-sm space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h2 className="text-lg font-black uppercase tracking-tight text-[#111111]">
              Customer Directory ({customerList.length})
            </h2>
            <p className="text-xs text-[#777777]">
              View customer profiles, order history, lifetime value, and delivery details
            </p>
          </div>
        </div>

        <div className="relative max-w-md">
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search by customer name, phone, or address..."
            className="w-full pl-9 pr-3 py-2 rounded-xl border border-[#d5cfc0] text-xs bg-[#fcfbf9] focus:bg-white"
          />
          <Search className="w-3.5 h-3.5 text-[#888888] absolute left-3 top-3" />
        </div>
      </div>

      {/* Customers Table */}
      <div className="bg-white rounded-2xl border border-[#ece7dc] shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="bg-[#f8f6f0] border-b border-[#ece7dc] text-[#666666] uppercase text-[10px] tracking-wider font-bold">
                <th className="p-3.5">Customer Name</th>
                <th className="p-3.5">Contact Phone</th>
                <th className="p-3.5">Shipping Address</th>
                <th className="p-3.5 text-center">Total Orders</th>
                <th className="p-3.5 text-right">Lifetime Spend</th>
                <th className="p-3.5 text-right">Order History</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#f3eee4]">
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={6} className="p-8 text-center text-xs text-[#888888]">
                    No customers found. Orders placed by customers will automatically register here.
                  </td>
                </tr>
              ) : (
                filtered.map((c, i) => (
                  <tr key={i} className="hover:bg-[#faf8f3] transition">
                    <td className="p-3.5">
                      <div className="flex items-center gap-2.5">
                        <div className="w-8 h-8 rounded-full bg-[#111111] text-white flex items-center justify-center font-bold text-xs uppercase">
                          {c.name.charAt(0) || 'C'}
                        </div>
                        <div>
                          <span className="font-bold text-sm text-[#111111] block">{c.name}</span>
                          {c.email && (
                            <span className="text-[11px] text-[#777777] block">{c.email}</span>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="p-3.5 font-mono font-semibold text-[#333333]">
                      {c.phone}
                    </td>
                    <td className="p-3.5 text-[#555555] max-w-xs truncate">
                      {c.address || c.city || 'Standard Address'}
                    </td>
                    <td className="p-3.5 text-center font-mono font-bold text-xs text-[#111111]">
                      {c.totalOrders}
                    </td>
                    <td className="p-3.5 text-right font-mono font-bold text-sm text-emerald-800">
                      ৳{c.totalSpent.toLocaleString()}
                    </td>
                    <td className="p-3.5 text-right">
                      <button
                        type="button"
                        onClick={() => setSelectedCustomer(c)}
                        className="px-3 py-1.5 rounded-lg border border-[#d5cfc0] bg-white hover:bg-[#f7f5ee] font-bold text-xs text-[#111111] flex items-center gap-1.5 ml-auto cursor-pointer"
                      >
                        <Eye className="w-3.5 h-3.5" />
                        <span>History</span>
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Customer Order History Modal */}
      {selectedCustomer && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="relative w-full max-w-xl bg-white rounded-3xl shadow-2xl p-6 sm:p-8 border border-[#e5e0d3] text-left">
            <div className="flex items-center justify-between pb-4 border-b border-[#f0eae0]">
              <div>
                <span className="text-[10px] font-bold uppercase tracking-widest text-[#777777]">
                  Customer History
                </span>
                <h3 className="text-lg font-black text-[#111111]">{selectedCustomer.name}</h3>
                <span className="text-xs text-[#666666] font-mono">{selectedCustomer.phone}</span>
              </div>
              <button
                type="button"
                onClick={() => setSelectedCustomer(null)}
                className="p-1.5 rounded-lg hover:bg-gray-100 text-[#777777] cursor-pointer"
              >
                ✕
              </button>
            </div>

            <div className="mt-4 space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-3 p-3 bg-[#f8f6f0] rounded-xl border border-[#e5e0d3]">
                <div>
                  <span className="text-[10px] text-[#777777] uppercase font-bold block">
                    Total Purchases
                  </span>
                  <span className="text-base font-black font-mono text-[#111111]">
                    {selectedCustomer.totalOrders} orders
                  </span>
                </div>
                <div>
                  <span className="text-[10px] text-[#777777] uppercase font-bold block">
                    Total Revenue
                  </span>
                  <span className="text-base font-black font-mono text-emerald-800">
                    ৳{selectedCustomer.totalSpent.toLocaleString()}
                  </span>
                </div>
              </div>

              <div>
                <span className="font-bold text-[#333333] uppercase block mb-2">
                  Orders by this Customer ({customerOrders.length})
                </span>
                <div className="divide-y divide-[#f0eae0] max-h-60 overflow-y-auto">
                  {customerOrders.map((ord) => (
                    <div key={ord.id} className="py-2.5 flex items-center justify-between">
                      <div>
                        <span className="font-mono font-bold text-[#111111] block">
                          #{ord.id?.slice(0, 10)}
                        </span>
                        <span className="text-[11px] text-[#777777]">
                          {ord.products?.length} items • Status: {ord.status}
                        </span>
                      </div>
                      <span className="font-mono font-bold text-sm text-[#111111]">
                        ৳{(ord.total || 0).toLocaleString()}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
