import React, { useState, useEffect, useRef } from 'react';
import { BrandingSettings } from '../../types';
import {
  getBrandingSettings,
  saveBrandingSettings,
  uploadBrandAsset,
  DEFAULT_BRANDING_SETTINGS,
} from '../../lib/firebase';
import {
  Palette,
  Upload,
  Save,
  CheckCircle2,
  AlertCircle,
  RotateCcw,
  Sparkles,
  Image,
  Eye,
  Trash2,
} from 'lucide-react';

interface AdminBrandingProps {
  onBrandingUpdated?: (settings: BrandingSettings) => void;
}

export const AdminBranding: React.FC<AdminBrandingProps> = ({
  onBrandingUpdated,
}) => {
  const [branding, setBranding] = useState<BrandingSettings>(DEFAULT_BRANDING_SETTINGS);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploadingLogo, setUploadingLogo] = useState(false);
  const [uploadingFavicon, setUploadingFavicon] = useState(false);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const logoInputRef = useRef<HTMLInputElement>(null);
  const faviconInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    async function loadBranding() {
      try {
        const loaded = await getBrandingSettings();
        setBranding(loaded);
      } catch (err: any) {
        console.warn('Branding load notice:', err);
      } finally {
        setLoading(false);
      }
    }
    loadBranding();
  }, []);

  const handleLogoUpload = async (file: File) => {
    if (!file || !file.type.startsWith('image/')) {
      setErrorMsg('Please upload a valid image file (PNG, JPG, SVG, WebP).');
      return;
    }

    setUploadingLogo(true);
    setErrorMsg(null);

    try {
      const url = await uploadBrandAsset(file, 'branding/logo');
      setBranding((prev) => ({ ...prev, logo: url }));
      setSuccessMsg('Logo uploaded successfully. Click "Save Branding" to apply.');
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to upload logo');
    } finally {
      setUploadingLogo(false);
    }
  };

  const handleFaviconUpload = async (file: File) => {
    if (!file || !file.type.startsWith('image/')) {
      setErrorMsg('Please upload a valid image file for favicon.');
      return;
    }

    setUploadingFavicon(true);
    setErrorMsg(null);

    try {
      const url = await uploadBrandAsset(file, 'branding/favicon');
      setBranding((prev) => ({ ...prev, favicon: url }));

      // Dynamically update document favicon in head
      const link = document.querySelector("link[rel*='icon']") as HTMLLinkElement | null;
      if (link) {
        link.href = url;
      }

      setSuccessMsg('Favicon uploaded successfully. Click "Save Branding" to apply.');
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to upload favicon');
    } finally {
      setUploadingFavicon(false);
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setSuccessMsg(null);
    setErrorMsg(null);

    try {
      await saveBrandingSettings(branding);

      // Update favicon in DOM
      if (branding.favicon) {
        const link = document.querySelector("link[rel*='icon']") as HTMLLinkElement | null;
        if (link) {
          link.href = branding.favicon;
        }
      }

      // Update page title if desired
      if (branding.name) {
        document.title = `${branding.name} | Modern Fit. Timeless Style`;
      }

      setSuccessMsg('Website branding and design settings saved successfully!');
      if (onBrandingUpdated) {
        onBrandingUpdated(branding);
      }
      setTimeout(() => setSuccessMsg(null), 3500);
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to save branding');
    } finally {
      setSaving(false);
    }
  };

  const handleReset = () => {
    if (confirm('Reset branding to CLOTHIQO default identity?')) {
      setBranding(DEFAULT_BRANDING_SETTINGS);
    }
  };

  if (loading) {
    return (
      <div className="p-12 text-center text-xs text-[#777777] bg-white rounded-2xl border border-[#ece7dc]">
        Loading branding settings...
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white p-5 rounded-2xl border border-[#ece7dc] shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-lg font-black uppercase tracking-tight text-[#111111] flex items-center gap-2">
            <Palette className="w-5 h-5 text-amber-900" />
            <span>Website Branding &amp; Visual Design</span>
          </h2>
          <p className="text-xs text-[#777777] mt-0.5">
            Admin-only controls to customize logo, favicon, color palette, and top announcement banner
          </p>
        </div>

        <button
          type="button"
          onClick={handleReset}
          className="px-3.5 py-2 rounded-xl border border-[#d5cfc0] hover:bg-black/5 text-xs font-bold text-[#333333] transition flex items-center gap-1.5 cursor-pointer"
        >
          <RotateCcw className="w-3.5 h-3.5" />
          <span>Reset Default Brand</span>
        </button>
      </div>

      {/* Notifications */}
      {successMsg && (
        <div className="p-4 bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs rounded-2xl font-bold flex items-center gap-2 animate-in fade-in">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>{successMsg}</span>
        </div>
      )}

      {errorMsg && (
        <div className="p-4 bg-red-50 border border-red-200 text-red-700 text-xs rounded-2xl font-bold flex items-center gap-2 animate-in fade-in">
          <AlertCircle className="w-4 h-4 text-red-600 shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}

      {/* Live Storefront Preview Box */}
      <div className="bg-white p-5 rounded-2xl border border-[#ece7dc] shadow-sm space-y-3">
        <div className="flex items-center justify-between">
          <span className="text-xs font-bold uppercase text-[#777777] flex items-center gap-1.5">
            <Eye className="w-3.5 h-3.5" />
            <span>Storefront Header Live Preview</span>
          </span>
          <span className="text-[10px] uppercase font-bold text-amber-900 bg-amber-50 px-2 py-0.5 rounded">
            Live Preview
          </span>
        </div>

        {/* Announcement Preview */}
        {branding.announcement && (
          <div className="py-1.5 px-4 bg-[#111111] text-white text-[11px] font-medium text-center tracking-wide rounded-lg">
            {branding.announcement}
          </div>
        )}

        {/* Header Preview */}
        <div className="p-4 rounded-xl bg-[#faf8f4] border border-[#e8e2d5] flex items-center justify-between">
          <div className="flex items-center gap-3">
            {branding.logo ? (
              <img
                src={branding.logo}
                alt={branding.name}
                className="h-9 max-w-[120px] object-contain rounded"
              />
            ) : (
              <span className="text-xl font-black tracking-widest text-[#111111] uppercase font-mono">
                {branding.name || 'CLOTHIQO'}
              </span>
            )}
            <span className="text-xs font-bold text-[#111111] uppercase tracking-wider">
              {branding.name}
            </span>
          </div>

          <div className="flex items-center gap-2 text-xs font-semibold text-[#666666]">
            <span>Shop</span>
            <span>Collection</span>
            <span className="w-6 h-6 rounded-full bg-black text-white flex items-center justify-center text-[10px]">
              0
            </span>
          </div>
        </div>
      </div>

      <form onSubmit={handleSave} className="space-y-6">
        {/* Identity Form */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {/* 1. Store Identity & Announcement */}
          <div className="bg-white p-6 rounded-2xl border border-[#ece7dc] shadow-sm space-y-4">
            <h3 className="font-extrabold text-sm uppercase tracking-wide text-[#111111] pb-2 border-b border-[#ece7dc]">
              Store Identity
            </h3>

            <div>
              <label className="text-[11px] font-bold uppercase text-[#555555] block mb-1">
                Brand Name *
              </label>
              <input
                type="text"
                required
                value={branding.name}
                onChange={(e) => setBranding({ ...branding, name: e.target.value })}
                placeholder="e.g. CLOTHIQO"
                className="w-full px-3.5 py-2 rounded-xl border border-[#d5cfc0] text-xs font-bold uppercase bg-[#faf8f4] focus:bg-white focus:outline-none focus:border-black"
              />
            </div>

            <div>
              <label className="text-[11px] font-bold uppercase text-[#555555] block mb-1">
                Top Announcement Bar
              </label>
              <textarea
                rows={3}
                value={branding.announcement}
                onChange={(e) => setBranding({ ...branding, announcement: e.target.value })}
                placeholder="Banner announcement message displayed at top of storefront..."
                className="w-full px-3.5 py-2 rounded-xl border border-[#d5cfc0] text-xs bg-[#faf8f4] focus:bg-white focus:outline-none focus:border-black"
              />
            </div>

            {/* Colors */}
            <div className="pt-2 border-t border-[#ece7dc] grid grid-cols-2 gap-3">
              <div>
                <label className="text-[11px] font-bold uppercase text-[#555555] block mb-1">
                  Primary Color
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="color"
                    value={branding.primary}
                    onChange={(e) => setBranding({ ...branding, primary: e.target.value })}
                    className="w-8 h-8 rounded-lg cursor-pointer border border-[#cccccc] p-0.5 bg-white"
                  />
                  <input
                    type="text"
                    value={branding.primary}
                    onChange={(e) => setBranding({ ...branding, primary: e.target.value })}
                    className="w-full px-2.5 py-1.5 rounded-lg border border-[#d5cfc0] text-xs font-mono uppercase bg-[#faf8f4]"
                  />
                </div>
              </div>

              <div>
                <label className="text-[11px] font-bold uppercase text-[#555555] block mb-1">
                  Secondary Color
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="color"
                    value={branding.secondary}
                    onChange={(e) => setBranding({ ...branding, secondary: e.target.value })}
                    className="w-8 h-8 rounded-lg cursor-pointer border border-[#cccccc] p-0.5 bg-white"
                  />
                  <input
                    type="text"
                    value={branding.secondary}
                    onChange={(e) => setBranding({ ...branding, secondary: e.target.value })}
                    className="w-full px-2.5 py-1.5 rounded-lg border border-[#d5cfc0] text-xs font-mono uppercase bg-[#faf8f4]"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* 2. Logo and Favicon Uploads */}
          <div className="bg-white p-6 rounded-2xl border border-[#ece7dc] shadow-sm space-y-5">
            <h3 className="font-extrabold text-sm uppercase tracking-wide text-[#111111] pb-2 border-b border-[#ece7dc]">
              Brand Assets (Logo &amp; Favicon)
            </h3>

            {/* Logo Upload Box */}
            <div className="space-y-2">
              <label className="text-[11px] font-bold uppercase text-[#555555] block">
                Website Logo
              </label>
              <div
                onClick={() => logoInputRef.current?.click()}
                onDragOver={(e) => e.preventDefault()}
                onDrop={(e) => {
                  e.preventDefault();
                  const file = e.dataTransfer.files?.[0];
                  if (file) handleLogoUpload(file);
                }}
                className="p-4 rounded-2xl border-2 border-dashed border-[#d5cfc0] hover:border-black bg-[#faf8f4] flex items-center justify-between gap-4 cursor-pointer transition"
              >
                <input
                  type="file"
                  ref={logoInputRef}
                  accept="image/*"
                  className="hidden"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) handleLogoUpload(file);
                  }}
                />

                <div className="flex items-center gap-3">
                  {branding.logo ? (
                    <img
                      src={branding.logo}
                      alt="Brand logo"
                      className="w-12 h-12 rounded-xl object-contain bg-white border border-[#e5e7eb] p-1"
                    />
                  ) : (
                    <div className="w-12 h-12 rounded-xl bg-amber-100 text-amber-900 flex items-center justify-center">
                      <Image className="w-6 h-6" />
                    </div>
                  )}

                  <div>
                    <span className="text-xs font-bold text-[#111111] block">
                      {uploadingLogo ? 'Uploading...' : 'Click or Drag & Drop Logo'}
                    </span>
                    <span className="text-[11px] text-[#777777]">
                      PNG, JPG, SVG or WebP (max 5MB)
                    </span>
                  </div>
                </div>

                <button
                  type="button"
                  className="px-3 py-1.5 rounded-lg bg-white border border-[#cccccc] text-[11px] font-bold text-[#333333] shadow-2xs hover:bg-[#faf8f4]"
                >
                  Browse
                </button>
              </div>
            </div>

            {/* Favicon Upload Box */}
            <div className="space-y-2 pt-2 border-t border-[#ece7dc]">
              <label className="text-[11px] font-bold uppercase text-[#555555] block">
                Browser Tab Favicon
              </label>
              <div
                onClick={() => faviconInputRef.current?.click()}
                onDragOver={(e) => e.preventDefault()}
                onDrop={(e) => {
                  e.preventDefault();
                  const file = e.dataTransfer.files?.[0];
                  if (file) handleFaviconUpload(file);
                }}
                className="p-4 rounded-2xl border-2 border-dashed border-[#d5cfc0] hover:border-black bg-[#faf8f4] flex items-center justify-between gap-4 cursor-pointer transition"
              >
                <input
                  type="file"
                  ref={faviconInputRef}
                  accept="image/*"
                  className="hidden"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) handleFaviconUpload(file);
                  }}
                />

                <div className="flex items-center gap-3">
                  {branding.favicon ? (
                    <img
                      src={branding.favicon}
                      alt="Favicon"
                      className="w-8 h-8 rounded-lg object-contain bg-white border border-[#e5e7eb] p-0.5"
                    />
                  ) : (
                    <div className="w-8 h-8 rounded-lg bg-emerald-100 text-emerald-900 flex items-center justify-center">
                      <Image className="w-4 h-4" />
                    </div>
                  )}

                  <div>
                    <span className="text-xs font-bold text-[#111111] block">
                      {uploadingFavicon ? 'Uploading...' : 'Upload Tab Favicon (.ico, .png)'}
                    </span>
                    <span className="text-[11px] text-[#777777]">
                      Recommended 32×32 or 64×64 pixels
                    </span>
                  </div>
                </div>

                <button
                  type="button"
                  className="px-3 py-1.5 rounded-lg bg-white border border-[#cccccc] text-[11px] font-bold text-[#333333] shadow-2xs hover:bg-[#faf8f4]"
                >
                  Browse
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Section 2: Homepage Content, Banners & Orbit 3D Settings */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {/* Homepage Content & Banners */}
          <div className="bg-white p-6 rounded-2xl border border-[#ece7dc] shadow-sm space-y-4">
            <h3 className="font-extrabold text-sm uppercase tracking-wide text-[#111111] pb-2 border-b border-[#ece7dc] flex items-center justify-between">
              <span>Homepage Content &amp; Banners</span>
              <Sparkles className="w-4 h-4 text-amber-600" />
            </h3>

            <div>
              <label className="text-[11px] font-bold uppercase text-[#555555] block mb-1">
                Hero Badge Text
              </label>
              <input
                type="text"
                value={branding.heroBadge || ''}
                onChange={(e) => setBranding({ ...branding, heroBadge: e.target.value })}
                placeholder="e.g. New 2026 Collection"
                className="w-full px-3.5 py-2 rounded-xl border border-[#d5cfc0] text-xs bg-[#faf8f4] focus:bg-white focus:outline-none focus:border-black"
              />
            </div>

            <div>
              <label className="text-[11px] font-bold uppercase text-[#555555] block mb-1">
                Hero Main Headline
              </label>
              <input
                type="text"
                value={branding.heroTitle || ''}
                onChange={(e) => setBranding({ ...branding, heroTitle: e.target.value })}
                placeholder="e.g. Modern Fit. Timeless Style."
                className="w-full px-3.5 py-2 rounded-xl border border-[#d5cfc0] text-xs font-bold bg-[#faf8f4] focus:bg-white focus:outline-none focus:border-black"
              />
            </div>

            <div>
              <label className="text-[11px] font-bold uppercase text-[#555555] block mb-1">
                Hero Subtitle / Description
              </label>
              <textarea
                rows={2}
                value={branding.heroSubtitle || ''}
                onChange={(e) => setBranding({ ...branding, heroSubtitle: e.target.value })}
                placeholder="Brief brand statement below main headline..."
                className="w-full px-3.5 py-2 rounded-xl border border-[#d5cfc0] text-xs bg-[#faf8f4] focus:bg-white focus:outline-none focus:border-black"
              />
            </div>

            <div>
              <label className="text-[11px] font-bold uppercase text-[#555555] block mb-1">
                Promotional Banner Image URL (Optional)
              </label>
              <input
                type="text"
                value={branding.bannerImage || ''}
                onChange={(e) => setBranding({ ...branding, bannerImage: e.target.value })}
                placeholder="https://... image URL for promotional banner"
                className="w-full px-3.5 py-2 rounded-xl border border-[#d5cfc0] text-xs font-mono bg-[#faf8f4] focus:bg-white focus:outline-none focus:border-black"
              />
            </div>
          </div>

          {/* 3D Orbit Settings */}
          <div className="bg-white p-6 rounded-2xl border border-[#ece7dc] shadow-sm space-y-4">
            <h3 className="font-extrabold text-sm uppercase tracking-wide text-[#111111] pb-2 border-b border-[#ece7dc] flex items-center justify-between">
              <span>Orbit 3D Showcase Settings</span>
              <RotateCcw className="w-4 h-4 text-emerald-700" />
            </h3>

            <div className="flex items-center justify-between p-3 rounded-xl bg-[#faf8f4] border border-[#ece7dc]">
              <div>
                <span className="text-xs font-bold text-[#111111] block">
                  Automatic Rotation
                </span>
                <span className="text-[11px] text-[#666666]">
                  Continuously rotate products in the 3D circle view
                </span>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={branding.autoRotate ?? true}
                  onChange={(e) => setBranding({ ...branding, autoRotate: e.target.checked })}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#111111]"></div>
              </label>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="text-[11px] font-bold uppercase text-[#555555]">
                  Orbit Radius: {branding.orbitRadius ?? 280}px
                </label>
                <span className="text-[10px] text-[#888888] font-mono">200px - 400px</span>
              </div>
              <input
                type="range"
                min="200"
                max="400"
                step="10"
                value={branding.orbitRadius ?? 280}
                onChange={(e) => setBranding({ ...branding, orbitRadius: Number(e.target.value) })}
                className="w-full accent-black cursor-pointer"
              />
            </div>

            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="text-[11px] font-bold uppercase text-[#555555]">
                  Rotation Duration: {branding.orbitSpeed ?? 30}s
                </label>
                <span className="text-[10px] text-[#888888] font-mono">10s (fast) - 60s (slow)</span>
              </div>
              <input
                type="range"
                min="10"
                max="60"
                step="2"
                value={branding.orbitSpeed ?? 30}
                onChange={(e) => setBranding({ ...branding, orbitSpeed: Number(e.target.value) })}
                className="w-full accent-black cursor-pointer"
              />
            </div>

            <div className="p-3 bg-amber-50/70 border border-amber-200 rounded-xl text-[11px] text-amber-900 leading-relaxed">
              Orbit parameters dynamically adjust the interactive rotating trouser showcase on the storefront.
            </div>
          </div>
        </div>

        {/* Save Button */}
        <div className="flex justify-end">
          <button
            type="submit"
            disabled={saving}
            className="px-6 py-3 rounded-xl bg-[#111111] hover:bg-black text-white text-xs font-black uppercase tracking-wider transition shadow-md hover:shadow-lg disabled:opacity-50 flex items-center gap-2 cursor-pointer"
          >
            <Save className="w-4 h-4" />
            <span>{saving ? 'Saving Changes...' : 'Save Branding & Design'}</span>
          </button>
        </div>
      </form>
    </div>
  );
};
