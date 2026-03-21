import { Link } from 'react-router-dom';
import { MessageCircle } from 'lucide-react';
import { motion } from 'framer-motion';
import { useLanguage } from '../contexts/LanguageContext';

interface ProductCardProps {
  id: string;
  name: string;
  brand?: string;
  image: string;
  category: string;
  isNew?: boolean;
}

export default function ProductCard({ id, name, brand, image, category, isNew }: ProductCardProps) {
  const { t } = useLanguage();
  return (
    <motion.div
      whileHover={{ y: -5 }}
      className="group relative flex flex-col bg-white rounded-2xl overflow-hidden shadow-sm hover:shadow-xl transition-all duration-300 border border-bel-dark/5"
    >
      {/* Image Container */}
      <div className="relative aspect-[4/3] bg-bel-gray overflow-hidden flex items-center justify-center p-6">
        {isNew && (
          <span className="absolute top-4 left-4 bg-bel-accent text-bel-dark text-xs font-bold uppercase tracking-wider py-1 px-3 rounded-full z-10">
            {t('cat.new')}
          </span>
        )}
        <img
          src={image}
          alt={name}
          className="w-full h-full object-contain transform group-hover:scale-105 transition-transform duration-500"
          referrerPolicy="no-referrer"
        />

      </div>

      {/* Content */}
      <div className="p-6 flex flex-col flex-grow">
        <div className="text-xs text-bel-accent font-semibold uppercase tracking-wider mb-2">
          {brand ? `${brand} • ${category}` : category}
        </div>
        <h3 className="font-serif text-xl font-medium text-bel-dark mb-2">
          {name}
        </h3>
        <div className="mt-auto flex items-center justify-end pt-4 border-t border-bel-dark/5">
          <a
            href={`https://wa.me/242044744456?text=${encodeURIComponent(t('wa.interest').replace('{name}', name))}`}
            target="_blank"
            rel="noopener noreferrer"
            className="text-bel-dark/50 hover:text-[#25D366] transition-colors"
            aria-label="Demander sur WhatsApp"
          >
            <MessageCircle size={24} />
          </a>
        </div>
      </div>
    </motion.div>
  );
}
