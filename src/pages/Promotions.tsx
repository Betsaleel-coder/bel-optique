import { useState, useEffect } from 'react';
import PromoBanner from '../components/PromoBanner';
import ProductGrid from '../components/ProductGrid';
import { supabase } from '../lib/supabase';
import { useLanguage } from '../contexts/LanguageContext';

export default function Promotions() {
  const { t } = useLanguage();
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchPromoProducts();
  }, []);

  async function fetchPromoProducts() {
    setLoading(true);
    const { data, error } = await supabase.from('products').select('*').eq('is_promotion', true);
    if (data) {
      const formattedData = data.map((p: any) => ({
        id: p.id,
        name: p.name,
        brand: p.brand,
        category: p.category,
        image: p.image_url,
        isNew: p.is_new,
      }));
      setProducts(formattedData);
    }
    setLoading(false);
  }

  return (
    <div className="bg-bel-light min-h-screen py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <h1 className="font-serif text-3xl sm:text-4xl md:text-6xl font-bold mb-4 sm:mb-6">{t('promo.title')}</h1>
          <p className="text-lg sm:text-xl text-bel-dark/70 font-light max-w-2xl mx-auto">
            {t('promo.desc')}
          </p>
        </div>

        <div className="space-y-16 mb-24">
          <PromoBanner
            title={t('promo.summer_title')}
            subtitle={t('promo.summer_desc')}
            image="https://images.unsplash.com/photo-1511499767150-a48a237f0083?q=80&w=1000&auto=format&fit=crop"
            link="/catalog?category=solaires"
            linkText={t('promo.view_offers')}
            color="accent"
          />

          <PromoBanner
            title={t('promo.back_title')}
            subtitle={t('promo.back_desc')}
            image="https://images.unsplash.com/photo-1556150259-22a849767675?q=80&w=1000&auto=format&fit=crop"
            link="/catalog?category=medicales"
            linkText={t('promo.discover')}
            color="light"
          />
        </div>

        <div>
          <h2 className="font-serif text-2xl sm:text-3xl font-bold mb-6 sm:mb-8 text-center">{t('promo.selection_title')}</h2>
          {loading ? (
            <div className="flex justify-center items-center h-64">
              <div className="w-8 h-8 border-4 border-bel-accent border-t-transparent rounded-full animate-spin"></div>
            </div>
          ) : (
            <ProductGrid products={products} />
          )}
        </div>
      </div>
    </div>
  );
}
