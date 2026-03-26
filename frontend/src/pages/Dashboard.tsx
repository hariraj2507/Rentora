import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Package, TrendingUp, Calendar, Star, Search, ChevronRight, Loader2, LogOut, Leaf, Landmark, Zap } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { QRCodeSVG } from 'qrcode.react';
import { dashboardApi, authApi, itemsApi, rentalRequestsApi, bookingsApi, agreementsApi } from '../services/api';
import { formatINR } from '../utils/format';
import { useToast } from '../components/Toast';
import { FileText } from 'lucide-react';

interface DashboardStats {
  active_rentals: number;
  active_lent: number;
  total_earnings: number;
  items_listed: number;
  trust_score: number;
  upcoming: Array<{
    id: string;
    item_title: string;
    item_image: string;
    start_date: string;
    end_date: string;
    status: string;
    total_rental: number;
    owner_name: string;
  }>;
  recent_activity: Array<{
    id: string;
    item_title: string;
    item_image: string;
    status: string;
    total_rental: number;
    renter_name: string;
    owner_name: string;
    start_date: string;
    end_date: string;
    created_at: string;
  }>;
}

interface RecommendedItem {
  id: string;
  title: string;
  price_per_day: number;
  image_url: string;
  category: string;
}

export default function Dashboard() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [recommendations, setRecommendations] = useState<RecommendedItem[]>([]);
  const [ownerRequests, setOwnerRequests] = useState<any[]>([]);
  const [renterRequests, setRenterRequests] = useState<any[]>([]);
  const [showQrModal, setShowQrModal] = useState<string | null>(null); // booking id
  const [loading, setLoading] = useState(true);
  const user = authApi.getUser();

  useEffect(() => {
    if (!authApi.isAuthenticated()) {
      navigate('/login');
      return;
    }
    loadDashboard();
  }, []);

  const loadDashboard = async () => {
    try {
      setLoading(true);
      const [dashData, itemsData, oReqs, rReqs] = await Promise.all([
        dashboardApi.getStats(),
        itemsApi.list(),
        rentalRequestsApi.getOwnerRequests(user.id).catch(() => []),
        rentalRequestsApi.getRenterRequests(user.id).catch(() => []),
      ]);
      setStats(dashData);
      setRecommendations(itemsData.slice(0, 3));
      setOwnerRequests(oReqs);
      setRenterRequests(rReqs);
    } catch (err: any) {
      console.error('Dashboard load error:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleRequestStatus = async (id: string, st: string) => {
    try {
      await rentalRequestsApi.updateStatus(id, st);
      toast(`Request ${st}`, 'success');
      loadDashboard();
    } catch (err: any) {
      toast(err.message, 'error');
    }
  };

  const handlePayAndConfirm = async (req: any) => {
    try {
      await bookingsApi.create({
        item_id: req.item_id,
        start_date: req.start_date,
        end_date: req.end_date,
        payment_method: 'card' // default for now
      });
      await rentalRequestsApi.updateStatus(req.id, 'booked');
      toast('Booking Confirmed & Paid!', 'success');
      loadDashboard();
    } catch (err: any) {
      toast(err.message, 'error');
    }
  };

  const simulateScan = async (booking: any) => {
    try {
      if (booking.status === 'pending' || booking.status === 'confirmed') {
        await bookingsApi.updateStatus(booking.id, 'active');
        toast('QR Scanned! Item picked up.', 'success');
      } else if (booking.status === 'active') {
        await bookingsApi.updateStatus(booking.id, 'completed');
        toast('QR Scanned! Item returned.', 'success');
      }
      loadDashboard();
    } catch (err: any) {
      toast(err.message, 'error');
    }
  };

  const handleDownloadAgreement = async (bookingId: string) => {
    try {
      const blob = await agreementsApi.getPdf(bookingId);
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `Agreement_${bookingId}.pdf`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
    } catch (err: any) {
      toast('Agreement PDF not available for this booking.', 'error');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="animate-spin text-primary-600" size={48} />
      </div>
    );
  }

  return (
    <div className="container mx-auto px-6 md:px-12 py-32 min-h-screen max-w-7xl">
      <div className="mb-12 flex flex-col md:flex-row md:items-end justify-between gap-6">
        <motion.div 
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
        >
          <h1 className="text-4xl font-bold tracking-tight text-slate-900 dark:text-white mb-3">
            Welcome back, <span className="text-gradient">{user?.name?.split(' ')[0] || 'Student'}</span> 👋
          </h1>
          <p className="text-slate-500 dark:text-slate-400 text-lg">Your campus rental activity overview.</p>
        </motion.div>
        
        <motion.div 
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          className="flex items-center gap-4"
        >
          <div className="glass px-6 py-3 rounded-2xl flex items-center gap-4 border-indigo-100 dark:border-indigo-900/30">
            <div className="bg-indigo-100 dark:bg-indigo-900/40 p-2 rounded-xl text-indigo-600 dark:text-indigo-400 shadow-inner">
              <Star size={20} className="fill-indigo-500" />
            </div>
            <div>
              <p className="text-xs text-slate-500 dark:text-slate-500 font-bold uppercase tracking-wider">Trust Score</p>
              <p className="text-xl font-black text-slate-900 dark:text-white">{stats?.trust_score || 80} <span className="text-sm font-medium text-slate-400">/ 100</span></p>
            </div>
          </div>
          <Link to="/items" className="px-6 py-3.5 rounded-2xl font-bold text-white bg-gradient-to-r from-primary-600 to-indigo-600 hover:from-primary-700 hover:to-indigo-700 shadow-xl shadow-primary-500/20 transition-all hover:-translate-y-1 hover:scale-105 flex items-center gap-2">
            <Package size={20} />
            Browse Items
          </Link>
          <button
            onClick={() => authApi.logout()}
            className="p-3.5 rounded-2xl glass hover:bg-red-50 dark:hover:bg-red-900/20 text-slate-400 hover:text-red-500 transition-all"
            title="Logout"
          >
            <LogOut size={20} />
          </button>
        </motion.div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-16">
        {[
          { title: "Active Rentals", value: String(stats?.active_rentals || 0), icon: <Package size={28} />, color: "text-blue-500", bg: "bg-blue-50 dark:bg-blue-500/10", border: "border-blue-100 dark:border-blue-900/30" },
          { title: "Items Lent", value: String(stats?.active_lent || 0), icon: <TrendingUp size={28} />, color: "text-emerald-500", bg: "bg-emerald-50 dark:bg-emerald-500/10", border: "border-emerald-100 dark:border-emerald-900/30" },
          { title: "Earnings", value: formatINR(stats?.total_earnings || 0), icon: <TrendingUp size={28} />, color: "text-primary-500", bg: "bg-primary-50 dark:bg-primary-500/10", border: "border-primary-100 dark:border-primary-900/30" },
          { title: "Listed Items", value: String(stats?.items_listed || 0), icon: <Calendar size={28} />, color: "text-amber-500", bg: "bg-amber-50 dark:bg-amber-500/10", border: "border-amber-100 dark:border-amber-900/30" }
        ].map((stat, i) => (
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.1 }}
            key={i} 
            className={`glass p-8 flex items-center gap-6 border-2 ${stat.border} hover-lift`}
          >
            <div className={`${stat.bg} ${stat.color} p-5 rounded-2xl`}>
              {stat.icon}
            </div>
            <div>
              <p className="text-sm font-bold text-slate-500 dark:text-slate-500 uppercase tracking-widest mb-1">{stat.title}</p>
              <h3 className="text-3xl font-black text-slate-900 dark:text-white leading-none">{stat.value}</h3>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Sustainability Impact Section */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
        className="mb-16 p-8 rounded-[3rem] bg-emerald-600 text-white relative overflow-hidden shadow-2xl shadow-emerald-500/20"
      >
        <div className="absolute top-0 right-0 w-96 h-96 bg-white/10 blur-[120px] rounded-full translate-x-1/2 -translate-y-1/2" />
        <div className="absolute bottom-0 left-0 w-64 h-64 bg-emerald-400/20 blur-[80px] rounded-full -translate-x-1/2 translate-y-1/2" />
        
        <div className="relative z-10">
          <div className="flex items-center gap-3 mb-8">
            <div className="p-2 bg-white/20 rounded-xl backdrop-blur-md">
              <Leaf size={24} />
            </div>
            <h2 className="text-2xl font-black tracking-tight uppercase tracking-widest text-[11px]">Your Sustainability Impact — SDG 12</h2>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-12">
            {[
              { label: "CO₂ Emissions Saved", value: "14.2 kg", desc: "By renting instead of buying new.", icon: <Zap size={24} /> },
              { label: "Campus Waste Reduced", value: "3.5 kg", desc: "Estimated e-waste diverted.", icon: <Landmark size={24} /> },
              { label: "Community Savings", value: formatINR((stats?.active_rentals || 0) * 8000), desc: "Potential buying cost avoided.", icon: <Star size={24} /> }
            ].map((impact, i) => (
              <div key={i} className="space-y-3">
                <div className="flex items-center gap-3">
                  <span className="text-white/60">{impact.icon}</span>
                  <span className="text-4xl font-black tracking-tighter tabular-nums">{impact.value}</span>
                </div>
                <p className="text-emerald-100 font-bold text-sm tracking-tight">{impact.label}</p>
                <p className="text-emerald-100/60 text-xs font-medium">{impact.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </motion.div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
        {/* Main Content Area */}
        <div className="lg:col-span-2 space-y-10">
          <section>
            <div className="flex items-center justify-between mb-8">
              <h2 className="text-2xl font-bold text-slate-900 dark:text-white flex items-center gap-3">
                <div className="w-2 h-8 bg-primary-600 rounded-full" />
                Recent Activity
              </h2>
              <Link to="/items" className="text-sm font-bold text-primary-600 hover:text-primary-700 dark:text-primary-400 group flex items-center gap-1">
                View all <ChevronRight size={16} className="group-hover:translate-x-1 transition-transform" />
              </Link>
            </div>
            
            <div className="space-y-6">
              {stats?.recent_activity && stats.recent_activity.length > 0 ? (
                stats.recent_activity.map((activity) => (
                  <motion.div 
                    key={activity.id}
                    whileHover={{ y: -5 }}
                    className="glass p-6 flex flex-col sm:flex-row gap-6 items-center border-slate-100 dark:border-slate-800/50 group"
                  >
                    <div className="w-full sm:w-40 h-32 rounded-2xl bg-slate-100 dark:bg-slate-900 overflow-hidden shrink-0 border border-slate-200 dark:border-slate-800">
                      {activity.item_image ? (
                        <img src={activity.item_image} alt={activity.item_title} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <Package size={32} className="text-slate-400" />
                        </div>
                      )}
                    </div>
                    <div className="flex-1 w-full">
                      <div className="flex justify-between items-start mb-4">
                        <div>
                          <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-1 group-hover:text-primary-600 transition-colors">{activity.item_title}</h3>
                          <p className="text-sm text-slate-500 dark:text-slate-400">
                            {activity.renter_name === user?.name ? `Lent by ${activity.owner_name}` : `Rented by ${activity.renter_name}`}
                          </p>
                        </div>
                        <span className={`px-4 py-1.5 rounded-full text-xs font-black uppercase tracking-widest ${
                          activity.status === 'pending' ? 'bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300' :
                          activity.status === 'confirmed' ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300' :
                          activity.status === 'completed' ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300' :
                          'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300'
                        }`}>
                          {activity.status}
                        </span>
                      </div>
                      
                      <div className="pt-5 border-t border-slate-100 dark:border-slate-800 flex flex-wrap justify-between items-center gap-4">
                        <div className="text-sm">
                          <span className="text-slate-400 dark:text-slate-500 font-medium">Period: </span>
                          <span className="font-bold text-slate-900 dark:text-white">{activity.start_date} → {activity.end_date}</span>
                        </div>
                        <div className="flex gap-3">
                           <button 
                             onClick={() => handleDownloadAgreement(activity.id)}
                             className="p-2 bg-slate-100 dark:bg-slate-800 text-slate-500 hover:text-primary-600 rounded-xl transition-all"
                             title="Download Agreement"
                           >
                             <FileText size={18} />
                           </button>
                           {activity.renter_name === user?.name && (activity.status === 'confirmed' || activity.status === 'active') && (
                             <button onClick={() => setShowQrModal(activity.id)} className="px-4 py-2 bg-slate-900 text-white dark:bg-white dark:text-slate-900 text-xs font-bold rounded-lg rounded-xl">Show QR</button>
                           )}
                           {activity.renter_name !== user?.name && (activity.status === 'confirmed' || activity.status === 'active') && (
                             <button onClick={() => simulateScan(activity)} className="px-4 py-2 border-2 border-slate-200 text-slate-600 text-xs font-bold rounded-xl">Simulate Handover/Return Scan</button>
                           )}
                           <div className="flex flex-col items-end">
                              <p className="text-sm font-bold text-primary-600 flex items-center">{formatINR(activity.total_rental)}</p>
                              {activity.status !== 'completed' && (
                                <div className="flex items-center gap-1 mt-1">
                                   <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse" />
                                   <span className="text-[10px] font-black uppercase tracking-widest text-emerald-600">Escrow Locked</span>
                                </div>
                              )}
                           </div>
                        </div>
                      </div>
                    </div>

                    {showQrModal === activity.id && (
                      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4" onClick={() => setShowQrModal(null)}>
                        <div className="bg-white dark:bg-slate-900 p-8 rounded-3xl shadow-2xl" onClick={e => e.stopPropagation()}>
                          <h3 className="text-2xl font-black mb-6 text-center text-slate-900 dark:text-white">Booking QR Code</h3>
                          <div className="bg-white p-4 rounded-xl border-4 border-slate-100 dark:border-slate-800 inline-block mx-auto">
                            <QRCodeSVG 
                              value={JSON.stringify({ booking_id: activity.id, item_id: activity.item_title, renter_id: activity.renter_name })} 
                              size={256} 
                              level="H"
                            />
                          </div>
                          <p className="text-center text-slate-500 mt-6 font-medium text-sm">Have the lender scan this QR to confirm handover/return.</p>
                          <button onClick={() => setShowQrModal(null)} className="mt-8 w-full py-3 bg-slate-100 dark:bg-slate-800 rounded-xl font-bold">Close</button>
                        </div>
                      </div>
                    )}
                  </motion.div>
                ))
              ) : (
                <div className="glass p-12 text-center">
                  <Package className="mx-auto mb-4 text-slate-300" size={48} />
                  <p className="text-slate-500 font-bold mb-2">No activity yet</p>
                  <p className="text-slate-400 text-sm mb-6">Start by browsing and renting items from your campus peers.</p>
                  <Link to="/items" className="px-6 py-3 bg-primary-600 text-white rounded-xl font-bold inline-flex items-center gap-2">
                    Explore Items <ChevronRight size={16} />
                  </Link>
                </div>
              )}
            </div>
          </section>

          {/* New Section for Rental Requests */}
          <section className="mt-12">
            <h2 className="text-2xl font-bold text-slate-900 dark:text-white flex items-center gap-3 mb-6">
              <div className="w-2 h-8 bg-amber-500 rounded-full" />
              Rental Requests
            </h2>

            <div className="space-y-6">
              {ownerRequests.length === 0 && renterRequests.length === 0 && (
                <p className="text-slate-500">No pending rental requests.</p>
              )}

              {/* Owner Requests (Incoming) */}
              {ownerRequests.filter(r => r.status === 'pending').map((req) => (
                <div key={req.id} className="glass p-6 border-l-4 border-l-indigo-500 rounded-r-2xl">
                  <div className="flex justify-between items-center">
                    <div>
                      <p className="text-xs uppercase font-bold text-indigo-500 mb-1">Incoming Request</p>
                      <h4 className="font-bold text-lg">{req.item_title}</h4>
                      <p className="text-sm text-slate-600">From: {req.renter_name}</p>
                      <p className="text-sm text-slate-600">Dates: {req.start_date} to {req.end_date}</p>
                    </div>
                    <div className="flex gap-2">
                      <button onClick={() => handleRequestStatus(req.id, 'accepted')} className="px-4 py-2 bg-emerald-500 text-white rounded-lg font-bold text-sm">Accept</button>
                      <button onClick={() => handleRequestStatus(req.id, 'rejected')} className="px-4 py-2 bg-red-500 text-white rounded-lg font-bold text-sm">Reject</button>
                    </div>
                  </div>
                </div>
              ))}

              {/* Renter Requests (Outgoing) */}
              {renterRequests.filter(r => r.status !== 'rejected' && r.status !== 'booked').map((req) => (
                <div key={req.id} className="glass p-6 border-l-4 border-l-amber-500 rounded-r-2xl">
                  <div className="flex justify-between items-center bg-transparent">
                    <div>
                      <p className="text-xs uppercase font-bold text-amber-500 mb-1">My Outgoing Request</p>
                      <h4 className="font-bold text-lg">{req.item_title}</h4>
                      <p className="text-sm text-slate-600">To: {req.owner_name}</p>
                      <p className="text-sm text-slate-600">Dates: {req.start_date} to {req.end_date}</p>
                      <p className="text-sm font-bold mt-2">Status: <span className="uppercase text-amber-600">{req.status}</span></p>
                    </div>
                    <div>
                      {req.status === 'accepted' && (
                        <button onClick={() => handlePayAndConfirm(req)} className="px-6 py-3 bg-primary-600 text-white rounded-xl font-bold flex items-center gap-2">
                          Authorize Payment
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </section>
        </div>

        {/* Sidebar */}
        <div className="space-y-8">
          <section className="glass p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-lg font-bold text-gray-900 dark:text-white flex items-center gap-2">
                <TrendingUp size={18} className="text-accent-500" />
                Available Items
              </h2>
            </div>
            
            <div className="space-y-4">
              {recommendations.map((item) => (
                <Link to={`/items/${item.id}`} key={item.id} className="group flex gap-4 p-3 -mx-3 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors">
                  <div className="w-20 h-20 rounded-lg overflow-hidden shrink-0">
                    <img src={item.image_url} alt={item.title} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" />
                  </div>
                  <div className="flex-1 py-1">
                    <h4 className="font-semibold text-gray-900 dark:text-white text-sm line-clamp-2 mb-1 group-hover:text-primary-600 dark:group-hover:text-primary-400 transition-colors">
                      {item.title}
                    </h4>
                    <div className="flex items-center justify-between mt-auto">
                      <span className="text-accent-600 dark:text-accent-400 font-bold text-sm tracking-tight">{formatINR(item.price_per_day)}/day</span>
                      <span className="text-xs text-slate-400 font-bold uppercase">{item.category}</span>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
            
            <Link to="/items" className="w-full mt-6 py-3 rounded-xl font-medium text-primary-600 dark:text-primary-400 border border-primary-200 dark:border-primary-800 hover:bg-primary-50 dark:hover:bg-primary-900/20 transition-colors flex items-center justify-center gap-2">
              <Search size={16} />
              Discover More
            </Link>
          </section>
        </div>
      </div>
    </div>
  );
}
