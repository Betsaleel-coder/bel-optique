import { motion } from 'framer-motion';
import { useLanguage } from '../contexts/LanguageContext';
import WhatsAppIcon from './WhatsAppIcon';

interface ProductCardProps {
  id: string;
  name: string;
  brand?: string;
  image: string;
  hoverImage?: string;
  category: string;
  isNew?: boolean;
}

export default function ProductCard({ id, name, brand, image, hoverImage, category, isNew }: ProductCardProps) {
  const { t } = useLanguage();
  return (
    <motion.div
      whileHover={{ y: -8 }}
      className="group relative flex flex-col bg-white overflow-hidden transition-all duration-500 hover:shadow-[0_20px_50px_rgba(0,0,0,0.1)] h-full"
    >
      {/* Aspect Ratio Container (Square for more presence) - Inspired by Fred.com */}
      <div className="relative aspect-square bg-[#FBFBFC] overflow-hidden flex items-center justify-center p-4 sm:p-10">
        {isNew && (
          <span className="absolute top-6 left-6 bg-bel-dark text-white text-[10px] font-bold uppercase tracking-[0.2em] py-1 px-3 rounded-sm z-10">
            {t('cat.new')}
          </span>
        )}
        
        {/* Main Image */}
        <img
          src={image}
          alt={name}
          className={`w-full h-full object-contain transform transition-all duration-700 ease-out ${
            hoverImage 
              ? 'group-hover:opacity-0 group-hover:scale-105' 
              : 'group-hover:scale-110'
          }`}
          referrerPolicy="no-referrer"
        />

        {/* Hover Image */}
        {hoverImage && (
          <img
            src={hoverImage}
            alt={`${name} hover`}
            className="absolute inset-0 w-full h-full object-contain transform scale-95 opacity-0 group-hover:opacity-100 group-hover:scale-110 transition-all duration-700 ease-out p-4 sm:p-10"
            referrerPolicy="no-referrer"
          />
        )}
        
        {/* Minimalist WhatsApp Always Visible - Miniature */}
        <a
          href={`https://wa.me/242044744456?text=${encodeURIComponent(t('wa.interest').replace('{name}', name))}`}
          target="_blank"
          rel="noopener noreferrer"
          className="absolute bottom-4 right-4 sm:bottom-6 sm:right-6 bg-white/90 backdrop-blur-sm shadow-md p-2 rounded-full text-[#25D366] transition-all duration-300 hover:scale-110 hover:shadow-lg z-20 border border-bel-dark/5"
          aria-label="Demander sur WhatsApp"
        >
          <WhatsAppIcon size={18} />
        </a>
      </div>

      {/* Luxury Content Styling */}
      <div className="p-8 text-center flex flex-col items-center flex-grow">
        <div className="text-[11px] text-bel-accent font-bold uppercase tracking-[0.3em] mb-4">
          {brand || "ESSENTIALS"}
        </div>
        
        <h3 className="font-serif text-2xl font-light text-bel-dark leading-tight mb-3 group-hover:text-bel-accent transition-colors duration-300">
          {name}
        </h3>
        
        <p className="text-bel-dark/40 text-xs italic tracking-wider mb-8">
          {category}
        </p>
        
        {/* Subtle Decorative Element */}
        <div className="mt-auto h-[1px] w-6 bg-bel-accent/20 group-hover:w-16 transition-all duration-700 ease-in-out" />
      </div>
    </motion.div>
  );
}
