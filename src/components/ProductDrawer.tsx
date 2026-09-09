import React, { useState } from 'react';
import { Product } from '../types';
import {
  X,
  ChevronDown,
  ChevronUp,
  ShoppingBag,
  Sparkles,
  Check,
  ShieldCheck,
  Truck,
  Star,
  Plus,
  Minus,
  ArrowRight,
  Zap,
} from 'lucide-react';

interface ProductDrawerProps {
  isOpen: boolean;
  product: Product;
  allProducts?: Product[];
  selectedSize: string;
  selectedColor: string;
  onSelectSize: (size: string) => void;
  onSelectColor: (color: string) => void;
  onClose: () => void;
  onAddToCart: (product: Product, size: string, color: string, quantity?: number) => void;
  onBuyNow?: (product: Product, size: string, color: string, quantity: number) => void;
  onSelectRelatedProduct?: (product: Product) => void;
  onAskAiAboutProduct?: (product: Product) => void;
}

export const ProductDrawer: React.FC<ProductDrawerProps> = ({
  isOpen,
  product,
  allProducts = [],
  selectedSize,
  selectedColor,
  onSelectSize,
  onSelectColor,
  onClose,
  onAddToCart,
  onBuyNow,
  onSelectRelatedProduct,
  onAskAiAboutProduct,
}) => {
  const [isExpanded, setIsExpanded] = useState<boolean>(true);
  const [isAdded, setIsAdded] = useState<boolean>(false);
  const [quantity, setQuantity] = useState<number>(1);
  const [selectedImageIndex, setSelectedImageIndex] = useState<number>(0);

  // Review Form State
  const [showReviewForm, setShowReviewForm] = useState<boolean>(false);
  const [reviewerName, setReviewerName] = useState('');
  const [reviewRating, setReviewRating] = useState(5);
  const [reviewComment, setReviewComment] = useState('');
  const [reviewSubmitted, setReviewSubmitted] = useState(false);

  const activeSize = selectedSize || product.sizes[0] || '32';
  const activeColor = selectedColor || product.colors[0] || 'Black';
  const isOutOfStock = product.stock === 0;

  // Build image gallery list (fallback to secondary angles)
  const imageGallery = [
    product.image,
    // Add variations or secondary viewpoints
    product.image.includes('unsplash')
      ? `${product.image}&auto=format&fit=crop&w=700&q=80`
      : product.image,
  ].filter(Boolean);

  const currentMainImage = imageGallery[selectedImageIndex] || product.image;

  // Related products
  const relatedProducts = allProducts
    .filter((p) => String(p.id) !== String(product.id) && p.category === product.category)
    .slice(0, 2);

  const handleAddToCart = () => {
    if (isOutOfStock) return;
    onAddToCart(product, activeSize, activeColor, quantity);
    setIsAdded(true);
    setTimeout(() => setIsAdded(false), 1800);
  };

  const handleBuyNow = () => {
    if (isOutOfStock) return;
    if (onBuyNow) {
      onBuyNow(product, activeSize, activeColor, quantity);
    } else {
      onAddToCart(product, activeSize, activeColor, quantity);
    }
  };

  const handleSubmitReview = (e: React.FormEvent) => {
    e.preventDefault();
    if (!reviewerName.trim() || !reviewComment.trim()) return;
    setReviewSubmitted(true);
    setTimeout(() => {
      setShowReviewForm(false);
      setReviewSubmitted(false);
      setReviewerName('');
      setReviewComment('');
    }, 2000);
  };

  return (
    <>
      {/* Backdrop for mobile */}
      {isOpen && (
        <div
          onClick={onClose}
          className="fixed inset-0 bg-black/40 backdrop-blur-xs z-35 md:hidden transition-opacity"
        />
      )}

      {/* Drawer Container */}
      <aside
        id="drawer"
        className={`fixed md:relative top-0 right-0 h-full bg-[#f8f5ef] z-40 flex flex-col transition-all duration-300 ease-in-out shadow-[-20px_0_50px_rgba(0,0,0,0.08)] border-l border-[#dddddd] ${
          isOpen ? 'w-full md:w-[440px] translate-x-0' : 'w-0 translate-x-full md:translate-x-0 md:w-0 overflow-hidden border-transparent'
        }`}
      >
        <div className="w-full md:w-[440px] h-full flex flex-col overflow-hidden text-[#111111]">
          {/* Drawer Header */}
          <div className="p-5 sm:p-6 pb-4 flex items-center justify-between border-b border-[#dddddd] bg-[#f8f5ef] sticky top-0 z-10">
            <div>
              <p className="text-[11px] text-[#666666] font-extrabold tracking-wider uppercase">
                {product.category}
              </p>
              <h2
                id="drawerTitle"
                className="text-xl sm:text-2xl font-black tracking-tight text-[#111111] leading-tight mt-0.5 truncate max-w-[280px]"
              >
                {product.name}
              </h2>
            </div>
            <button
              id="closeDrawer"
              onClick={onClose}
              className="w-9 h-9 rounded-full border border-[#cccccc] hover:bg-black/5 flex items-center justify-center text-[#111111] transition cursor-pointer"
              title="Close drawer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Drawer Scrollable Body */}
          <div className="p-5 sm:p-6 overflow-y-auto flex-1 space-y-5">
              {/* Main Product Image & Thumbnail Selector */}
              <div className="space-y-2">
                <div
                  id="drawerMedia"
                  className="h-[280px] sm:h-[320px] rounded-2xl overflow-hidden relative shadow-sm select-none group bg-[#eeeeee] border border-[#dddddd]"
                >
                  {currentMainImage ? (
                    <img
                      src={currentMainImage}
                      alt={product.name}
                      referrerPolicy="no-referrer"
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                  ) : (
                    <div className="w-full h-full grid place-items-center text-white font-extrabold text-7xl bg-neutral-900">
                      <span className="drop-shadow-sm">{product.icon}</span>
                    </div>
                  )}

                  {/* Previous / Next Image buttons if multiple */}
                  {imageGallery.length > 1 && (
                    <div className="absolute inset-y-0 inset-x-2 flex items-center justify-between pointer-events-none">
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedImageIndex((idx) => (idx > 0 ? idx - 1 : imageGallery.length - 1));
                        }}
                        className="pointer-events-auto w-8 h-8 rounded-full bg-white/80 hover:bg-white text-black backdrop-blur-md flex items-center justify-center shadow-md cursor-pointer transition active:scale-90"
                      >
                        ‹
                      </button>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedImageIndex((idx) => (idx < imageGallery.length - 1 ? idx + 1 : 0));
                        }}
                        className="pointer-events-auto w-8 h-8 rounded-full bg-white/80 hover:bg-white text-black backdrop-blur-md flex items-center justify-center shadow-md cursor-pointer transition active:scale-90"
                      >
                        ›
                      </button>
                    </div>
                  )}

                  {/* AI Stylist Button */}
                  {onAskAiAboutProduct && (
                    <button
                      type="button"
                      onClick={() => onAskAiAboutProduct(product)}
                      className="absolute top-3 right-3 flex items-center gap-1.5 text-[11px] font-bold bg-black/75 hover:bg-black backdrop-blur-md border border-white/20 text-white px-3 py-1.5 rounded-full transition cursor-pointer"
                    >
                      <Sparkles className="w-3 h-3 text-amber-300" />
                      <span>Style Advice</span>
                    </button>
                  )}

                  {/* Tag */}
                  {product.tag && (
                    <div className="absolute bottom-3 left-3 text-[10px] font-extrabold uppercase tracking-wider px-2.5 py-1 rounded-full bg-black/80 backdrop-blur-md text-white shadow-xs">
                      {product.tag}
                    </div>
                  )}
                </div>

                {/* Multiple Images Thumbnails (Gallery scroll) */}
                {imageGallery.length > 1 && (
                  <div className="flex items-center gap-2 pt-1 overflow-x-auto scrollbar-none py-1">
                    {imageGallery.map((img, idx) => (
                      <button
                        key={idx}
                        type="button"
                        onClick={() => setSelectedImageIndex(idx)}
                        className={`w-14 h-14 rounded-xl overflow-hidden border-2 transition cursor-pointer shrink-0 ${
                          selectedImageIndex === idx
                            ? 'border-[#111111] shadow-xs ring-1 ring-black'
                            : 'border-transparent opacity-60 hover:opacity-100'
                        }`}
                      >
                        <img src={img} alt="Thumbnail" className="w-full h-full object-cover" />
                      </button>
                    ))}
                  </div>
                )}
              </div>

            {/* Price, Rating & Stock Status */}
            <div className="flex items-center justify-between py-2 border-b border-black/[0.08]">
              <div>
                <div className="flex items-center gap-1 text-amber-500 mb-1">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <Star key={i} className="w-3.5 h-3.5 fill-current" />
                  ))}
                  <span className="text-[11px] font-bold text-[#111111] ml-1">
                    4.9 (48 reviews)
                  </span>
                </div>
                <div className="flex items-baseline gap-2">
                  <span
                    id="drawerPrice"
                    className="text-2xl font-black text-[#111111] font-mono"
                  >
                    ৳{product.price.toLocaleString()}
                  </span>
                  {product.originalPrice && product.originalPrice > product.price && (
                    <span className="text-xs font-mono text-[#888888] line-through">
                      ৳{product.originalPrice.toLocaleString()}
                    </span>
                  )}
                </div>
              </div>

              <div className="text-right">
                <span
                  className={`text-[11px] font-bold block ${
                    isOutOfStock ? 'text-red-700' : 'text-emerald-700'
                  }`}
                >
                  {isOutOfStock ? 'Out of stock' : `${product.stock} units available`}
                </span>
                <button
                  id="openBtn"
                  onClick={() => setIsExpanded(!isExpanded)}
                  className="mt-1 flex items-center gap-1 px-3 py-1 rounded-full border border-[#cccccc] bg-white hover:bg-black/5 text-[#111111] text-xs font-semibold transition cursor-pointer"
                >
                  <span>{isExpanded ? 'Collapse' : 'Details'}</span>
                  {isExpanded ? (
                    <ChevronUp className="w-3 h-3 text-[#666666]" />
                  ) : (
                    <ChevronDown className="w-3 h-3 text-[#666666]" />
                  )}
                </button>
              </div>
            </div>

            {/* Fabric Highlight */}
            {product.fabric && (
              <div className="px-3.5 py-2.5 rounded-xl bg-white border border-[#dddddd] text-xs">
                <span className="text-[10px] font-bold uppercase tracking-wider text-[#888888] block">
                  Tailored Fabric
                </span>
                <p className="font-semibold text-[#111111] mt-0.5">{product.fabric}</p>
              </div>
            )}

            {/* Size Selector */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-bold text-[#111111] uppercase tracking-wider">
                  Select Size
                </span>
                <span className="text-xs text-[#666666]">
                  Selected: <strong className="text-black font-mono">{activeSize}</strong>
                </span>
              </div>

              <div id="sizeWrap" className="flex flex-wrap gap-2">
                {product.sizes.map((size) => {
                  const isSelected = activeSize === size;
                  return (
                    <button
                      key={size}
                      type="button"
                      onClick={() => onSelectSize(size)}
                      className={`min-h-[44px] min-w-[44px] px-3.5 py-2 rounded-xl text-xs font-bold border transition-all cursor-pointer flex items-center justify-center ${
                        isSelected
                          ? 'bg-[#111111] text-white border-[#111111] shadow-xs ring-2 ring-black/10'
                          : 'bg-white text-[#111111] border-[#cccccc] hover:border-[#111111]'
                      }`}
                    >
                      {size}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Colour Selector */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-bold text-[#111111] uppercase tracking-wider">
                  Select Colour
                </span>
                <span className="text-xs text-[#666666]">
                  Selected: <strong className="text-black">{activeColor}</strong>
                </span>
              </div>

              <div className="flex flex-wrap gap-2">
                {product.colors.map((color) => {
                  const isSelected = activeColor === color;
                  return (
                    <button
                      key={color}
                      type="button"
                      onClick={() => onSelectColor(color)}
                      className={`min-h-[44px] px-3.5 py-2 rounded-xl text-xs font-bold border transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                        isSelected
                          ? 'bg-[#111111] text-white border-[#111111] shadow-xs ring-2 ring-black/10'
                          : 'bg-white text-[#111111] border-[#cccccc] hover:border-[#111111]'
                      }`}
                    >
                      <span>{color}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Quantity Selector */}
            <div>
              <span className="text-xs font-bold text-[#111111] uppercase tracking-wider block mb-2">
                Quantity
              </span>
              <div className="inline-flex items-center gap-2 bg-white px-2 py-1 rounded-xl border border-[#cccccc]">
                <button
                  type="button"
                  onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                  className="min-h-[40px] min-w-[40px] flex items-center justify-center text-[#666666] hover:text-black cursor-pointer rounded-lg hover:bg-black/5"
                >
                  <Minus className="w-4 h-4" />
                </button>
                <span className="w-10 text-center font-mono font-bold text-sm text-[#111111]">
                  {quantity}
                </span>
                <button
                  type="button"
                  onClick={() => setQuantity((q) => Math.min(product.stock || 10, q + 1))}
                  className="min-h-[40px] min-w-[40px] flex items-center justify-center text-[#666666] hover:text-black cursor-pointer rounded-lg hover:bg-black/5"
                >
                  <Plus className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Quick value badges */}
            <div className="grid grid-cols-2 gap-2 pt-1 text-[11px] text-[#555555]">
              <div className="flex items-center gap-1.5 p-2 rounded-lg bg-white border border-[#dddddd]">
                <Truck className="w-3.5 h-3.5 text-[#111111]" />
                <span>Fast Nationwide Delivery</span>
              </div>
              <div className="flex items-center gap-1.5 p-2 rounded-lg bg-white border border-[#dddddd]">
                <ShieldCheck className="w-3.5 h-3.5 text-[#111111]" />
                <span>100% Genuine Fabric</span>
              </div>
            </div>

            {/* Extra Details Accordion */}
            {isExpanded && (
              <div id="drawerExtra" className="space-y-4 pt-2 border-t border-[#dddddd]">
                {/* Description */}
                <div>
                  <h4 className="text-xs font-bold uppercase tracking-wider text-[#111111] mb-1">
                    Description
                  </h4>
                  <p id="drawerDesc" className="text-xs text-[#555555] leading-relaxed">
                    {product.description}
                  </p>
                </div>

                {/* Material & Specifications Breakdown */}
                {product.details && (
                  <div className="bg-white border border-[#dddddd] rounded-xl p-3.5 space-y-2 text-xs">
                    {product.details.material && (
                      <div className="flex justify-between gap-2">
                        <span className="text-[#666666]">Material</span>
                        <span className="font-semibold text-[#111111] text-right">{product.details.material}</span>
                      </div>
                    )}
                    {product.details.fit && (
                      <div className="flex justify-between gap-2">
                        <span className="text-[#666666]">Fit & Cut</span>
                        <span className="font-semibold text-[#111111] text-right">{product.details.fit}</span>
                      </div>
                    )}
                    {product.details.weight && (
                      <div className="flex justify-between gap-2">
                        <span className="text-[#666666]">Weight</span>
                        <span className="font-semibold text-[#111111] text-right">{product.details.weight}</span>
                      </div>
                    )}
                    {product.details.waistband && (
                      <div className="flex justify-between gap-2">
                        <span className="text-[#666666]">Waistband</span>
                        <span className="font-semibold text-[#111111] text-right">{product.details.waistband}</span>
                      </div>
                    )}
                  </div>
                )}

                {/* Related Products ("You may also like") */}
                {relatedProducts.length > 0 && (
                  <div className="pt-2">
                    <h4 className="text-xs font-bold uppercase tracking-wider text-[#111111] mb-2">
                      You May Also Like
                    </h4>
                    <div className="grid grid-cols-2 gap-2">
                      {relatedProducts.map((rel) => (
                        <div
                          key={rel.id}
                          onClick={() => onSelectRelatedProduct && onSelectRelatedProduct(rel)}
                          className="bg-white p-2.5 rounded-xl border border-[#dddddd] hover:border-black transition cursor-pointer flex flex-col justify-between"
                        >
                          <img
                            src={rel.image}
                            alt={rel.name}
                            className="w-full h-24 object-cover rounded-lg mb-1.5"
                          />
                          <div>
                            <span className="text-[11px] font-bold text-[#111111] block truncate">
                              {rel.name}
                            </span>
                            <span className="text-[11px] font-mono font-bold text-emerald-800">
                              ৳{rel.price.toLocaleString()}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Customer Reviews & Add Review Form */}
                <div className="pt-2">
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="text-xs font-bold uppercase tracking-wider text-[#111111]">
                      Customer Feedback
                    </h4>
                    <button
                      type="button"
                      onClick={() => setShowReviewForm(!showReviewForm)}
                      className="text-[11px] font-bold text-black underline cursor-pointer"
                    >
                      {showReviewForm ? 'Cancel' : 'Write Review'}
                    </button>
                  </div>

                  {showReviewForm && (
                    <form onSubmit={handleSubmitReview} className="bg-white p-3.5 rounded-xl border border-[#dddddd] space-y-2.5 mb-3 text-xs">
                      {reviewSubmitted ? (
                        <div className="text-emerald-700 font-bold text-center py-2 flex items-center justify-center gap-1.5">
                          <Check className="w-4 h-4" />
                          <span>Thank you! Your review was submitted for approval.</span>
                        </div>
                      ) : (
                        <>
                          <div>
                            <label className="text-[10px] font-bold uppercase text-[#666666] block mb-1">
                              Your Name
                            </label>
                            <input
                              type="text"
                              required
                              value={reviewerName}
                              onChange={(e) => setReviewerName(e.target.value)}
                              placeholder="e.g. Tanvir Ahmed"
                              className="w-full px-2.5 py-1.5 rounded-lg border border-[#cccccc]"
                            />
                          </div>

                          <div>
                            <label className="text-[10px] font-bold uppercase text-[#666666] block mb-1">
                              Rating
                            </label>
                            <div className="flex items-center gap-1 text-amber-500">
                              {[1, 2, 3, 4, 5].map((star) => (
                                <button
                                  key={star}
                                  type="button"
                                  onClick={() => setReviewRating(star)}
                                  className="cursor-pointer"
                                >
                                  <Star
                                    className={`w-4 h-4 ${
                                      star <= reviewRating ? 'fill-current' : 'text-gray-300'
                                    }`}
                                  />
                                </button>
                              ))}
                            </div>
                          </div>

                          <div>
                            <label className="text-[10px] font-bold uppercase text-[#666666] block mb-1">
                              Your Review
                            </label>
                            <textarea
                              required
                              rows={2}
                              value={reviewComment}
                              onChange={(e) => setReviewComment(e.target.value)}
                              placeholder="Share your thoughts on fit, fabric, and drape..."
                              className="w-full px-2.5 py-1.5 rounded-lg border border-[#cccccc]"
                            />
                          </div>

                          <button
                            type="submit"
                            className="w-full py-2 bg-black text-white font-bold rounded-lg uppercase tracking-wider text-[11px] cursor-pointer"
                          >
                            Submit Review
                          </button>
                        </>
                      )}
                    </form>
                  )}

                  <div className="space-y-2 text-xs">
                    <div className="p-2.5 bg-white rounded-lg border border-[#eeeeee]">
                      <div className="flex items-center gap-1 text-amber-500 mb-1">
                        {Array.from({ length: 5 }).map((_, i) => (
                          <Star key={i} className="w-3 h-3 fill-current" />
                        ))}
                      </div>
                      <p className="text-[#555555]">
                        "The drape is remarkable. Fits over sneakers seamlessly."
                      </p>
                      <span className="text-[10px] text-[#888888] block mt-1">
                        Shakil R. • Verified Purchase
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Sticky Bottom Action Bar respecting env(safe-area-inset-bottom) */}
          <div className="p-4 sm:p-5 border-t border-[#dddddd] bg-[#f8f5ef] shadow-lg space-y-2.5 shrink-0 pb-safe">
            <div className="flex items-center justify-between">
              <div>
                <span className="text-[10px] text-[#777777] font-bold uppercase tracking-wider block">
                  Total ({quantity} {quantity > 1 ? 'items' : 'item'})
                </span>
                <div className="flex items-baseline gap-2">
                  <span className="text-xl sm:text-2xl font-black text-[#111111] font-mono">
                    ৳{(product.price * quantity).toLocaleString()}
                  </span>
                  {product.originalPrice && product.originalPrice > product.price && (
                    <span className="text-xs font-mono text-[#888888] line-through">
                      ৳{(product.originalPrice * quantity).toLocaleString()}
                    </span>
                  )}
                </div>
              </div>
              <span
                className={`text-xs font-bold px-2.5 py-1 rounded-full ${
                  isOutOfStock ? 'bg-red-100 text-red-700' : 'bg-emerald-100 text-emerald-800'
                }`}
              >
                {isOutOfStock ? 'Out of stock' : `${product.stock} in stock`}
              </span>
            </div>

            <div className="grid grid-cols-2 gap-2.5">
              <button
                type="button"
                disabled={isOutOfStock}
                onClick={handleAddToCart}
                className={`min-h-[46px] w-full py-3 rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 cursor-pointer shadow-xs border active:scale-[0.98] ${
                  isOutOfStock
                    ? 'bg-gray-200 border-gray-300 text-gray-400 cursor-not-allowed'
                    : isAdded
                    ? 'bg-emerald-600 border-emerald-600 text-white'
                    : 'bg-white border-[#111111] text-[#111111] hover:bg-black/5'
                }`}
              >
                {isAdded ? (
                  <>
                    <Check className="w-4 h-4" />
                    <span>Added!</span>
                  </>
                ) : (
                  <>
                    <ShoppingBag className="w-4 h-4" />
                    <span>Add to Cart</span>
                  </>
                )}
              </button>

              <button
                type="button"
                disabled={isOutOfStock}
                onClick={handleBuyNow}
                className={`min-h-[46px] w-full py-3 rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 cursor-pointer shadow-sm active:scale-[0.98] ${
                  isOutOfStock
                    ? 'bg-gray-300 text-gray-400 cursor-not-allowed'
                    : 'bg-[#111111] hover:bg-black text-white'
                }`}
              >
                <Zap className="w-4 h-4 fill-current text-amber-300" />
                <span>Buy Now</span>
              </button>
            </div>
          </div>
        </div>
      </aside>
    </>
  );
};
