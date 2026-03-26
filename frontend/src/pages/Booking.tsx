import { useState, useMemo, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';
import { format, addDays, isBefore, isAfter, isSameDay, parseISO, differenceInDays } from 'date-fns';
import { Calendar, ShieldCheck, CheckCircle2, AlertCircle, ArrowRight, ChevronRight, Loader2 } from 'lucide-react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { itemsApi, authApi, rentalRequestsApi, agreementsApi } from '../services/api';
import { useToast } from '../components/Toast';
import { formatINR } from '../utils/format';
import { FileText, Download } from 'lucide-react';

interface ItemData {
  id: string;
  title: string;
  price_per_day: number;
  deposit: number;
  image_url: string;
  owner_id: string;
  owner_name: string;
  owner_trust_score: number;
  bookings: Array<{ start_date: string; end_date: string }>;
}

export default function Booking() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  
  const [item, setItem] = useState<ItemData | null>(null);
  const [loadingItem, setLoadingItem] = useState(true);
  const [existingBookings, setExistingBookings] = useState<Array<{ start_date: string; end_date: string }>>([]);

  const [startDate, setStartDate] = useState<Date | null>(null);
  const [endDate, setEndDate] = useState<Date | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [step, setStep] = useState(1);
  const [isProcessing, setIsProcessing] = useState(false);
  const [agreedToTerms, setAgreedToTerms] = useState(false);
  const [confirmedBookingId, setConfirmedBookingId] = useState<string | null>(null);
  const [downloadingPdf, setDownloadingPdf] = useState(false);

  useEffect(() => {
    if (!id) return;
    
    // Check authentication
    if (!authApi.isAuthenticated()) {
      navigate('/login');
      return;
    }

    loadItem();
  }, [id]);

  const loadItem = async () => {
    try {
      setLoadingItem(true);
      const data = await itemsApi.getById(id!);
      setItem(data);
      setExistingBookings(data.bookings || []);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoadingItem(false);
    }
  };

  const checkAvailability = (start: Date, end: Date) => {
    for (const booking of existingBookings) {
      const bStart = parseISO(booking.start_date);
      const bEnd = parseISO(booking.end_date);
      if (
        (isBefore(start, bEnd) || isSameDay(start, bEnd)) &&
        (isAfter(end, bStart) || isSameDay(end, bStart))
      ) {
        return false;
      }
    }
    return true;
  };

  const days = useMemo(() => {
    if (startDate && endDate) {
      if (!checkAvailability(startDate, endDate)) {
        return 0;
      }
      const diff = differenceInDays(endDate, startDate);
      return diff === 0 ? 1 : diff;
    }
    return 0;
  }, [startDate, endDate, existingBookings]);

  const pricePerDay = item?.price_per_day || 0;
  const depositAmount = item?.deposit || 0;
  const rentalTotal = days * pricePerDay;
  const total = rentalTotal + depositAmount;

  const handleConfirm = () => {
    if (!startDate || !endDate) {
      setError("Please select both start and end dates.");
      return;
    }
    if (!checkAvailability(startDate, endDate)) {
      setError("The selected range overlaps with an existing booking.");
      return;
    }
    
    // Create Rental Request instead of proceeding to payment
    handleRentalRequest();
  };

  const handleRentalRequest = async () => {
    if (!startDate || !endDate || !item) return;

    setIsProcessing(true);
    setError(null);

    try {
      const request: any = await rentalRequestsApi.create({
        item_id: item.id,
        start_date: format(startDate, 'yyyy-MM-dd'),
        end_date: format(endDate, 'yyyy-MM-dd'),
      });
      
      // Also create the Agreement record
      await agreementsApi.create({
        booking_id: request.id, // Using request ID as temporary booking ID link for the agreement
        item_id: item.id,
        renter_id: authApi.getUser().id,
        owner_id: item.owner_id,
        price: item.price_per_day,
        deposit: item.deposit,
        start_date: format(startDate, 'yyyy-MM-dd'),
        end_date: format(endDate, 'yyyy-MM-dd'),
        terms_accepted: true
      });

      setConfirmedBookingId(request.id);
      setStep(3); // Go straight to success!
      toast(`Successfully requested ${item.title}!`, 'success');
    } catch (err: any) {
      setError(err.message || 'Request failed. Please try again.');
    } finally {
      setIsProcessing(false);
    }
  };

  const downloadAgreement = async () => {
    if (!confirmedBookingId) return;
    setDownloadingPdf(true);
    try {
      const blob = await agreementsApi.getPdf(confirmedBookingId);
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `Agreement_${confirmedBookingId}.pdf`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
    } catch (err: any) {
      toast(err.message, 'error');
    } finally {
      setDownloadingPdf(false);
    }
  };



  if (loadingItem) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="animate-spin text-primary-600" size={48} />
      </div>
    );
  }

  if (!item) {
    return (
      <div className="min-h-screen flex items-center justify-center flex-col gap-4">
        <p className="text-2xl font-black text-red-500">Item not found</p>
        <button onClick={() => navigate('/items')} className="px-6 py-3 bg-primary-600 text-white rounded-xl font-bold">
          Back to Listings
        </button>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-6 md:px-12 py-32 min-h-screen max-w-6xl">
      <div className="max-w-5xl mx-auto">
        
        <div className="mb-12">
          <button onClick={() => navigate(-1)} className="group flex items-center gap-2 text-sm font-bold text-slate-500 hover:text-slate-900 dark:hover:text-white transition-all">
            <div className="w-8 h-8 rounded-full flex items-center justify-center border border-slate-200 dark:border-slate-800 group-hover:bg-slate-100 dark:group-hover:bg-slate-800">
              <ChevronRight className="rotate-180" size={16} />
            </div>
            Back to item
          </button>
        </div>

        <div className="flex flex-col lg:flex-row gap-16">
          
          {/* Main Content Area */}
          <div className="flex-1 space-y-12">
            <div>
              <h1 className="text-4xl font-black text-slate-900 dark:text-white mb-4 tracking-tighter">
                {step === 1 ? 'Select Dates' : step === 3 ? 'Request Sent!' : ''}
              </h1>
              <div className="flex items-center gap-3">
                <div className={`h-1.5 flex-1 rounded-full transition-all duration-500 bg-primary-600`} />
                <div className={`h-1.5 flex-1 rounded-full transition-all duration-500 ${step >= 3 ? 'bg-primary-600' : 'bg-slate-100 dark:bg-slate-800'}`} />
              </div>
            </div>

            <AnimatePresence mode="wait">
              {step === 1 && (
                <motion.div 
                  initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }}
                  className="space-y-10"
                >
                    <section className="glass p-10 rounded-[2.5rem] bg-white dark:bg-slate-900/50 border-2 border-slate-100 dark:border-slate-800/50 shadow-2xl shadow-indigo-500/5">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-10 mb-8 pb-8 border-b border-slate-100 dark:border-slate-800">
                        <div>
                          <label className="block text-xs font-black uppercase tracking-widest text-slate-500 mb-3">Pickup Date</label>
                          <div className="relative">
                            <Calendar className="absolute left-4 top-1/2 -translate-y-1/2 text-primary-500 z-10 pointer-events-none" size={20} />
                            <DatePicker
                              selected={startDate}
                              onChange={(date: Date | null) => {
                                setStartDate(date);
                                if (date && endDate && isBefore(endDate, date)) setEndDate(null);
                                setError(null);
                              }}
                              minDate={new Date()}
                              excludeDateIntervals={existingBookings.map(b => ({
                                start: parseISO(b.start_date),
                                end: parseISO(b.end_date)
                              }))}
                              placeholderText="Select date"
                              className="w-full pl-12 pr-6 py-4 rounded-2xl bg-slate-50 dark:bg-slate-950 border-2 border-transparent focus:border-primary-500 focus:ring-4 focus:ring-primary-500/10 outline-none transition-all font-bold text-slate-900 dark:text-white"
                            />
                          </div>
                        </div>
                        <div>
                          <label className="block text-xs font-black uppercase tracking-widest text-slate-500 mb-3">Return Date</label>
                          <div className="relative">
                            <Calendar className="absolute left-4 top-1/2 -translate-y-1/2 text-primary-500 z-10 pointer-events-none" size={20} />
                            <DatePicker
                              selected={endDate}
                              onChange={(date: Date | null) => {
                                setEndDate(date);
                                setError(null);
                              }}
                              minDate={startDate || new Date()}
                              disabled={!startDate}
                              excludeDateIntervals={existingBookings.map(b => ({
                                start: parseISO(b.start_date),
                                end: parseISO(b.end_date)
                              }))}
                              placeholderText="Select date"
                              className="w-full pl-12 pr-6 py-4 rounded-2xl bg-slate-50 dark:bg-slate-950 border-2 border-transparent focus:border-primary-500 focus:ring-4 focus:ring-primary-500/10 outline-none transition-all font-bold text-slate-900 dark:text-white disabled:opacity-50"
                            />
                          </div>
                        </div>
                      </div>

                      <div className="space-y-6">
                        <div className="flex items-center gap-3">
                          <FileText className="text-primary-500" size={20} />
                          <h3 className="text-sm font-black uppercase tracking-widest text-slate-900 dark:text-white">Rental Agreement & Terms</h3>
                        </div>
                        <div className="p-6 bg-slate-50 dark:bg-slate-950/50 rounded-2xl border border-slate-100 dark:border-slate-800 space-y-3">
                          <ul className="text-xs text-slate-500 dark:text-slate-400 space-y-2 font-medium">
                            <li className="flex items-start gap-2">• Item must be returned on time as per selected dates.</li>
                            <li className="flex items-start gap-2">• User is 100% responsible for physical condition and damages.</li>
                            <li className="flex items-start gap-2">• Security deposit of {formatINR(depositAmount)} will be held in Escrow.</li>
                            <li className="flex items-start gap-2">• Late returns may incur daily penalties and trust score deduction.</li>
                          </ul>
                        </div>
                        <label className="flex items-center gap-4 cursor-pointer group">
                          <div className="relative">
                            <input 
                              type="checkbox" 
                              checked={agreedToTerms}
                              onChange={(e) => setAgreedToTerms(e.target.checked)}
                              className="peer hidden" 
                            />
                            <div className="w-6 h-6 rounded-lg border-2 border-slate-200 dark:border-slate-800 peer-checked:bg-primary-500 peer-checked:border-primary-500 transition-all flex items-center justify-center">
                              <CheckCircle2 size={16} className="text-white scale-0 peer-checked:scale-100 transition-transform" />
                            </div>
                          </div>
                          <span className="text-sm font-bold text-slate-600 dark:text-slate-400 group-hover:text-slate-900 dark:group-hover:text-white transition-colors">
                            I agree to the Rental Terms & Conditions
                          </span>
                        </label>
                      </div>
                    </section>

                  {error && (
                    <motion.div initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} className="p-5 rounded-2xl bg-red-50 dark:bg-red-500/10 border-2 border-red-100 dark:border-red-500/20 flex items-center gap-4 text-red-600 dark:text-red-400">
                      <AlertCircle size={24} className="shrink-0" />
                      <span className="text-sm font-bold">{error}</span>
                    </motion.div>
                  )}

                  <motion.button 
                    whileHover={{ scale: 1.02, y: -2 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={handleConfirm}
                    disabled={!startDate || !endDate || !agreedToTerms || !!error || isProcessing}
                    className="w-full py-5 rounded-[2rem] font-black text-white bg-slate-900 dark:bg-white dark:text-slate-900 disabled:opacity-50 disabled:cursor-not-allowed shadow-2xl transition-all flex items-center justify-center gap-3 text-lg"
                  >
                    {isProcessing ? <Loader2 className="animate-spin" /> : <>Request to Rent <ArrowRight size={22} className="text-primary-500" /></>}
                  </motion.button>
                </motion.div>
              )}



              {step === 3 && (
                <motion.div 
                  initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }}
                  className="glass p-16 rounded-[3rem] text-center bg-white dark:bg-slate-950 border-4 border-emerald-500/10"
                >
                  <div className="w-32 h-32 bg-emerald-500/10 rounded-full flex items-center justify-center mx-auto mb-8 shadow-inner">
                    <CheckCircle2 size={64} className="text-emerald-500" />
                  </div>
                  <h2 className="text-5xl font-black text-slate-900 dark:text-white mb-6 tracking-tighter">You're all set!</h2>
                  <p className="text-slate-500 dark:text-slate-400 mb-4 max-w-lg mx-auto text-xl leading-relaxed">
                    You've successfully submitted a rental request for this item.
                  </p>
                  <p className="text-slate-500 dark:text-slate-400 mb-12 max-w-lg mx-auto text-sm leading-relaxed">
                    We've notified {item.owner_name}. Check your dashboard to proceed to payment once they accept.
                  </p>
                  <div className="flex flex-col sm:flex-row justify-center gap-6">
                    <button 
                      onClick={downloadAgreement}
                      disabled={downloadingPdf}
                      className="px-10 py-5 rounded-[2rem] font-black text-slate-900 dark:text-white glass border-primary-500/20 shadow-xl transition-all hover-lift flex items-center justify-center gap-2"
                    >
                      {downloadingPdf ? <Loader2 className="animate-spin" size={20} /> : <Download size={20} className="text-primary-500" />}
                      Agreement PDF
                    </button>
                    <Link to="/dashboard" className="px-10 py-5 rounded-[2rem] font-black text-white bg-slate-900 dark:bg-primary-600 hover:shadow-primary-500/30 shadow-2xl transition-all hover-lift">
                      Track Activity
                    </Link>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Sticky Summary pane */}
          {step < 3 && (
            <div className="w-full lg:w-[420px] shrink-0">
              <div className="glass p-10 rounded-[3rem] border border-slate-100 dark:border-slate-800/50 bg-white/50 dark:bg-slate-900/50 sticky top-32 premium-shadow overflow-hidden">
                <div className="absolute top-0 left-1/2 -translate-x-1/2 w-32 h-1 bg-primary-500 rounded-full" />
                
                <div className="flex gap-6 pb-10 border-b border-slate-100 dark:border-slate-800/50">
                  <div className="w-28 h-24 rounded-3xl overflow-hidden shrink-0 border border-slate-200 dark:border-slate-800 shadow-lg">
                    <img src={item.image_url} alt={item.title} className="w-full h-full object-cover" />
                  </div>
                  <div className="flex flex-col justify-center">
                    <h3 className="font-bold text-slate-900 dark:text-white text-lg line-clamp-2 mb-2 leading-tight">{item.title}</h3>
                    <div className="flex flex-col gap-2">
                       <div className="flex items-center gap-1.5 px-3 py-1 bg-indigo-50 dark:bg-indigo-900/30 w-fit rounded-full">
                         <ShieldCheck size={14} className="text-indigo-600 dark:text-indigo-400" /> 
                         <span className="text-[10px] font-black uppercase text-indigo-700 dark:text-indigo-300">Verified Owner</span>
                       </div>
                       <div className="flex items-center gap-1.5 px-3 py-1 bg-emerald-50 dark:bg-emerald-900/30 w-fit rounded-full">
                         <ShieldCheck size={14} className="text-emerald-600 dark:text-emerald-400" /> 
                         <span className="text-[10px] font-black uppercase text-emerald-700 dark:text-emerald-300">Escrow Protected</span>
                       </div>
                    </div>
                  </div>
                </div>

                <div className="py-10 space-y-8 border-b border-slate-100 dark:border-slate-800/50">
                  <h3 className="font-black text-slate-900 dark:text-white text-xl uppercase tracking-widest text-[11px]">Pricing Breakdown</h3>
                  
                  <div className="space-y-6">
                    <div className="flex justify-between items-center">
                      <div className="flex flex-col">
                        <span className="text-slate-900 dark:text-white font-bold text-base">Rental Fee</span>
                        <span className="text-slate-400 text-xs">{formatINR(pricePerDay)} x {days} days</span>
                      </div>
                      <span className="text-slate-900 dark:text-white font-black text-xl">{formatINR(rentalTotal)}</span>
                    </div>
                    <div className="flex justify-between items-center group">
                      <div className="flex flex-col">
                        <span className="text-slate-900 dark:text-white font-bold text-base flex items-center gap-2">
                          Security Deposit
                          <AlertCircle size={14} className="text-slate-400" />
                        </span>
                        <span className="text-emerald-500 text-[10px] font-black uppercase tracking-tighter">Fully Refundable</span>
                      </div>
                      <span className="text-slate-900 dark:text-white font-black text-xl">{formatINR(depositAmount)}</span>
                    </div>
                  </div>
                </div>

                <div className="pt-10">
                  <div className="flex justify-between items-end mb-8">
                    <span className="text-slate-500 font-black uppercase tracking-widest text-xs">Total Commitment</span>
                    <span className="text-4xl font-black text-primary-600 dark:text-primary-400 tracking-tighter">{formatINR(total)}</span>
                  </div>
                  <p className="text-[10px] text-center text-slate-400 dark:text-slate-500 font-medium leading-relaxed italic mb-4">
                    By confirming, you agree to handle this item with extreme care under the campus conduct policy.
                  </p>
                  <div className="p-3 bg-emerald-500/10 rounded-xl border border-emerald-500/20 text-center">
                     <p className="text-[10px] font-black uppercase tracking-widest text-emerald-600">Payment held securely in escrow</p>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
