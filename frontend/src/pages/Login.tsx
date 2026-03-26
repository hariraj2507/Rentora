import { useState } from 'react';
import { motion } from 'framer-motion';
import { Link, useNavigate } from 'react-router-dom';
import { Package, Mail, Lock, User, AlertCircle } from 'lucide-react';
import { authApi } from '../services/api';
import { useToast } from '../components/Toast';

export default function Login() {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  
  const navigate = useNavigate();
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!isLogin && !email.endsWith('.edu')) {
      setError('Only verified student (.edu) emails are allowed.');
      return;
    }

    if (password.length < 6) {
      setError('Password must be at least 6 characters.');
      return;
    }

    setLoading(true);
    try {
      if (isLogin) {
        await authApi.login(email, password);
      } else {
        await authApi.register(name, email, password);
        toast('Account created! Welcome to RENTORA.', 'success');
      }
      if (isLogin) toast('Welcome back!', 'success');
      navigate('/dashboard');
    } catch (err: any) {
      setError(err.message || 'An error occurred. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex text-gray-900 dark:text-white dark:bg-dark-bg bg-gray-50">
      {/* Visual Side */}
      <div className="hidden lg:flex flex-1 relative bg-primary-900 overflow-hidden items-center justify-center p-12">
        <div className="absolute inset-0 z-0 opacity-30">
          <div className="absolute top-0 right-0 w-[800px] h-[800px] bg-gradient-to-bl from-accent-500 rounded-full blur-[150px] mix-blend-screen opacity-50 translate-x-1/2 -translate-y-1/2" />
          <div className="absolute bottom-0 left-0 w-[800px] h-[800px] bg-gradient-to-tr from-primary-500 rounded-full blur-[150px] mix-blend-screen opacity-50 -translate-x-1/2 translate-y-1/2" />
        </div>
        
        <div className="relative z-10 max-w-lg text-white">
          <Link to="/" className="flex items-center gap-3 mb-12 opacity-80 hover:opacity-100 transition-opacity">
            <div className="bg-white/20 p-2 rounded-xl backdrop-blur-sm">
              <Package size={28} />
            </div>
            <span className="text-2xl font-bold tracking-tight">RENTORA</span>
          </Link>
          <motion.h2 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-5xl font-bold mb-6 font-heading leading-tight"
          >
            Join the exclusive campus network.
          </motion.h2>
          <motion.p 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="text-xl text-primary-100 leading-relaxed font-body"
          >
            Connect with verified students to rent efficiently, sustainably, and safely. Use your .edu email to get started instantly.
          </motion.p>

          {/* Demo credentials hint */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.4 }}
            className="mt-12 p-6 bg-white/10 backdrop-blur-sm rounded-2xl border border-white/20"
          >
            <p className="text-white/60 text-xs font-bold uppercase tracking-widest mb-3">Demo Login</p>
            <p className="text-white/90 text-sm font-mono">david@stanford.edu / password123</p>
          </motion.div>
        </div>
      </div>

      {/* Form Side */}
      <div className="flex-1 flex flex-col justify-center px-6 sm:px-12 lg:px-24">
        <div className="w-full max-w-md mx-auto">
          {/* Mobile Logo */}
          <Link to="/" className="lg:hidden flex items-center gap-2 mb-8 justify-center">
            <div className="bg-primary-600 text-white p-2 rounded-xl">
              <Package size={24} />
            </div>
            <span className="text-xl font-bold tracking-tight dark:text-white">RENTORA</span>
          </Link>

          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="glass dark:bg-gray-900/50 p-8 sm:p-10"
          >
            <div className="mb-8 text-center">
              <h1 className="text-3xl font-bold mb-2 font-heading">
                {isLogin ? 'Welcome back' : 'Create an account'}
              </h1>
              <p className="text-gray-600 dark:text-gray-400">
                {isLogin ? 'Enter your details to access your dashboard' : 'Use your .edu email to join the network'}
              </p>
            </div>

            {error && (
              <div className="mb-6 p-4 rounded-xl bg-red-50 dark:bg-red-500/10 border border-red-200 dark:border-red-500/20 flex items-center gap-3 text-red-600 dark:text-red-400">
                <AlertCircle size={20} />
                <span className="text-sm font-medium">{error}</span>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-5">
              {!isLogin && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Full Name</label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400">
                      <User size={18} />
                    </div>
                    <input 
                      type="text" 
                      required
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      className="w-full pl-10 pr-4 py-3 rounded-xl bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none transition-all dark:text-white"
                      placeholder="John Doe"
                    />
                  </div>
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">University Email</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400">
                    <Mail size={18} />
                  </div>
                  <input 
                    type="email" 
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full pl-10 pr-4 py-3 rounded-xl bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none transition-all dark:text-white"
                    placeholder="student@university.edu"
                  />
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Password</label>
                  {isLogin && <a href="#" className="text-sm text-primary-600 hover:text-primary-700 dark:text-primary-400 font-medium">Forgot password?</a>}
                </div>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400">
                    <Lock size={18} />
                  </div>
                  <input 
                    type="password" 
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full pl-10 pr-4 py-3 rounded-xl bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none transition-all dark:text-white"
                    placeholder="••••••••"
                  />
                </div>
              </div>

              <motion.button 
                whileHover={{ scale: 1.01 }}
                whileTap={{ scale: 0.99 }}
                type="submit" 
                disabled={loading}
                className="w-full py-3.5 rounded-xl font-bold text-white bg-primary-600 hover:bg-primary-700 shadow-glow transition-all mt-6 disabled:opacity-70"
              >
                {loading ? 'Connecting...' : isLogin ? 'Sign In' : 'Create Account'}
              </motion.button>
            </form>

            <div className="mt-8 text-center text-sm text-gray-600 dark:text-gray-400">
              {isLogin ? "Don't have an account? " : "Already have an account? "}
              <button 
                onClick={() => { setIsLogin(!isLogin); setError(''); }}
                className="text-primary-600 dark:text-primary-400 font-semibold hover:underline"
              >
                {isLogin ? 'Sign up' : 'Log in'}
              </button>
            </div>
            
          </motion.div>
        </div>
      </div>
    </div>
  );
}
