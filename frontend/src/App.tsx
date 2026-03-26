import { BrowserRouter as Router, Routes, Route, useLocation } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { AppLayout } from './components/layout/AppLayout';
import { ToastProvider } from './components/Toast';
import { ThemeProvider } from './context/ThemeContext';
import Landing from './pages/Landing';
import Dashboard from './pages/Dashboard';
import Listings from './pages/Listings';
import ItemDetail from './pages/ItemDetail';
import Booking from './pages/Booking';
import Profile from './pages/Profile';
import Login from './pages/Login';
import PostItem from './pages/PostItem';
import Messages from './pages/Messages';

function AnimatedRoutes() {
  const location = useLocation();
  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={location.pathname}
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -12 }}
        transition={{ duration: 0.25, ease: 'easeInOut' }}
      >
        <Routes location={location}>
          <Route path="/" element={<AppLayout />}>
            <Route index element={<Landing />} />
            <Route path="dashboard" element={<Dashboard />} />
            <Route path="items" element={<Listings />} />
            <Route path="items/:id" element={<ItemDetail />} />
            <Route path="book/:id" element={<Booking />} />
            <Route path="profile" element={<Profile />} />
            <Route path="post-item" element={<PostItem />} />
            <Route path="messages" element={<Messages />} />
          </Route>
          <Route path="/login" element={<Login />} />
        </Routes>
      </motion.div>
    </AnimatePresence>
  );
}

function App() {
  return (
    <ThemeProvider>
      <ToastProvider>
        <Router>
          <AnimatedRoutes />
        </Router>
      </ToastProvider>
    </ThemeProvider>
  );
}

export default App;
