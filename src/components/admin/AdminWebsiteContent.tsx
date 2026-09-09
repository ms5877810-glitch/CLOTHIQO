import React, { useState, useEffect } from 'react';
import { BrandingSettings } from '../../types';
import { getBrandingSettings, saveBrandingSettings, DEFAULT_BRANDING_SETTINGS } from '../../lib/firebase';
import { Layout, Save, CheckCircle2, AlertCircle, Sparkles, Globe, RotateCcw } from 'lucide-react';

export const AdminWebsiteContent: React.FC = () => {
  const [settings, setSettings] = useState<BrandingSettings>(DEFAULT_BRANDING_SETTINGS);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    async function load() {
      try {
        const loaded = await getBrandingSettings();
        setSettings(loaded);
      } catch (err: any) {
        console.warn('Failed to load website content:', err);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setSuccessMsg(null);
    setErrorMsg(null);

    try {
      await saveBrandingSettings(settings);
      setSuccessMsg('Website content & homepage settings saved successfully!');
      setTimeout(() => setSuccessMsg(null), 3500);
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to save website content');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="p-12 text-center text-xs text-[#777777] bg-white rounded-2xl border border-[#ece7dc]">
        Loading website content...
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white p-5 rounded-2xl border border-[#ece7dc] shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-lg font-black uppercase tracking-tight text-[#111111] flex items-center gap-2">
            <Globe className="w-5 h-5 text-amber-900" />
            <span>Website Content &amp; Hero Sections</span>
          </h2>
          <p className="text-xs text-[#777777] mt-0.5">
            Configure homepage banners, announcements, headlines, and callout tags
          </p>
        </div>
      </div>

      {successMsg && (
        <div className="p-4 bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs rounded-2xl font-bold flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>{successMsg}</span>
        </div>
      )}

      {errorMsg && (
        <div className="p-4 bg-red-50 border border-red-200 text-red-700 text-xs rounded-2xl font-bold flex items-center gap-2">
          <AlertCircle className="w-4 h-4 text-red-600 shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}

      <form onSubmit={handleSave} className="space-y-6">
        {/* Announcement & Hero Banner */}
        <div className="bg-white p-6 rounded-2xl border border-[#ece7dc] shadow-xs space-y-4">
          <h3 className="font-extrabold text-sm uppercase tracking-wide text-[#111111] pb-2 border-b border-[#ece7dc] flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-amber-600" />
            <span>Top Bar Announcement</span>
          </h3>

          <div>
            <label className="text-[11px] font-bold uppercase text-[#555555] block mb-1">
              Storewide Announcement Message
            </label>
            <input
              type="text"
              value={settings.announcement || ''}
              onChange={(e) => setSettings({ ...settings, announcement: e.target.value })}
              placeholder="e.g. Free Dhaka delivery on orders over ৳3,000 | Hand-finished Menswear"
              className="w-full px-3.5 py-2.5 rounded-xl border border-[#d5cfc0] text-xs bg-[#faf8f4] focus:bg-white focus:outline-none focus:border-black font-medium"
            />
            <span className="text-[11px] text-[#777777] mt-1 block">
              Displayed prominently across the very top bar of the storefront.
            </span>
          </div>
        </div>

        {/* Hero Section Headlines */}
        <div className="bg-white p-6 rounded-2xl border border-[#ece7dc] shadow-xs space-y-4">
          <h3 className="font-extrabold text-sm uppercase tracking-wide text-[#111111] pb-2 border-b border-[#ece7dc]">
            Homepage Hero Headline &amp; Tagline
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="text-[11px] font-bold uppercase text-[#555555] block mb-1">
                Badge / Eyebrow Text
              </label>
              <input
                type="text"
                value={settings.heroBadge || ''}
                onChange={(e) => setSettings({ ...settings, heroBadge: e.target.value })}
                placeholder="e.g. New 2026 Collection"
                className="w-full px-3.5 py-2 rounded-xl border border-[#d5cfc0] text-xs bg-[#faf8f4] focus:bg-white focus:outline-none focus:border-black"
              />
            </div>

            <div>
              <label className="text-[11px] font-bold uppercase text-[#555555] block mb-1">
                Main Hero Headline
              </label>
              <input
                type="text"
                value={settings.heroTitle || ''}
                onChange={(e) => setSettings({ ...settings, heroTitle: e.target.value })}
                placeholder="e.g. Modern Fit. Timeless Style."
                className="w-full px-3.5 py-2 rounded-xl border border-[#d5cfc0] text-xs font-bold bg-[#faf8f4] focus:bg-white focus:outline-none focus:border-black"
              />
            </div>
          </div>

          <div>
            <label className="text-[11px] font-bold uppercase text-[#555555] block mb-1">
              Hero Description &amp; Philosophy
            </label>
            <textarea
              rows={3}
              value={settings.heroSubtitle || ''}
              onChange={(e) => setSettings({ ...settings, heroSubtitle: e.target.value })}
              placeholder="e.g. Contemporary silhouettes engineered from heavyweight cotton and tropical drape blends."
              className="w-full px-3.5 py-2 rounded-xl border border-[#d5cfc0] text-xs bg-[#faf8f4] focus:bg-white focus:outline-none focus:border-black"
            />
          </div>

          <div>
            <label className="text-[11px] font-bold uppercase text-[#555555] block mb-1">
              Promotional Banner URL (Optional)
            </label>
            <input
              type="text"
              value={settings.bannerImage || ''}
              onChange={(e) => setSettings({ ...settings, bannerImage: e.target.value })}
              placeholder="https://... promotional banner image URL"
              className="w-full px-3.5 py-2 rounded-xl border border-[#d5cfc0] text-xs font-mono bg-[#faf8f4] focus:bg-white focus:outline-none focus:border-black"
            />
          </div>
        </div>

        {/* Orbit Settings */}
        <div className="bg-white p-6 rounded-2xl border border-[#ece7dc] shadow-xs space-y-4">
          <h3 className="font-extrabold text-sm uppercase tracking-wide text-[#111111] pb-2 border-b border-[#ece7dc] flex items-center gap-2">
            <RotateCcw className="w-4 h-4 text-emerald-700" />
            <span>Interactive 3D Circle Showcase</span>
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="p-3 bg-[#faf8f4] rounded-xl border border-[#ece7dc]">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-[#111111]">Auto-Rotation</span>
                <input
                  type="checkbox"
                  checked={settings.autoRotate ?? true}
                  onChange={(e) => setSettings({ ...settings, autoRotate: e.target.checked })}
                  className="w-4 h-4 accent-black cursor-pointer"
                />
              </div>
              <span className="text-[10px] text-[#777777] block mt-1">Spin products automatically</span>
            </div>

            <div className="p-3 bg-[#faf8f4] rounded-xl border border-[#ece7dc]">
              <div className="flex justify-between text-xs font-bold text-[#111111] mb-1">
                <span>Orbit Radius</span>
                <span className="font-mono">{settings.orbitRadius ?? 280}px</span>
              </div>
              <input
                type="range"
                min="200"
                max="400"
                step="10"
                value={settings.orbitRadius ?? 280}
                onChange={(e) => setSettings({ ...settings, orbitRadius: Number(e.target.value) })}
                className="w-full accent-black cursor-pointer"
              />
            </div>

            <div className="p-3 bg-[#faf8f4] rounded-xl border border-[#ece7dc]">
              <div className="flex justify-between text-xs font-bold text-[#111111] mb-1">
                <span>Speed (Sec/Cycle)</span>
                <span className="font-mono">{settings.orbitSpeed ?? 30}s</span>
              </div>
              <input
                type="range"
                min="10"
                max="60"
                step="2"
                value={settings.orbitSpeed ?? 30}
                onChange={(e) => setSettings({ ...settings, orbitSpeed: Number(e.target.value) })}
                className="w-full accent-black cursor-pointer"
              />
            </div>
          </div>
        </div>

        <div className="flex justify-end">
          <button
            type="submit"
            disabled={saving}
            className="px-6 py-3 rounded-xl bg-[#111111] hover:bg-black text-white text-xs font-black uppercase tracking-wider transition shadow-md hover:shadow-lg disabled:opacity-50 flex items-center gap-2 cursor-pointer"
          >
            <Save className="w-4 h-4" />
            <span>{saving ? 'Saving...' : 'Save Website Content'}</span>
          </button>
        </div>
      </form>
    </div>
  );
};
