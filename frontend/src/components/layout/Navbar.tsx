import { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Moon, Sun, Package, LogOut } from 'lucide-react';
import { authApi } from '../../services/api';
import { useTheme } from '../../context/ThemeContext';

export default function Navbar() {
  const [isScrolled, setIsScrolled] = useState(false);
  const { theme, toggleTheme } = useTheme();
  const location = useLocation();
  const [user, setUser] = useState(authApi.getUser());

  useEffect(() => {
    const handleScroll = () => setIsScrolled(window.scrollY > 20);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Re-check auth state on route change
  useEffect(() => {
    setUser(authApi.getUser());
  }, [location.pathname]);

  const isLoggedIn = authApi.isAuthenticated();

  return (
    <nav className={`fixed top-0 left-0 right-0 z-50 transition-all duration-500 ${isScrolled ? 'py-4' : 'py-8'}`}>
      <div className="container mx-auto px-6 md:px-12 flex justify-center">
        <div className={`flex items-center justify-between gap-12 px-8 py-3.5 rounded-[2.5rem] border transition-all duration-500 w-full max-w-5xl ${isScrolled ? 'glass shadow-2xl shadow-indigo-500/10 border-slate-200/50 dark:border-slate-800/50 bg-white/70 dark:bg-slate-900/70' : 'bg-transparent border-transparent'}`}>
          {/* Logo */}
          <Link to="/" className="flex items-center gap-3 group">
            <div className="w-10 h-10 bg-slate-900 dark:bg-white rounded-xl flex items-center justify-center group-hover:rotate-12 transition-transform shadow-xl">
              <Package className="text-white dark:text-slate-900" size={22} />
            </div>
            <span className="text-2xl font-black text-slate-900 dark:text-white tracking-tighter">
              RENT<span className="text-primary-600">ORA</span>
            </span>
          </Link>

          {/* Nav Links */}
          <div className="hidden md:flex items-center gap-10">
            {[
              { name: 'Explore', path: '/items' },
              { name: 'Dashboard', path: '/dashboard' },
              { name: 'Messages', path: '/messages' },
              { name: 'Profile', path: '/profile' },
            ].map((link) => (
              <Link
                key={link.path}
                to={link.path}
                className={`text-xs font-black uppercase tracking-widest transition-all hover:text-primary-600 relative group px-2 py-1 ${location.pathname === link.path ? 'text-primary-600' : 'text-slate-500 dark:text-slate-400'}`}
              >
                {link.name}
                <span className={`absolute -bottom-2 left-0 h-1 bg-primary-600 transition-all duration-300 rounded-full ${location.pathname === link.path ? 'w-full' : 'w-0 group-hover:w-full'}`} />
              </Link>
            ))}
          </div>

          <div className="flex items-center gap-4">
            <button onClick={toggleTheme} className="p-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:scale-110 active:scale-90 transition-all shadow-inner">
              {theme === 'dark' ? <Sun size={20} /> : <Moon size={20} />}
            </button>

            {isLoggedIn && user ? (
              <div className="flex items-center gap-3">
                <Link to="/profile" className="flex items-center gap-3 group">
                  {user.avatar ? (
                    <img src={user.avatar} alt={user.name} className="w-9 h-9 rounded-xl border-2 border-primary-500/30 group-hover:scale-110 transition-transform" />
                  ) : (
                    <div className="w-9 h-9 rounded-xl bg-primary-600 flex items-center justify-center text-white font-black text-xs group-hover:scale-110 transition-transform">
                      {user.name?.charAt(0)}
                    </div>
                  )}
                  <span className="hidden lg:block text-xs font-black text-slate-900 dark:text-white uppercase tracking-widest">
                    {user.name?.split(' ')[0]}
                  </span>
                </Link>
                <button
                  onClick={() => authApi.logout()}
                  className="p-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 transition-all"
                  title="Logout"
                >
                  <LogOut size={16} />
                </button>
              </div>
            ) : (
              <Link 
                to="/login" 
                className="px-6 py-2.5 rounded-2xl bg-slate-900 dark:bg-white text-white dark:text-slate-900 font-black text-xs uppercase tracking-widest hover:scale-105 active:scale-95 transition-all shadow-2xl shadow-slate-500/10"
              >
                Log In
              </Link>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
}
