import React, { useState } from 'react';
import {
  Product,
  AllowedCategory,
  ALLOWED_CATEGORIES,
  ALLOWED_SIZES,
} from '../../types';
import {
  Search,
  Plus,
  Edit2,
  Trash2,
  Eye,
  Check,
  X,
  Sparkles,
  Layers,
  ChevronLeft,
  ChevronRight,
  Upload,
} from 'lucide-react';

interface AdminProductsProps {
  products: Product[];
  onAddProduct: (productData: Partial<Product>) => Promise<void>;
  onUpdateProduct: (id: string | number, updates: Partial<Product>) => Promise<void>;
  onDeleteProduct: (id: string | number) => Promise<void>;
  onBulkDelete: (ids: (string | number)[]) => Promise<void>;
  initialOpenModal?: boolean;
}

export const AdminProducts: React.FC<AdminProductsProps> = ({
  products,
  onAddProduct,
  onUpdateProduct,
  onDeleteProduct,
  onBulkDelete,
  initialOpenModal = false,
}) => {
  // Search, Filter, Sort, Pagination
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<string>('All');
  const [statusFilter, setStatusFilter] = useState<string>('All');
  const [sortBy, setSortBy] = useState<'newest' | 'price-asc' | 'price-desc' | 'stock'>('newest');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 6;

  // Selection for bulk delete
  const [selectedIds, setSelectedIds] = useState<Set<string | number>>(new Set());

  // Modal states
  const [isModalOpen, setIsModalOpen] = useState(initialOpenModal);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [previewProduct, setPreviewProduct] = useState<Product | null>(null);
  const [saving, setSaving] = useState(false);

  // Form states
  const [name, setName] = useState('');
  const [category, setCategory] = useState<AllowedCategory>('Baggy Pants');
  const [price, setPrice] = useState<number>(1890);
  const [discountPrice, setDiscountPrice] = useState<number | undefined>(undefined);
  const [sku, setSku] = useState('');
  const [description, setDescription] = useState('');
  const [fabric, setFabric] = useState('');
  const [stock, setStock] = useState<number>(25);
  const [imageUrl, setImageUrl] = useState('');
  const [additionalImages, setAdditionalImages] = useState<string[]>([]);
  const [newImageInput, setNewImageInput] = useState('');
  const [selectedSizes, setSelectedSizes] = useState<string[]>(['28', '30', '32', '34', '36']);
  const [selectedColors, setSelectedColors] = useState<string[]>(['Black']);
  const [newColorInput, setNewColorInput] = useState('');
  const [featured, setFeatured] = useState(false);
  const [bestseller, setBestseller] = useState(false);
  const [sale, setSale] = useState(false);
  const [status, setStatus] = useState<'Active' | 'Draft' | 'Out of Stock'>('Active');

  const openCreateModal = () => {
    setEditingProduct(null);
    setName('');
    setCategory('Baggy Pants');
    setPrice(1890);
    setDiscountPrice(undefined);
    setSku(`CLT-${Math.floor(1000 + Math.random() * 9000)}`);
    setDescription('');
    setFabric('340 GSM Heavy Cotton Twill');
    setStock(25);
    setImageUrl('https://images.unsplash.com/photo-1541099649105-f69ad21f3246?auto=format&fit=crop&w=900&q=80');
    setAdditionalImages([]);
    setSelectedSizes(['28', '30', '32', '34', '36']);
    setSelectedColors(['Black']);
    setFeatured(false);
    setBestseller(false);
    setSale(false);
    setStatus('Active');
    setIsModalOpen(true);
  };

  const openEditModal = (p: Product) => {
    setEditingProduct(p);
    setName(p.name);
    setCategory(p.category);
    setPrice(p.price);
    setDiscountPrice(p.discountPrice);
    setSku(p.sku || `CLT-${p.id}`);
    setDescription(p.description);
    setFabric(p.fabric || 'Premium Textile');
    setStock(p.stock);
    setImageUrl(p.image);
    setAdditionalImages(p.images || []);
    setSelectedSizes(p.sizes || ['30', '32', '34']);
    setSelectedColors(p.colors || ['Black']);
    setFeatured(!!p.featured);
    setBestseller(!!p.bestseller);
    setSale(!!p.sale);
    setStatus(p.status || (p.stock === 0 ? 'Out of Stock' : 'Active'));
    setIsModalOpen(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const productPayload: Partial<Product> = {
        name: name.trim(),
        category,
        price: Number(price),
        discountPrice: discountPrice ? Number(discountPrice) : undefined,
        sku: sku.trim(),
        description: description.trim(),
        fabric: fabric.trim(),
        stock: Number(stock),
        image: imageUrl.trim() || 'https://images.unsplash.com/photo-1541099649105-f69ad21f3246?auto=format&fit=crop&w=900&q=80',
        images: additionalImages,
        sizes: selectedSizes,
        colors: selectedColors,
        featured,
        bestseller,
        sale,
        status,
      };

      if (editingProduct) {
        await onUpdateProduct(editingProduct.id, productPayload);
      } else {
        await onAddProduct(productPayload);
      }
      setIsModalOpen(false);
    } catch (err) {
      console.error('Error saving product:', err);
    } finally {
      setSaving(false);
    }
  };

  // Filtered and Sorted list
  const filteredProducts = products.filter((p) => {
    const matchesSearch =
      p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (p.sku && p.sku.toLowerCase().includes(searchTerm.toLowerCase())) ||
      p.category.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = categoryFilter === 'All' || p.category === categoryFilter;
    const matchesStatus =
      statusFilter === 'All' ||
      (statusFilter === 'Active' && p.status !== 'Draft' && p.stock > 0) ||
      (statusFilter === 'Out of Stock' && p.stock === 0) ||
      (statusFilter === 'Draft' && p.status === 'Draft');

    return matchesSearch && matchesCategory && matchesStatus;
  });

  const sortedProducts = [...filteredProducts].sort((a, b) => {
    if (sortBy === 'price-asc') return a.price - b.price;
    if (sortBy === 'price-desc') return b.price - a.price;
    if (sortBy === 'stock') return a.stock - b.stock;
    return 0; // default Firestore order / catalog order
  });

  const totalPages = Math.ceil(sortedProducts.length / itemsPerPage) || 1;
  const paginatedProducts = sortedProducts.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const toggleSelectAll = () => {
    if (selectedIds.size === paginatedProducts.length && paginatedProducts.length > 0) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(paginatedProducts.map((p) => p.id)));
    }
  };

  const toggleSelectOne = (id: string | number) => {
    const next = new Set(selectedIds);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    setSelectedIds(next);
  };

  return (
    <div className="space-y-6">
      {/* Top Header & Search Filters */}
      <div className="bg-white p-5 rounded-2xl border border-[#ece7dc] shadow-sm space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h2 className="text-lg font-black uppercase tracking-tight text-[#111111]">
              Product Catalog ({products.length})
            </h2>
            <p className="text-xs text-[#777777]">
              Manage styles, pricing, images, sizes, stock, and promotional tags
            </p>
          </div>
          <div className="flex items-center gap-2">
            {selectedIds.size > 0 && (
              <button
                type="button"
                onClick={() => {
                  if (confirm(`Delete ${selectedIds.size} selected products?`)) {
                    onBulkDelete(Array.from(selectedIds));
                    setSelectedIds(new Set());
                  }
                }}
                className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-red-600 hover:bg-red-700 text-white text-xs font-bold transition shadow-sm cursor-pointer"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Delete Selected ({selectedIds.size})</span>
              </button>
            )}
            <button
              type="button"
              onClick={openCreateModal}
              className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-[#111111] hover:bg-black text-white text-xs font-black tracking-wider uppercase transition shadow-sm cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>Add Product</span>
            </button>
          </div>
        </div>

        {/* Filter Controls Bar */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3 pt-2">
          {/* Search */}
          <div className="relative">
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value);
                setCurrentPage(1);
              }}
              placeholder="Search product name, SKU..."
              className="w-full pl-9 pr-3 py-2 rounded-xl border border-[#d5cfc0] text-xs bg-[#fcfbf9] focus:bg-white focus:outline-none focus:ring-1 focus:ring-black"
            />
            <Search className="w-3.5 h-3.5 text-[#888888] absolute left-3 top-3" />
          </div>

          {/* Category Filter */}
          <select
            value={categoryFilter}
            onChange={(e) => {
              setCategoryFilter(e.target.value);
              setCurrentPage(1);
            }}
            className="w-full px-3 py-2 rounded-xl border border-[#d5cfc0] text-xs bg-[#fcfbf9] text-[#111111] font-semibold cursor-pointer"
          >
            <option value="All">All Categories</option>
            {ALLOWED_CATEGORIES.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>

          {/* Status Filter */}
          <select
            value={statusFilter}
            onChange={(e) => {
              setStatusFilter(e.target.value);
              setCurrentPage(1);
            }}
            className="w-full px-3 py-2 rounded-xl border border-[#d5cfc0] text-xs bg-[#fcfbf9] text-[#111111] font-semibold cursor-pointer"
          >
            <option value="All">All Statuses</option>
            <option value="Active">Active / In Stock</option>
            <option value="Out of Stock">Out of Stock</option>
            <option value="Draft">Draft</option>
          </select>

          {/* Sort By */}
          <select
            value={sortBy}
            onChange={(e: any) => setSortBy(e.target.value)}
            className="w-full px-3 py-2 rounded-xl border border-[#d5cfc0] text-xs bg-[#fcfbf9] text-[#111111] font-semibold cursor-pointer"
          >
            <option value="newest">Sort: Catalog Order</option>
            <option value="price-asc">Price: Low to High</option>
            <option value="price-desc">Price: High to Low</option>
            <option value="stock">Stock: Lowest First</option>
          </select>
        </div>
      </div>

      {/* Products Table */}
      <div className="bg-white rounded-2xl border border-[#ece7dc] shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="bg-[#f8f6f0] border-b border-[#ece7dc] text-[#666666] uppercase text-[10px] tracking-wider font-bold">
                <th className="p-3.5 text-center w-10">
                  <input
                    type="checkbox"
                    checked={
                      selectedIds.size === paginatedProducts.length &&
                      paginatedProducts.length > 0
                    }
                    onChange={toggleSelectAll}
                    className="rounded border-[#d5cfc0] cursor-pointer"
                  />
                </th>
                <th className="p-3.5">Product</th>
                <th className="p-3.5">Category</th>
                <th className="p-3.5">Price</th>
                <th className="p-3.5 text-center">Stock</th>
                <th className="p-3.5 text-center">Status</th>
                <th className="p-3.5 text-center">Badges</th>
                <th className="p-3.5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#f3eee4]">
              {paginatedProducts.length === 0 ? (
                <tr>
                  <td colSpan={8} className="p-8 text-center text-xs text-[#888888]">
                    No products matched your search or filters.
                  </td>
                </tr>
              ) : (
                paginatedProducts.map((p) => {
                  const isSelected = selectedIds.has(p.id);
                  const isOutOfStock = p.stock === 0;
                  const isLowStock = p.stock > 0 && p.stock < 10;

                  return (
                    <tr
                      key={p.id}
                      className={`hover:bg-[#faf8f3] transition ${
                        isSelected ? 'bg-amber-50/50' : ''
                      }`}
                    >
                      <td className="p-3.5 text-center">
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={() => toggleSelectOne(p.id)}
                          className="rounded border-[#d5cfc0] cursor-pointer"
                        />
                      </td>
                      <td className="p-3.5">
                        <div className="flex items-center gap-3">
                          <img
                            src={p.image}
                            alt={p.name}
                            className="w-12 h-14 object-cover rounded-lg bg-gray-100 border border-[#e5e0d3] shrink-0"
                          />
                          <div>
                            <span className="font-bold text-sm text-[#111111] block">
                              {p.name}
                            </span>
                            <span className="text-[10px] font-mono text-[#888888]">
                              SKU: {p.sku || `CLT-${p.id}`}
                            </span>
                          </div>
                        </div>
                      </td>
                      <td className="p-3.5 font-semibold text-[#444444]">
                        {p.category}
                      </td>
                      <td className="p-3.5">
                        <span className="font-mono font-bold text-sm text-[#111111] block">
                          ৳{p.price.toLocaleString()}
                        </span>
                        {p.discountPrice && (
                          <span className="font-mono text-[10px] text-red-600 line-through">
                            ৳{p.discountPrice.toLocaleString()}
                          </span>
                        )}
                      </td>
                      <td className="p-3.5 text-center">
                        <span
                          className={`inline-block px-2 py-0.5 rounded font-mono font-bold text-xs ${
                            isOutOfStock
                              ? 'bg-red-100 text-red-700'
                              : isLowStock
                              ? 'bg-amber-100 text-amber-700'
                              : 'bg-emerald-50 text-emerald-800'
                          }`}
                        >
                          {p.stock}
                        </span>
                      </td>
                      <td className="p-3.5 text-center">
                        <span
                          className={`inline-block px-2.5 py-1 rounded-full text-[10px] font-bold uppercase ${
                            isOutOfStock
                              ? 'bg-red-100 text-red-800'
                              : p.status === 'Draft'
                              ? 'bg-gray-100 text-gray-700'
                              : 'bg-emerald-100 text-emerald-800'
                          }`}
                        >
                          {isOutOfStock ? 'Out of Stock' : (p.status || 'Active')}
                        </span>
                      </td>
                      <td className="p-3.5 text-center">
                        <div className="flex items-center justify-center gap-1">
                          {p.featured && (
                            <span className="px-1.5 py-0.5 rounded bg-purple-100 text-purple-800 text-[9px] font-bold uppercase">
                              Featured
                            </span>
                          )}
                          {p.bestseller && (
                            <span className="px-1.5 py-0.5 rounded bg-blue-100 text-blue-800 text-[9px] font-bold uppercase">
                              Best
                            </span>
                          )}
                          {p.sale && (
                            <span className="px-1.5 py-0.5 rounded bg-rose-100 text-rose-800 text-[9px] font-bold uppercase">
                              Sale
                            </span>
                          )}
                          {!p.featured && !p.bestseller && !p.sale && (
                            <span className="text-[#aaaaaa] text-[10px]">—</span>
                          )}
                        </div>
                      </td>
                      <td className="p-3.5 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            type="button"
                            onClick={() => setPreviewProduct(p)}
                            title="Preview Product"
                            className="p-1.5 rounded-lg border border-[#e5e0d3] hover:bg-white text-[#555555] hover:text-black transition cursor-pointer"
                          >
                            <Eye className="w-3.5 h-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={() => openEditModal(p)}
                            title="Edit Product"
                            className="p-1.5 rounded-lg border border-[#e5e0d3] hover:bg-white text-[#555555] hover:text-black transition cursor-pointer"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              if (confirm(`Are you sure you want to delete "${p.name}"?`)) {
                                onDeleteProduct(p.id);
                              }
                            }}
                            title="Delete Product"
                            className="p-1.5 rounded-lg border border-red-200 hover:bg-red-50 text-red-600 transition cursor-pointer"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Bar */}
        <div className="p-4 border-t border-[#ece7dc] bg-[#fdfcf9] flex items-center justify-between text-xs">
          <span className="text-[#777777]">
            Showing page {currentPage} of {totalPages} ({filteredProducts.length} items)
          </span>
          <div className="flex items-center gap-1.5">
            <button
              type="button"
              disabled={currentPage === 1}
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              className="p-1.5 rounded-lg border border-[#d5cfc0] bg-white disabled:opacity-40 hover:bg-gray-50 cursor-pointer"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <span className="px-2 font-mono font-bold text-[#111111]">{currentPage}</span>
            <button
              type="button"
              disabled={currentPage === totalPages}
              onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
              className="p-1.5 rounded-lg border border-[#d5cfc0] bg-white disabled:opacity-40 hover:bg-gray-50 cursor-pointer"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Add / Edit Product Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs overflow-y-auto">
          <div className="relative w-full max-w-2xl bg-white rounded-3xl shadow-2xl p-6 sm:p-8 border border-[#e5e0d3] my-8 text-left max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-4 border-b border-[#f0eae0]">
              <h3 className="text-base font-black uppercase tracking-tight text-[#111111]">
                {editingProduct ? 'Edit Product' : 'Add New Trouser / Product'}
              </h3>
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="p-1.5 rounded-lg hover:bg-gray-100 text-[#777777] cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSave} className="mt-5 space-y-4 text-xs">
              {/* Name & SKU */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="font-bold text-[#333333] uppercase tracking-wider block mb-1">
                    Product Name *
                  </label>
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="e.g. Urban Black Baggy"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-[#d1cbbe] bg-[#fdfcf9] font-medium"
                  />
                </div>
                <div>
                  <label className="font-bold text-[#333333] uppercase tracking-wider block mb-1">
                    SKU Code
                  </label>
                  <input
                    type="text"
                    value={sku}
                    onChange={(e) => setSku(e.target.value)}
                    placeholder="CLT-1890"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-[#d1cbbe] bg-[#fdfcf9] font-mono"
                  />
                </div>
              </div>

              {/* Category, Price, Discount Price */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="font-bold text-[#333333] uppercase tracking-wider block mb-1">
                    Category *
                  </label>
                  <select
                    value={category}
                    onChange={(e: any) => setCategory(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-[#d1cbbe] bg-[#fdfcf9] font-semibold"
                  >
                    {ALLOWED_CATEGORIES.map((cat) => (
                      <option key={cat} value={cat}>
                        {cat}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="font-bold text-[#333333] uppercase tracking-wider block mb-1">
                    Price (৳) *
                  </label>
                  <input
                    type="number"
                    required
                    min={0}
                    value={price}
                    onChange={(e) => setPrice(Number(e.target.value))}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-[#d1cbbe] bg-[#fdfcf9] font-mono"
                  />
                </div>
                <div>
                  <label className="font-bold text-[#333333] uppercase tracking-wider block mb-1">
                    Discount Price (৳)
                  </label>
                  <input
                    type="number"
                    min={0}
                    value={discountPrice || ''}
                    onChange={(e) =>
                      setDiscountPrice(e.target.value ? Number(e.target.value) : undefined)
                    }
                    placeholder="Optional original price"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-[#d1cbbe] bg-[#fdfcf9] font-mono"
                  />
                </div>
              </div>

              {/* Stock & Status */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="font-bold text-[#333333] uppercase tracking-wider block mb-1">
                    Stock Quantity *
                  </label>
                  <input
                    type="number"
                    required
                    min={0}
                    value={stock}
                    onChange={(e) => setStock(Number(e.target.value))}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-[#d1cbbe] bg-[#fdfcf9] font-mono"
                  />
                </div>
                <div>
                  <label className="font-bold text-[#333333] uppercase tracking-wider block mb-1">
                    Status
                  </label>
                  <select
                    value={status}
                    onChange={(e: any) => setStatus(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-[#d1cbbe] bg-[#fdfcf9] font-semibold"
                  >
                    <option value="Active">Active (Visible)</option>
                    <option value="Draft">Draft (Hidden)</option>
                    <option value="Out of Stock">Out of Stock</option>
                  </select>
                </div>
              </div>

              {/* Image URL & Multiple Images */}
              <div>
                <label className="font-bold text-[#333333] uppercase tracking-wider block mb-1">
                  Primary Image URL *
                </label>
                <input
                  type="url"
                  required
                  value={imageUrl}
                  onChange={(e) => setImageUrl(e.target.value)}
                  placeholder="https://images.unsplash.com/..."
                  className="w-full px-3.5 py-2.5 rounded-xl border border-[#d1cbbe] bg-[#fdfcf9] font-mono text-xs"
                />
              </div>

              {/* Additional Gallery Images */}
              <div>
                <label className="font-bold text-[#333333] uppercase tracking-wider block mb-1">
                  Additional Gallery Images
                </label>
                <div className="flex gap-2 mb-2">
                  <input
                    type="url"
                    value={newImageInput}
                    onChange={(e) => setNewImageInput(e.target.value)}
                    placeholder="Add another image URL..."
                    className="flex-1 px-3 py-2 rounded-xl border border-[#d1cbbe] text-xs bg-[#fdfcf9]"
                  />
                  <button
                    type="button"
                    onClick={() => {
                      if (newImageInput.trim()) {
                        setAdditionalImages([...additionalImages, newImageInput.trim()]);
                        setNewImageInput('');
                      }
                    }}
                    className="px-3 py-2 rounded-xl bg-black text-white font-bold text-xs"
                  >
                    + Add
                  </button>
                </div>
                {additionalImages.length > 0 && (
                  <div className="flex flex-wrap gap-2">
                    {additionalImages.map((img, i) => (
                      <div
                        key={i}
                        className="relative group w-14 h-14 rounded-lg overflow-hidden border border-[#d1cbbe]"
                      >
                        <img src={img} alt="" className="w-full h-full object-cover" />
                        <button
                          type="button"
                          onClick={() =>
                            setAdditionalImages(additionalImages.filter((_, idx) => idx !== i))
                          }
                          className="absolute inset-0 bg-black/60 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition"
                        >
                          <X className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Sizes Available */}
              <div>
                <label className="font-bold text-[#333333] uppercase tracking-wider block mb-1.5">
                  Sizes Available
                </label>
                <div className="flex flex-wrap gap-2">
                  {ALLOWED_SIZES.map((sz) => {
                    const isChecked = selectedSizes.includes(sz);
                    return (
                      <button
                        key={sz}
                        type="button"
                        onClick={() => {
                          if (isChecked) {
                            setSelectedSizes(selectedSizes.filter((s) => s !== sz));
                          } else {
                            setSelectedSizes([...selectedSizes, sz]);
                          }
                        }}
                        className={`px-3 py-1.5 rounded-lg border font-mono font-bold transition cursor-pointer ${
                          isChecked
                            ? 'bg-black text-white border-black'
                            : 'bg-[#f7f5ee] text-[#555555] border-[#d5cfc0]'
                        }`}
                      >
                        {sz}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Description & Fabric */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="font-bold text-[#333333] uppercase tracking-wider block mb-1">
                    Fabric &amp; Composition
                  </label>
                  <input
                    type="text"
                    value={fabric}
                    onChange={(e) => setFabric(e.target.value)}
                    placeholder="340 GSM Heavy Cotton Twill"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-[#d1cbbe] bg-[#fdfcf9]"
                  />
                </div>
                <div>
                  <label className="font-bold text-[#333333] uppercase tracking-wider block mb-1">
                    Description
                  </label>
                  <textarea
                    rows={2}
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="Details, fit, pocket construction..."
                    className="w-full px-3.5 py-2 rounded-xl border border-[#d1cbbe] bg-[#fdfcf9]"
                  />
                </div>
              </div>

              {/* Promotional Badges */}
              <div className="p-3.5 rounded-xl bg-[#f8f6f0] border border-[#e5e0d3] flex flex-wrap items-center gap-6">
                <label className="flex items-center gap-2 cursor-pointer font-bold text-xs text-[#222222]">
                  <input
                    type="checkbox"
                    checked={featured}
                    onChange={(e) => setFeatured(e.target.checked)}
                    className="rounded border-[#d1cbbe]"
                  />
                  <span>Featured Collection</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer font-bold text-xs text-[#222222]">
                  <input
                    type="checkbox"
                    checked={bestseller}
                    onChange={(e) => setBestseller(e.target.checked)}
                    className="rounded border-[#d1cbbe]"
                  />
                  <span>Bestseller</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer font-bold text-xs text-[#222222]">
                  <input
                    type="checkbox"
                    checked={sale}
                    onChange={(e) => setSale(e.target.checked)}
                    className="rounded border-[#d1cbbe]"
                  />
                  <span>On Sale</span>
                </label>
              </div>

              {/* Submit / Cancel Buttons */}
              <div className="pt-4 border-t border-[#f0eae0] flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-5 py-2.5 rounded-xl border border-[#d5cfc0] font-bold text-[#555555] hover:bg-gray-50 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="px-6 py-2.5 rounded-xl bg-[#111111] hover:bg-black text-white font-bold uppercase tracking-wider cursor-pointer disabled:opacity-50"
                >
                  {saving ? 'Saving...' : editingProduct ? 'Update Product' : 'Create Product'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Product Preview Modal */}
      {previewProduct && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="relative w-full max-w-md bg-white rounded-3xl shadow-2xl p-6 border border-[#e5e0d3] text-left">
            <button
              type="button"
              onClick={() => setPreviewProduct(null)}
              className="absolute top-4 right-4 p-1.5 rounded-lg hover:bg-gray-100 text-[#777777] cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
            <img
              src={previewProduct.image}
              alt={previewProduct.name}
              className="w-full h-72 object-cover rounded-2xl bg-gray-100 border border-[#e5e0d3] mb-4"
            />
            <span className="text-[10px] font-bold uppercase tracking-widest text-[#777777] block">
              {previewProduct.category}
            </span>
            <h3 className="text-xl font-black text-[#111111] mt-0.5">{previewProduct.name}</h3>
            <div className="flex items-center gap-3 mt-2">
              <span className="text-lg font-black font-mono text-[#111111]">
                ৳{previewProduct.price.toLocaleString()}
              </span>
              <span className="text-xs font-semibold px-2 py-0.5 rounded bg-emerald-50 text-emerald-800">
                Stock: {previewProduct.stock}
              </span>
            </div>
            <p className="text-xs text-[#666666] mt-3 leading-relaxed">
              {previewProduct.description || 'Premium trousers tailored with clean hems and relaxed silhouette.'}
            </p>
            <div className="mt-4 pt-3 border-t border-[#f0eae0] flex flex-wrap gap-1.5">
              {previewProduct.sizes?.map((sz) => (
                <span key={sz} className="px-2 py-1 bg-[#f5f2eb] rounded text-[11px] font-mono font-bold">
                  {sz}
                </span>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
