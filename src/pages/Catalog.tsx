import { useState, useEffect } from 'react';
import FilterSidebar from '../components/FilterSidebar';
import ProductGrid from '../components/ProductGrid';

import { supabase } from '../lib/supabase';
import { useLanguage } from '../contexts/LanguageContext';

const getFilterCategories = (t: (key: string) => string) => [
  {
    id: 'genre',
    name: t('filter.genre'),
    options: [
      { id: 'homme', label: t('filter.homme'), count: 42 },
      { id: 'femme', label: t('filter.femme'), count: 56 },
      { id: 'enfants', label: t('filter.enfants'), count: 18 },
    ],
  },
  {
    id: 'marques',
    name: t('filter.marques'),
    options: [
      { id: 'rayban', label: 'Ray Ban', count: 24 },
      { id: 'boss', label: 'Hugo Boss', count: 15 },
      { id: 'fred', label: 'Fred', count: 8 },
      { id: 'maxmara', label: 'Max Mara', count: 12 },
      { id: 'williammorris', label: 'William Morris', count: 19 },
      { id: 'guess', label: 'Guess', count: 22 },
      { id: 'carrera', label: 'Carrera', count: 14 },
      { id: 'versace', label: 'Versace', count: 9 },
    ],
  },
  {
    id: 'type',
    name: t('filter.type'),
    options: [
      { id: 'medicales', label: t('filter.medical'), count: 85 },
      { id: 'solaires', label: t('filter.solaires'), count: 31 },
    ],
  },
];

export default function Catalog() {
  const { t } = useLanguage();
  const [selectedFilters, setSelectedFilters] = useState<Record<string, string[]>>({});
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    fetchProducts();
  }, []);

  async function fetchProducts() {
    setLoading(true);
    const { data, error } = await supabase.from('products').select('*');
    if (data) {
      const formattedData = data.map((p: any) => ({
        id: p.id,
        name: p.name,
        brand: p.brand,
        category: p.category,
        gender: p.gender || 'Unisex',
        image: p.image_url,
        isNew: p.is_new,
      }));
      setProducts(formattedData);
    }
    setLoading(false);
  }

  const handleFilterChange = (categoryId: string, optionId: string) => {
    setSelectedFilters((prev) => {
      const current = prev[categoryId] || [];
      const updated = current.includes(optionId)
        ? current.filter((id) => id !== optionId)
        : [...current, optionId];

      return { ...prev, [categoryId]: updated };
    });
  };

  const filteredProducts = products.filter(product => {
    // Search filter
    if (searchQuery && !product.name.toLowerCase().includes(searchQuery.toLowerCase()) && !product.brand.toLowerCase().includes(searchQuery.toLowerCase())) {
      return false;
    }

    // Genre filter
    if (selectedFilters.genre?.length) {
      const match = selectedFilters.genre.some(g => 
        (product.gender && product.gender.toLowerCase() === g.toLowerCase()) ||
        product.category.toLowerCase().includes(g.toLowerCase()) || 
        product.name.toLowerCase().includes(g.toLowerCase())
      );
      if (!match) return false;
    }

    // Marques filter
    if (selectedFilters.marques?.length) {
      if (!selectedFilters.marques.some(m => product.brand.toLowerCase().includes(m.toLowerCase()))) {
        return false;
      }
    }

    // Type filter
    if (selectedFilters.type?.length) {
      if (!selectedFilters.type.some(t => product.category.toLowerCase().includes(t.toLowerCase()))) {
        return false;
      }
    }

    return true;
  });

  return (
    <div className="bg-bel-light min-h-screen py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-12 text-center md:text-left">
          <h1 className="font-serif text-3xl sm:text-4xl md:text-5xl font-bold mb-4">{t('cat.title')}</h1>
          <p className="text-bel-dark/70 max-w-2xl text-base sm:text-lg">
            {t('cat.desc')}
          </p>
        </div>

        <div className="flex flex-col lg:flex-row gap-12">
          {/* Sidebar */}
          <FilterSidebar
            categories={getFilterCategories(t)}
            selectedFilters={selectedFilters}
            onFilterChange={handleFilterChange}
          />

          {/* Product Grid */}
          <div className="flex-1">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
              <span className="text-sm text-bel-dark/70 font-medium">{filteredProducts.length} {t('cat.results')}</span>
              
              <div className="flex w-full md:w-auto items-center gap-4">
                <div className="relative flex-1 md:w-64">
                    <input 
                        type="text"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        placeholder={t('cat.search')}
                        className="w-full px-4 py-2 bg-white border border-bel-dark/10 rounded-xl focus:ring-2 focus:ring-bel-accent outline-none text-sm"
                    />
                </div>
                <select className="bg-transparent border-none text-sm font-medium text-bel-dark focus:ring-0 cursor-pointer outline-none">
                  <option>{t('cat.sort')}: {t('cat.sort_new')}</option>
                  <option>{t('cat.sort')}: {t('cat.sort_brand')}</option>
                </select>
              </div>
            </div>

            {loading ? (
              <div className="flex justify-center items-center h-64">
                <div className="w-8 h-8 border-4 border-bel-accent border-t-transparent rounded-full animate-spin"></div>
              </div>
            ) : (
              <ProductGrid products={filteredProducts} />
            )}

            {/* Pagination Placeholder */}
            <div className="mt-16 flex justify-center">
              <button className="px-6 py-2 sm:px-8 sm:py-3 border border-bel-dark/20 rounded-full font-medium hover:bg-bel-dark hover:text-white transition-colors">
                {t('cat.load_more')}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
