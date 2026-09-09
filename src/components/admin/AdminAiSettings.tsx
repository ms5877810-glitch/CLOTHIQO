import React, { useState } from 'react';
import { Sparkles, Save, CheckCircle2, Bot, Sliders } from 'lucide-react';

export const AdminAiSettings: React.FC = () => {
  const [modelName, setModelName] = useState('gemini-2.5-flash');
  const [systemInstruction, setSystemInstruction] = useState(
    `You are the CLOTHIQO AI Stylist — an expert in contemporary trouser tailoring, streetwear baggy proportions, and sharp formal elegance for men in Bangladesh. Offer concise, confident fit advice and product recommendations strictly from the CLOTHIQO catalog.`
  );
  const [temperature, setTemperature] = useState(0.7);
  const [saved, setSaved] = useState(false);

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    localStorage.setItem(
      'clothiqo_ai_stylist_config',
      JSON.stringify({ modelName, systemInstruction, temperature })
    );
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  };

  return (
    <div className="space-y-6">
      <div className="bg-white p-5 rounded-2xl border border-[#ece7dc] shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-lg font-black uppercase tracking-tight text-[#111111] flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-amber-900" />
            <span>AI Stylist &amp; Fit Advisor Settings</span>
          </h2>
          <p className="text-xs text-[#777777] mt-0.5">
            Configure Google Gemini AI styling instructions, model intelligence, and trouser fit guidance
          </p>
        </div>
      </div>

      {saved && (
        <div className="p-4 bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs rounded-2xl font-bold flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>AI Stylist configuration updated successfully!</span>
        </div>
      )}

      <form onSubmit={handleSave} className="space-y-5 bg-white p-6 rounded-2xl border border-[#ece7dc] shadow-xs">
        <div>
          <label className="text-[11px] font-bold uppercase text-[#555555] block mb-1">
            Active Intelligence Model
          </label>
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-[#faf8f4] border border-[#d5cfc0] flex items-center gap-2 text-xs font-mono font-bold text-[#111111]">
              <Bot className="w-4 h-4 text-emerald-700" />
              <span>{modelName} (Server-Side Proxy)</span>
            </div>
            <span className="text-[11px] text-[#777777]">
              Uses secure server-side Gemini API route `/api/ai/stylist` with zero client key exposure.
            </span>
          </div>
        </div>

        <div>
          <label className="text-[11px] font-bold uppercase text-[#555555] block mb-1">
            System Persona &amp; Fit Recommendations Guide
          </label>
          <textarea
            rows={5}
            value={systemInstruction}
            onChange={(e) => setSystemInstruction(e.target.value)}
            className="w-full px-3.5 py-2.5 rounded-xl border border-[#d5cfc0] text-xs bg-[#faf8f4] focus:bg-white focus:outline-none focus:border-black font-sans leading-relaxed"
          />
        </div>

        <div>
          <div className="flex justify-between text-xs font-bold text-[#111111] mb-1">
            <span>Styling Creativity (Temperature): {temperature}</span>
            <span className="text-[10px] text-[#777777] font-mono">0.0 (Precise) - 1.0 (Creative)</span>
          </div>
          <input
            type="range"
            min="0"
            max="1"
            step="0.05"
            value={temperature}
            onChange={(e) => setTemperature(parseFloat(e.target.value))}
            className="w-full accent-black cursor-pointer"
          />
        </div>

        <div className="pt-2 flex justify-end">
          <button
            type="submit"
            className="px-6 py-3 rounded-xl bg-[#111111] hover:bg-black text-white text-xs font-black uppercase tracking-wider transition shadow-md hover:shadow-lg flex items-center gap-2 cursor-pointer"
          >
            <Save className="w-4 h-4" />
            <span>Save AI Settings</span>
          </button>
        </div>
      </form>
    </div>
  );
};
