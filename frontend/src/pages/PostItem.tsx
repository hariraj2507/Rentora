import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Camera, Tag, IndianRupee, Info, Loader2, ChevronLeft, ShieldCheck, ArrowRight, AlertCircle, Plus } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { itemsApi, authApi } from '../services/api';
import { useToast } from '../components/Toast';

export default function PostItem() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [predicting, setPredicting] = useState(false);

  const [formData, setFormData] = useState({
    title: '',
    description: '',
    price_per_day: '',
    deposit: '',
    category: 'Other',
    condition: 'Excellent',
    image_url: ''
  });

  const categories = ['Electronics', 'Books', 'Academic', 'Equipment', 'Other'];
  const conditions = ['Like New', 'Excellent', 'Good', 'Fair'];

  useEffect(() => {
    if (!authApi.isAuthenticated()) {
      navigate('/login');
    }
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      setUploading(true);
      setError(null);
      const { imageUrl } = await itemsApi.upload(file);
      setFormData(prev => ({ ...prev, image_url: imageUrl }));
      toast('Image uploaded successfully!', 'success');
    } catch (err: any) {
      setError(err.message || 'Failed to upload image');
      toast(err.message || 'Failed to upload image', 'error');
    } finally {
      setUploading(false);
    }
  };

  const handleAiPredict = async () => {
    if (!formData.title) {
      toast('Please enter a title first!', 'error');
      return;
    }
    setPredicting(true);
    try {
      const data = await itemsApi.predictPrice(formData.title, formData.category);
      setFormData(prev => ({ 
        ...prev, 
        price_per_day: data.suggestedPrice.toString(),
        deposit: data.suggestedDeposit.toString()
      }));
      toast('AI suggested a price based on campus demand!', 'success');
    } catch (err: any) {
      toast('AI prediction failed. Try setting it manually.', 'error');
    } finally {
      setPredicting(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const price = parseFloat(formData.price_per_day);
      const deposit = parseFloat(formData.deposit);

      if (isNaN(price) || price <= 0) throw new Error('Invalid price');

      await itemsApi.create({
        ...formData,
        price_per_day: price,
        deposit: isNaN(deposit) ? 0 : deposit,
      });

      toast('Product posted successfully!', 'success');
      navigate('/items');
    } catch (err: any) {
      setError(err.message || 'Failed to post item');
      toast(err.message || 'Failed to post item', 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container mx-auto px-6 py-32 min-h-screen max-w-4xl">
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-3xl mx-auto"
      >
        <button 
          onClick={() => navigate(-1)} 
          className="flex items-center gap-2 text-slate-500 hover:text-slate-900 dark:hover:text-white font-black text-xs uppercase tracking-widest mb-12 transition-all group"
        >
          <ChevronLeft size={16} className="group-hover:-translate-x-1 transition-transform" />
          Back
        </button>

        <div className="mb-12">
          <h1 className="text-5xl font-black text-slate-900 dark:text-white tracking-tighter mb-4">Post an Item</h1>
          <p className="text-slate-500 text-lg">Earn money by renting your unused equipment to peers.</p>
        </div>

        {error && (
          <div className="mb-8 p-5 rounded-3xl bg-red-50 dark:bg-red-500/10 border-2 border-red-100 dark:border-red-500/20 flex items-center gap-4 text-red-600 dark:text-red-400">
            <AlertCircle size={24} className="shrink-0" />
            <span className="text-sm font-bold">{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-8">
          <div className="glass p-8 md:p-12 rounded-[3rem] border border-slate-100 dark:border-slate-800/50 shadow-2xl space-y-10">
            
            {/* Basic Info */}
            <div className="space-y-6">
              <h3 className="text-xs font-black uppercase tracking-widest text-primary-600 flex items-center gap-2">
                <Info size={14} /> Basic Information
              </h3>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2">Item Title</label>
                  <input 
                    required
                    type="text" 
                    name="title"
                    value={formData.title}
                    onChange={handleChange}
                    placeholder="e.g. Sony A7III Mirrorless Camera"
                    className="w-full px-6 py-4 rounded-2xl bg-slate-50 dark:bg-slate-950 border-2 border-transparent focus:border-primary-500 outline-none transition-all font-bold"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2">Description</label>
                  <textarea 
                    required
                    name="description"
                    value={formData.description}
                    onChange={handleChange}
                    rows={4}
                    placeholder="Describe the item, what's included, and any rules..."
                    className="w-full px-6 py-4 rounded-2xl bg-slate-50 dark:bg-slate-950 border-2 border-transparent focus:border-primary-500 outline-none transition-all font-bold resize-none"
                  />
                </div>
              </div>
            </div>

            {/* Pricing & Category */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 pt-8 border-t border-slate-100 dark:border-slate-800">
              <div className="space-y-6">
                <h3 className="text-xs font-black uppercase tracking-widest text-primary-600 flex items-center gap-2">
                  <IndianRupee size={14} /> Pricing
                </h3>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2">Price per Day (₹)</label>
                    <div className="flex items-center gap-4">
                      <input 
                        required
                        type="number" 
                        name="price_per_day"
                        value={formData.price_per_day}
                        onChange={handleChange}
                        placeholder="0"
                        className="flex-1 px-6 py-4 rounded-2xl bg-slate-50 dark:bg-slate-950 border-2 border-transparent focus:border-primary-500 outline-none transition-all font-bold"
                      />
                      <button
                        type="button"
                        onClick={handleAiPredict}
                        disabled={predicting}
                        className="px-4 py-4 rounded-2xl bg-primary-100 dark:bg-primary-900/30 text-primary-600 hover:bg-primary-200 transition-all font-black text-[10px] uppercase tracking-widest flex items-center gap-2 whitespace-nowrap"
                      >
                        {predicting ? <Loader2 className="animate-spin" size={14} /> : 'AI Predict'}
                      </button>
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2">Deposit (₹)</label>
                    <input 
                      type="number" 
                      name="deposit"
                      value={formData.deposit}
                      onChange={handleChange}
                      placeholder="0"
                      className="w-full px-6 py-4 rounded-2xl bg-slate-50 dark:bg-slate-950 border-2 border-transparent focus:border-primary-500 outline-none transition-all font-bold"
                    />
                  </div>
                </div>
              </div>

              <div className="space-y-6">
                <h3 className="text-xs font-black uppercase tracking-widest text-primary-600 flex items-center gap-2">
                  <Tag size={14} /> Details
                </h3>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2">Category</label>
                    <select 
                      name="category"
                      value={formData.category}
                      onChange={handleChange}
                      className="w-full px-6 py-4 rounded-2xl bg-slate-50 dark:bg-slate-950 border-2 border-transparent focus:border-primary-500 outline-none transition-all font-bold appearance-none cursor-pointer"
                    >
                      {categories.map(cat => <option key={cat} value={cat}>{cat}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2">Condition</label>
                    <select 
                      name="condition"
                      value={formData.condition}
                      onChange={handleChange}
                      className="w-full px-6 py-4 rounded-2xl bg-slate-50 dark:bg-slate-950 border-2 border-transparent focus:border-primary-500 outline-none transition-all font-bold appearance-none cursor-pointer"
                    >
                      {conditions.map(c => <option key={c} value={c}>{c}</option>)}
                    </select>
                  </div>
                </div>
              </div>
            </div>

            {/* Media */}
            <div className="pt-8 border-t border-slate-100 dark:border-slate-800 space-y-6">
              <h3 className="text-xs font-black uppercase tracking-widest text-primary-600 flex items-center gap-2">
                 Media
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div>
                  <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2">Upload Photo</label>
                  <label className={`relative group flex flex-col items-center justify-center w-full aspect-video rounded-[2rem] border-4 border-dashed cursor-pointer transition-all overflow-hidden ${
                    formData.image_url ? 'border-emerald-500/50 bg-emerald-500/5' : 'border-slate-100 dark:border-slate-800 hover:border-primary-500/50 hover:bg-primary-500/5'
                  }`}>
                    {uploading ? (
                      <Loader2 className="animate-spin text-primary-500" size={32} />
                    ) : formData.image_url ? (
                      <div className="absolute inset-0 group-hover:scale-105 transition-transform duration-700">
                        <img src={formData.image_url} alt="Preview" className="w-full h-full object-cover" />
                        <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                          <Plus className="text-white" size={32} />
                          <p className="text-white font-black text-xs uppercase ml-2">Change Image</p>
                        </div>
                      </div>
                    ) : (
                      <div className="flex flex-col items-center gap-3">
                        <div className="p-4 bg-slate-50 dark:bg-slate-900 rounded-2xl">
                          <Camera className="text-slate-400 group-hover:text-primary-500 transition-colors" size={24} />
                        </div>
                        <p className="text-xs font-black text-slate-400 uppercase tracking-widest group-hover:text-primary-500 transition-colors">Select a file</p>
                      </div>
                    )}
                    <input type="file" accept="image/*" onChange={handleFileChange} className="hidden" />
                  </label>
                </div>

                <div className="space-y-4">
                  <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2">Or Paste Image URL</label>
                  <div className="relative">
                    <Camera className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
                    <input 
                      required
                      type="url" 
                      name="image_url"
                      value={formData.image_url}
                      onChange={handleChange}
                      placeholder="https://images.unsplash.com/..."
                      className="w-full pl-16 pr-6 py-4 rounded-2xl bg-slate-50 dark:bg-slate-950 border-2 border-transparent focus:border-primary-500 outline-none transition-all font-bold"
                    />
                  </div>
                  <p className="mt-2 text-[10px] font-bold text-slate-400 uppercase tracking-widest leading-relaxed">Local upload is recommended for the best display quality. Paste a URL as a backup fallback.</p>
                </div>
              </div>
            </div>

          </div>

          <div className="flex flex-col sm:flex-row gap-6">
            <button 
              type="button"
              onClick={() => navigate(-1)}
              className="px-10 py-5 rounded-[2rem] font-black text-slate-900 dark:text-white glass border-2 border-transparent hover:border-slate-200 dark:hover:border-slate-800 transition-all"
            >
              Cancel
            </button>
            <button 
              type="submit"
              disabled={loading}
              className="flex-1 py-5 rounded-[2rem] font-black text-white bg-slate-900 dark:bg-white dark:text-slate-900 shadow-2xl transition-all flex items-center justify-center gap-3 disabled:opacity-50 text-lg hover:scale-[1.02]"
            >
              {loading ? <Loader2 className="animate-spin" /> : <>Post Item for Rent <ArrowRight size={22} className="text-primary-500" /></>}
            </button>
          </div>

          <div className="glass p-6 rounded-[2rem] border border-emerald-500/10 bg-emerald-500/5 flex items-start gap-4">
            <ShieldCheck className="text-emerald-500 shrink-0 mt-1" size={24} />
            <div>
              <p className="text-sm font-bold text-emerald-900 dark:text-emerald-400">Owner Protection</p>
              <p className="text-xs text-emerald-700 dark:text-emerald-500/80 leading-relaxed font-medium">Your item is protected by Rentora's campus security policy. We verify all renters and maintain trust scores to ensure your equipment comes back safe.</p>
            </div>
          </div>
        </form>
      </motion.div>
    </div>
  );
}
