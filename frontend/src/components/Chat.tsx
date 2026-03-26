import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Send, X, MessageSquare, Loader2, User } from 'lucide-react';
import { messagesApi, authApi } from '../services/api';

interface Message {
  message_id: string;
  sender_id: string;
  receiver_id: string;
  item_id: string;
  message_text: string;
  timestamp: string;
}

interface ChatProps {
  itemId: string;
  receiverId: string;
  itemTitle: string;
  onClose: () => void;
}

export default function Chat({ itemId, receiverId, itemTitle, onClose }: ChatProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const user = authApi.getUser();

  const fetchMessages = async () => {
    if (!user) return;
    try {
      const data = await messagesApi.list(itemId, user.id, receiverId);
      setMessages(data);
    } catch (err) {
      console.error('Failed to fetch messages:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMessages();
    const interval = setInterval(fetchMessages, 3000); // Polling every 3s as requested
    return () => clearInterval(interval);
  }, [itemId, receiverId]);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || sending) return;

    setSending(true);
    try {
      await messagesApi.send({
        receiver_id: receiverId,
        item_id: itemId,
        message_text: newMessage.trim()
      });
      setNewMessage('');
      fetchMessages();
    } catch (err) {
      console.error('Failed to send message:', err);
    } finally {
      setSending(false);
    }
  };

  return (
    <motion.div 
      initial={{ opacity: 0, scale: 0.95, y: 20 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.95, y: 20 }}
      className="fixed bottom-6 right-6 z-[100] w-[400px] h-[600px] glass bg-white dark:bg-slate-900 shadow-2xl rounded-[2.5rem] border border-slate-200 dark:border-slate-800 flex flex-col overflow-hidden"
    >
      {/* Header */}
      <div className="p-6 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between bg-white/50 dark:bg-slate-900/50 backdrop-blur-md">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-primary-500/10 flex items-center justify-center text-primary-600">
            <MessageSquare size={20} />
          </div>
          <div>
            <h3 className="font-bold text-slate-900 dark:text-white leading-tight">Lender Chat</h3>
            <p className="text-[10px] uppercase font-black tracking-widest text-slate-400 truncate max-w-[200px]">{itemTitle}</p>
          </div>
        </div>
        <button onClick={onClose} className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full transition-colors text-slate-400">
          <X size={20} />
        </button>
      </div>

      {/* Messages */}
      <div 
        ref={scrollRef}
        className="flex-1 overflow-y-auto p-6 space-y-4 custom-scrollbar"
      >
        {loading && messages.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-slate-400 gap-3">
            <Loader2 className="animate-spin" />
            <p className="text-xs font-bold uppercase tracking-widest">Loading history...</p>
          </div>
        ) : messages.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-slate-400 gap-3 text-center px-8">
            <div className="w-16 h-16 rounded-3xl bg-slate-50 dark:bg-slate-800 flex items-center justify-center mb-2">
              <MessageSquare size={32} />
            </div>
            <p className="text-sm font-bold text-slate-600 dark:text-slate-300">Start the conversation!</p>
            <p className="text-xs">Ask about the item condition, pickup location, or availability details.</p>
          </div>
        ) : (
              messages.map((msg) => (
                <div 
                  key={msg.message_id}
                  className={`flex ${msg.sender_id === user?.id ? 'justify-end' : 'justify-start'}`}
                >
                  <div 
                    className={`max-w-[80%] px-5 py-3 rounded-3xl shadow-sm ${
                      msg.sender_id === user?.id 
                        ? 'bg-slate-900 dark:bg-white text-white dark:text-slate-900 rounded-tr-none' 
                        : 'bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-white rounded-tl-none'
                    }`}
                  >
                    <p className="text-sm font-medium leading-relaxed">{msg.message_text}</p>
                    <p className={`text-[9px] mt-1 opacity-50 font-bold ${msg.sender_id === user?.id ? 'text-right' : 'text-left'}`}>
                      {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </p>
                  </div>
                </div>
              ))
        )}
      </div>

      {/* Input */}
      <form 
        onSubmit={handleSend}
        className="p-6 border-t border-slate-100 dark:border-slate-800 bg-white/50 dark:bg-slate-900/50"
      >
        <div className="relative">
          <input 
            type="text"
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            placeholder="Type your message..."
            className="w-full pl-6 pr-14 py-4 rounded-2xl bg-white dark:bg-slate-800 border-2 border-slate-100 dark:border-slate-700 focus:border-primary-500 focus:ring-4 focus:ring-primary-500/10 outline-none transition-all font-medium text-slate-900 dark:text-white"
          />
          <button 
            type="submit"
            disabled={!newMessage.trim() || sending}
            className="absolute right-2 top-1/2 -translate-y-1/2 p-3 bg-slate-900 dark:bg-white text-white dark:text-slate-900 rounded-xl hover:scale-105 active:scale-95 transition-all shadow-lg disabled:opacity-50"
          >
            {sending ? <Loader2 className="animate-spin" size={20} /> : <Send size={20} />}
          </button>
        </div>
      </form>
    </motion.div>
  );
}
