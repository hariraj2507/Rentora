import { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { MessageSquare, Search, Send, ChevronRight, Loader2, ArrowLeft } from 'lucide-react';
import { messagesApi, authApi } from '../services/api';
import { Link } from 'react-router-dom';

interface Thread {
  id: string;
  sender_id: string;
  receiver_id: string;
  item_id: string;
  message_text: string;
  created_at: string;
  sender_name: string;
  sender_avatar: string;
  receiver_name: string;
  receiver_avatar: string;
  item_title: string;
  item_image: string;
}

export default function Messages() {
  const [threads, setThreads] = useState<Thread[]>([]);
  const [selectedThread, setSelectedThread] = useState<Thread | null>(null);
  const [messages, setMessages] = useState<any[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [msgLoading, setMsgLoading] = useState(false);
  const [sending, setSending] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const user = authApi.getUser();

  useEffect(() => {
    fetchThreads();
    const interval = setInterval(fetchThreads, 10000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (selectedThread) {
      fetchMessages(selectedThread.item_id);
    }
  }, [selectedThread]);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const fetchThreads = async () => {
    try {
      const data = await messagesApi.getUserMessages();
      // Group by itemId + unique partner pairing to show threads
      const uniqueThreads: Record<string, Thread> = {};
      data.forEach((m: Thread) => {
        const partnerId = m.sender_id === user.id ? m.receiver_id : m.sender_id;
        const threadKey = `${m.item_id}-${partnerId}`;
        if (!uniqueThreads[threadKey]) {
          uniqueThreads[threadKey] = m;
        }
      });
      setThreads(Object.values(uniqueThreads));
    } catch (err) {
      console.error('Failed to fetch threads:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchMessages = async (itemId: string) => {
    if (!selectedThread) return;
    setMsgLoading(true);
    try {
      const partnerId = selectedThread.sender_id === user.id ? selectedThread.receiver_id : selectedThread.sender_id;
      const data = await messagesApi.list(itemId, user.id, partnerId);
      setMessages(data);
    } catch (err) {
      console.error('Failed to fetch messages:', err);
    } finally {
      setMsgLoading(false);
    }
  };

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || !selectedThread || sending) return;

    const partnerId = selectedThread.sender_id === user.id ? selectedThread.receiver_id : selectedThread.sender_id;
    setSending(true);
    try {
      await messagesApi.send({
        receiver_id: partnerId,
        item_id: selectedThread.item_id,
        message_text: newMessage.trim()
      });
      setNewMessage('');
      fetchMessages(selectedThread.item_id);
    } catch (err) {
      console.error('Failed to send:', err);
    } finally {
      setSending(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen pt-32 flex items-center justify-center">
        <Loader2 className="animate-spin text-primary-600" size={48} />
      </div>
    );
  }

  return (
    <div className="container mx-auto px-6 md:px-12 py-32 min-h-screen max-w-7xl">
      <div className="flex flex-col lg:flex-row h-[750px] glass rounded-[3rem] overflow-hidden border border-slate-200 dark:border-slate-800 shadow-2xl">
        
        {/* Sidebar: Threads */}
        <div className={`w-full lg:w-[400px] border-r border-slate-200 dark:border-slate-800 bg-white/50 dark:bg-slate-900/50 flex flex-col ${selectedThread ? 'hidden lg:flex' : 'flex'}`}>
          <div className="p-8 border-b border-slate-200 dark:border-slate-800">
            <h1 className="text-3xl font-black text-slate-900 dark:text-white tracking-tighter mb-6">Messages</h1>
            <div className="relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
              <input 
                type="text" 
                placeholder="Search conversations..." 
                className="w-full pl-12 pr-6 py-3 rounded-2xl bg-slate-100 dark:bg-slate-800 text-sm font-medium outline-none focus:ring-2 focus:ring-primary-500/20"
              />
            </div>
          </div>

          <div className="flex-1 overflow-y-auto custom-scrollbar p-4 space-y-2">
            {threads.length === 0 ? (
              <div className="text-center py-12 text-slate-400">
                <MessageSquare className="mx-auto mb-4 opacity-20" size={48} />
                <p className="font-bold">No messages yet</p>
                <Link to="/items" className="text-xs text-primary-600 hover:underline">Start browsing items</Link>
              </div>
            ) : (
              threads.map((thread) => {
                const partnerName = thread.sender_id === user.id ? thread.receiver_name : thread.sender_name;
                const partnerAvatar = thread.sender_id === user.id ? thread.receiver_avatar : thread.sender_avatar;
                const isActive = selectedThread?.item_id === thread.item_id && 
                                (selectedThread?.sender_id === thread.sender_id || selectedThread?.receiver_id === thread.sender_id);

                return (
                  <motion.button
                    whileHover={{ x: 4 }}
                    key={thread.id}
                    onClick={() => setSelectedThread(thread)}
                    className={`w-full p-4 rounded-3xl flex items-center gap-4 transition-all ${isActive ? 'bg-slate-900 dark:bg-white shadow-xl translate-x-1' : 'hover:bg-slate-50 dark:hover:bg-slate-800'}`}
                  >
                    <div className="relative shrink-0">
                      <img src={partnerAvatar} className="w-14 h-14 rounded-2xl object-cover" />
                      <div className="absolute -bottom-1 -right-1 w-4 h-4 rounded-full bg-emerald-500 border-2 border-white dark:border-slate-900" />
                    </div>
                    <div className="flex-1 text-left min-w-0">
                      <div className="flex justify-between items-start mb-0.5">
                        <h3 className={`font-black tracking-tight truncate ${isActive ? 'text-white dark:text-slate-900' : 'text-slate-900 dark:text-white'}`}>
                          {partnerName}
                        </h3>
                        <span className={`text-[9px] font-bold ${isActive ? 'text-slate-400' : 'text-slate-400'}`}>
                          {new Date(thread.created_at).toLocaleDateString()}
                        </span>
                      </div>
                      <p className={`text-xs font-bold truncate ${isActive ? 'text-primary-400' : 'text-primary-500'}`}>
                        {thread.item_title}
                      </p>
                      <p className={`text-[11px] truncate mt-1 ${isActive ? 'text-slate-300' : 'text-slate-500'}`}>
                        {thread.message_text}
                      </p>
                    </div>
                  </motion.button>
                );
              })
            )}
          </div>
        </div>

        {/* Chat Area */}
        <div className={`flex-1 flex flex-col bg-white dark:bg-slate-900 ${!selectedThread ? 'hidden lg:flex items-center justify-center p-20 text-center' : 'flex'}`}>
          {!selectedThread ? (
            <div className="space-y-6">
              <div className="w-32 h-32 rounded-[2.5rem] bg-slate-50 dark:bg-slate-800 flex items-center justify-center mx-auto shadow-inner">
                <MessageSquare size={64} className="text-slate-200 dark:text-slate-700" />
              </div>
              <h2 className="text-3xl font-black text-slate-900 dark:text-white tracking-tighter">Your Campus Inbox</h2>
              <p className="text-slate-500 dark:text-slate-400 max-w-sm">Select a conversation to coordinate pick-ups, ask questions, or discuss item details with campus peers.</p>
            </div>
          ) : (
            <>
              {/* Chat Header */}
              <div className="p-6 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <button onClick={() => setSelectedThread(null)} className="lg:hidden p-2 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800">
                    <ArrowLeft size={20} />
                  </button>
                  <div className="flex items-center gap-4">
                    <img 
                      src={selectedThread.sender_id === user.id ? selectedThread.receiver_avatar : selectedThread.sender_avatar} 
                      className="w-12 h-12 rounded-xl object-cover" 
                    />
                    <div>
                      <h3 className="font-black text-slate-900 dark:text-white leading-tight">
                        {selectedThread.sender_id === user.id ? selectedThread.receiver_name : selectedThread.sender_name}
                      </h3>
                      <Link to={`/items/${selectedThread.item_id}`} className="text-[10px] font-black uppercase tracking-widest text-primary-600 hover:text-primary-700">
                        {selectedThread.item_title} <ChevronRight size={10} className="inline" />
                      </Link>
                    </div>
                  </div>
                </div>
              </div>

              {/* Chat Messages */}
              <div ref={scrollRef} className="flex-1 overflow-y-auto p-8 space-y-6 bg-slate-50/30 dark:bg-slate-950/20 custom-scrollbar">
                {msgLoading ? (
                   <div className="h-full flex flex-col items-center justify-center gap-4">
                      <Loader2 className="animate-spin text-primary-500" />
                      <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Syncing Messages...</p>
                   </div>
                ) : (
                  messages.map((msg, i) => (
                    <div key={msg.message_id || i} className={`flex ${msg.sender_id === user.id ? 'justify-end' : 'justify-start'}`}>
                      <div className={`max-w-[70%] space-y-1 ${msg.sender_id === user.id ? 'items-end' : 'items-start'}`}>
                        <div className={`px-5 py-3 rounded-2xl shadow-sm text-sm font-medium leading-relaxed ${
                          msg.sender_id === user.id 
                            ? 'bg-slate-900 dark:bg-white text-white dark:text-slate-900 rounded-tr-none shadow-indigo-500/5' 
                            : 'bg-white dark:bg-slate-800 text-slate-900 dark:text-white rounded-tl-none border border-slate-100 dark:border-slate-700'
                        }`}>
                          {msg.message_text}
                        </div>
                        <span className="text-[9px] font-bold text-slate-400 opacity-0 group-hover:opacity-100 transition-opacity">
                          {new Date(msg.timestamp || msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>
                    </div>
                  ))
                )}
              </div>

              {/* Chat Input */}
              <form onSubmit={handleSend} className="p-8 border-t border-slate-100 dark:border-slate-800">
                <div className="relative">
                  <input
                    type="text"
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    placeholder="Type your message..."
                    className="w-full pl-6 pr-16 py-4 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border-2 border-slate-100 dark:border-slate-800 focus:border-primary-500 focus:ring-4 focus:ring-primary-500/10 outline-none transition-all font-medium text-slate-900 dark:text-white"
                  />
                  <button
                    type="submit"
                    disabled={!newMessage.trim() || sending}
                    className="absolute right-2 top-1/2 -translate-y-1/2 w-12 h-12 rounded-xl bg-slate-900 dark:bg-white text-white dark:text-slate-900 flex items-center justify-center shadow-xl hover:scale-105 active:scale-95 transition-all disabled:opacity-50"
                  >
                    {sending ? <Loader2 className="animate-spin" size={20} /> : <Send size={20} />}
                  </button>
                </div>
              </form>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
