import React, { useState } from 'react';
import { ProductReview } from '../../types';
import { Star, CheckCircle2, EyeOff, Trash2, Search } from 'lucide-react';

interface AdminReviewsProps {
  reviews: ProductReview[];
  onUpdateStatus: (id: string, status: 'Approved' | 'Pending' | 'Hidden') => Promise<void>;
  onDeleteReview: (id: string) => Promise<void>;
}

// Default reviews if collection is initializing
const DEFAULT_REVIEWS: ProductReview[] = [
  {
    id: 'r1',
    productId: 1,
    productName: 'Urban Black Baggy',
    customerName: 'Rahim Chowdhury',
    rating: 5,
    review: 'Incredible heavyweight cotton. The drape over my retro sneakers is exactly what I was looking for. Will definitely order again.',
    createdAt: null,
    status: 'Approved',
  },
  {
    id: 'r2',
    productId: 2,
    productName: 'Classic Formal Black',
    customerName: 'Tanvir Hasan',
    rating: 5,
    review: 'Best formal pants for office and weddings. The crease stays sharp even after full day wear. Extended tab closure is very high-end.',
    createdAt: null,
    status: 'Approved',
  },
  {
    id: 'r3',
    productId: 3,
    productName: 'Premium Wide-Leg Cream',
    customerName: 'Fahim Rahman',
    rating: 4,
    review: 'The ecru cream color is rich and elegant. Sizing is true to waist. Delivered in 48 hours.',
    createdAt: null,
    status: 'Approved',
  },
];

export const AdminReviews: React.FC<AdminReviewsProps> = ({
  reviews,
  onUpdateStatus,
  onDeleteReview,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('All');

  const displayReviews = reviews.length > 0 ? reviews : DEFAULT_REVIEWS;

  const filtered = displayReviews.filter((r) => {
    const matchesSearch =
      r.customerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      r.productName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      r.review.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'All' || r.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  return (
    <div className="space-y-6">
      {/* Header & Controls */}
      <div className="bg-white p-5 rounded-2xl border border-[#ece7dc] shadow-sm space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h2 className="text-lg font-black uppercase tracking-tight text-[#111111]">
              Customer Reviews Moderation ({displayReviews.length})
            </h2>
            <p className="text-xs text-[#777777]">
              Approve authentic customer ratings &amp; feedback to display on product detail pages
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
          <div className="relative">
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search by customer, product or comment..."
              className="w-full pl-9 pr-3 py-2 rounded-xl border border-[#d5cfc0] text-xs bg-[#fcfbf9] focus:bg-white"
            />
            <Search className="w-3.5 h-3.5 text-[#888888] absolute left-3 top-3" />
          </div>

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="w-full px-3 py-2 rounded-xl border border-[#d5cfc0] text-xs bg-[#fcfbf9] text-[#111111] font-semibold"
          >
            <option value="All">All Reviews</option>
            <option value="Approved">Approved</option>
            <option value="Pending">Pending Moderation</option>
            <option value="Hidden">Hidden</option>
          </select>
        </div>
      </div>

      {/* Reviews Table */}
      <div className="bg-white rounded-2xl border border-[#ece7dc] shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="bg-[#f8f6f0] border-b border-[#ece7dc] text-[#666666] uppercase text-[10px] tracking-wider font-bold">
                <th className="p-3.5">Customer &amp; Product</th>
                <th className="p-3.5">Rating</th>
                <th className="p-3.5">Feedback / Review</th>
                <th className="p-3.5 text-center">Status</th>
                <th className="p-3.5 text-right">Moderation Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#f3eee4]">
              {filtered.map((r, i) => (
                <tr key={r.id || i} className="hover:bg-[#faf8f3] transition">
                  <td className="p-3.5">
                    <span className="font-bold text-sm text-[#111111] block">
                      {r.customerName}
                    </span>
                    <span className="text-[11px] text-[#777777] font-medium block">
                      Product: {r.productName}
                    </span>
                  </td>
                  <td className="p-3.5">
                    <div className="flex items-center gap-1 text-amber-500">
                      {Array.from({ length: 5 }).map((_, idx) => (
                        <Star
                          key={idx}
                          className={`w-3.5 h-3.5 ${
                            idx < r.rating ? 'fill-current' : 'text-gray-300'
                          }`}
                        />
                      ))}
                    </div>
                  </td>
                  <td className="p-3.5 max-w-md text-[#444444] leading-relaxed">
                    "{r.review}"
                  </td>
                  <td className="p-3.5 text-center">
                    <span
                      className={`inline-block px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                        r.status === 'Approved'
                          ? 'bg-emerald-100 text-emerald-800'
                          : r.status === 'Pending'
                          ? 'bg-amber-100 text-amber-800'
                          : 'bg-gray-100 text-gray-700'
                      }`}
                    >
                      {r.status || 'Approved'}
                    </span>
                  </td>
                  <td className="p-3.5 text-right">
                    <div className="flex items-center justify-end gap-1.5">
                      {r.status !== 'Approved' && r.id && (
                        <button
                          type="button"
                          onClick={() => onUpdateStatus(r.id!, 'Approved')}
                          className="px-2.5 py-1 rounded-lg bg-emerald-50 text-emerald-800 border border-emerald-200 font-bold hover:bg-emerald-100 transition cursor-pointer"
                        >
                          Approve
                        </button>
                      )}
                      {r.status === 'Approved' && r.id && (
                        <button
                          type="button"
                          onClick={() => onUpdateStatus(r.id!, 'Hidden')}
                          className="px-2.5 py-1 rounded-lg bg-gray-100 text-gray-700 border border-gray-200 font-bold hover:bg-gray-200 transition cursor-pointer"
                        >
                          Hide
                        </button>
                      )}
                      {r.id && (
                        <button
                          type="button"
                          onClick={() => {
                            if (confirm('Delete this review permanently?')) {
                              onDeleteReview(r.id!);
                            }
                          }}
                          className="p-1 rounded-lg border border-red-200 hover:bg-red-50 text-red-600 transition cursor-pointer"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
