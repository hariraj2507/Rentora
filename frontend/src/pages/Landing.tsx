import { useState } from 'react';
import { motion } from 'framer-motion';
import { ArrowRight, ShieldCheck, Zap, CheckCircle, Leaf, Play, Search, Handshake, QrCode } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { authApi } from '../services/api';
import { useToast } from '../components/Toast';

export default function Landing() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [demoLoading, setDemoLoading] = useState(false);

  const handleDemoLogin = async () => {
    setDemoLoading(true);
    try {
      await authApi.login('alex@harvard.edu', 'password123');
      toast('Welcome, Alex! Demo session started.', 'success');
      navigate('/dashboard');
    } catch {
      toast('Backend not reachable. Start the server first.', 'error');
    } finally {
      setDemoLoading(false);
    }
  };

  return (
    <div className="overflow-x-hidden pt-20">
      {/* Hero Section */}
      <section className="relative min-h-[90vh] flex items-center justify-center py-24">
        {/* Background Elements */}
        <div className="absolute top-0 inset-x-0 h-full -z-10">
          <div className="absolute top-0 left-1/4 w-[500px] h-[500px] bg-primary-500/10 blur-[120px] rounded-full animate-pulse" />
          <div className="absolute bottom-0 right-1/4 w-[500px] h-[500px] bg-accent-500/10 blur-[120px] rounded-full animate-pulse delay-1000" />
        </div>

        <div className="container mx-auto px-6 md:px-12 text-center max-w-5xl">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, ease: "easeOut" }}
          >
            {/* SDG + Live Badge */}
            <div className="flex items-center justify-center gap-3 mb-8 flex-wrap">
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white text-xs font-black uppercase tracking-widest shadow-xl shadow-slate-500/5">
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                </span>
                Campus-Exclusive
              </div>
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-700 dark:text-emerald-400 text-xs font-black uppercase tracking-widest">
                <Leaf size={14} />
                UN SDG 12 — Responsible Consumption
              </div>
            </div>
            
            <h1 className="text-6xl md:text-8xl font-black text-slate-900 dark:text-white mb-8 tracking-tighter leading-[0.9]">
              Rent anything from <br />
              <span className="text-gradient">your community.</span>
            </h1>
            
            <p className="text-xl md:text-2xl text-slate-500 dark:text-slate-400 mb-12 max-w-2xl mx-auto leading-relaxed font-medium">
              The high-trust, AI-powered rental platform exclusive to students. 
              Save money, earn from your gear, and build a sustainable campus.
            </p>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <Link 
                to="/items" 
                className="w-full sm:w-auto px-10 py-5 rounded-[2rem] font-black text-white bg-slate-900 dark:bg-white dark:text-slate-900 shadow-2xl shadow-slate-500/20 hover:scale-105 active:scale-95 transition-all text-lg flex items-center justify-center gap-2"
              >
                Browse Catalog
                <ArrowRight size={22} className="text-primary-500" />
              </Link>
              <button 
                onClick={handleDemoLogin}
                disabled={demoLoading}
                className="w-full sm:w-auto px-10 py-5 rounded-[2rem] font-black bg-primary-600 text-white hover:bg-primary-700 shadow-2xl shadow-primary-500/20 transition-all text-lg flex items-center justify-center gap-2 disabled:opacity-70"
              >
                <Play size={20} className="fill-current" />
                {demoLoading ? 'Starting...' : 'Live Demo'}
              </button>
              <Link 
                to="/login" 
                className="w-full sm:w-auto px-10 py-5 rounded-[2rem] font-black text-slate-900 dark:text-white glass hover:bg-slate-100 dark:hover:bg-slate-800 transition-all text-lg"
              >
                Start Lending
              </Link>
            </div>
          </motion.div>

          {/* Social Proof / Stats */}
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5, duration: 1 }}
            className="mt-24 pt-12 border-t border-slate-100 dark:border-slate-800 flex flex-wrap justify-center gap-12 md:gap-24"
          >
            {[
              { label: "Active Items", value: "2.4k+" },
              { label: "Verified Users", value: "1.2k+" },
              { label: "Trust Score", value: "99.8%" },
              { label: "CO₂ Saved", value: "3.2T" }
            ].map((stat, i) => (
              <div key={i} className="text-center">
                <p className="text-3xl font-black text-slate-900 dark:text-white mb-1 tracking-tighter">{stat.value}</p>
                <p className="text-xs font-black uppercase tracking-widest text-slate-500 dark:text-slate-500">{stat.label}</p>
              </div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* How It Works */}
      <section className="py-28 relative">
        <div className="container mx-auto px-6 max-w-5xl">
          <div className="text-center mb-20">
            <h2 className="text-4xl md:text-5xl font-black text-slate-900 dark:text-white mb-6 tracking-tight">3 Steps. 60 Seconds.</h2>
            <p className="text-lg text-slate-500 max-w-xl mx-auto font-medium">From browsing to handover — the fastest rental experience on campus.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-0 relative">
            {/* Connector line */}
            <div className="hidden md:block absolute top-16 left-[16.6%] right-[16.6%] h-px bg-gradient-to-r from-primary-600/0 via-primary-600/30 to-primary-600/0" />

            {[
              { step: "01", title: "Find & Request", desc: "Browse campus listings, check trusted lender scores, and request your dates.", icon: <Search size={28} />, color: "bg-blue-500" },
              { step: "02", title: "Owner Confirms", desc: "The lender approves your booking. Payment is held securely in escrow.", icon: <Handshake size={28} />, color: "bg-primary-600" },
              { step: "03", title: "QR Handover", desc: "Meet at a campus hub, scan QR to verify handover — done in seconds.", icon: <QrCode size={28} />, color: "bg-emerald-500" },
            ].map((item, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.15 }}
                className="text-center px-8 py-12"
              >
                <div className={`${item.color} w-16 h-16 rounded-2xl flex items-center justify-center text-white mx-auto mb-8 shadow-xl relative z-10`}>
                  {item.icon}
                </div>
                <p className="text-[10px] font-black uppercase tracking-widest text-primary-600 mb-3">Step {item.step}</p>
                <h3 className="text-xl font-black text-slate-900 dark:text-white mb-3 tracking-tight">{item.title}</h3>
                <p className="text-slate-500 dark:text-slate-400 font-medium text-sm leading-relaxed">{item.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Features Grid */}
      <section className="py-32 bg-slate-50/50 dark:bg-slate-900/20">
        <div className="container mx-auto px-6 max-w-7xl">
          <div className="text-center mb-24">
            <h2 className="text-4xl md:text-5xl font-black text-slate-900 dark:text-white mb-6 tracking-tight">Built on Trust</h2>
            <p className="text-lg text-slate-500 max-w-2xl mx-auto font-medium">We've combined AI verification with campus-exclusive access to create the safest rental experience.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-12">
            {[
              { 
                title: "Student Verification", 
                desc: "Every user is verified via their official university .edu email to ensure community safety and accountability.",
                icon: <ShieldCheck size={32} />,
                color: "bg-blue-500"
              },
              { 
                title: "AI Demand Pricing", 
                desc: "Predictive analytics help you price your items for maximum earnings based on campus exam schedules and events.",
                icon: <Zap size={32} />,
                color: "bg-amber-500"
              },
              { 
                title: "Instant QR Handover", 
                desc: "Secure QR-code based handovers at verified campus hotspots prevent disputes and keep a timestamped record.",
                icon: <CheckCircle size={32} />,
                color: "bg-emerald-500"
              }
            ].map((feature, i) => (
              <motion.div 
                whileHover={{ y: -10 }}
                key={i} 
                className="glass p-12 rounded-[3rem] bg-white dark:bg-slate-900 border-2 border-slate-100 dark:border-slate-800/50 hover:shadow-2xl hover:shadow-primary-500/5 transition-all group"
              >
                <div className={`${feature.color} w-16 h-16 rounded-2xl flex items-center justify-center text-white mb-8 shadow-xl group-hover:scale-110 transition-transform`}>
                  {feature.icon}
                </div>
                <h3 className="text-2xl font-black text-slate-900 dark:text-white mb-4 tracking-tight">{feature.title}</h3>
                <p className="text-slate-500 dark:text-slate-400 leading-relaxed font-medium">{feature.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-32">
        <div className="container mx-auto px-6 max-w-4xl text-center">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            className="glass p-16 md:p-20 rounded-[4rem] bg-white dark:bg-slate-900 border-2 border-slate-100 dark:border-slate-800/50 shadow-2xl relative overflow-hidden"
          >
            <div className="absolute top-0 left-1/4 w-[400px] h-[400px] bg-primary-500/10 blur-[120px] rounded-full -translate-y-1/2" />
            <div className="absolute bottom-0 right-1/4 w-[400px] h-[400px] bg-emerald-500/10 blur-[120px] rounded-full translate-y-1/2" />
            
            <div className="relative z-10">
              <div className="flex items-center justify-center gap-2 mb-8">
                <Leaf className="text-emerald-500" size={20} />
                <span className="text-xs font-black uppercase tracking-widest text-emerald-600 dark:text-emerald-400">Sustainability Mission</span>
              </div>
              <h2 className="text-4xl md:text-5xl font-black text-slate-900 dark:text-white mb-6 tracking-tighter">
                Every rental is a choice<br />for the planet.
              </h2>
              <p className="text-lg text-slate-500 max-w-xl mx-auto mb-12 font-medium leading-relaxed">
                Rentora helps reduce campus waste by making it easy to share resources. Join the movement.
              </p>
              <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                <button 
                  onClick={handleDemoLogin}
                  disabled={demoLoading}
                  className="px-10 py-5 rounded-[2rem] font-black text-white bg-primary-600 hover:bg-primary-700 shadow-2xl shadow-primary-500/20 transition-all text-lg flex items-center gap-2 disabled:opacity-70"
                >
                  <Play size={20} className="fill-current" />
                  Try Live Demo
                </button>
                <Link 
                  to="/login" 
                  className="px-10 py-5 rounded-[2rem] font-black text-slate-900 dark:text-white glass transition-all text-lg"
                >
                  Create Account
                </Link>
              </div>
            </div>
          </motion.div>
        </div>
      </section>
    </div>
  );
}
