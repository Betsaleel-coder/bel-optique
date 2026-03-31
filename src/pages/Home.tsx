import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowRight, Eye, Sparkles, ShieldCheck } from 'lucide-react';
import { useState, useEffect } from 'react';
import PromoBanner from '../components/PromoBanner';
import { useLanguage } from '../contexts/LanguageContext';
import { supabase } from '../lib/supabase';
import BrandShowcase from '../components/BrandShowcase';
import Testimonials from '../components/Testimonials';
import artLensLogo from '../assets/logo-france-clair-1 (1).webp';
import WhatsAppIcon from '../components/WhatsAppIcon';
import heroBackground from '../assets/vto-background.png';

export default function Home() {
  const { t } = useLanguage();
  const [featuredProducts, setFeaturedProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchFeaturedProducts();
  }, []);

  async function fetchFeaturedProducts() {
    setLoading(true);
    // Request products with is_featured = true first
    const { data: featured, error: featuredError } = await supabase
      .from('products')
      .select('*')
      .eq('is_featured', true)
      .limit(4);

    let data = featured;

    // Fallback to most recent if no featured products are found
    if (!data || data.length === 0) {
      const { data: latest } = await supabase
        .from('products')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(4);
      data = latest;
    }

    if (data) {
      const formattedData = data.map((p: any) => ({
        id: p.id,
        name: p.name,
        brand: p.brand,
        category: p.category,
        image: p.image_url,
        isNew: p.is_new,
      }));
      setFeaturedProducts(formattedData);
    }
    setLoading(false);
  }

  return (
    <div className="flex flex-col">
      {/* Hero Section */}
      <section className="relative h-[85vh] flex items-center justify-center overflow-hidden">
        <div className="absolute inset-0 z-0">
          <img
            src={heroBackground}
            alt="Person wearing stylish glasses"
            className="w-full h-full object-cover object-[center_20%]"
          />
          <div className="absolute inset-0 bg-black/60"></div>
        </div>

        <div className="relative z-10 text-center px-4 max-w-5xl mx-auto">
          <motion.h1
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, ease: "easeOut" }}
            className="font-serif text-4xl sm:text-5xl md:text-7xl lg:text-8xl font-bold text-white mb-4 sm:mb-6 tracking-tight"
          >
            {t('home.hero_title')}
          </motion.h1>
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.2, ease: "easeOut" }}
            className="text-lg sm:text-xl md:text-2xl text-bel-light/90 mb-8 sm:mb-12 font-light max-w-2xl mx-auto"
          >
            {t('home.hero_subtitle')}
          </motion.p>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.4, ease: "easeOut" }}
            className="flex flex-col sm:flex-row items-center justify-center gap-4"
          >
            <Link
              to="/catalog"
              className="w-full sm:w-auto px-6 py-3 sm:px-8 sm:py-4 bg-white text-bel-dark rounded-full font-medium hover:bg-bel-accent hover:text-bel-dark transition-all transform hover:scale-105"
            >
              {t('home.hero_btn_catalog')}
            </Link>
            <Link
              to="/appointment"
              className="w-full sm:w-auto px-6 py-3 sm:px-8 sm:py-4 bg-transparent border border-white text-white rounded-full font-medium hover:bg-white/10 transition-all"
            >
              {t('home.hero_btn_appointment')}
            </Link>
          </motion.div>
        </div>
      </section>

      {/* Catchphrase Section */}
      <section className="py-24 bg-bel-dark text-white text-center">
        <div className="max-w-4xl mx-auto px-4">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            <Sparkles className="text-bel-accent mx-auto mb-8" size={40} />
            <h2 className="font-serif text-3xl md:text-5xl font-bold mb-8 leading-tight">
              {t('home.catchphrase_title')}
            </h2>
            <p className="text-xl md:text-2xl text-bel-light/80 font-light leading-relaxed">
              {t('home.catchphrase_text')}
            </p>
          </motion.div>
        </div>
      </section>

      {/* Art Lens Partner Section */}
      <section className="py-12 bg-bel-dark text-bel-light border-b border-bel-light/10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <p className="text-sm font-bold tracking-widest uppercase text-bel-accent mb-4">{t('home.partner_title')}</p>
          <div className="flex justify-center mb-6">
            <img 
              src={artLensLogo} 
              alt="Art Lens" 
              className="h-16 md:h-20 w-auto object-contain filter brightness-0 invert opacity-90" 
            />
          </div>
          <p className="text-bel-light/70 max-w-2xl mx-auto text-lg">
            {t('home.partner_desc')}
          </p>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-24 bg-bel-light">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-12">
            <div className="text-center">
              <div className="w-16 h-16 mx-auto bg-bel-dark text-white rounded-full flex items-center justify-center mb-6">
                <Eye size={32} strokeWidth={1.5} />
              </div>
              <h3 className="font-serif text-2xl font-medium mb-4">{t('home.feat_1_title')}</h3>
              <p className="text-bel-dark/70 leading-relaxed">
                {t('home.feat_1_desc')}
              </p>
            </div>
            <div className="text-center">
              <div className="w-16 h-16 mx-auto bg-bel-accent text-bel-dark rounded-full flex items-center justify-center mb-6">
                <Sparkles size={32} strokeWidth={1.5} />
              </div>
              <h3 className="font-serif text-2xl font-medium mb-4">{t('home.feat_2_title')}</h3>
              <p className="text-bel-dark/70 leading-relaxed">
                {t('home.feat_2_desc')}
              </p>
            </div>
            <div className="text-center">
              <div className="w-16 h-16 mx-auto bg-bel-dark text-white rounded-full flex items-center justify-center mb-6">
                <ShieldCheck size={32} strokeWidth={1.5} />
              </div>
              <h3 className="font-serif text-2xl font-medium mb-4">{t('home.feat_3_title')}</h3>
              <p className="text-bel-dark/70 leading-relaxed">
                {t('home.feat_3_desc')}
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Featured Collection */}
      <section className="py-24 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-end mb-12">
            <div>
              <span className="text-bel-accent font-semibold uppercase tracking-widest text-sm mb-2 block">{t('home.coll_new')}</span>
              <h2 className="font-serif text-3xl sm:text-4xl md:text-5xl font-bold">{t('home.coll_title')}</h2>
            </div>
            <Link to="/catalog" className="hidden md:flex items-center text-bel-dark font-medium hover:text-bel-accent transition-colors group">
              {t('home.coll_view_all')} <ArrowRight className="ml-2 transform group-hover:translate-x-1 transition-transform" size={20} />
            </Link>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
            {loading ? (
              <div className="col-span-1 sm:col-span-2 lg:col-span-4 flex justify-center items-center h-48">
                <div className="w-8 h-8 border-4 border-bel-accent border-t-transparent rounded-full animate-spin"></div>
              </div>
            ) : featuredProducts.map((product) => (
              <div key={product.id} className="group cursor-pointer">
                <div className="bg-bel-gray aspect-[4/3] rounded-2xl overflow-hidden mb-4 relative flex items-center justify-center p-6">
                  {product.isNew && (
                    <span className="absolute top-4 left-4 bg-bel-accent text-bel-dark text-xs font-bold uppercase tracking-wider py-1 px-3 rounded-full z-10">
                      {t('cat.new')}
                    </span>
                  )}
                  <img src={product.image} alt={product.name} loading="lazy" className="w-full h-full object-cover mix-blend-multiply transform group-hover:scale-105 transition-transform duration-500" />
                  
                  {/* WhatsApp Overlay Icon */}
                  <a
                    href={`https://wa.me/242044744456?text=${encodeURIComponent(t('wa.interest').replace('{name}', product.name))}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="absolute bottom-4 right-4 bg-white/90 backdrop-blur-sm p-2 rounded-full shadow-lg text-[#25D366] transform translate-y-2 opacity-0 group-hover:translate-y-0 group-hover:opacity-100 transition-all duration-300 hover:bg-[#25D366] hover:text-white z-20"
                    aria-label="Demander sur WhatsApp"
                  >
                    <WhatsAppIcon size={20} />
                  </a>
                </div>
                <div className="text-xs text-bel-accent font-semibold uppercase tracking-wider mb-1">{product.brand} • {product.category}</div>
                <h3 className="font-serif text-lg font-medium text-bel-dark mb-1">{product.name}</h3>
              </div>
            ))}
          </div>

          <div className="mt-12 text-center md:hidden">
            <Link to="/catalog" className="inline-flex items-center text-bel-dark font-medium hover:text-bel-accent transition-colors">
              {t('home.coll_view_all')} <ArrowRight className="ml-2" size={20} />
            </Link>
          </div>
        </div>
      </section>

      {/* Brand Showcase */}
      <BrandShowcase />

      {/* Testimonials */}
      <Testimonials />

      {/* News Preview */}
      <section className="py-24 bg-white border-t border-bel-dark/5">
        <div className="max-w-7xl mx-auto px-4 text-center">
          <h2 className="font-serif text-3xl md:text-4xl font-bold mb-8">{t('home.news_title')}</h2>
          <Link
            to="/news"
            className="inline-flex items-center gap-2 bg-bel-dark text-white px-8 py-4 rounded-full font-medium hover:bg-bel-accent hover:text-bel-dark transition-all transform hover:scale-105"
          >
            {t('home.news_view_all')}
            <ArrowRight size={20} />
          </Link>
        </div>
      </section>

      {/* Promo Section placeholder if needed */}
    </div>
  );
}
