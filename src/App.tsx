import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { LanguageProvider } from './contexts/LanguageContext';
import Navbar from './components/Navbar';
import Footer from './components/Footer';
import WhatsAppButton from './components/WhatsAppButton';
import Home from './pages/Home';
import Catalog from './pages/Catalog';
import Promotions from './pages/Promotions';
import VirtualTryOn from './pages/VirtualTryOn';
import Appointment from './pages/Appointment';
import Location from './pages/Location';
import Contact from './pages/Contact';
import News from './pages/News';
import AdminDashboard from './pages/AdminDashboard';
import ScrollToTop from './components/ScrollToTop';

export default function App() {
  return (
    <LanguageProvider>
      <BrowserRouter>
        <ScrollToTop />
        <div className="flex flex-col min-h-screen">
          <div className="texture-overlay"></div>
          <Navbar />
          <main className="flex-grow">
            <Routes>
              <Route path="/" element={<Home />} />
              <Route path="/catalog" element={<Catalog />} />
              <Route path="/promotions" element={<Promotions />} />
              <Route path="/vto" element={<VirtualTryOn />} />
              <Route path="/appointment" element={<Appointment />} />
              <Route path="/news" element={<News />} />
              <Route path="/location" element={<Location />} />
              <Route path="/contact" element={<Contact />} />
              <Route path="/admin" element={<AdminDashboard />} />
            </Routes>
          </main>
          <Footer />
          <WhatsAppButton />
        </div>
      </BrowserRouter>
    </LanguageProvider>
  );
}
