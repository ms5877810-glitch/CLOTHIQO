import React from 'react';
import { Product, ALLOWED_CATEGORIES } from '../../types';
import { Layers, Package, ArrowRight, Tag, Sparkles } from 'lucide-react';

interface AdminCategoriesProps {
  products: Product[];
  onSelectCategory?: (category: string) => void;
}

export const AdminCategories: React.FC<AdminCategoriesProps> = ({
  products,
  onSelectCategory,
}) => {
  const categoryStats = ALLOWED_CATEGORIES.map((cat) => {
    const categoryProducts = products.filter((p) => p.category === cat);
    const totalStock = categoryProducts.reduce((sum, p) => sum + (p.stock || 0), 0);
    const avgPrice = categoryProducts.length
      ? Math.round(
          categoryProducts.reduce((sum, p) => sum + (p.price || 0), 0) /
            categoryProducts.length
        )
      : 0;
    const sampleImages = categoryProducts.slice(0, 3).map((p) => p.image);

    return {
      name: cat,
      count: categoryProducts.length,
      totalStock,
      avgPrice,
      sampleImages,
      badge:
        cat === 'Baggy Pants'
          ? 'Streetwear & Oversized'
          : cat === 'Formal Pants'
          ? 'Tailored & Office'
          : 'Contemporary Drape',
    };
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white p-5 rounded-2xl border border-[#ece7dc] shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-lg font-black uppercase tracking-tight text-[#111111] flex items-center gap-2">
            <Layers className="w-5 h-5 text-amber-900" />
            <span>Product Categories</span>
          </h2>
          <p className="text-xs text-[#777777] mt-0.5">
            Manage trouser product taxonomy, active lines, and inventory distribution
          </p>
        </div>
      </div>

      {/* Category Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        {categoryStats.map((item) => (
          <div
            key={item.name}
            className="bg-white rounded-2xl border border-[#ece7dc] p-6 shadow-xs hover:border-[#111111] transition flex flex-col justify-between"
          >
            <div>
              <div className="flex items-center justify-between mb-3">
                <span className="px-2.5 py-0.5 rounded-full bg-[#f8f6f0] border border-[#ece7dc] text-[10px] font-extrabold uppercase tracking-wide text-[#444444]">
                  {item.badge}
                </span>
                <span className="text-xs font-bold text-[#111111]">
                  {item.count} Products
                </span>
              </div>

              <h3 className="text-lg font-black text-[#111111] uppercase tracking-tight">
                {item.name}
              </h3>

              {/* Sample Product Images */}
              <div className="flex items-center gap-2 my-4">
                {item.sampleImages.length > 0 ? (
                  item.sampleImages.map((img, idx) => (
                    <img
                      key={idx}
                      src={img}
                      alt={item.name}
                      className="w-14 h-14 rounded-xl object-cover border border-[#e5e7eb]"
                    />
                  ))
                ) : (
                  <div className="w-14 h-14 rounded-xl bg-[#f8f6f0] border border-[#ece7dc] flex items-center justify-center text-xs text-[#888888]">
                    No items
                  </div>
                )}
              </div>

              {/* Stats */}
              <div className="space-y-2 py-3 border-t border-[#f0eae0] text-xs">
                <div className="flex justify-between text-[#666666]">
                  <span>Total In-Stock:</span>
                  <span className="font-bold text-[#111111] font-mono">
                    {item.totalStock} units
                  </span>
                </div>
                <div className="flex justify-between text-[#666666]">
                  <span>Average Price:</span>
                  <span className="font-bold text-[#111111] font-mono">
                    ৳{item.avgPrice.toLocaleString()}
                  </span>
                </div>
              </div>
            </div>

            {onSelectCategory && (
              <button
                type="button"
                onClick={() => onSelectCategory(item.name)}
                className="mt-4 w-full py-2.5 px-3 rounded-xl bg-[#faf8f4] hover:bg-[#111111] hover:text-white border border-[#d5cfc0] hover:border-black text-xs font-bold transition flex items-center justify-center gap-1.5 cursor-pointer text-[#333333]"
              >
                <span>View Products</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};
