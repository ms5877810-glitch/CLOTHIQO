import React, { useState, useMemo } from 'react';
import { Product } from '../types';
import {
  Check,
  ShoppingBag,
  ArrowUpRight,
  Search,
  SlidersHorizontal,
  Star,
  Eye,
  Percent,
  Flame,
  Truck,
  ShieldCheck,
  Clock,
  Sparkles,
  Zap,
} from 'lucide-react';

interface GridViewProps {
  products: Product[];
  selectedProduct: Product;
  onOpenProduct: (product: Product) => void;
  onAddToCart: (product: Product, size: string, color: string) => void;
  onBuyNow?: (product: Product, size: string, color: string) => void;
  onOpenCart?: () => void;
  onOpenTracking?: () => void;
}

type SectionView = 'all' | 'featured' | 'bestsellers' | 'sale';

export const GridView: React.FC<GridViewProps> = ({
  products,
  selectedProduct,
  onOpenProduct,
  onAddToCart,
  onBuyNow,
}) => {
  // Navigation & Section Filter
  const [activeSection, setActiveSection] = useState<SectionView>('all');
  const [selectedCategory, setSelectedCategory] = useState<string>('All');

  // Search & Filter state
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedSizeFilter, setSelectedSizeFilter] = useState<string>('All');
  const [selectedColorFilter, setSelectedColorFilter] = useState<string>('All');
  const [inStockOnly, setInStockOnly] = useState(false);
  const [maxPrice, setMaxPrice] = useState<number>(3500);
  const [sortBy, setSortBy] = useState<string>('featured');
  const [showFiltersMobile, setShowFiltersMobile] = useState(false);

  // Per-card selections
  const [selectedSizes, setSelectedSizes] = useState<Record<string, string>>(() => {
    const initial: Record<string, string> = {};
    products.forEach((p) => {
      initial[String(p.id)] = p.sizes[0] || '30';
    });
    return initial;
  });
  const [selectedColors, setSelectedColors] = useState<Record<string, string>>(() => {
    const initial: Record<string, string> = {};
    products.forEach((p) => {
      initial[String(p.id)] = p.colors[0] || 'Black';
    });
    return initial;
  });
  const [justAddedId, setJustAddedId] = useState<string | number | null>(null);
  const [imgErrors, setImgErrors] = useState<Record<string, boolean>>({});

  const filterCategories = ['All', 'Baggy Pants', 'Formal Pants', 'Wide-Leg Pants'];
  const allSizes = ['All', '28', '30', '32', '34', '36'];
  const allColors = ['All', 'Black', 'Off-White', 'Charcoal', 'Navy', 'Ecru Cream', 'Mushroom Grey'];

  // Filtered & Sorted products computation
  const filteredProducts = useMemo(() => {
    return products.filter((p) => {
      // Section Tab filter
      if (activeSection === 'featured' && !p.isFeatured && p.tag !== 'New Arrival') {
        return false;
      }
      if (activeSection === 'bestsellers' && !p.isBestseller && p.tag !== 'Best Seller') {
        return false;
      }
      if (activeSection === 'sale' && !p.originalPrice && !p.isSale) {
        return false;
      }

      // Category filter
      if (selectedCategory !== 'All' && p.category !== selectedCategory) {
        return false;
      }

      // Search term
      if (searchTerm.trim()) {
        const query = searchTerm.toLowerCase();
        const matchesName = p.name.toLowerCase().includes(query);
        const matchesCat = p.category.toLowerCase().includes(query);
        const matchesFabric = p.fabric?.toLowerCase().includes(query);
        if (!matchesName && !matchesCat && !matchesFabric) return false;
      }

      // Size filter
      if (selectedSizeFilter !== 'All' && !p.sizes.includes(selectedSizeFilter)) {
        return false;
      }

      // Color filter
      if (selectedColorFilter !== 'All' && !p.colors.includes(selectedColorFilter)) {
        return false;
      }

      // In stock only
      if (inStockOnly && p.stock <= 0) {
        return false;
      }

      // Price slider
      if (p.price > maxPrice) {
        return false;
      }

      return true;
    }).sort((a, b) => {
      if (sortBy === 'price-asc') return a.price - b.price;
      if (sortBy === 'price-desc') return b.price - a.price;
      if (sortBy === 'newest') return Number(b.id) - Number(a.id);
      if (sortBy === 'bestseller') {
        const aScore = (a.isBestseller ? 1 : 0) + (a.salesCount || 0);
        const bScore = (b.isBestseller ? 1 : 0) + (b.salesCount || 0);
        return bScore - aScore;
      }
      return 0; // featured default
    });
  }, [
    products,
    activeSection,
    selectedCategory,
    searchTerm,
    selectedSizeFilter,
    selectedColorFilter,
    inStockOnly,
    maxPrice,
    sortBy,
  ]);

  const handleSelectSize = (productId: string | number, size: string, e?: React.MouseEvent) => {
    e?.stopPropagation();
    setSelectedSizes((prev) => ({ ...prev, [String(productId)]: size }));
  };

  const handleSelectColor = (productId: string | number, color: string, e?: React.MouseEvent) => {
    e?.stopPropagation();
    setSelectedColors((prev) => ({ ...prev, [String(productId)]: color }));
  };

  const handleAddProduct = (e: React.MouseEvent, product: Product) => {
    e.stopPropagation();
    if (product.stock === 0) return;

    const pid = String(product.id);
    const size = selectedSizes[pid] || product.sizes[0];
    const color = selectedColors[pid] || product.colors[0];

    onAddToCart(product, size, color);
    setJustAddedId(product.id);
    setTimeout(() => setJustAddedId(null), 1800);
  };

  const scrollToShop = () => {
    const el = document.getElementById('shop');
    el?.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <div id="gridView" className="absolute inset-0 overflow-y-auto bg-[#f8f5ef] text-[#111111] scroll-smooth">
      {/* 7. HOMEPAGE HERO SECTION */}
      <section
        id="home"
        className="hero relative min-h-[480px] sm:min-h-[540px] flex items-center justify-center text-center px-5 py-16 sm:py-24 border-b border-black/[0.06] bg-gradient-to-b from-[#f4efe4] to-[#f8f5ef] overflow-hidden"
      >
        <div className="absolute inset-0 opacity-[0.03] pointer-events-none bg-[radial-gradient(#000_1px,transparent_1px)] [background-size:16px_16px]" />

        <div className="relative max-w-2xl mx-auto space-y-4">
          <span className="inline-block px-4 py-1.5 rounded-full bg-black/5 text-[#111111] text-xs font-black tracking-[4px] uppercase border border-black/10">
            PREMIUM FASHION
          </span>

          <h1 className="text-4xl sm:text-6xl md:text-7xl font-black tracking-[6px] sm:tracking-[8px] text-[#111111] leading-tight uppercase font-sans">
            CLOTHIQO
          </h1>

          <p className="text-base sm:text-lg text-[#555555] font-medium tracking-wide max-w-md mx-auto">
            Shop the latest collection. Tailored for comfort, drape, and enduring elegance.
          </p>

          <div className="pt-4 flex items-center justify-center gap-3">
            <button
              onClick={scrollToShop}
              className="bg-[#111111] hover:bg-black text-white px-8 py-3.5 rounded-full text-xs font-black tracking-widest uppercase transition shadow-md hover:shadow-xl cursor-pointer active:scale-95"
            >
              SHOP NOW
            </button>
          </div>
        </div>
      </section>

      {/* SECTION NAV TABS: Featured Collection | Best Sellers | Sale | All */}
      <section className="bg-white border-b border-[#e8e4dc] sticky top-0 z-20 shadow-xs">
        <div className="max-w-7xl mx-auto px-4 sm:px-[6%] flex items-center justify-between gap-4 py-3 overflow-x-auto">
          <div className="flex items-center gap-2">
            {[
              { id: 'all', label: 'All Pants' },
              { id: 'featured', label: 'Featured Collection', icon: Sparkles },
              { id: 'bestsellers', label: 'Best Sellers', icon: Flame },
              { id: 'sale', label: 'Sale', icon: Percent },
            ].map((tab) => {
              const Icon = tab.icon;
              const isActive = activeSection === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveSection(tab.id as SectionView)}
                  className={`flex items-center gap-1.5 px-4 py-2 rounded-full text-xs font-bold whitespace-nowrap transition cursor-pointer ${
                    isActive
                      ? 'bg-[#111111] text-white shadow-xs'
                      : 'bg-[#f8f6f0] text-[#555555] hover:text-black hover:bg-[#efebe1]'
                  }`}
                >
                  {Icon && <Icon className="w-3.5 h-3.5" />}
                  <span>{tab.label}</span>
                </button>
              );
            })}
          </div>

          <button
            type="button"
            onClick={() => setShowFiltersMobile(!showFiltersMobile)}
            className="md:hidden flex items-center gap-1 px-3 py-1.5 rounded-lg border border-[#d5cfc0] text-xs font-bold text-[#333333]"
          >
            <SlidersHorizontal className="w-3.5 h-3.5" />
            <span>Filters</span>
          </button>
        </div>
      </section>

      {/* 13. SEARCH & COMPREHENSIVE FILTER CONTROLS */}
      <section id="shop" className="py-6 sm:py-8 px-3 sm:px-[6%] max-w-7xl mx-auto">
        {/* Mobile Filter & Sort Bar (Hidden on Desktop) */}
        <div className="block md:hidden mb-4 space-y-2.5">
          {/* Search Input */}
          <div className="relative w-full">
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search baggy, formal, fabric..."
              className="w-full pl-9 pr-3 py-2.5 rounded-xl border border-[#d5cfc0] text-xs bg-white focus:bg-white focus:border-black outline-none shadow-2xs"
            />
            <Search className="w-4 h-4 text-[#888888] absolute left-3 top-1/2 -translate-y-1/2" />
          </div>

          {/* Quick Category horizontal scroll + Filter Drawer Button */}
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setShowFiltersMobile(true)}
              className="min-h-[42px] px-3.5 rounded-xl bg-[#111111] text-white text-xs font-bold flex items-center gap-1.5 shrink-0 shadow-xs cursor-pointer active:scale-95"
            >
              <SlidersHorizontal className="w-3.5 h-3.5" />
              <span>Filters</span>
              {(selectedCategory !== 'All' || selectedSizeFilter !== 'All' || selectedColorFilter !== 'All' || inStockOnly || sortBy !== 'featured') && (
                <span className="w-2 h-2 rounded-full bg-amber-400" />
              )}
            </button>

            <div className="flex items-center gap-1.5 overflow-x-auto scrollbar-none py-0.5">
              {filterCategories.map((cat) => {
                const isActive = selectedCategory === cat;
                return (
                  <button
                    key={cat}
                    type="button"
                    onClick={() => setSelectedCategory(cat)}
                    className={`min-h-[42px] px-3 rounded-xl text-xs font-bold whitespace-nowrap transition cursor-pointer shrink-0 border ${
                      isActive
                        ? 'bg-[#111111] text-white border-[#111111]'
                        : 'bg-white text-[#444444] border-[#d5cfc0]'
                    }`}
                  >
                    {cat}
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Desktop Filter Bar (Hidden on Mobile) */}
        <div className="hidden md:block bg-white p-5 rounded-2xl border border-[#ece7dc] shadow-sm mb-8 space-y-4">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            {/* Search Input */}
            <div className="relative w-full md:w-80">
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search styles, fabric, categories..."
                className="w-full pl-9 pr-3 py-2 rounded-xl border border-[#d5cfc0] text-xs bg-[#fcfbf9] focus:bg-white focus:outline-none"
              />
              <Search className="w-3.5 h-3.5 text-[#888888] absolute left-3 top-3" />
            </div>

            {/* Category Pills */}
            <div className="flex items-center gap-1.5 flex-wrap">
              {filterCategories.map((cat) => {
                const isActive = selectedCategory === cat;
                return (
                  <button
                    key={cat}
                    type="button"
                    onClick={() => setSelectedCategory(cat)}
                    className={`px-3.5 py-1.5 rounded-full text-xs font-bold transition cursor-pointer ${
                      isActive
                        ? 'bg-[#111111] text-white'
                        : 'bg-[#f7f5ee] text-[#444444] hover:bg-[#eae4d5]'
                    }`}
                  >
                    {cat}
                  </button>
                );
              })}
            </div>

            {/* Sort Dropdown */}
            <div className="flex items-center gap-2">
              <span className="text-xs text-[#777777] font-semibold hidden lg:inline">Sort:</span>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="px-3 py-2 rounded-xl border border-[#d5cfc0] text-xs bg-[#fcfbf9] font-bold text-[#111111] cursor-pointer"
              >
                <option value="featured">Featured</option>
                <option value="price-asc">Price: Low to High</option>
                <option value="price-desc">Price: High to Low</option>
                <option value="newest">Newest Arrivals</option>
                <option value="bestseller">Best Selling</option>
              </select>
            </div>
          </div>

          {/* Secondary filter row */}
          <div className="pt-3 border-t border-[#f0eae0] grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
            {/* Size Filter */}
            <div>
              <label className="text-[11px] font-bold text-[#666666] uppercase block mb-1">
                Size Filter
              </label>
              <select
                value={selectedSizeFilter}
                onChange={(e) => setSelectedSizeFilter(e.target.value)}
                className="w-full px-2.5 py-1.5 rounded-lg border border-[#d5cfc0] bg-[#fcfbf9] text-xs font-semibold"
              >
                {allSizes.map((s) => (
                  <option key={s} value={s}>
                    {s === 'All' ? 'All Sizes' : `Size ${s}`}
                  </option>
                ))}
              </select>
            </div>

            {/* Colour Filter */}
            <div>
              <label className="text-[11px] font-bold text-[#666666] uppercase block mb-1">
                Colour
              </label>
              <select
                value={selectedColorFilter}
                onChange={(e) => setSelectedColorFilter(e.target.value)}
                className="w-full px-2.5 py-1.5 rounded-lg border border-[#d5cfc0] bg-[#fcfbf9] text-xs font-semibold"
              >
                {allColors.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </div>

            {/* Price Range Slider */}
            <div>
              <div className="flex items-center justify-between text-[11px] font-bold text-[#666666] uppercase mb-1">
                <span>Max Price</span>
                <span className="font-mono text-black">৳{maxPrice}</span>
              </div>
              <input
                type="range"
                min="1000"
                max="3500"
                step="50"
                value={maxPrice}
                onChange={(e) => setMaxPrice(Number(e.target.value))}
                className="w-full accent-black cursor-pointer"
              />
            </div>

            {/* In Stock Only Checkbox */}
            <div className="flex items-center">
              <label className="flex items-center gap-2 cursor-pointer mt-4 select-none">
                <input
                  type="checkbox"
                  checked={inStockOnly}
                  onChange={(e) => setInStockOnly(e.target.checked)}
                  className="rounded border-[#cccccc] text-black focus:ring-black cursor-pointer"
                />
                <span className="text-xs font-bold text-[#333333]">In-stock only</span>
              </label>
            </div>
          </div>
        </div>

        {/* Mobile Filters Bottom Sheet / Drawer */}
        {showFiltersMobile && (
          <div
            className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex flex-col justify-end"
            onClick={() => setShowFiltersMobile(false)}
          >
            <div
              className="bg-white rounded-t-3xl p-5 max-h-[85dvh] overflow-y-auto space-y-5 shadow-2xl animate-in slide-in-from-bottom duration-300 pb-safe"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Header */}
              <div className="flex items-center justify-between pb-3 border-b border-[#e5e7eb]">
                <div className="flex items-center gap-2">
                  <SlidersHorizontal className="w-4 h-4 text-[#111111]" />
                  <h3 className="font-extrabold text-base text-[#111111]">Filters &amp; Sorting</h3>
                </div>
                <button
                  type="button"
                  onClick={() => setShowFiltersMobile(false)}
                  className="w-9 h-9 rounded-full bg-black/5 flex items-center justify-center text-[#444444] cursor-pointer"
                >
                  ✕
                </button>
              </div>

              {/* Sort Section */}
              <div>
                <label className="text-xs font-bold uppercase tracking-wider text-[#666666] block mb-2">
                  Sort Collection
                </label>
                <div className="grid grid-cols-2 gap-2">
                  {[
                    { id: 'featured', label: 'Featured' },
                    { id: 'bestseller', label: 'Best Selling' },
                    { id: 'price-asc', label: 'Price: Low to High' },
                    { id: 'price-desc', label: 'Price: High to Low' },
                    { id: 'newest', label: 'Newest Arrivals' },
                  ].map((s) => (
                    <button
                      key={s.id}
                      type="button"
                      onClick={() => setSortBy(s.id)}
                      className={`min-h-[44px] px-3 py-2 rounded-xl text-xs font-bold text-left transition border ${
                        sortBy === s.id
                          ? 'bg-[#111111] text-white border-[#111111]'
                          : 'bg-[#f9f8f6] text-[#333333] border-[#e8e4dc]'
                      }`}
                    >
                      {s.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Category Section */}
              <div>
                <label className="text-xs font-bold uppercase tracking-wider text-[#666666] block mb-2">
                  Category
                </label>
                <div className="flex flex-wrap gap-2">
                  {filterCategories.map((cat) => (
                    <button
                      key={cat}
                      type="button"
                      onClick={() => setSelectedCategory(cat)}
                      className={`min-h-[44px] px-4 py-2 rounded-full text-xs font-bold transition border ${
                        selectedCategory === cat
                          ? 'bg-[#111111] text-white border-[#111111]'
                          : 'bg-[#f9f8f6] text-[#333333] border-[#e8e4dc]'
                      }`}
                    >
                      {cat}
                    </button>
                  ))}
                </div>
              </div>

              {/* Size Section */}
              <div>
                <label className="text-xs font-bold uppercase tracking-wider text-[#666666] block mb-2">
                  Waist Size
                </label>
                <div className="flex flex-wrap gap-2">
                  {allSizes.map((s) => (
                    <button
                      key={s}
                      type="button"
                      onClick={() => setSelectedSizeFilter(s)}
                      className={`min-h-[44px] min-w-[44px] px-3.5 py-2 rounded-xl text-xs font-bold transition border ${
                        selectedSizeFilter === s
                          ? 'bg-[#111111] text-white border-[#111111]'
                          : 'bg-[#f9f8f6] text-[#333333] border-[#e8e4dc]'
                      }`}
                    >
                      {s}
                    </button>
                  ))}
                </div>
              </div>

              {/* Color Section */}
              <div>
                <label className="text-xs font-bold uppercase tracking-wider text-[#666666] block mb-2">
                  Colorway
                </label>
                <div className="flex flex-wrap gap-2">
                  {allColors.map((c) => (
                    <button
                      key={c}
                      type="button"
                      onClick={() => setSelectedColorFilter(c)}
                      className={`min-h-[44px] px-3.5 py-2 rounded-xl text-xs font-bold transition border ${
                        selectedColorFilter === c
                          ? 'bg-[#111111] text-white border-[#111111]'
                          : 'bg-[#f9f8f6] text-[#333333] border-[#e8e4dc]'
                      }`}
                    >
                      {c}
                    </button>
                  ))}
                </div>
              </div>

              {/* Price Range */}
              <div>
                <div className="flex items-center justify-between text-xs font-bold uppercase text-[#666666] mb-2">
                  <span>Maximum Price</span>
                  <span className="font-mono text-black text-sm">৳{maxPrice.toLocaleString()}</span>
                </div>
                <input
                  type="range"
                  min="1000"
                  max="3500"
                  step="50"
                  value={maxPrice}
                  onChange={(e) => setMaxPrice(Number(e.target.value))}
                  className="w-full accent-black h-2 bg-[#e5e7eb] rounded-lg cursor-pointer"
                />
              </div>

              {/* In-stock toggle */}
              <div className="flex items-center justify-between p-3 rounded-2xl bg-[#f9f8f6] border border-[#e8e4dc]">
                <span className="text-xs font-bold text-[#111111]">In-stock only</span>
                <input
                  type="checkbox"
                  checked={inStockOnly}
                  onChange={(e) => setInStockOnly(e.target.checked)}
                  className="w-5 h-5 accent-black rounded cursor-pointer"
                />
              </div>

              {/* Bottom Sticky Action Buttons */}
              <div className="pt-2 flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => {
                    setSelectedCategory('All');
                    setSelectedSizeFilter('All');
                    setSelectedColorFilter('All');
                    setMaxPrice(3500);
                    setInStockOnly(false);
                    setSortBy('featured');
                  }}
                  className="min-h-[48px] px-4 py-3 rounded-2xl border border-[#cccccc] text-xs font-bold text-[#333333] hover:bg-black/5 cursor-pointer"
                >
                  Clear All
                </button>
                <button
                  type="button"
                  onClick={() => setShowFiltersMobile(false)}
                  className="min-h-[48px] flex-1 py-3 rounded-2xl bg-[#111111] text-white text-xs font-bold uppercase tracking-wider cursor-pointer shadow-md"
                >
                  Apply Filters ({filteredProducts.length} Items)
                </button>
              </div>
            </div>
          </div>
        )}

        {/* 8. PRODUCT CARDS GRID (1 col on narrow <340px, 2 col on smartphone, 3 col on desktop) */}
        <div
          id="products"
          className="products grid grid-cols-1 xs:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-6"
        >
          {filteredProducts.length === 0 ? (
            <div className="col-span-full py-16 text-center bg-white rounded-2xl border border-[#ece7dc] p-8">
              <p className="text-sm font-bold text-[#333333]">No trousers found matching your filter selection.</p>
              <button
                type="button"
                onClick={() => {
                  setSelectedCategory('All');
                  setActiveSection('all');
                  setSearchTerm('');
                  setSelectedSizeFilter('All');
                  setSelectedColorFilter('All');
                  setMaxPrice(3500);
                  setInStockOnly(false);
                }}
                className="mt-3 px-4 py-2 rounded-xl bg-black text-white text-xs font-bold cursor-pointer"
              >
                Reset All Filters
              </button>
            </div>
          ) : (
            filteredProducts.map((product) => {
              const pid = String(product.id);
              const isSelectedCard = String(selectedProduct.id) === pid;
              const isJustAdded = String(justAddedId) === pid;
              const currentSelectedSize = selectedSizes[pid] || product.sizes[0];
              const currentSelectedColor = selectedColors[pid] || product.colors[0];
              const hasError = imgErrors[pid];
              const isOut = product.stock === 0;

              return (
                <div
                  key={product.id}
                  id={`product-${product.id}`}
                  onClick={() => onOpenProduct(product)}
                  className={`product group bg-white rounded-2xl overflow-hidden shadow-sm hover:shadow-xl transition-all duration-300 cursor-pointer flex flex-col justify-between border border-[#e8e4dc] ${
                    isSelectedCard ? 'ring-2 ring-[#111111]' : ''
                  }`}
                >
                  {/* Product Photo with 3:4 aspect ratio & lazy loading */}
                  <div className="relative w-full aspect-[3/4] bg-[#eeeeee] overflow-hidden flex items-center justify-center">
                    {!hasError && product.image ? (
                      <img
                        src={product.image}
                        alt={product.name}
                        loading="lazy"
                        referrerPolicy="no-referrer"
                        onError={() => setImgErrors((prev) => ({ ...prev, [pid]: true }))}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500 ease-out"
                      />
                    ) : (
                      <div className="w-full h-full grid place-items-center text-white font-black text-4xl sm:text-6xl select-none bg-gradient-to-br from-neutral-800 to-neutral-900">
                        {product.icon}
                      </div>
                    )}

                    {/* Badges: Sale badge & Bestseller badge */}
                    <div className="absolute top-2 left-2 sm:top-3 sm:left-3 flex flex-col gap-1 items-start max-w-[80%]">
                      {product.originalPrice && product.originalPrice > product.price && (
                        <span className="text-[9px] sm:text-[10px] font-black uppercase tracking-wider px-2 py-0.5 sm:px-2.5 sm:py-1 rounded-full bg-red-600 text-white shadow-xs">
                          ৳{(product.originalPrice - product.price)} OFF
                        </span>
                      )}
                      {(product.isBestseller || product.tag === 'Best Seller') && (
                        <span className="text-[9px] sm:text-[10px] font-black uppercase tracking-wider px-2 py-0.5 sm:px-2.5 sm:py-1 rounded-full bg-black text-white shadow-xs flex items-center gap-1">
                          <Flame className="w-2.5 h-2.5 sm:w-3 sm:h-3 text-amber-400" />
                          <span>BEST</span>
                        </span>
                      )}
                      {product.tag && product.tag !== 'Best Seller' && (
                        <span className="text-[9px] sm:text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 sm:px-2.5 sm:py-1 rounded-full bg-white/90 backdrop-blur-md text-[#111111] shadow-xs truncate max-w-full">
                          {product.tag}
                        </span>
                      )}
                    </div>

                    {/* Quick View Floating Action */}
                    <div className="absolute top-2 right-2 sm:top-3 sm:right-3 flex flex-col gap-2">
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          onOpenProduct(product);
                        }}
                        title="Quick View"
                        className="w-8 h-8 sm:w-9 sm:h-9 rounded-full bg-white/90 hover:bg-white text-black backdrop-blur-md flex items-center justify-center shadow-md transition transform hover:scale-105 cursor-pointer active:scale-90"
                      >
                        <Eye className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                      </button>
                    </div>

                    {/* Stock Status Bar */}
                    <div className="absolute bottom-2 left-2 sm:bottom-3 sm:left-3">
                      <span
                        className={`text-[9px] sm:text-[10px] font-bold px-2 py-0.5 rounded-md backdrop-blur-md ${
                          isOut
                            ? 'bg-red-600/90 text-white'
                            : product.stock < 10
                            ? 'bg-amber-600/90 text-white'
                            : 'bg-black/60 text-white'
                        }`}
                      >
                        {isOut ? 'Out of stock' : `${product.stock} in stock`}
                      </span>
                    </div>
                  </div>

                  {/* Product Info */}
                  <div className="product-info p-3 sm:p-5 flex flex-col justify-between flex-1">
                    <div>
                      <div className="category text-[10px] sm:text-[11px] text-[#777777] uppercase font-bold tracking-wider mb-1">
                        {product.category}
                      </div>

                      <h3 className="text-xs sm:text-base font-bold text-[#111111] group-hover:text-black transition-colors mb-1 sm:mb-2 leading-snug line-clamp-2">
                        {product.name}
                      </h3>

                      {/* Price & Discount */}
                      <div className="price flex items-baseline gap-1.5 sm:gap-2 mb-2 sm:mb-3.5">
                        <span className="font-bold text-sm sm:text-lg text-[#111111] font-mono">
                          ৳{product.price.toLocaleString()}
                        </span>
                        {product.originalPrice && product.originalPrice > product.price && (
                          <span className="font-mono text-[10px] sm:text-xs text-[#888888] line-through">
                            ৳{product.originalPrice.toLocaleString()}
                          </span>
                        )}
                      </div>

                      {/* Quick Size Selector */}
                      <div className="mb-2 sm:mb-3">
                        <span className="text-[10px] sm:text-[11px] text-[#555555] font-bold uppercase mb-1 block">
                          Size
                        </span>
                        <div className="sizes flex flex-wrap gap-1">
                          {product.sizes.map((size) => {
                            const isSizeActive = currentSelectedSize === size;
                            return (
                              <button
                                key={size}
                                type="button"
                                onClick={(e) => handleSelectSize(product.id, size, e)}
                                className={`px-1.5 sm:px-2 py-0.5 sm:py-1 border rounded text-[10px] sm:text-[11px] font-semibold transition cursor-pointer min-w-[28px] text-center ${
                                  isSizeActive
                                    ? 'bg-[#111111] text-white border-[#111111]'
                                    : 'bg-white text-[#111111] border-[#cccccc] hover:border-[#111111]'
                                }`}
                              >
                                {size}
                              </button>
                            );
                          })}
                        </div>
                      </div>

                      {/* Quick Colour Selector */}
                      <div className="mb-3 sm:mb-4">
                        <span className="text-[10px] sm:text-[11px] text-[#555555] font-bold uppercase mb-1 block">
                          Colour
                        </span>
                        <div className="colors flex flex-wrap gap-1">
                          {product.colors.map((color) => {
                            const isColorActive = currentSelectedColor === color;
                            return (
                              <button
                                key={color}
                                type="button"
                                onClick={(e) => handleSelectColor(product.id, color, e)}
                                className={`px-2 py-0.5 sm:py-1 border rounded text-[10px] sm:text-[11px] font-semibold transition cursor-pointer ${
                                  isColorActive
                                    ? 'bg-[#111111] text-white border-[#111111]'
                                    : 'bg-white text-[#111111] border-[#cccccc] hover:border-[#111111]'
                                }`}
                              >
                                {color}
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    </div>

                    {/* Action Buttons: Add to Cart and Buy Now */}
                    <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-1.5 sm:gap-2 pt-1">
                      <button
                        type="button"
                        disabled={isOut}
                        onClick={(e) => handleAddProduct(e, product)}
                        className={`add-btn flex-1 min-h-[42px] sm:min-h-[44px] py-2 sm:py-3 px-2 rounded-xl text-[11px] sm:text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer shadow-xs active:scale-[0.98] ${
                          isOut
                            ? 'bg-gray-200 text-gray-400 cursor-not-allowed border border-gray-300'
                            : isJustAdded
                            ? 'bg-emerald-600 hover:bg-emerald-700 text-white'
                            : 'bg-white hover:bg-[#f3eee4] text-[#111111] border border-[#111111]'
                        }`}
                      >
                        {isOut ? (
                          <span>Out of Stock</span>
                        ) : isJustAdded ? (
                          <>
                            <Check className="w-3.5 h-3.5" />
                            <span>Added</span>
                          </>
                        ) : (
                          <>
                            <ShoppingBag className="w-3.5 h-3.5" />
                            <span>Add to Cart</span>
                          </>
                        )}
                      </button>

                      <button
                        type="button"
                        disabled={isOut}
                        onClick={(e) => {
                          e.stopPropagation();
                          if (isOut) return;
                          if (onBuyNow) {
                            onBuyNow(product, currentSelectedSize, currentSelectedColor);
                          } else {
                            handleAddProduct(e, product);
                          }
                        }}
                        className={`buy-now-btn flex-1 min-h-[42px] sm:min-h-[44px] py-2 sm:py-3 px-2 rounded-xl text-[11px] sm:text-xs font-black tracking-wider uppercase transition-all flex items-center justify-center gap-1 cursor-pointer shadow-xs active:scale-[0.98] ${
                          isOut
                            ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                            : 'bg-[#111111] hover:bg-black text-white'
                        }`}
                      >
                        <Zap className="w-3.5 h-3.5 text-amber-300" />
                        <span>Buy Now</span>
                      </button>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </section>

      {/* 7. CUSTOMER REVIEWS SECTION */}
      <section className="section py-16 px-4 sm:px-[6%] max-w-7xl mx-auto border-t border-[#ece7dc]">
        <div className="text-center max-w-xl mx-auto mb-10">
          <span className="text-xs font-black uppercase tracking-[3px] text-[#777777]">
            Verified Customer Reviews
          </span>
          <h2 className="text-2xl sm:text-3xl font-black text-[#111111] mt-1">
            Praised by Modern Gentlemen
          </h2>
          <div className="flex items-center justify-center gap-1 text-amber-500 mt-2">
            {Array.from({ length: 5 }).map((_, i) => (
              <Star key={i} className="w-4 h-4 fill-current" />
            ))}
            <span className="text-xs font-bold text-[#111111] ml-1.5">4.9 / 5.0 (280+ Reviews)</span>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white p-6 rounded-2xl border border-[#e8e4dc] shadow-sm space-y-3">
            <div className="flex items-center gap-1 text-amber-500">
              {Array.from({ length: 5 }).map((_, i) => (
                <Star key={i} className="w-3.5 h-3.5 fill-current" />
              ))}
            </div>
            <p className="text-xs text-[#444444] leading-relaxed">
              "The Urban Black Baggy is the best wide silhouette trouser in Bangladesh. The 340 GSM fabric falls smoothly without bunching. Truly luxury quality."
            </p>
            <div className="pt-2 border-t border-[#f0eae0]">
              <span className="font-bold text-xs text-[#111111] block">Tanvir Hasan</span>
              <span className="text-[10px] text-[#888888]">Dhaka • Verified Buyer</span>
            </div>
          </div>

          <div className="bg-white p-6 rounded-2xl border border-[#e8e4dc] shadow-sm space-y-3">
            <div className="flex items-center gap-1 text-amber-500">
              {Array.from({ length: 5 }).map((_, i) => (
                <Star key={i} className="w-3.5 h-3.5 fill-current" />
              ))}
            </div>
            <p className="text-xs text-[#444444] leading-relaxed">
              "Wore the Classic Formal Black trousers for corporate meetings. The extended tab closure and sharp crease held up all day. Fast delivery in 48 hours."
            </p>
            <div className="pt-2 border-t border-[#f0eae0]">
              <span className="font-bold text-xs text-[#111111] block">Rahim Chowdhury</span>
              <span className="text-[10px] text-[#888888]">Chattogram • Verified Buyer</span>
            </div>
          </div>

          <div className="bg-white p-6 rounded-2xl border border-[#e8e4dc] shadow-sm space-y-3">
            <div className="flex items-center gap-1 text-amber-500">
              {Array.from({ length: 5 }).map((_, i) => (
                <Star key={i} className="w-3.5 h-3.5 fill-current" />
              ))}
            </div>
            <p className="text-xs text-[#444444] leading-relaxed">
              "The Wide-Leg Cream pants pair effortlessly with blazers and minimal tees. The fabric feels bespoke. Cash on delivery was seamless."
            </p>
            <div className="pt-2 border-t border-[#f0eae0]">
              <span className="font-bold text-xs text-[#111111] block">Fahim Rahman</span>
              <span className="text-[10px] text-[#888888]">Sylhet • Verified Buyer</span>
            </div>
          </div>
        </div>
      </section>

      {/* VALUE PROPOSITIONS */}
      <section className="section py-14 px-4 sm:px-[6%] max-w-7xl mx-auto">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-white p-5 rounded-2xl border border-[#e8e4dc] shadow-xs text-center space-y-1.5">
            <Truck className="w-5 h-5 mx-auto text-[#111111]" />
            <h3 className="font-bold text-xs uppercase text-[#111111]">Nationwide Delivery</h3>
            <p className="text-[11px] text-[#666666]">Across all districts of Bangladesh</p>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-[#e8e4dc] shadow-xs text-center space-y-1.5">
            <Clock className="w-5 h-5 mx-auto text-[#111111]" />
            <h3 className="font-bold text-xs uppercase text-[#111111]">2–5 Days Delivery</h3>
            <p className="text-[11px] text-[#666666]">Express dispatch directly to your door</p>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-[#e8e4dc] shadow-xs text-center space-y-1.5">
            <ShieldCheck className="w-5 h-5 mx-auto text-[#111111]" />
            <h3 className="font-bold text-xs uppercase text-[#111111]">Cash on Delivery</h3>
            <p className="text-[11px] text-[#666666]">Pay upon inspection at delivery</p>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-[#e8e4dc] shadow-xs text-center space-y-1.5">
            <Sparkles className="w-5 h-5 mx-auto text-[#111111]" />
            <h3 className="font-bold text-xs uppercase text-[#111111]">Premium Cotton</h3>
            <p className="text-[11px] text-[#666666]">Heavyweight 340+ GSM crafted fabrics</p>
          </div>
        </div>
      </section>

      {/* FOOTER */}
      <footer id="support" className="bg-[#111111] text-white pt-14 pb-8 px-4 sm:px-[6%] border-t border-black/20">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8 pb-10">
            <div>
              <h3 className="font-black text-lg tracking-widest uppercase mb-3 text-white">
                CLOTHIQO
              </h3>
              <p className="text-xs text-[#aaaaaa] leading-relaxed">
                Modern Fit. Timeless Style. Premium trousers tailored for the modern silhouette.
              </p>
            </div>

            <div>
              <h3 className="font-bold text-xs uppercase tracking-wider mb-3 text-white">
                Customer Support
              </h3>
              <p className="text-xs text-[#aaaaaa] leading-loose">
                Email: <a href="mailto:3218.clothiqo@gmail.com" className="hover:underline text-white">3218.clothiqo@gmail.com</a>
                <br />
                Phone: <a href="tel:+8801602954526" className="hover:underline text-white">+8801602954526</a>
                <br />
                Support: 24/7 Hotline
              </p>
            </div>

            <div>
              <h3 className="font-bold text-xs uppercase tracking-wider mb-3 text-white">
                Shipping &amp; Policy
              </h3>
              <p className="text-xs text-[#aaaaaa] leading-relaxed">
                Inside Dhaka: ৳80 (2–3 days)
                <br />
                Outside Dhaka: ৳130 (3–5 days)
                <br />
                Easy 7-day size exchange guarantee.
              </p>
            </div>

            <div>
              <h3 className="font-bold text-xs uppercase tracking-wider mb-3 text-white">
                Collection
              </h3>
              <p className="text-xs text-[#aaaaaa] leading-loose">
                Baggy Pants
                <br />
                Formal Pants
                <br />
                Wide-Leg Pants
              </p>
            </div>
          </div>

          <div className="border-t border-[#333333] pt-6 text-center text-xs text-[#777777]">
            © 2026 CLOTHIQO. All Rights Reserved. Crafted for distinction.
          </div>
        </div>
      </footer>
    </div>
  );
};
