import React, { useState } from 'react';
import { Product, ALLOWED_SIZES } from '../../types';
import {
  Package,
  AlertTriangle,
  CheckCircle,
  Plus,
  Minus,
  Save,
  Search,
  Layers,
  History,
} from 'lucide-react';

interface AdminInventoryProps {
  products: Product[];
  onUpdateStock: (productId: string | number, newStock: number) => Promise<void>;
}

export const AdminInventory: React.FC<AdminInventoryProps> = ({
  products,
  onUpdateStock,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [stockEdits, setStockEdits] = useState<Record<string, number>>({});
  const [savingId, setSavingId] = useState<string | number | null>(null);

  const totalStock = products.reduce((acc, p) => acc + (p.stock || 0), 0);
  const lowStock = products.filter((p) => p.stock > 0 && p.stock < 10);
  const outOfStock = products.filter((p) => p.stock === 0);

  const filtered = products.filter(
    (p) =>
      p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.category.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (p.sku && p.sku.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  const handleStockChange = (id: string | number, value: number) => {
    setStockEdits((prev) => ({
      ...prev,
      [String(id)]: Math.max(0, value),
    }));
  };

  const handleSaveStock = async (p: Product) => {
    const nextVal = stockEdits[String(p.id)] ?? p.stock;
    setSavingId(p.id);
    try {
      await onUpdateStock(p.id, nextVal);
      setStockEdits((prev) => {
        const next = { ...prev };
        delete next[String(p.id)];
        return next;
      });
    } finally {
      setSavingId(null);
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Inventory Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-[#ece7dc] shadow-sm flex items-center gap-4">
          <div className="p-3 bg-blue-50 text-blue-700 rounded-xl">
            <Package className="w-5 h-5" />
          </div>
          <div>
            <span className="text-xs font-bold uppercase tracking-wider text-[#777777] block">
              Total Stock Units
            </span>
            <span className="text-2xl font-black font-mono text-[#111111]">{totalStock}</span>
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-[#ece7dc] shadow-sm flex items-center gap-4">
          <div className="p-3 bg-amber-50 text-amber-700 rounded-xl">
            <AlertTriangle className="w-5 h-5" />
          </div>
          <div>
            <span className="text-xs font-bold uppercase tracking-wider text-[#777777] block">
              Low Stock Alerts
            </span>
            <span className="text-2xl font-black font-mono text-amber-700">
              {lowStock.length} items
            </span>
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-[#ece7dc] shadow-sm flex items-center gap-4">
          <div className="p-3 bg-red-50 text-red-700 rounded-xl">
            <AlertTriangle className="w-5 h-5" />
          </div>
          <div>
            <span className="text-xs font-bold uppercase tracking-wider text-[#777777] block">
              Out of Stock
            </span>
            <span className="text-2xl font-black font-mono text-red-700">
              {outOfStock.length} items
            </span>
          </div>
        </div>
      </div>

      {/* Warning Banners if applicable */}
      {outOfStock.length > 0 && (
        <div className="p-4 rounded-2xl bg-red-50 border border-red-200 text-red-800 text-xs flex items-center justify-between">
          <div className="flex items-center gap-2 font-semibold">
            <AlertTriangle className="w-4 h-4 shrink-0" />
            <span>
              {outOfStock.length} product(s) are completely out of stock and unavailable for customers to order.
            </span>
          </div>
        </div>
      )}

      {/* Search Bar */}
      <div className="bg-white p-4 rounded-2xl border border-[#ece7dc] shadow-sm flex items-center justify-between">
        <div className="relative w-full max-w-sm">
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search inventory by style or SKU..."
            className="w-full pl-9 pr-3 py-2 rounded-xl border border-[#d5cfc0] text-xs bg-[#fcfbf9] focus:bg-white"
          />
          <Search className="w-3.5 h-3.5 text-[#888888] absolute left-3 top-3" />
        </div>
        <span className="text-xs text-[#777777]">
          Showing {filtered.length} products
        </span>
      </div>

      {/* Stock Management Table */}
      <div className="bg-white rounded-2xl border border-[#ece7dc] shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="bg-[#f8f6f0] border-b border-[#ece7dc] text-[#666666] uppercase text-[10px] tracking-wider font-bold">
                <th className="p-3.5">Product &amp; SKU</th>
                <th className="p-3.5">Category</th>
                <th className="p-3.5 text-center">Available Sizes</th>
                <th className="p-3.5 text-center">Colors</th>
                <th className="p-3.5 text-center">Current Stock</th>
                <th className="p-3.5 text-center">Quick Adjust</th>
                <th className="p-3.5 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#f3eee4]">
              {filtered.map((p) => {
                const currentEdit = stockEdits[String(p.id)] ?? p.stock;
                const isChanged = currentEdit !== p.stock;
                const isOut = p.stock === 0;
                const isLow = p.stock > 0 && p.stock < 10;

                return (
                  <tr key={p.id} className="hover:bg-[#faf8f3] transition">
                    <td className="p-3.5">
                      <div className="flex items-center gap-3">
                        <img
                          src={p.image}
                          alt={p.name}
                          className="w-10 h-12 object-cover rounded-lg bg-gray-100 border border-[#e5e0d3] shrink-0"
                        />
                        <div>
                          <span className="font-bold text-sm text-[#111111] block">{p.name}</span>
                          <span className="text-[10px] font-mono text-[#888888]">
                            SKU: {p.sku || `CLT-${p.id}`}
                          </span>
                        </div>
                      </div>
                    </td>
                    <td className="p-3.5 font-semibold text-[#555555]">{p.category}</td>
                    <td className="p-3.5 text-center">
                      <div className="flex flex-wrap justify-center gap-1 max-w-[150px] mx-auto">
                        {p.sizes?.map((s) => (
                          <span
                            key={s}
                            className="px-1.5 py-0.5 bg-[#f0eae0] rounded text-[9px] font-mono font-bold text-[#333333]"
                          >
                            {s}
                          </span>
                        ))}
                      </div>
                    </td>
                    <td className="p-3.5 text-center">
                      <span className="text-[11px] text-[#555555]">
                        {p.colors?.join(', ') || 'Black'}
                      </span>
                    </td>
                    <td className="p-3.5 text-center">
                      <span
                        className={`inline-block px-2.5 py-1 rounded-full font-mono font-bold text-xs ${
                          isOut
                            ? 'bg-red-100 text-red-800'
                            : isLow
                            ? 'bg-amber-100 text-amber-800'
                            : 'bg-emerald-100 text-emerald-800'
                        }`}
                      >
                        {isOut ? 'Out of Stock (0)' : `${p.stock} units`}
                      </span>
                    </td>
                    <td className="p-3.5 text-center">
                      <div className="inline-flex items-center gap-1.5 bg-[#f7f5ee] p-1 rounded-xl border border-[#d5cfc0]">
                        <button
                          type="button"
                          onClick={() => handleStockChange(p.id, currentEdit - 5)}
                          className="p-1 rounded hover:bg-white text-[#555555] cursor-pointer"
                        >
                          <Minus className="w-3 h-3" />
                        </button>
                        <input
                          type="number"
                          min={0}
                          value={currentEdit}
                          onChange={(e) => handleStockChange(p.id, Number(e.target.value))}
                          className="w-14 text-center font-mono font-bold text-xs bg-transparent focus:outline-none"
                        />
                        <button
                          type="button"
                          onClick={() => handleStockChange(p.id, currentEdit + 5)}
                          className="p-1 rounded hover:bg-white text-[#555555] cursor-pointer"
                        >
                          <Plus className="w-3 h-3" />
                        </button>
                      </div>
                    </td>
                    <td className="p-3.5 text-right">
                      {isChanged ? (
                        <button
                          type="button"
                          disabled={savingId === p.id}
                          onClick={() => handleSaveStock(p)}
                          className="px-3 py-1.5 rounded-lg bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-xs flex items-center gap-1 ml-auto shadow-xs cursor-pointer"
                        >
                          <Save className="w-3 h-3" />
                          <span>{savingId === p.id ? 'Saving...' : 'Save'}</span>
                        </button>
                      ) : (
                        <span className="text-[11px] text-emerald-700 font-semibold flex items-center justify-end gap-1">
                          <CheckCircle className="w-3.5 h-3.5" />
                          <span>Synced</span>
                        </span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
