import { ShieldCheck, Star, ShieldAlert, Award, ChevronRight, CheckCircle2, MapPin, Calendar, Package, TrendingUp, Loader2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { dashboardApi, authApi } from '../services/api';
import { formatINR } from '../utils/format';
import { useEffect, useState } from 'react';

export default function Profile() {
  const [activeTab, setActiveTab] = useState<'overview' | 'history'>('overview');
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const user = authApi.getUser();

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const data = await dashboardApi.getStats();
      setStats(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  if (loading || !user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="animate-spin text-primary-600" size={40} />
      </div>
    );
  }

  const avatar = `https://ui-avatars.com/api/?name=${encodeURIComponent(user.name)}&background=4f46e5&color=fff`;

  return (
    <div className="min-h-screen pt-32 pb-24">
      <div className="container mx-auto px-6 md:px-12 max-w-7xl">
        <div className="flex flex-col lg:flex-row gap-16">
          
          {/* Sidebar: Profile Info */}
          <div className="w-full lg:w-96 shrink-0 space-y-8">
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="glass p-12 rounded-[3.5rem] text-center border-2 border-slate-100 dark:border-slate-800/50 shadow-2xl relative overflow-hidden"
            >
              <div className="absolute top-0 inset-x-0 h-32 bg-primary-500/5 -z-10" />
              
              <div className="relative inline-block mb-8">
                <img src={avatar} className="w-32 h-32 rounded-[2.5rem] shadow-2xl border-4 border-white dark:border-slate-800" />
                <div className="absolute -bottom-2 -right-2 bg-emerald-500 text-white p-2 rounded-xl shadow-lg">
                  <ShieldCheck size={20} />
                </div>
              </div>

              <h2 className="text-3xl font-black text-slate-900 dark:text-white mb-2 tracking-tighter">{user.name}</h2>
              <p className="text-xs font-black uppercase tracking-widest text-slate-500 mb-8">{user.email.split('@')[0]} • Joined Mar 2024</p>
              
              <div className="space-y-4">
                <div className="flex items-center justify-between p-4 glass rounded-2xl border border-slate-100 dark:border-slate-800/50">
                  <span className="text-xs font-black uppercase tracking-widest text-slate-400 text-left">Trust Score</span>
                  <span className="text-xl font-black text-primary-600 tabular-nums">{stats?.trust_score || 80}%</span>
                </div>
                <div className="flex items-center justify-between p-4 glass rounded-2xl border border-slate-100 dark:border-slate-800/50">
                  <span className="text-xs font-black uppercase tracking-widest text-slate-400 text-left">Community Rank</span>
                  <span className="text-sm font-black text-slate-900 dark:text-white">Gold Lender</span>
                </div>
              </div>
            </motion.div>

            <div className="glass p-10 rounded-[3rem] border border-slate-100 dark:border-slate-800/50">
              <h3 className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-8 border-b border-slate-100 dark:border-slate-800 pb-4">Verification Registry</h3>
              <ul className="space-y-6">
                {[
                  { icon: <CheckCircle2 className="text-primary-600" />, label: "University Email", status: true },
                  { icon: <CheckCircle2 className="text-primary-600" />, label: "Student ID", status: true },
                  { icon: <ShieldAlert className="text-slate-300" />, label: "Biometric Proof", status: false }
                ].map((v, i) => (
                  <li key={i} className="flex items-center gap-4">
                    <div className="shrink-0">{v.icon}</div>
                    <span className={`text-xs font-black uppercase tracking-widest ${v.status ? 'text-slate-900 dark:text-white' : 'text-slate-400'}`}>{v.label}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          {/* Main Content Area */}
          <div className="flex-1 space-y-12">
            <div className="flex gap-12 border-b border-slate-100 dark:border-slate-800 w-full pb-px">
              <button 
                onClick={() => setActiveTab('overview')}
                className={`text-2xl font-black tracking-tighter pb-8 border-b-2 transition-all ${activeTab === 'overview' ? 'text-slate-900 dark:text-white border-primary-600' : 'text-slate-400 border-transparent hover:text-slate-600'}`}
              >
                Performance
              </button>
              <button 
                onClick={() => setActiveTab('history')}
                className={`text-2xl font-black tracking-tighter pb-8 border-b-2 transition-all ${activeTab === 'history' ? 'text-slate-900 dark:text-white border-primary-600' : 'text-slate-400 border-transparent hover:text-slate-600'}`}
              >
                Deal History
              </button>
            </div>

            <AnimatePresence mode="wait">
              <motion.div
                key={activeTab}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.4 }}
                className="space-y-12"
              >
                {activeTab === 'overview' ? (
                  <>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                      {[
                        { icon: <Package />, label: "Total Rentals", value: stats?.active_rentals || 0, color: "text-blue-500" },
                        { icon: <Award />, label: "Lent Out", value: stats?.active_lent || 0, color: "text-primary-600" },
                        { icon: <TrendingUp />, label: "Reliability", value: "100%", color: "text-emerald-500" }
                      ].map((stat, i) => (
                        <div key={i} className="glass p-8 rounded-[2.5rem] border border-slate-100 dark:border-slate-800/50 hover:shadow-xl transition-all">
                          <div className={`p-3 rounded-xl bg-slate-50 dark:bg-slate-800 w-fit mb-6 ${stat.color}`}>{stat.icon}</div>
                          <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2">{stat.label}</p>
                          <p className="text-4xl font-black text-slate-900 dark:text-white tracking-tighter tabular-nums">{stat.value}</p>
                        </div>
                      ))}
                    </div>

                    <div className="space-y-8">
                      <h3 className="text-xl font-black text-slate-900 dark:text-white tracking-tight flex items-center gap-3">
                        <Star className="text-amber-500 fill-amber-500" /> Community Appraisal
                      </h3>
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                        {[
                          { author: 'Emily C.', comment: 'Always takes great care of gear. Very trustworthy member of the community.' },
                          { author: 'Michael R.', comment: 'Seamless transaction. Item was in perfect condition as described.' },
                        ].map((review, i) => (
                          <div key={i} className="glass p-10 rounded-[3rem] border border-slate-100 dark:border-slate-800/50 relative">
                             <div className="flex gap-1 mb-6 text-amber-500">
                                {[...Array(5)].map((_, i) => <Star key={i} size={14} className="fill-current" />)}
                             </div>
                             <p className="text-lg text-slate-600 dark:text-slate-400 font-medium leading-relaxed mb-8 italic">"{review.comment}"</p>
                             <div className="flex items-center gap-4">
                               <div className="w-10 h-10 rounded-[1rem] bg-slate-100 dark:bg-slate-800 flex items-center justify-center font-black text-xs">{review.author.charAt(0)}</div>
                               <div>
                                  <p className="text-sm font-black text-slate-900 dark:text-white tracking-tight">{review.author}</p>
                                  <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Oct 2023</p>
                               </div>
                             </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </>
                ) : (
                  <div className="space-y-6">
                    {stats?.recent_activity?.length > 0 ? (
                      stats.recent_activity.map((tx: any) => (
                      <motion.div 
                        whileHover={{ scale: 1.01 }}
                        key={tx.id} 
                        className="glass p-8 rounded-[2.5rem] border border-slate-100 dark:border-slate-800/50 flex flex-col md:flex-row gap-8 items-center"
                      >
                        <div className="w-24 h-24 rounded-3xl overflow-hidden shadow-xl border-4 border-white dark:border-slate-800 shrink-0 bg-slate-100 dark:bg-slate-900 flex items-center justify-center">
                          {tx.item_image ? (
                            <img src={tx.item_image} className="w-full h-full object-cover" />
                          ) : (
                            <Package size={32} className="text-slate-400" />
                          )}
                        </div>
                        
                        <div className="flex-1 text-center md:text-left">
                          <div className="flex flex-wrap items-center justify-center md:justify-start gap-3 mb-3">
                            <span className={`px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest ${
                              tx.renter_name === user.name ? 'bg-blue-500/10 text-blue-600' : 'bg-primary-500/10 text-primary-600'
                            }`}>
                              {tx.renter_name === user.name ? 'Borrowed' : 'Lent'}
                            </span>
                            <span className="px-4 py-1.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-500 text-[10px] font-black uppercase tracking-widest">
                               {tx.status}
                            </span>
                          </div>
                          <h4 className="text-xl font-black text-slate-900 dark:text-white tracking-tight mb-2">{tx.item_title}</h4>
                          <div className="flex items-center justify-center md:justify-start gap-4 text-[10px] font-black uppercase tracking-widest text-slate-400">
                             <span className="flex items-center gap-1.5"><Calendar size={12} /> {tx.start_date} → {tx.end_date}</span>
                             <span className="flex items-center gap-1.5"><MapPin size={12} /> {tx.renter_name === user.name ? `From ${tx.owner_name}` : `To ${tx.renter_name}`}</span>
                          </div>
                        </div>

                        <div className="flex flex-col items-end gap-3 shrink-0">
                           <p className="text-2xl font-black text-slate-900 dark:text-white tabular-nums">{formatINR(tx.total_rental)}</p>
                           <button className="flex items-center gap-1.5 text-[10px] font-black uppercase tracking-widest text-primary-600 group">
                              Audit Transaction <ChevronRight size={14} className="group-hover:translate-x-1 transition-transform" />
                           </button>
                        </div>
                      </motion.div>
                    ))) : (
                      <div className="glass p-12 text-center rounded-[3rem]">
                        <Package className="mx-auto mb-4 text-slate-300" size={48} />
                        <p className="text-slate-500 font-bold">No deals recorded yet.</p>
                      </div>
                    )}
                  </div>
                )}
              </motion.div>
            </AnimatePresence>
          </div>

        </div>
      </div>
    </div>
  );
}
