import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Product } from '../types';
import { Sparkles, ArrowRight, RotateCw, ChevronLeft, ChevronRight } from 'lucide-react';

interface CircleViewProps {
  products: Product[];
  selectedProduct: Product;
  onSelectProduct: (product: Product) => void;
  onOpenDrawer: (product: Product) => void;
  brandName: string;
}

export const CircleView: React.FC<CircleViewProps> = ({
  products,
  selectedProduct,
  onSelectProduct,
  onOpenDrawer,
  brandName,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [rotationOffset, setRotationOffset] = useState<number>(0);
  const [radius, setRadius] = useState<number>(250);
  const [isAutoRotate, setIsAutoRotate] = useState<boolean>(false);
  const [containerSize, setContainerSize] = useState<{ width: number; height: number }>({
    width: 800,
    height: 700,
  });

  // Touch drag tracking
  const touchStartRef = useRef<{ x: number; y: number; angle: number; time: number } | null>(null);
  const isDraggingRef = useRef<boolean>(false);
  const rafRef = useRef<number | null>(null);
  const lastTimeRef = useRef<number>(performance.now());

  // Screen size classification
  const isMobile = containerSize.width < 640;
  const isExtraSmall = containerSize.width < 380;

  // Sizing constants based on viewport
  const nodeWidth = isExtraSmall ? 82 : isMobile ? 96 : 130;
  const nodeHeight = isExtraSmall ? 112 : isMobile ? 130 : 170;
  const heroSize = isExtraSmall ? 130 : isMobile ? 155 : 240;

  // Measure container and dynamically calculate safe radius
  useEffect(() => {
    if (!containerRef.current) return;

    const updateSize = () => {
      if (!containerRef.current) return;
      const width = containerRef.current.clientWidth;
      const height = containerRef.current.clientHeight;
      setContainerSize({ width, height });

      const isSm = width < 640;
      const isXs = width < 380;
      const nW = isXs ? 82 : isSm ? 96 : 130;
      const nH = isXs ? 112 : isSm ? 130 : 170;

      // Ensure nodes never clip outside viewport boundaries
      const maxSafeRadiusX = (width / 2) - (nW / 2) - 10;
      const maxSafeRadiusY = (height / 2) - (nH / 2) - 35; // account for header and footer controls
      const maxSafeRadius = Math.max(70, Math.min(maxSafeRadiusX, maxSafeRadiusY));

      if (isSm) {
        setRadius(Math.min(maxSafeRadius, 140));
      } else {
        setRadius(Math.min(maxSafeRadius, 270));
      }
    };

    updateSize();
    const observer = new ResizeObserver(updateSize);
    observer.observe(containerRef.current);
    return () => observer.disconnect();
  }, []);

  // Check prefers-reduced-motion
  useEffect(() => {
    if (window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      setIsAutoRotate(false);
    }
  }, []);

  // requestAnimationFrame loop: adapts to 60Hz/120Hz display refresh rates, pauses when tab is hidden
  useEffect(() => {
    let active = true;

    const handleVisibility = () => {
      if (document.hidden) {
        lastTimeRef.current = performance.now();
      }
    };
    document.addEventListener('visibilitychange', handleVisibility);

    const loop = (now: number) => {
      if (!active) return;
      const dt = Math.min((now - lastTimeRef.current) / 1000, 0.1); // cap at 100ms
      lastTimeRef.current = now;

      if (isAutoRotate && !document.hidden && !isDraggingRef.current) {
        // Rotate smoothly at constant angular velocity (rad/s)
        const speed = 0.22; // radians per second
        setRotationOffset((prev) => prev + speed * dt);
      }

      rafRef.current = requestAnimationFrame(loop);
    };

    rafRef.current = requestAnimationFrame(loop);

    return () => {
      active = false;
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      document.removeEventListener('visibilitychange', handleVisibility);
    };
  }, [isAutoRotate]);

  const rotateStep = useCallback((direction: 'next' | 'prev') => {
    const step = (Math.PI * 2) / Math.max(products.length, 1);
    setRotationOffset((prev) => prev + (direction === 'next' ? -step : step));
  }, [products.length]);

  // Touch gesture support: User can swipe horizontally or circularly to spin the orbit
  const handleTouchStart = (e: React.TouchEvent) => {
    if (e.touches.length !== 1 || !containerRef.current) return;
    const touch = e.touches[0];
    const rect = containerRef.current.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;
    const angle = Math.atan2(touch.clientY - centerY, touch.clientX - centerX);

    touchStartRef.current = {
      x: touch.clientX,
      y: touch.clientY,
      angle,
      time: performance.now(),
    };
    isDraggingRef.current = false;
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!touchStartRef.current || !containerRef.current || e.touches.length !== 1) return;
    const touch = e.touches[0];
    const dx = touch.clientX - touchStartRef.current.x;
    const dy = touch.clientY - touchStartRef.current.y;

    // Detect if movement is intentional spin
    if (!isDraggingRef.current && Math.sqrt(dx * dx + dy * dy) > 8) {
      isDraggingRef.current = true;
    }

    if (isDraggingRef.current) {
      const rect = containerRef.current.getBoundingClientRect();
      const centerX = rect.left + rect.width / 2;
      const centerY = rect.top + rect.height / 2;
      const currentAngle = Math.atan2(touch.clientY - centerY, touch.clientX - centerX);
      let angleDiff = currentAngle - touchStartRef.current.angle;

      // Normalize diff
      while (angleDiff > Math.PI) angleDiff -= Math.PI * 2;
      while (angleDiff < -Math.PI) angleDiff += Math.PI * 2;

      setRotationOffset((prev) => prev + angleDiff);
      touchStartRef.current.angle = currentAngle;
    }
  };

  const handleTouchEnd = () => {
    touchStartRef.current = null;
    setTimeout(() => {
      isDraggingRef.current = false;
    }, 50);
  };

  return (
    <div
      ref={containerRef}
      id="circleView"
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
      style={{ touchAction: 'pan-y' }}
      className="absolute inset-0 flex flex-col items-center justify-center select-none overflow-hidden w-full max-w-full"
    >
      {/* Background Ambience */}
      <div className="absolute inset-0 pointer-events-none opacity-40 bg-[radial-gradient(#e5e7eb_1px,transparent_1px)] [background-size:24px_24px]" />

      {/* Interactive Controls Overlay */}
      <div className="absolute top-3 sm:top-4 left-3 sm:left-6 z-30 flex items-center gap-2">
        <button
          type="button"
          onClick={() => setIsAutoRotate(!isAutoRotate)}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium border transition min-h-[36px] cursor-pointer active:scale-95 ${
            isAutoRotate
              ? 'bg-black text-white border-black shadow-xs'
              : 'bg-white/90 backdrop-blur-sm text-[#4b5563] border-[#e5e7eb] hover:border-black/20'
          }`}
          title="Toggle orbit rotation"
        >
          <RotateCw className={`w-3.5 h-3.5 ${isAutoRotate ? 'animate-spin' : ''}`} />
          <span className="hidden xs:inline">{isAutoRotate ? 'Rotating' : 'Orbit'}</span>
        </button>

        <div className="flex items-center bg-white/90 backdrop-blur-sm border border-[#e5e7eb] rounded-full p-0.5 shadow-2xs">
          <button
            type="button"
            onClick={() => rotateStep('prev')}
            className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-black/5 text-[#4b5563] transition active:scale-90 cursor-pointer"
            title="Rotate backward"
            aria-label="Rotate backward"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <button
            type="button"
            onClick={() => rotateStep('next')}
            className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-black/5 text-[#4b5563] transition active:scale-90 cursor-pointer"
            title="Rotate forward"
            aria-label="Rotate forward"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Orbit Container Stage */}
      <div
        className="relative flex items-center justify-center pointer-events-none"
        style={{
          width: `${radius * 2 + nodeWidth}px`,
          height: `${radius * 2 + nodeHeight}px`,
        }}
      >
        {/* Orbital Guide Rings */}
        <div
          className="absolute rounded-full border border-dashed border-black/[0.12] pointer-events-none transition-all duration-300"
          style={{
            width: `${radius * 2}px`,
            height: `${radius * 2}px`,
          }}
        />
        <div
          className="absolute rounded-full border border-black/[0.04] pointer-events-none transition-all duration-300"
          style={{
            width: `${radius * 2 + (isMobile ? 40 : 80)}px`,
            height: `${radius * 2 + (isMobile ? 40 : 80)}px`,
          }}
        />

        {/* Center Hero Card */}
        <div
          id="hero-center"
          className="relative z-10 rounded-[24px] sm:rounded-[32px] overflow-hidden text-white flex flex-col justify-between shadow-[0_16px_50px_rgba(0,0,0,0.18)] transition-all duration-300 group pointer-events-auto shrink-0"
          style={{
            width: `${heroSize}px`,
            height: `${heroSize}px`,
            background: `linear-gradient(135deg, var(--brand), var(--brand-2))`,
          }}
        >
          {/* Background image preview if available */}
          {selectedProduct.image && (
            <div className="absolute inset-0 z-0 opacity-40 group-hover:opacity-50 transition-opacity">
              <img
                src={selectedProduct.image}
                alt={selectedProduct.name}
                referrerPolicy="no-referrer"
                loading="lazy"
                className="w-full h-full object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/40 to-transparent" />
            </div>
          )}

          {/* Content container */}
          <div className="relative z-10 p-3.5 sm:p-5 h-full flex flex-col justify-between">
            {/* Top badge */}
            <div className="flex items-center justify-between">
              <span className="inline-flex items-center gap-1 text-[9px] sm:text-[10px] font-bold tracking-wider uppercase px-2 py-0.5 rounded-full bg-white/25 backdrop-blur-md border border-white/20 text-white shadow-xs">
                <Sparkles className="w-2.5 h-2.5 sm:w-3 sm:h-3" />
                Featured
              </span>
              <span className="text-white/90 text-[10px] sm:text-xs font-semibold drop-shadow-xs truncate max-w-[80px]">
                {brandName}
              </span>
            </div>

            {/* Bottom Title & Action */}
            <div>
              <small className="block text-white/90 text-[9px] sm:text-[11px] uppercase tracking-wider mb-0.5 font-bold drop-shadow-xs truncate">
                {selectedProduct.category || 'Premium Cut'}
              </small>
              <h2
                id="heroTitle"
                className="text-xs sm:text-lg font-extrabold tracking-tight leading-tight line-clamp-2 drop-shadow-sm"
              >
                {selectedProduct.name}
              </h2>
              <div className="mt-1.5 sm:mt-2 flex items-center justify-between pt-1.5 border-t border-white/25">
                <span className="text-xs sm:text-base font-black text-white drop-shadow-xs">
                  {selectedProduct.priceFormatted || `৳${selectedProduct.price.toLocaleString()}`}
                </span>
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    onOpenDrawer(selectedProduct);
                  }}
                  className="flex items-center gap-1 text-[10px] sm:text-xs font-bold bg-white text-[#111111] px-2.5 sm:px-3 py-1 rounded-full hover:bg-white/95 shadow-xs transition cursor-pointer active:scale-95"
                >
                  <span>Details</span>
                  <ArrowRight className="w-2.5 h-2.5 sm:w-3 sm:h-3" />
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Orbiting Product Nodes */}
        {products.map((product, index) => {
          const total = products.length;
          const angle = (Math.PI * 2 * index) / total - Math.PI / 2 + rotationOffset;
          const x = Math.cos(angle) * radius;
          const y = Math.sin(angle) * radius;
          const isSelected = String(selectedProduct.id) === String(product.id);
          const naturalTilt = index % 2 === 0 ? 4 : -4;

          return (
            <div
              key={product.id}
              onClick={(e) => {
                e.stopPropagation();
                onSelectProduct(product);
                onOpenDrawer(product);
              }}
              style={{
                width: `${nodeWidth}px`,
                height: `${nodeHeight}px`,
                transform: `translate(${x}px, ${y}px) rotate(${isSelected ? 0 : naturalTilt}deg) scale(${isSelected ? 1.06 : 1})`,
                transition: 'transform 0.3s cubic-bezier(0.16, 1, 0.3, 1), box-shadow 0.2s ease',
              }}
              id={`product-node-${product.id}`}
              className={`product-node absolute left-1/2 top-1/2 -ml-[${nodeWidth / 2}px] -mt-[${nodeHeight / 2}px] rounded-[18px] sm:rounded-[22px] p-1.5 sm:p-2 bg-white border cursor-pointer select-none flex flex-col justify-between shadow-[0_8px_24px_rgba(0,0,0,0.08)] active:scale-95 hover:shadow-[0_16px_36px_rgba(0,0,0,0.15)] z-20 pointer-events-auto transition-all ${
                isSelected
                  ? 'border-[var(--brand)] ring-2 ring-[var(--brand-2)]/50 shadow-[0_12px_30px_rgba(0,0,0,0.16)]'
                  : 'border-[#e5e7eb] hover:border-black/25'
              }`}
            >
              {/* Product Thumbnail */}
              <div
                className="w-full rounded-[12px] sm:rounded-[14px] overflow-hidden flex items-center justify-center font-extrabold relative transition-colors bg-[#f3f4f6]"
                style={{ height: isExtraSmall ? '60px' : isMobile ? '72px' : '95px' }}
              >
                {product.image ? (
                  <img
                    src={product.image}
                    alt={product.name}
                    referrerPolicy="no-referrer"
                    loading="lazy"
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <span className="tracking-tighter text-[#111111] text-lg">{product.icon}</span>
                )}
                {product.tag && (
                  <span className="absolute top-1 left-1 text-[7px] sm:text-[8px] font-extrabold uppercase tracking-wider px-1 py-0.5 rounded-full bg-black/70 text-white backdrop-blur-xs">
                    {product.tag}
                  </span>
                )}
              </div>

              {/* Product Label */}
              <div className="pt-1 px-0.5">
                <b className="block text-[10px] sm:text-[11px] font-bold text-[#111111] leading-tight truncate">
                  {product.name}
                </b>
                <div className="flex items-center justify-between mt-0.5">
                  <span className="text-[10px] sm:text-xs font-black text-[#111111]">
                    {product.priceFormatted || `৳${product.price.toLocaleString()}`}
                  </span>
                  <span className="text-[9px] text-[#6b7280] font-semibold hidden xs:inline truncate max-w-[45px]">
                    {product.category.replace(' Pants', '')}
                  </span>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Subtle footer hint */}
      <div className="absolute bottom-3 sm:bottom-5 text-center text-[11px] sm:text-xs text-[#6b7280] bg-white/80 backdrop-blur-md px-3.5 py-1.5 rounded-full border border-black/[0.05] shadow-2xs pointer-events-none max-w-[90vw] truncate">
        {isMobile ? 'Swipe to rotate orbit • Tap cut to inspect' : 'Click or swipe any cut to inspect details'}
      </div>
    </div>
  );
};
