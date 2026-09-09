import React, { useState, useRef, useEffect } from 'react';
import { Product, ChatMessage } from '../types';
import { Sparkles, X, Send, ArrowRight, Bot, User, ShoppingBag } from 'lucide-react';

interface AiAssistantDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  brandName: string;
  products: Product[];
  currentProduct?: Product;
  onSelectProduct: (product: Product) => void;
  initialPrompt?: string;
}

export const AiAssistantDrawer: React.FC<AiAssistantDrawerProps> = ({
  isOpen,
  onClose,
  brandName,
  products,
  currentProduct,
  onSelectProduct,
  initialPrompt,
}) => {
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 'welcome',
      role: 'assistant',
      content: `Hello! I'm your AI personal stylist at ${brandName}. Looking for outfit pairing advice, fabric insights, or styling ideas? Ask me anything!`,
      timestamp: 'Just now',
      suggestedProducts: [products[0], products[1]],
    },
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, loading]);

  useEffect(() => {
    if (initialPrompt && isOpen) {
      handleSendMessage(initialPrompt);
    }
  }, [initialPrompt, isOpen]);

  const handleSendMessage = async (textToSend?: string) => {
    const query = (textToSend || input).trim();
    if (!query || loading) return;

    const userMessage: ChatMessage = {
      id: Date.now().toString(),
      role: 'user',
      content: query,
      timestamp: 'Just now',
    };

    setMessages((prev) => [...prev, userMessage]);
    if (!textToSend) setInput('');
    setLoading(true);

    try {
      const response = await fetch('/api/ai/ask', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt: query,
          brandName,
          currentProduct,
        }),
      });

      if (!response.ok) {
        throw new Error('Stylist request failed');
      }

      const data = await response.json();
      const recommendedProducts = (data.recommendedIds || [])
        .map((id: number) => products.find((p) => p.id === id))
        .filter(Boolean) as Product[];

      const aiMessage: ChatMessage = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: data.reply || 'Here is what I recommend from our current collection.',
        timestamp: 'Just now',
        suggestedProducts: recommendedProducts.length > 0 ? recommendedProducts : undefined,
      };

      setMessages((prev) => [...prev, aiMessage]);
    } catch (err) {
      console.error('AI Stylist error:', err);
      // Fallback helpful reply
      setMessages((prev) => [
        ...prev,
        {
          id: (Date.now() + 1).toString(),
          role: 'assistant',
          content:
            "For a relaxed streetwear silhouette, try our Urban Baggy Black (৳1,890) paired with oversized tees and retro sneakers. For formal occasions, our Classic Formal Black (৳2,190) offers clean tailored creases.",
          timestamp: 'Just now',
          suggestedProducts: [products[0], products[1], products[2]],
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-stretch sm:justify-end">
      {/* Overlay */}
      <div
        onClick={onClose}
        className="fixed inset-0 bg-black/40 backdrop-blur-xs transition-opacity animate-in fade-in"
      />

      {/* Drawer: Bottom sheet on mobile, right drawer on sm+ */}
      <div
        id="ai-assistant-drawer"
        className="relative w-full sm:max-w-md bg-white h-[88vh] sm:h-full rounded-t-3xl sm:rounded-none shadow-2xl flex flex-col z-10 animate-in slide-in-from-bottom sm:slide-in-from-right duration-300 overflow-hidden"
      >
        {/* Mobile Pull Handle */}
        <div className="w-12 h-1.5 bg-[#dddddd] rounded-full mx-auto mt-2 sm:hidden shrink-0" />

        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-[#e5e7eb] flex items-center justify-between bg-white sticky top-0 z-10 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-[var(--brand)] to-[var(--brand-2)] text-white flex items-center justify-center shadow-sm shrink-0">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <h2 className="font-extrabold text-sm sm:text-base text-[#111111]">
                  AI Stylist & Concierge
                </h2>
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              </div>
              <p className="text-[11px] sm:text-xs text-[#6b7280]">
                Powered by Gemini • {brandName}
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

        {/* Quick Suggestion Chips */}
        <div className="px-4 py-2.5 bg-[#f9fafb] border-b border-[#e5e7eb] overflow-x-auto flex items-center gap-2 scrollbar-none shrink-0">
          {[
            'Baggy vs Formal fit',
            'Sizing & waist guide',
            'Pairing shoes & shirts',
            'Fabric care & wash',
          ].map((promptText) => (
            <button
              key={promptText}
              onClick={() => handleSendMessage(promptText)}
              className="text-[11px] font-semibold text-[#4b5563] hover:text-[#111111] bg-white border border-[#e5e7eb] hover:border-black/30 px-3 py-1.5 rounded-full whitespace-nowrap transition shadow-2xs cursor-pointer active:scale-95 shrink-0"
            >
              {promptText}
            </button>
          ))}
        </div>

        {/* Messages Body */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-4">
          {messages.map((msg) => (
            <div
              key={msg.id}
              className={`flex gap-2.5 sm:gap-3 ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              {msg.role === 'assistant' && (
                <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg bg-[var(--brand)]/10 text-[var(--brand)] flex items-center justify-center shrink-0 mt-0.5">
                  <Bot className="w-4 h-4" />
                </div>
              )}

              <div
                className={`max-w-[85%] rounded-2xl p-3 sm:p-3.5 text-xs leading-relaxed ${
                  msg.role === 'user'
                    ? 'bg-[#111111] text-white rounded-br-xs'
                    : 'bg-[#f4f4f2] text-[#111111] rounded-bl-xs'
                }`}
              >
                <p className="whitespace-pre-line">{msg.content}</p>

                {/* Suggested Products in Message */}
                {msg.suggestedProducts && msg.suggestedProducts.length > 0 && (
                  <div className="mt-3 pt-3 border-t border-black/[0.08] space-y-2">
                    <span className="text-[10px] font-bold tracking-wider uppercase text-[#6b7280] block">
                      Recommended Matches
                    </span>
                    <div className="space-y-1.5">
                      {msg.suggestedProducts.map((p) => (
                        <div
                          key={p.id}
                          onClick={() => {
                            onSelectProduct(p);
                            onClose();
                          }}
                          className="flex items-center justify-between p-2 rounded-xl bg-white border border-[#e5e7eb] hover:border-black/30 cursor-pointer shadow-2xs transition group active:scale-[0.98]"
                        >
                          <div className="flex items-center gap-2.5 min-w-0">
                            <div
                              className="w-9 h-9 rounded-lg overflow-hidden shrink-0 bg-[#f3f4f6] flex items-center justify-center border border-black/5"
                            >
                              {p.image ? (
                                <img
                                  src={p.image}
                                  alt={p.name}
                                  referrerPolicy="no-referrer"
                                  className="w-full h-full object-cover"
                                />
                              ) : (
                                <span className="font-bold text-xs text-[#111111]">{p.icon}</span>
                              )}
                            </div>
                            <div className="truncate">
                              <b className="block text-xs font-semibold text-[#111111] truncate group-hover:text-[var(--brand)] transition-colors">
                                {p.name}
                              </b>
                              <span className="text-[10px] text-[#6b7280] font-medium font-mono">
                                {p.priceFormatted || `৳${p.price.toLocaleString()}`}
                              </span>
                            </div>
                          </div>
                          <span className="text-[10px] font-bold text-[#111111] bg-black/5 px-2 py-1 rounded-full flex items-center gap-1 group-hover:bg-black group-hover:text-white transition shrink-0">
                            <span>Inspect</span>
                            <ArrowRight className="w-2.5 h-2.5" />
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {msg.role === 'user' && (
                <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg bg-[#111111] text-white flex items-center justify-center shrink-0 mt-0.5">
                  <User className="w-4 h-4" />
                </div>
              )}
            </div>
          ))}

          {loading && (
            <div className="flex gap-2.5 items-center">
              <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg bg-[var(--brand)]/10 text-[var(--brand)] flex items-center justify-center shrink-0">
                <Bot className="w-4 h-4" />
              </div>
              <div className="bg-[#f4f4f2] text-[#6b7280] text-xs px-3.5 py-2.5 rounded-2xl rounded-bl-xs flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-[var(--brand)] animate-bounce" />
                <span className="w-2 h-2 rounded-full bg-[var(--brand)] animate-bounce [animation-delay:0.2s]" />
                <span className="w-2 h-2 rounded-full bg-[var(--brand)] animate-bounce [animation-delay:0.4s]" />
                <span className="text-[11px] font-medium ml-1">Stylist is thinking...</span>
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Input Bar with pb-safe */}
        <div className="p-3 sm:p-4 border-t border-[#e5e7eb] bg-white shrink-0 pb-safe">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSendMessage();
            }}
            className="flex items-center gap-2"
          >
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Ask stylist for recommendations..."
              className="flex-1 min-h-[44px] px-3.5 text-base sm:text-xs rounded-xl border border-[#e5e7eb] focus:outline-none focus:border-black transition bg-[#fafafa] focus:bg-white"
            />
            <button
              type="submit"
              disabled={!input.trim() || loading}
              className="min-h-[44px] min-w-[44px] px-3.5 rounded-xl bg-[#111111] hover:bg-black text-white text-xs font-bold flex items-center justify-center transition disabled:opacity-40 cursor-pointer active:scale-95"
            >
              <Send className="w-4 h-4" />
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};
