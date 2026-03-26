import { Package, Share2, Globe, MessageCircle, Mail } from 'lucide-react';
import { Link } from 'react-router-dom';

export default function Footer() {
  return (
    <footer className="mt-20 border-t border-gray-200 dark:border-gray-800 bg-white dark:bg-dark-bg transition-colors duration-300">
      <div className="container mx-auto px-4 md:px-8 py-12 md:py-16">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-12 md:gap-8">
          {/* Brand */}
          <div className="flex flex-col gap-4">
            <Link to="/" className="flex items-center gap-2 mb-4">
              <div className="bg-primary-600 text-white p-2 rounded-xl">
                <Package size={24} />
              </div>
              <span className="text-xl font-bold tracking-tight text-gray-900 dark:text-white">
                RENTORA
              </span>
            </Link>
            <p className="text-gray-600 dark:text-gray-400 max-w-xs leading-relaxed">
              Safe, high-trust peer-to-peer rental platform connecting verified students. Optimize use of idle resources affordably.
            </p>
            <div className="flex items-center gap-4 mt-4">
              <a href="#" className="p-2 rounded-lg bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:text-primary-600 dark:hover:text-primary-400 transition-colors">
                <MessageCircle size={20} />
              </a>
              <a href="#" className="p-2 rounded-lg bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:text-primary-600 dark:hover:text-primary-400 transition-colors">
                <Globe size={20} />
              </a>
              <a href="#" className="p-2 rounded-lg bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:text-primary-600 dark:hover:text-primary-400 transition-colors">
                <Share2 size={20} />
              </a>
            </div>
          </div>

          {/* Links Group 1 */}
          <div className="flex flex-col gap-4">
            <h4 className="text-gray-900 dark:text-white font-semibold mb-2">Platform</h4>
            <Link to="/items" className="text-gray-600 dark:text-gray-400 hover:text-primary-600 transition-colors">Browse Items</Link>
            <Link to="/how-it-works" className="text-gray-600 dark:text-gray-400 hover:text-primary-600 transition-colors">How it Works</Link>
            <Link to="/trust" className="text-gray-600 dark:text-gray-400 hover:text-primary-600 transition-colors">Trust & Safety</Link>
            <Link to="/pricing" className="text-gray-600 dark:text-gray-400 hover:text-primary-600 transition-colors">Pricing</Link>
          </div>

          {/* Links Group 2 */}
          <div className="flex flex-col gap-4">
            <h4 className="text-gray-900 dark:text-white font-semibold mb-2">Company</h4>
            <Link to="/about" className="text-gray-600 dark:text-gray-400 hover:text-primary-600 transition-colors">About Us</Link>
            <Link to="/careers" className="text-gray-600 dark:text-gray-400 hover:text-primary-600 transition-colors">Careers</Link>
            <Link to="/blog" className="text-gray-600 dark:text-gray-400 hover:text-primary-600 transition-colors">Blog</Link>
            <Link to="/contact" className="text-gray-600 dark:text-gray-400 hover:text-primary-600 transition-colors">Contact</Link>
          </div>

          {/* Connect */}
          <div className="flex flex-col gap-4">
            <h4 className="text-gray-900 dark:text-white font-semibold mb-2">Stay Updated</h4>
            <p className="text-gray-600 dark:text-gray-400 text-sm mb-2">
              Get the latest updates on new features and product releases.
            </p>
            <div className="flex mt-2 relative">
              <Mail className="absolute left-3 top-1/2 -transform-y-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
              <input 
                type="email" 
                placeholder="Enter your email" 
                className="w-full bg-gray-100 dark:bg-gray-800 border-none rounded-xl py-3 pl-10 pr-4 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500 transition-all outline-none"
              />
            </div>
            <button className="w-full mt-2 py-3 rounded-xl font-medium text-white bg-primary-600 hover:bg-primary-700 shadow-glow transition-all">
              Subscribe
            </button>
          </div>
        </div>

        <div className="h-px bg-gray-200 dark:bg-gray-800 my-8"></div>
        
        <div className="flex flex-col md:flex-row items-center justify-between text-sm text-gray-500 dark:text-gray-400">
          <p>© {new Date().getFullYear()} RENTORA. All rights reserved.</p>
          <div className="flex gap-6 mt-4 md:mt-0">
            <a href="#" className="hover:text-primary-600 transition-colors">Privacy Policy</a>
            <a href="#" className="hover:text-primary-600 transition-colors">Terms of Service</a>
            <a href="#" className="hover:text-primary-600 transition-colors">Cookie Policy</a>
          </div>
        </div>
      </div>
    </footer>
  );
}
