import React, { useState } from 'react';
import { BrandConfig, ViewMode } from '../types';
import {
  Sparkles,
  CircleDot,
  LayoutGrid,
  PackageCheck,
  Menu,
  X,
  ShoppingBag,
  Search,
  ArrowRight,
} from 'lucide-react';

interface TopbarProps {
  brand: BrandConfig;
  currentMode: ViewMode;
  onSelectMode: (mode: ViewMode) => void;
  cartCount: number;
  onOpenCart: () => void;
  onOpenAi: () => void;
  onOpenTracking: () => void;
  onSearchClick?: () => void;
}

export const Topbar: React.FC<TopbarProps> = ({
  brand,
  currentMode,
  onSelectMode,
  cartCount,
  onOpenCart,
  onOpenAi,
  onOpenTracking,
}) => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const handleNavClick = (sectionId: string, e?: React.MouseEvent) => {
    e?.preventDefault();
    setMobileMenuOpen(false);
    setSearchOpen(false);
    if (currentMode !== 'grid') {
      onSelectMode('grid');
    }
    setTimeout(() => {
      const el = document.getElementById(sectionId);
      if (el) {
        el.scrollIntoView({ behavior: 'smooth' });
      }
    }, 100);
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (currentMode !== 'grid') {
      onSelectMode('grid');
    }
    setSearchOpen(false);
    setMobileMenuOpen(false);
    setTimeout(() => {
      const searchInput = document.querySelector('#shop input[type="text"]') as HTMLInputElement | null;
      if (searchInput) {
        searchInput.value = searchQuery;
        searchInput.dispatchEvent(new Event('input', { bubbles: true }));
        searchInput.focus();
        const shopSection = document.getElementById('shop');
        shopSection?.scrollIntoView({ behavior: 'smooth' });
      } else {
        const shopSection = document.getElementById('shop');
        shopSection?.scrollIntoView({ behavior: 'smooth' });
      }
    }, 120);
  };

  return (
    <>
      <header
        id="topbar"
        className="h-[60px] sm:h-[70px] flex items-center justify-between px-3 sm:px-[5%] border-b border-[#dddddd] bg-[#f8f5ef]/95 backdrop-blur-md sticky top-0 z-30 transition-all select-none w-full max-w-full overflow-hidden"
      >
        {/* Brand & Logo */}
        <div className="flex items-center gap-2 sm:gap-3 shrink-0">
          <div
            className="flex items-center gap-2 sm:gap-2.5 cursor-pointer py-1"
            onClick={(e) => handleNavClick('home', e)}
          >
            <img
              id="logo"
              src={brand.logo || '/clothiqo-logo.jpg'}
              alt={brand.name || 'CLOTHIQO'}
              referrerPolicy="no-referrer"
              className="w-[34px] h-[34px] sm:w-[40px] sm:h-[40px] object-contain rounded-xl bg-white border border-[#dddddd] p-1 shadow-2xs shrink-0"
            />
            <span className="logo text-lg sm:text-2xl font-black tracking-[1.5px] sm:tracking-[3px] text-[#111111] uppercase truncate max-w-[130px] xs:max-w-[180px] sm:max-w-none">
              {brand.name || 'CLOTHIQO'}
            </span>
          </div>
        </div>

        {/* Desktop Navigation Links */}
        <nav className="hidden lg:flex items-center gap-7 text-xs sm:text-sm font-bold text-[#111111]">
          <a
            href="#home"
            onClick={(e) => handleNavClick('home', e)}
            className="hover:opacity-60 transition text-[#111111]"
          >
            Home
          </a>
          <a
            href="#shop"
            onClick={(e) => handleNavClick('shop', e)}
            className="hover:opacity-60 transition text-[#111111]"
          >
            Shop
          </a>
          <a
            href="#about"
            onClick={(e) => handleNavClick('about', e)}
            className="hover:opacity-60 transition text-[#111111]"
          >
            About
          </a>
          <a
            href="#support"
            onClick={(e) => handleNavClick('support', e)}
            className="hover:opacity-60 transition text-[#111111]"
          >
            Support
          </a>
          <button
            type="button"
            onClick={onOpenTracking}
            className="hover:opacity-60 transition text-[#111111] flex items-center gap-1.5 font-bold cursor-pointer min-h-[44px]"
          >
            <PackageCheck className="w-4 h-4 text-amber-700" />
            <span>Track Order</span>
          </button>
        </nav>

        {/* Right Actions: Search, Mode Switcher, Cart, Hamburger */}
        <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
          {/* Search Toggle Button (44px min touch target) */}
          <button
            type="button"
            onClick={() => setSearchOpen(!searchOpen)}
            className="w-10 h-10 sm:w-11 sm:h-11 rounded-full flex items-center justify-center text-[#111111] hover:bg-black/5 active:bg-black/10 transition cursor-pointer"
            aria-label="Search collection"
            title="Search products"
          >
            <Search className="w-4 h-4 sm:w-4.5 sm:h-4.5" />
          </button>

          {/* Mode Switcher: Orbit vs Store */}
          <div className="flex items-center bg-[#ece7dc] p-0.5 sm:p-1 rounded-full border border-black/[0.06]">
            <button
              id="circleBtn"
              type="button"
              onClick={() => onSelectMode('circle')}
              className={`flex items-center gap-1 px-2.5 sm:px-3 py-1.5 rounded-full text-xs font-bold transition-all cursor-pointer min-h-[32px] sm:min-h-[36px] ${
                currentMode === 'circle'
                  ? 'bg-[#111111] text-white shadow-xs'
                  : 'text-[#555555] hover:text-[#111111]'
              }`}
              title="Orbital 360 View"
            >
              <CircleDot className="w-3.5 h-3.5" />
              <span className="hidden xs:inline">Orbit</span>
            </button>
            <button
              id="gridBtn"
              type="button"
              onClick={() => onSelectMode('grid')}
              className={`flex items-center gap-1 px-2.5 sm:px-3 py-1.5 rounded-full text-xs font-bold transition-all cursor-pointer min-h-[32px] sm:min-h-[36px] ${
                currentMode === 'grid'
                  ? 'bg-[#111111] text-white shadow-xs'
                  : 'text-[#555555] hover:text-[#111111]'
              }`}
              title="Catalog Store View"
            >
              <LayoutGrid className="w-3.5 h-3.5" />
              <span className="hidden xs:inline">Store</span>
            </button>
          </div>

          {/* AI Stylist desktop button */}
          <button
            id="ask-ai-center-pill"
            type="button"
            onClick={onOpenAi}
            className="hidden md:flex items-center gap-1.5 bg-white border border-[#cccccc] hover:border-[#111111] rounded-full px-3.5 py-1.5 text-xs font-bold text-[#111111] shadow-2xs transition cursor-pointer min-h-[44px]"
            title="Ask AI Trouser Stylist"
          >
            <Sparkles className="w-3.5 h-3.5 text-amber-600" />
            <span>AI Stylist</span>
          </button>

          {/* Cart Button (min 44px touch target) */}
          <button
            id="cartBtn"
            type="button"
            onClick={onOpenCart}
            className="cart-btn min-h-[44px] px-3 sm:px-4 py-2 rounded-full bg-[#111111] hover:bg-black text-white text-xs sm:text-sm font-bold flex items-center gap-1.5 cursor-pointer shadow-xs active:scale-95 transition"
            aria-label={`View Cart, ${cartCount} items`}
          >
            <ShoppingBag className="w-4 h-4" />
            <span className="hidden sm:inline">Cart</span>
            <span className="font-mono text-xs">({cartCount})</span>
          </button>

          {/* Mobile Menu Toggle Button (min 44px touch target) */}
          <button
            type="button"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="lg:hidden min-w-[44px] min-h-[44px] p-2.5 rounded-xl bg-white border border-[#dddddd] text-[#111111] hover:bg-black/5 active:scale-95 transition cursor-pointer flex items-center justify-center"
            aria-label="Toggle navigation menu"
          >
            {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </header>

      {/* Expandable Compact Search Dropdown */}
      {searchOpen && (
        <div className="bg-white border-b border-[#dddddd] px-4 py-3 shadow-md sticky top-[60px] sm:top-[70px] z-29 animate-in slide-in-from-top duration-200">
          <form onSubmit={handleSearchSubmit} className="max-w-xl mx-auto flex items-center gap-2">
            <div className="relative flex-1">
              <Search className="w-4 h-4 text-[#888888] absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search baggy, formal, fabric, size..."
                autoFocus
                className="w-full pl-9 pr-3 py-2.5 rounded-xl border border-[#cccccc] text-xs sm:text-sm bg-[#fafafa] focus:bg-white focus:border-black outline-none"
              />
            </div>
            <button
              type="submit"
              className="px-4 py-2.5 rounded-xl bg-[#111111] text-white text-xs font-bold uppercase tracking-wider cursor-pointer"
            >
              Search
            </button>
            <button
              type="button"
              onClick={() => setSearchOpen(false)}
              className="p-2 text-[#777777] hover:text-black cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </form>
        </div>
      )}

      {/* Mobile Drawer Navigation (Menu: Home, Shop, About, Support, Track Order, AI Stylist) */}
      {mobileMenuOpen && (
        <div
          className="lg:hidden fixed inset-0 top-[60px] sm:top-[70px] z-40 bg-black/50 backdrop-blur-xs flex flex-col"
          onClick={() => setMobileMenuOpen(false)}
        >
          <div
            className="bg-[#f8f5ef] border-b border-[#dddddd] p-5 space-y-4 shadow-2xl animate-in slide-in-from-top duration-200 max-h-[calc(100dvh-70px)] overflow-y-auto pb-safe"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex flex-col space-y-1 text-sm font-bold text-[#111111]">
              <a
                href="#home"
                onClick={(e) => handleNavClick('home', e)}
                className="min-h-[44px] flex items-center px-4 rounded-xl hover:bg-white/80 active:bg-black/5 transition"
              >
                Home
              </a>
              <a
                href="#shop"
                onClick={(e) => handleNavClick('shop', e)}
                className="min-h-[44px] flex items-center px-4 rounded-xl hover:bg-white/80 active:bg-black/5 transition"
              >
                Shop Collection
              </a>
              <a
                href="#about"
                onClick={(e) => handleNavClick('about', e)}
                className="min-h-[44px] flex items-center px-4 rounded-xl hover:bg-white/80 active:bg-black/5 transition"
              >
                About CLOTHIQO
              </a>
              <a
                href="#support"
                onClick={(e) => handleNavClick('support', e)}
                className="min-h-[44px] flex items-center px-4 rounded-xl hover:bg-white/80 active:bg-black/5 transition"
              >
                Customer Support
              </a>
            </div>

            <div className="pt-3 border-t border-[#dddddd] flex flex-col gap-2.5">
              <button
                type="button"
                onClick={() => {
                  setMobileMenuOpen(false);
                  onOpenTracking();
                }}
                className="min-h-[44px] w-full flex items-center justify-between px-4 py-3 rounded-xl bg-white border border-[#cccccc] text-xs font-bold text-[#111111] shadow-2xs cursor-pointer active:scale-98 transition"
              >
                <div className="flex items-center gap-2.5">
                  <PackageCheck className="w-4 h-4 text-amber-700" />
                  <span>Track Order</span>
                </div>
                <ArrowRight className="w-3.5 h-3.5 text-[#888888]" />
              </button>

              <button
                type="button"
                onClick={() => {
                  setMobileMenuOpen(false);
                  onOpenAi();
                }}
                className="min-h-[44px] w-full flex items-center justify-between px-4 py-3 rounded-xl bg-white border border-[#cccccc] text-xs font-bold text-[#111111] shadow-2xs cursor-pointer active:scale-98 transition"
              >
                <div className="flex items-center gap-2.5">
                  <Sparkles className="w-4 h-4 text-amber-600" />
                  <span>AI Stylist</span>
                </div>
                <ArrowRight className="w-3.5 h-3.5 text-[#888888]" />
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
