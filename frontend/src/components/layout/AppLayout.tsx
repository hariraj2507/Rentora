import { Outlet } from 'react-router-dom';
import Navbar from './Navbar';
import Footer from './Footer';
import AIChatAssistant from '../AIChatAssistant';

export function AppLayout() {
  return (
    <div className="min-h-screen flex flex-col transition-colors duration-300 dark:bg-dark-bg">
      <Navbar />
      <main className="flex-grow">
        <Outlet />
      </main>
      <Footer />
      <AIChatAssistant />
    </div>
  );
}
