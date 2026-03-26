import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Filter, MapPin, Search, Star, ChevronDown, SlidersHorizontal, ShieldCheck, ChevronRight, Loader2, Leaf, Plus } from 'lucide-react';
import { Link } from 'react-router-dom';
import { itemsApi } from '../services/api';
import { formatINR } from '../utils/format';

interface Item {
  id: string;
  title: string;
  price_per_day: number;
  deposit: number;
  category: string;
  condition: string;
  image_url: string;
  owner_name: string;
  owner_trust_score: number;
  owner_avatar: string;
}

export default function Listings() {
  const [items, setItems] = useState<Item[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [activeCategory, setActiveCategory] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');

  const categories = ['All', 'Electronics', 'Books', 'Academic', 'Equipment'];

  useEffect(() => {
    loadItems();
  }, [activeCategory]);

  const loadItems = async () => {
    try {
      setLoading(true);
      const data = await itemsApi.list({
        category: activeCategory,
        search: searchQuery || undefined,
      });
      setItems(data);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    loadItems();
  };

  return (
    <div className="container mx-auto px-4 py-24 min-h-screen">
      <div className="flex flex-col lg:flex-row gap-8">
        
        {/* Sidebar Filters */}
        <div className="w-full lg:w-64 shrink-0 space-y-6">
          <div className="glass p-6">
            <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
              <SlidersHorizontal size={18} /> Filters
            </h3>
            
            <div className="space-y-6">
              <div>
                <label className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3 block">Category</label>
                <div className="space-y-2">
                  {categories.map((cat) => (
                    <button 
                      key={cat}
                      onClick={() => setActiveCategory(cat)}
                      className={`w-full text-left px-3 py-2 rounded-lg text-sm transition-colors ${
                        activeCategory === cat 
                          ? 'bg-primary-50 text-primary-700 dark:bg-primary-900/30 dark:text-primary-400 font-medium' 
                          : 'text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800'
                      }`}
                    >
                      {cat}
                    </button>
                  ))}
                </div>
              </div>
              
              <div className="h-px bg-gray-100 dark:bg-gray-800 w-full" />

              <div>
                <label className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3 block">Price Range / Day</label>
                <div className="flex items-center gap-2">
                  <input type="number" placeholder="Min" className="w-full px-3 py-2 bg-gray-50 dark:bg-gray-800 border-none rounded-lg text-sm text-gray-900 dark:text-white" />
                  <span className="text-gray-400">-</span>
                  <input type="number" placeholder="Max" className="w-full px-3 py-2 bg-gray-50 dark:bg-gray-800 border-none rounded-lg text-sm text-gray-900 dark:text-white" />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="flex-1">
          <div className="mb-8 flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div>
              <h1 className="text-3xl font-bold font-heading text-gray-900 dark:text-white mb-2">Explore Items</h1>
              <p className="text-gray-600 dark:text-gray-400">
                {loading ? 'Loading...' : `${items.length} items available from verified peers.`}
              </p>
            </div>
            <Link to="/post-item" className="px-6 py-3.5 rounded-2xl font-bold text-white bg-slate-900 dark:bg-white dark:text-slate-900 shadow-xl transition-all hover:scale-105 active:scale-95 flex items-center justify-center gap-3 text-sm">
              <div className="w-8 h-8 rounded-xl bg-primary-600 flex items-center justify-center">
                <Plus size={18} className="text-white" />
              </div>
              Post an Item
            </Link>
          </div>

          {/* Search Bar */}
          <form onSubmit={handleSearch} className="flex flex-col sm:flex-row gap-4 mb-8">
            <div className="relative flex-1">
              <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
              <input 
                type="text" 
                placeholder="Search for an item..." 
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-12 pr-4 py-3.5 glass-darker text-gray-900 dark:text-white outline-none focus:ring-2 focus:ring-primary-500 rounded-xl"
              />
            </div>
            <button type="submit" className="px-6 py-3.5 glass whitespace-nowrap flex items-center gap-2 text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">
              <Filter size={18} />
              Search
            </button>
          </form>

          {/* Loading State */}
          {loading && (
            <div className="flex items-center justify-center py-24">
              <Loader2 className="animate-spin text-primary-600" size={40} />
            </div>
          )}

          {/* Error State */}
          {error && !loading && (
            <div className="text-center py-12 text-red-500">
              <p className="font-bold mb-2">Failed to load items</p>
              <p className="text-sm">{error}</p>
              <button onClick={loadItems} className="mt-4 px-6 py-2 bg-primary-600 text-white rounded-xl">Retry</button>
            </div>
          )}

          {/* Items Grid */}
          {!loading && !error && (
            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-8">
              {items.map((item, i) => (
                <motion.div 
                  initial={{ opacity: 0, scale: 0.95 }}
                  whileInView={{ opacity: 1, scale: 1 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.05 }}
                  key={item.id} 
                  className="group glass dark:bg-slate-900/40 rounded-[2rem] overflow-hidden hover:shadow-2xl hover:shadow-indigo-500/10 transition-all duration-500 border border-slate-200 dark:border-slate-800 flex flex-col premium-shadow"
                >
                  <div className="relative aspect-[4/5] overflow-hidden">
                    <img 
                      src={item.image_url} 
                      alt={item.title} 
                      className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
                    />
                    
                    <div className="absolute inset-0 bg-gradient-to-t from-slate-900/80 via-transparent to-transparent opacity-60 group-hover:opacity-80 transition-opacity" />

                    <div className="absolute top-4 left-4 flex flex-col gap-2">
                      <div className="flex items-center gap-1.5 px-3 py-1.5 bg-white/10 backdrop-blur-md border border-white/20 rounded-full text-[10px] font-black uppercase tracking-widest text-white shadow-xl">
                        <ShieldCheck size={14} className="text-emerald-400" />
                        {item.owner_trust_score}% Trusted
                      </div>
                      <div className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-500/20 backdrop-blur-md border border-emerald-500/30 rounded-full text-[10px] font-black uppercase tracking-widest text-emerald-400 shadow-xl">
                        <Leaf size={14} />
                        SDG 12
                      </div>
                    </div>

                    <div className="absolute top-4 right-4 bg-white/90 dark:bg-slate-900/90 backdrop-blur-md px-3 py-1.5 rounded-2xl text-[11px] font-black text-slate-900 dark:text-white shadow-xl">
                      {item.category}
                    </div>

                    <div className="absolute bottom-4 left-4 right-4 flex justify-between items-end">
                      <div className="flex flex-col">
                        <span className="text-white/70 text-[10px] font-bold uppercase tracking-wider mb-0.5">Starting at</span>
                        <span className="text-2xl font-black text-white">{formatINR(item.price_per_day)}<span className="text-xs font-medium text-white/60">/day</span></span>
                      </div>
                    </div>
                  </div>
                  
                  <div className="p-6 flex flex-col flex-1 dark:bg-slate-900/40">
                    <div className="flex justify-between items-start mb-3">
                      <h3 className="font-bold text-slate-900 dark:text-white text-lg line-clamp-2 leading-snug group-hover:text-primary-500 transition-colors">
                        {item.title}
                      </h3>
                    </div>
                    
                    <div className="flex items-center justify-between mt-auto pt-5 border-t border-slate-100 dark:border-slate-800">
                      <p className="text-xs font-bold text-slate-500 dark:text-slate-400">
                        by {item.owner_name}
                      </p>
                      <Link to={`/items/${item.id}`} className="p-3 bg-slate-900 dark:bg-white text-white dark:text-slate-900 rounded-xl hover:scale-105 active:scale-95 transition-all shadow-lg">
                        <ChevronRight size={18} />
                      </Link>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          )}

          {!loading && !error && items.length === 0 && (
            <div className="text-center py-24 text-slate-500">
              <p className="text-2xl font-black mb-2">No items found</p>
              <p>Try a different category or search term.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
