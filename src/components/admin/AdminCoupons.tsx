import React, { useState } from 'react';
import { Coupon } from '../../types';
import { Tag, Plus, Edit2, Trash2, CheckCircle2, XCircle, Search, X } from 'lucide-react';

interface AdminCouponsProps {
  coupons: Coupon[];
  onAddCoupon: (coupon: Omit<Coupon, 'id' | 'createdAt'>) => Promise<string>;
  onUpdateCoupon: (id: string, updates: Partial<Coupon>) => Promise<void>;
  onDeleteCoupon: (id: string) => Promise<void>;
}

// Built-in store coupon defaults
const DEFAULT_COUPONS: Coupon[] = [
  {
    id: 'c1',
    code: 'WELCOME10',
    discountPercent: 10,
    minimumOrder: 1000,
    expiryDate: '2026-12-31',
    status: 'Active',
    usageCount: 14,
  },
  {
    id: 'c2',
    code: 'CLOTHIQO200',
    fixedDiscount: 200,
    minimumOrder: 2000,
    expiryDate: '2026-12-31',
    status: 'Active',
    usageCount: 28,
  },
  {
    id: 'c3',
    code: 'RAMADAN25',
    discountPercent: 25,
    minimumOrder: 3000,
    expiryDate: '2026-06-30',
    status: 'Active',
    usageCount: 42,
  },
  {
    id: 'c4',
    code: 'PREMIUM500',
    fixedDiscount: 500,
    minimumOrder: 4000,
    expiryDate: '2026-12-31',
    status: 'Active',
    usageCount: 9,
  },
];

export const AdminCoupons: React.FC<AdminCouponsProps> = ({
  coupons,
  onAddCoupon,
  onUpdateCoupon,
  onDeleteCoupon,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCoupon, setEditingCoupon] = useState<Coupon | null>(null);

  // Form states
  const [code, setCode] = useState('');
  const [discountType, setDiscountType] = useState<'percent' | 'fixed'>('percent');
  const [discountValue, setDiscountValue] = useState<number>(10);
  const [minimumOrder, setMinimumOrder] = useState<number>(1000);
  const [expiryDate, setExpiryDate] = useState('2026-12-31');
  const [status, setStatus] = useState<'Active' | 'Inactive'>('Active');
  const [saving, setSaving] = useState(false);

  const displayCoupons = coupons.length > 0 ? coupons : DEFAULT_COUPONS;

  const filtered = displayCoupons.filter((c) =>
    c.code.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const openCreateModal = () => {
    setEditingCoupon(null);
    setCode('');
    setDiscountType('percent');
    setDiscountValue(10);
    setMinimumOrder(1000);
    setExpiryDate('2026-12-31');
    setStatus('Active');
    setIsModalOpen(true);
  };

  const openEditModal = (c: Coupon) => {
    setEditingCoupon(c);
    setCode(c.code);
    if (c.fixedDiscount) {
      setDiscountType('fixed');
      setDiscountValue(c.fixedDiscount);
    } else {
      setDiscountType('percent');
      setDiscountValue(c.discountPercent || 10);
    }
    setMinimumOrder(c.minimumOrder || 1000);
    setExpiryDate(c.expiryDate || '2026-12-31');
    setStatus(c.status || 'Active');
    setIsModalOpen(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const payload: any = {
        code: code.trim().toUpperCase(),
        minimumOrder: Number(minimumOrder),
        expiryDate,
        status,
        discountPercent: discountType === 'percent' ? Number(discountValue) : undefined,
        fixedDiscount: discountType === 'fixed' ? Number(discountValue) : undefined,
      };

      if (editingCoupon && editingCoupon.id) {
        await onUpdateCoupon(editingCoupon.id, payload);
      } else {
        await onAddCoupon(payload);
      }
      setIsModalOpen(false);
    } catch (err) {
      console.error('Error saving coupon:', err);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header & Controls */}
      <div className="bg-white p-5 rounded-2xl border border-[#ece7dc] shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-lg font-black uppercase tracking-tight text-[#111111]">
            Coupon &amp; Discount Codes ({displayCoupons.length})
          </h2>
          <p className="text-xs text-[#777777]">
            Validated securely through backend server logic during checkout
          </p>
        </div>
        <button
          type="button"
          onClick={openCreateModal}
          className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-[#111111] hover:bg-black text-white text-xs font-black tracking-wider uppercase transition shadow-sm cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          <span>Create Coupon</span>
        </button>
      </div>

      {/* Coupons Table */}
      <div className="bg-white rounded-2xl border border-[#ece7dc] shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="bg-[#f8f6f0] border-b border-[#ece7dc] text-[#666666] uppercase text-[10px] tracking-wider font-bold">
                <th className="p-3.5">Coupon Code</th>
                <th className="p-3.5">Discount Value</th>
                <th className="p-3.5">Minimum Order</th>
                <th className="p-3.5">Expiry Date</th>
                <th className="p-3.5 text-center">Status</th>
                <th className="p-3.5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#f3eee4]">
              {filtered.map((c) => (
                <tr key={c.id || c.code} className="hover:bg-[#faf8f3] transition">
                  <td className="p-3.5">
                    <span className="font-mono font-black text-sm text-[#111111] px-2.5 py-1 bg-[#f5f2eb] rounded-lg border border-[#e5e0d3]">
                      {c.code}
                    </span>
                  </td>
                  <td className="p-3.5 font-bold text-emerald-800 font-mono text-sm">
                    {c.discountPercent ? `${c.discountPercent}% OFF` : `৳${c.fixedDiscount} FLAT`}
                  </td>
                  <td className="p-3.5 font-mono text-[#555555]">
                    ৳{c.minimumOrder.toLocaleString()}
                  </td>
                  <td className="p-3.5 text-[#666666]">{c.expiryDate}</td>
                  <td className="p-3.5 text-center">
                    <button
                      type="button"
                      onClick={() => {
                        if (c.id) {
                          onUpdateCoupon(c.id, {
                            status: c.status === 'Active' ? 'Inactive' : 'Active',
                          });
                        }
                      }}
                      className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase cursor-pointer ${
                        c.status === 'Active'
                          ? 'bg-emerald-100 text-emerald-800'
                          : 'bg-gray-100 text-gray-700'
                      }`}
                    >
                      {c.status === 'Active' ? (
                        <CheckCircle2 className="w-3 h-3" />
                      ) : (
                        <XCircle className="w-3 h-3" />
                      )}
                      <span>{c.status}</span>
                    </button>
                  </td>
                  <td className="p-3.5 text-right">
                    <div className="flex items-center justify-end gap-1.5">
                      <button
                        type="button"
                        onClick={() => openEditModal(c)}
                        className="p-1.5 rounded-lg border border-[#e5e0d3] hover:bg-white text-[#555555] hover:text-black cursor-pointer"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          if (c.id && confirm(`Delete coupon "${c.code}"?`)) {
                            onDeleteCoupon(c.id);
                          }
                        }}
                        className="p-1.5 rounded-lg border border-red-200 hover:bg-red-50 text-red-600 cursor-pointer"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="relative w-full max-w-md bg-white rounded-3xl shadow-2xl p-6 sm:p-8 border border-[#e5e0d3] text-left">
            <div className="flex items-center justify-between pb-4 border-b border-[#f0eae0]">
              <h3 className="text-base font-black uppercase text-[#111111]">
                {editingCoupon ? 'Edit Coupon' : 'Create Coupon'}
              </h3>
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="p-1.5 rounded-lg hover:bg-gray-100 text-[#777777] cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSave} className="mt-4 space-y-4 text-xs">
              <div>
                <label className="font-bold text-[#333333] uppercase block mb-1">Coupon Code *</label>
                <input
                  type="text"
                  required
                  value={code}
                  onChange={(e) => setCode(e.target.value.toUpperCase())}
                  placeholder="e.g. WELCOME10"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-[#d1cbbe] font-mono font-bold uppercase"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-[#333333] uppercase block mb-1">Discount Type</label>
                  <select
                    value={discountType}
                    onChange={(e: any) => setDiscountType(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-[#d1cbbe] font-semibold"
                  >
                    <option value="percent">Percentage (%)</option>
                    <option value="fixed">Fixed Amount (৳)</option>
                  </select>
                </div>
                <div>
                  <label className="font-bold text-[#333333] uppercase block mb-1">Value *</label>
                  <input
                    type="number"
                    required
                    min={1}
                    value={discountValue}
                    onChange={(e) => setDiscountValue(Number(e.target.value))}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-[#d1cbbe] font-mono"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-[#333333] uppercase block mb-1">Min Order (৳) *</label>
                  <input
                    type="number"
                    required
                    min={0}
                    value={minimumOrder}
                    onChange={(e) => setMinimumOrder(Number(e.target.value))}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-[#d1cbbe] font-mono"
                  />
                </div>
                <div>
                  <label className="font-bold text-[#333333] uppercase block mb-1">Expiry Date</label>
                  <input
                    type="date"
                    required
                    value={expiryDate}
                    onChange={(e) => setExpiryDate(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-[#d1cbbe]"
                  />
                </div>
              </div>

              <div className="pt-3 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 rounded-xl border border-[#d5cfc0] font-bold text-[#555555]"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="px-5 py-2 rounded-xl bg-black text-white font-bold uppercase tracking-wider cursor-pointer"
                >
                  {saving ? 'Saving...' : 'Save Coupon'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
