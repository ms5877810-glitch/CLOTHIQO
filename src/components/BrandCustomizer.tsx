import React, { useRef } from 'react';
import { BrandConfig } from '../types';
import { BRAND_PRESETS } from '../data/products';
import { X, Palette, Sparkles, RotateCcw, Check, Upload, Trash2 } from 'lucide-react';

interface BrandCustomizerProps {
  isOpen: boolean;
  onClose: () => void;
  brand: BrandConfig;
  onUpdateBrand: (updated: BrandConfig) => void;
  onResetDefault: () => void;
}

export const BrandCustomizer: React.FC<BrandCustomizerProps> = ({
  isOpen,
  onClose,
  brand,
  onUpdateBrand,
  onResetDefault,
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const objectUrl = URL.createObjectURL(file);
      // Directly update DOM element #logo if present
      const logoEl = document.getElementById("logo") as HTMLImageElement | null;
      if (logoEl) {
        logoEl.src = objectUrl;
      }
      const reader = new FileReader();
      reader.onload = (event) => {
        const dataUrl = event.target?.result as string;
        onUpdateBrand({
          ...brand,
          logo: dataUrl || objectUrl
        });
      };
      reader.readAsDataURL(file);
    }
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    const file = e.dataTransfer.files?.[0];
    if (file && file.type.startsWith('image/')) {
      const objectUrl = URL.createObjectURL(file);
      const logoEl = document.getElementById("logo") as HTMLImageElement | null;
      if (logoEl) {
        logoEl.src = objectUrl;
      }
      const reader = new FileReader();
      reader.onload = (event) => {
        const dataUrl = event.target?.result as string;
        onUpdateBrand({
          ...brand,
          logo: dataUrl || objectUrl
        });
      };
      reader.readAsDataURL(file);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 select-none overflow-y-auto">
      {/* Dimmed Overlay */}
      <div
        onClick={onClose}
        className="fixed inset-0 bg-black/40 backdrop-blur-xs transition-opacity animate-in fade-in"
      />

      {/* Modal Dialog */}
      <div
        id="brand-customizer-modal"
        className="relative w-full max-w-lg bg-white rounded-[32px] border border-[#e5e7eb] shadow-2xl p-6 sm:p-7 z-10 space-y-5 animate-in zoom-in-95 duration-200 max-h-[90vh] overflow-y-auto"
      >
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-black/[0.06]">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-xl bg-[var(--brand)]/10 text-[var(--brand)] flex items-center justify-center">
              <Palette className="w-5 h-5" />
            </div>
            <div>
              <h2 className="font-extrabold text-xl text-[#111111] tracking-tight">
                Brand Customizer
              </h2>
              <p className="text-xs text-[#6b7280]">
                Live logo, theme palette, and store identity
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="w-9 h-9 rounded-full border border-[#e5e7eb] hover:bg-black/5 flex items-center justify-center text-[#4b5563] transition cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Live Brand Preview Card */}
        <div className="bg-[#f9fafb] border border-[#e5e7eb] rounded-2xl p-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            {brand.logo ? (
              <img
                src={brand.logo}
                alt={`${brand.name} preview`}
                referrerPolicy="no-referrer"
                className="w-12 h-12 rounded-xl object-contain bg-white border border-[#e5e7eb] p-1 shadow-sm"
              />
            ) : (
              <div
                className="w-12 h-12 rounded-xl grid place-items-center text-white font-extrabold text-xl shadow-md transition-all"
                style={{
                  background: `linear-gradient(135deg, ${brand.primary}, ${brand.secondary})`
                }}
              >
                {brand.name.charAt(0) || 'N'}
              </div>
            )}
            <div>
              <h4 className="font-extrabold text-base text-[#111111]">
                {brand.name || 'Nova Store'}
              </h4>
              <span className="text-xs text-[#6b7280]">
                {brand.primary} • {brand.secondary}
              </span>
            </div>
          </div>

          <span className="inline-flex items-center gap-1 text-[11px] font-bold text-[var(--brand)] bg-white px-3 py-1 rounded-full border border-[#e5e7eb] shadow-2xs">
            <Sparkles className="w-3 h-3" /> Live
          </span>
        </div>

        {/* Inputs */}
        <div className="space-y-4 text-xs">
          {/* Brand Name Input */}
          <div>
            <label className="block font-bold text-[#111111] uppercase tracking-wider mb-1.5">
              Brand / Store Name
            </label>
            <input
              type="text"
              value={brand.name}
              onChange={(e) => onUpdateBrand({ ...brand, name: e.target.value })}
              placeholder="e.g. Clothiqo, Nova Store, Aether Studios"
              className="w-full h-11 px-3.5 rounded-xl border border-[#e5e7eb] focus:border-black focus:outline-none text-sm transition bg-white"
            />
          </div>

          {/* Logo Upload Zone */}
          <div>
            <label className="block font-bold text-[#111111] uppercase tracking-wider mb-1.5">
              Brand Logo Image
            </label>
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileChange}
              accept="image/*"
              className="hidden"
            />

            <div
              onDragOver={(e) => e.preventDefault()}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
              className="border-2 border-dashed border-[#e5e7eb] hover:border-[var(--brand)] rounded-2xl p-4 text-center cursor-pointer transition-colors bg-white hover:bg-black/[0.01]"
            >
              {brand.logo ? (
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <img
                      src={brand.logo}
                      alt="Brand logo"
                      referrerPolicy="no-referrer"
                      className="w-10 h-10 object-contain rounded-lg border border-[#e5e7eb] p-1 bg-white"
                    />
                    <div className="text-left">
                      <p className="font-bold text-[#111111] text-xs">Custom Logo Loaded</p>
                      <p className="text-[11px] text-[#6b7280]">Click or drag to replace</p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      onUpdateBrand({ ...brand, logo: '' });
                    }}
                    className="p-2 rounded-xl text-red-500 hover:bg-red-50 transition"
                    title="Remove Logo"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ) : (
                <div className="py-2 flex flex-col items-center gap-1.5">
                  <div className="w-9 h-9 rounded-full bg-black/[0.04] flex items-center justify-center text-[#4b5563]">
                    <Upload className="w-4 h-4 text-[var(--brand)]" />
                  </div>
                  <p className="font-semibold text-xs text-[#111111]">
                    Click to upload or drag & drop logo
                  </p>
                  <p className="text-[11px] text-[#6b7280]">
                    PNG, JPG, SVG, or WEBP supported
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Preset Color Themes */}
          <div>
            <label className="block font-bold text-[#111111] uppercase tracking-wider mb-2">
              Curated Brand Themes & Presets
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
              {BRAND_PRESETS.map((preset) => {
                const isActive =
                  brand.primary.toLowerCase() === preset.primary.toLowerCase() &&
                  brand.secondary.toLowerCase() === preset.secondary.toLowerCase();
                return (
                  <button
                    key={preset.name}
                    type="button"
                    onClick={() =>
                      onUpdateBrand({
                        ...brand,
                        name: preset.brandName || brand.name,
                        logo: preset.logo !== undefined ? preset.logo : brand.logo,
                        primary: preset.primary,
                        secondary: preset.secondary,
                      })
                    }
                    className={`flex items-center gap-2 p-2 rounded-xl border text-left transition-all cursor-pointer ${
                      isActive
                        ? 'border-black bg-black/5 ring-1 ring-black'
                        : 'border-[#e5e7eb] hover:border-black/30 bg-white'
                    }`}
                  >
                    <div
                      className="w-6 h-6 rounded-lg shrink-0 flex items-center justify-center text-white"
                      style={{
                        background: `linear-gradient(135deg, ${preset.primary}, ${preset.secondary})`
                      }}
                    >
                      {isActive && <Check className="w-3.5 h-3.5" />}
                    </div>
                    <span className="font-semibold text-xs text-[#111111] truncate">
                      {preset.name}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Custom Color Pickers */}
          <div className="grid grid-cols-2 gap-3 pt-1">
            <div>
              <label className="block font-bold text-[#111111] uppercase tracking-wider mb-1">
                Primary Color
              </label>
              <div className="flex items-center gap-2 border border-[#e5e7eb] rounded-xl p-1.5 bg-white">
                <input
                  type="color"
                  value={brand.primary}
                  onChange={(e) => onUpdateBrand({ ...brand, primary: e.target.value })}
                  className="w-8 h-8 rounded-lg cursor-pointer border-0 p-0"
                />
                <input
                  type="text"
                  value={brand.primary}
                  onChange={(e) => onUpdateBrand({ ...brand, primary: e.target.value })}
                  className="w-full text-xs font-mono font-semibold focus:outline-none"
                />
              </div>
            </div>

            <div>
              <label className="block font-bold text-[#111111] uppercase tracking-wider mb-1">
                Secondary Color
              </label>
              <div className="flex items-center gap-2 border border-[#e5e7eb] rounded-xl p-1.5 bg-white">
                <input
                  type="color"
                  value={brand.secondary}
                  onChange={(e) => onUpdateBrand({ ...brand, secondary: e.target.value })}
                  className="w-8 h-8 rounded-lg cursor-pointer border-0 p-0"
                />
                <input
                  type="text"
                  value={brand.secondary}
                  onChange={(e) => onUpdateBrand({ ...brand, secondary: e.target.value })}
                  className="w-full text-xs font-mono font-semibold focus:outline-none"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="flex items-center justify-between pt-3 border-t border-black/[0.06]">
          <button
            type="button"
            onClick={onResetDefault}
            className="flex items-center gap-1.5 text-xs text-[#6b7280] hover:text-[#111111] transition py-1 cursor-pointer"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Reset to Clothiqo</span>
          </button>

          <button
            type="button"
            onClick={onClose}
            className="h-10 px-6 rounded-xl bg-[#111111] text-white text-xs font-bold hover:bg-black transition shadow-sm cursor-pointer"
          >
            Apply Styling
          </button>
        </div>
      </div>
    </div>
  );
};
