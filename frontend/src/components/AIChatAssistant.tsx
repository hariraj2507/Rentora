import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Send, X, Bot, Loader2, Sparkles, AlertCircle } from 'lucide-react';
import { aiChatApi, authApi } from '../services/api';
import { Link } from 'react-router-dom';
import { formatINR } from '../utils/format';

interface AIMessage {
  role: 'user' | 'ai';
  text: string;
  items?: any[];
  suggestion?: string | null;
}

export default function AIChatAssistant() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<AIMessage[]>([
    { role: 'ai', text: "Hi! I'm your Rentora Assistant. Looking for something specific? Ask me about 'calculators', 'electronics', or 'items under ₹50'." }
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const user = authApi.getUser();

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, isOpen]);

  const handleSend = async (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!input.trim() || loading) return;

    const userMsg = input.trim();
    setInput('');
    setMessages(prev => [...prev, { role: 'user', text: userMsg }]);
    setLoading(true);

    try {
      const data = await aiChatApi.sendMessage(userMsg);
      setMessages(prev => [...prev, { 
        role: 'ai', 
        text: data.message, 
        items: data.items,
        suggestion: data.suggestion
      }]);
    } catch (err: any) {
      setMessages(prev => [...prev, { 
        role: 'ai', 
        text: "I'm having trouble connecting right now. Please try again later." 
      }]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      {/* Floating Button */}
      <motion.button
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.9 }}
        onClick={() => setIsOpen(!isOpen)}
        className="fixed bottom-6 right-6 z-[100] w-16 h-16 rounded-full bg-slate-900 dark:bg-white text-white dark:text-slate-900 shadow-2xl flex items-center justify-center border-4 border-primary-500/20"
      >
        {isOpen ? <X size={28} /> : <Bot size={28} className="animate-pulse" />}
      </motion.button>

      {/* Chat Window */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 100, scale: 0.8 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 100, scale: 0.8 }}
            className="fixed bottom-24 right-6 z-[100] w-[400px] h-[600px] glass bg-white dark:bg-slate-900 shadow-2xl rounded-[2.5rem] border border-slate-200 dark:border-slate-800 flex flex-col overflow-hidden"
          >
            {/* Header */}
            <div className="p-6 border-b border-slate-100 dark:border-slate-800 bg-slate-900 text-white flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-primary-500 flex items-center justify-center shadow-lg shadow-primary-500/30">
                  <Sparkles size={20} className="text-white" />
                </div>
                <div>
                  <h3 className="font-bold text-lg leading-tight">Rentora AI</h3>
                  <div className="flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                    <span className="text-[10px] uppercase font-black tracking-widest opacity-70">Always Online</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Chat Body */}
            <div 
              ref={scrollRef}
              className="flex-1 overflow-y-auto p-6 space-y-6 custom-scrollbar bg-slate-50/50 dark:bg-slate-950/20"
            >
              {messages.map((msg, i) => (
                <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'} animate-in fade-in slide-in-from-bottom-3 duration-500`}>
                  <div className={`max-w-[85%] space-y-3 ${msg.role === 'user' ? 'items-end' : 'items-start'}`}>
                    <div className={`px-5 py-3 rounded-2xl shadow-sm text-sm font-medium leading-relaxed ${
                      msg.role === 'user' 
                        ? 'bg-primary-600 text-white rounded-tr-none shadow-primary-500/10' 
                        : 'bg-white dark:bg-slate-800 text-slate-900 dark:text-white rounded-tl-none border border-slate-100 dark:border-slate-700'
                    }`}>
                      {msg.text}
                    </div>

                    {/* Result Items */}
                    {msg.items && msg.items.length > 0 && (
                      <div className="flex flex-col gap-3 w-full">
                        {msg.items.map((item: any) => (
                          <motion.div 
                            whileHover={{ x: 5 }}
                            key={item.id} 
                            className="bg-white dark:bg-slate-800 p-3 rounded-2xl border border-slate-100 dark:border-slate-700 shadow-sm flex items-center gap-3 group"
                          >
                            <img src={item.image_url} alt={item.title} className="w-12 h-12 rounded-xl object-cover border border-slate-100 dark:border-slate-700" />
                            <div className="flex-1 min-w-0">
                              <p className="text-xs font-bold text-slate-900 dark:text-white truncate">{item.title}</p>
                              <p className="text-[10px] text-primary-500 font-black">{formatINR(item.price_per_day)}/day</p>
                            </div>
                            <Link 
                              to={`/items/${item.id}`}
                              className="w-8 h-8 rounded-full bg-slate-50 dark:bg-slate-700 flex items-center justify-center text-slate-400 group-hover:bg-primary-500 group-hover:text-white transition-all"
                            >
                              <Sparkles size={14} />
                            </Link>
                          </motion.div>
                        ))}
                      </div>
                    )}
                    
                    {msg.suggestion && (
                      <div className="flex items-center gap-2 px-3 py-1.5 bg-primary-500/5 border border-primary-500/10 rounded-lg">
                        <AlertCircle size={12} className="text-primary-500" />
                        <span className="text-[10px] font-bold text-primary-600/80 italic">{msg.suggestion}</span>
                      </div>
                    )}
                  </div>
                </div>
              ))}
              {loading && (
                <div className="flex justify-start">
                  <div className="bg-white dark:bg-slate-800 px-4 py-3 rounded-2xl border border-slate-100 dark:border-slate-700 shadow-sm flex items-center gap-2">
                    <Loader2 className="animate-spin text-primary-500" size={16} />
                    <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">Assistant Thinking...</span>
                  </div>
                </div>
              )}
            </div>

            {/* Input Area */}
            <form onSubmit={handleSend} className="p-6 border-t border-slate-100 dark:border-slate-800 bg-white/50 dark:bg-slate-900/50">
              <div className="relative flex items-center gap-3">
                {!user && (
                  <div className="absolute inset-x-0 -top-12 text-center">
                    <Link to="/login" className="text-[10px] font-black uppercase tracking-widest text-primary-600 hover:underline">Log in to chat</Link>
                  </div>
                )}
                <input
                  type="text"
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  placeholder={user ? "Search or ask anything..." : "Please log in..."}
                  disabled={!user || loading}
                  className="flex-1 bg-white dark:bg-slate-800 border-2 border-slate-100 dark:border-slate-700 px-5 py-4 rounded-2xl outline-none focus:border-primary-500 focus:ring-4 focus:ring-primary-500/10 transition-all text-sm font-medium disabled:opacity-50"
                />
                <button
                  type="submit"
                  disabled={!input.trim() || loading || !user}
                  className="w-12 h-12 rounded-2xl bg-slate-900 dark:bg-white text-white dark:text-slate-900 flex items-center justify-center shadow-xl hover:scale-110 active:scale-95 transition-all disabled:opacity-50"
                >
                  <Send size={20} />
                </button>
              </div>
            </form>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
