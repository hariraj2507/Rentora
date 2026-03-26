import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Package, User, Clock, ChevronLeft, Share2, Heart, Shield, Loader2 } from 'lucide-react';
import { Link, useParams, useNavigate } from 'react-router-dom';
import { itemsApi, authApi } from '../services/api';
import { formatINR } from '../utils/format';
import Chat from '../components/Chat';

interface ItemData {
  id: string;
  title: string;
  description: string;
  price_per_day: number;
  deposit: number;
  category: string;
  condition: string;
  image_url: string;
  owner_id: string;
  owner_name: string;
  owner_trust_score: number;
  owner_avatar: string;
  owner_joined: string;
  reviews: Array<{ id: string; reviewer_name: string; rating: number; comment: string; created_at: string }>;
  bookings: Array<{ start_date: string; end_date: string }>;
}

export default function ItemDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [item, setItem] = useState<ItemData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showChat, setShowChat] = useState(false);
  const [activeTab, setActiveTab] = useState<'overview' | 'rules' | 'escrow'>('overview');
  const [isEditingPrice, setIsEditingPrice] = useState(false);
  const [newPrice, setNewPrice] = useState('');
  const [updating, setUpdating] = useState(false);
  const user = authApi.getUser();

  useEffect(() => {
    if (!id) return;
    loadItem();
  }, [id]);

  const loadItem = async () => {
    try {
      setLoading(true);
      const data = await itemsApi.getById(id!);
      setItem(data);
      setNewPrice(data.price_per_day.toString());
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdatePrice = async () => {
    if (!item || !newPrice) return;
    setUpdating(true);
    try {
      const price = parseFloat(newPrice);
      if (isNaN(price) || price <= 0) throw new Error('Invalid price');
      
      await itemsApi.update(item.id, { price_per_day: price });
      setItem({ ...item, price_per_day: price });
      setIsEditingPrice(false);
    } catch (err: any) {
      console.error('Update price error:', err);
    } finally {
      setUpdating(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="animate-spin text-primary-600" size={48} />
      </div>
    );
  }

  if (error || !item) {
    return (
      <div className="min-h-screen flex items-center justify-center flex-col gap-4">
        <p className="text-2xl font-black text-red-500">Item not found</p>
        <p className="text-slate-500">{error}</p>
        <button onClick={() => navigate('/items')} className="px-6 py-3 bg-primary-600 text-white rounded-xl font-bold">
          Back to Listings
        </button>
      </div>
    );
  }

  return (
    <div className="min-h-screen pt-28 pb-12">
      <div className="container mx-auto px-6 md:px-12 max-w-7xl">
        {/* Breadcrumbs / Back */}
        <div className="flex items-center justify-between mb-12">
          <button 
            onClick={() => navigate(-1)} 
            className="flex items-center gap-2 text-slate-500 hover:text-slate-900 dark:hover:text-white font-black text-xs uppercase tracking-widest transition-all group"
          >
            <ChevronLeft size={16} className="group-hover:-translate-x-1 transition-transform" />
            Back to listings
          </button>
          <div className="flex gap-4">
            <button className="p-3 rounded-2xl glass hover:bg-slate-100 dark:hover:bg-slate-800 transition-all text-slate-600 dark:text-slate-400">
              <Share2 size={18} />
            </button>
            <button className="p-3 rounded-2xl glass hover:bg-slate-100 dark:hover:bg-slate-800 transition-all text-slate-600 dark:text-slate-400">
              <Heart size={18} />
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-16">
          {/* Left: Gallery */}
          <div className="lg:col-span-7 space-y-8">
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="relative aspect-[4/3] rounded-[3rem] overflow-hidden glass border-4 border-white dark:border-slate-800 shadow-2xl"
            >
              <img
                src={item.image_url}
                alt={item.title}
                className="w-full h-full object-cover"
              />
            </motion.div>

            {/* Description Tab Style */}
            <div className="space-y-8 pt-8">
              <div className="inline-flex gap-8 border-b border-slate-100 dark:border-slate-800 w-full pb-px">
                <button 
                  onClick={() => setActiveTab('overview')}
                  className={`text-xl font-black pb-6 tracking-tight transition-all border-b-2 ${activeTab === 'overview' ? 'text-slate-900 dark:text-white border-primary-600' : 'text-slate-500 border-transparent hover:text-slate-900 dark:hover:text-white'}`}
                >Overview</button>
                <button 
                  onClick={() => setActiveTab('rules')}
                  className={`text-xl font-black pb-6 tracking-tight transition-all border-b-2 ${activeTab === 'rules' ? 'text-slate-900 dark:text-white border-primary-600' : 'text-slate-500 border-transparent hover:text-slate-900 dark:hover:text-white'}`}
                >Rules</button>
                <button 
                  onClick={() => setActiveTab('escrow')}
                  className={`text-xl font-black pb-6 tracking-tight transition-all flex items-center gap-2 border-b-2 ${activeTab === 'escrow' ? 'text-slate-900 dark:text-white border-primary-600' : 'text-slate-500 border-transparent hover:text-slate-900 dark:hover:text-white'}`}
                >
                   Escrow <span className="text-[10px] bg-primary-500 text-white px-2 py-0.5 rounded-full">Active</span>
                </button>
              </div>

              <div className="min-h-[300px]">
                {activeTab === 'overview' && (
                  <motion.div 
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="prose prose-slate dark:prose-invert max-w-none"
                  >
                    <h2 className="text-3xl font-black text-slate-900 dark:text-white tracking-tighter mb-4">{item.title}</h2>
                    <div className="flex gap-3 mb-6">
                      <span className="px-4 py-1.5 rounded-full bg-primary-500/10 text-primary-600 text-[10px] font-black uppercase tracking-widest">{item.category}</span>
                      <span className="px-4 py-1.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 text-[10px] font-black uppercase tracking-widest">{item.condition}</span>
                    </div>
                    <p className="text-xl text-slate-600 dark:text-slate-400 leading-relaxed font-medium">
                      {item.description}
                    </p>
                  </motion.div>
                )}

                {activeTab === 'rules' && (
                  <motion.div 
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="space-y-6"
                  >
                    <h3 className="text-2xl font-black text-slate-900 dark:text-white">Campus Rental Standards</h3>
                    <ul className="space-y-4">
                      {[
                        "Handover must happen in a public campus location (Library, Student Union, etc.)",
                        "The item should be cleaned and sanitized before return.",
                        "Late returns will incur a 2x daily fee penalty calculated by the hour.",
                        "Any accidental damage must be reported immediately via the platform chat.",
                        "The QR verification must be performed at the exact moment of handover."
                      ].map((rule, idx) => (
                        <li key={idx} className="flex gap-4 items-start">
                          <div className="w-6 h-6 rounded-full bg-primary-100 dark:bg-primary-900/30 text-primary-600 flex items-center justify-center shrink-0 mt-1 font-black text-xs">
                            {idx + 1}
                          </div>
                          <p className="text-slate-600 dark:text-slate-400 font-medium leading-relaxed">{rule}</p>
                        </li>
                      ))}
                    </ul>
                  </motion.div>
                )}

                {activeTab === 'escrow' && (
                  <motion.div 
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="space-y-8"
                  >
                    <div className="p-8 rounded-[2.5rem] bg-indigo-600 text-white relative overflow-hidden shadow-2xl">
                      <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 blur-3xl rounded-full translate-x-10 -translate-y-10" />
                      <div className="relative z-10 flex items-start gap-6">
                        <div className="p-4 bg-white/20 rounded-2xl backdrop-blur-md">
                           <Shield size={32} />
                        </div>
                        <div className="space-y-2">
                           <h4 className="text-xl font-black tracking-tight">Rentora Escrow Protection™</h4>
                           <p className="text-indigo-100 text-sm font-medium leading-relaxed">Your payment is securely held by us. The lender only receives the funds AFTER you scan the QR code to confirm a successful item handover. **100% Secure. 100% Trusted.**</p>
                        </div>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="glass p-6 rounded-3xl border-slate-100 dark:border-slate-800">
                        <h4 className="font-black text-slate-900 dark:text-white mb-2">How it works for Renters</h4>
                        <p className="text-xs text-slate-500 font-medium leading-relaxed">When you book, your funds are pulled and held in a secure vault. They are only released once you physically inspect and accept the item using your unique QR code.</p>
                      </div>
                      <div className="glass p-6 rounded-3xl border-slate-100 dark:border-slate-800">
                        <h4 className="font-black text-slate-900 dark:text-white mb-2">How it works for Lenders</h4>
                        <p className="text-xs text-slate-500 font-medium leading-relaxed">We verify the renter's funds upfront so you never risk not getting paid. Your payout is triggered the instant the renter scans your handover QR code.</p>
                      </div>
                    </div>
                  </motion.div>
                )}
              </div>

              {/* Feature Grid */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-6 pt-8">
                {[
                  { icon: <Shield className="text-blue-500" />, label: "Escrow Protected", value: "Verified" },
                  { icon: <Clock className="text-amber-500" />, label: "Zero Risk", value: "Locked" },
                  { icon: <Package className="text-primary-500" />, label: "Condition", value: item.condition },
                  { icon: <User className="text-emerald-500" />, label: "Verified Peer", value: "Individual" }
                ].map((feat, i) => (
                  <div key={i} className="glass p-6 rounded-[2rem] text-center space-y-2 border border-slate-100 dark:border-slate-800/50 hover:shadow-xl transition-all">
                    <div className="flex justify-center mb-2">{feat.icon}</div>
                    <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">{feat.label}</p>
                    <p className="text-sm font-black text-slate-900 dark:text-white tracking-tight">{feat.value}</p>
                  </div>
                ))}
              </div>

              {/* Escrow Highlight Box */}
              <div className="p-8 rounded-[2.5rem] bg-indigo-600 text-white relative overflow-hidden shadow-2xl">
                 <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 blur-3xl rounded-full translate-x-10 -translate-y-10" />
                 <div className="relative z-10 flex items-start gap-6">
                    <div className="p-4 bg-white/20 rounded-2xl backdrop-blur-md">
                       <Shield size={32} />
                    </div>
                    <div className="space-y-2">
                       <h4 className="text-xl font-black tracking-tight">Rentora Escrow Protection™</h4>
                       <p className="text-indigo-100 text-sm font-medium leading-relaxed">Your payment is securely held by us. The lender only receives the funds AFTER you scan the QR code to confirm a successful item handover. **100% Secure. 100% Trusted.**</p>
                    </div>
                 </div>
              </div>
            </div>
          </div>

          {/* Right: Actions */}
          <div className="lg:col-span-5">
            <div className="sticky top-32 space-y-8">
              {/* Pricing Card */}
              <motion.div 
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                className="glass p-12 rounded-[3.5rem] border-2 border-slate-100 dark:border-slate-800/50 shadow-2xl relative overflow-hidden"
              >
                <div className="absolute top-0 right-0 p-8">
                  <span className="bg-primary-500/10 text-primary-600 px-4 py-2 rounded-full font-black text-[10px] uppercase tracking-widest border border-primary-500/20">Popular</span>
                </div>

                <div className="flex flex-col gap-2 mb-10">
                  {isEditingPrice ? (
                    <div className="flex items-center gap-4">
                      <input 
                        type="number"
                        value={newPrice}
                        onChange={(e) => setNewPrice(e.target.value)}
                        className="w-full px-6 py-4 rounded-2xl bg-slate-50 dark:bg-slate-900 border-2 border-primary-500 outline-none font-black text-2xl"
                        autoFocus
                      />
                      <button 
                        onClick={handleUpdatePrice}
                        disabled={updating}
                        className="p-4 bg-primary-600 text-white rounded-2xl hover:bg-primary-700 disabled:opacity-50"
                      >
                        {updating ? <Loader2 className="animate-spin" size={24} /> : 'Save'}
                      </button>
                      <button 
                        onClick={() => setIsEditingPrice(false)}
                        className="p-4 text-slate-500 font-bold"
                      >
                        Cancel
                      </button>
                    </div>
                  ) : (
                    <div className="flex items-center justify-between">
                      <div className="flex items-baseline gap-2">
                        <span className="text-6xl font-black text-slate-900 dark:text-white tracking-tighter">{formatINR(item.price_per_day)}</span>
                        <span className="text-slate-400 font-black uppercase text-xs tracking-widest">/ day</span>
                      </div>
                      {user?.id === item.owner_id && (
                        <button 
                          onClick={() => setIsEditingPrice(true)}
                          className="px-4 py-2 rounded-xl bg-primary-500/10 text-primary-600 font-black text-[10px] uppercase tracking-widest hover:bg-primary-500/20 transition-all border border-primary-500/20"
                        >
                          Change Price
                        </button>
                      )}
                    </div>
                  )}
                </div>

                <div className="space-y-6 mb-10 pb-10 border-b border-slate-100 dark:border-slate-800">
                  <div className="flex items-center justify-between">
                    <span className="text-slate-500 font-medium">Refundable Deposit</span>
                    <span className="text-slate-900 dark:text-white font-black">{formatINR(item.deposit)}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-slate-500 font-medium">Platform Service Fee</span>
                    <span className="text-emerald-500 font-black">Free (Beta)</span>
                  </div>
                </div>

                <Link 
                  to={`/book/${item.id}`}
                  className="w-full py-6 rounded-[2rem] bg-slate-900 dark:bg-white text-white dark:text-slate-900 text-center font-black uppercase tracking-widest text-sm hover:scale-[1.02] active:scale-95 transition-all shadow-2xl shadow-slate-500/20 flex items-center justify-center gap-3"
                >
                  Request to Borrow
                  <ChevronLeft size={20} className="rotate-180" />
                </Link>

                <p className="text-center text-xs text-slate-400 mt-6 font-medium tracking-tight">
                  Protected by <span className="text-primary-600 font-black underline underline-offset-4">Rentora Assurance</span>™
                </p>
              </motion.div>

              {/* Owner Trust Card */}
              <div className="glass p-10 rounded-[3rem] border border-slate-100 dark:border-slate-800/50">
                <div className="flex items-center gap-6 mb-8">
                  <img src={item.owner_avatar} className="w-16 h-16 rounded-[1.5rem] shadow-xl" />
                  <div>
                    <h4 className="text-xl font-black text-slate-900 dark:text-white tracking-tight">{item.owner_name}</h4>
                    <p className="text-xs font-black uppercase tracking-widest text-slate-500">Verified Lender</p>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-6 mb-8">
                  <div className="space-y-1">
                    <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Trust Score</p>
                    <div className="flex items-center gap-2">
                      <div className="h-2 w-full bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                        <div className="h-full bg-primary-600" style={{ width: `${item.owner_trust_score}%` }}></div>
                      </div>
                      <span className="text-sm font-black text-slate-900 dark:text-white tabular-nums">{item.owner_trust_score}</span>
                    </div>
                  </div>
                </div>

                <button 
                  onClick={() => setShowChat(true)}
                  className="w-full py-4 rounded-2xl glass border border-slate-200 dark:border-slate-800 font-black uppercase tracking-widest text-[10px] hover:bg-slate-50 dark:hover:bg-slate-800 transition-all"
                >
                  Chat with Lender
                </button>
              </div>
            </div>
          </div>
        </div>

        <AnimatePresence>
          {showChat && item && (
            <Chat 
              itemId={item.id}
              receiverId={item.owner_id}
              itemTitle={item.title}
              onClose={() => setShowChat(false)}
            />
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
