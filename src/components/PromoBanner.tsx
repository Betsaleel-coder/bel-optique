import { Link } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';

interface PromoBannerProps {
  title: string;
  subtitle: string;
  image: string;
  link: string;
  linkText: string;
  color?: 'dark' | 'light' | 'accent';
}

export default function PromoBanner({ title, subtitle, image, link, linkText, color = 'dark' }: PromoBannerProps) {
  const bgColors = {
    dark: 'bg-bel-dark text-bel-light',
    light: 'bg-bel-light text-bel-dark border border-bel-dark/10',
    accent: 'bg-bel-accent text-bel-dark',
  };

  return (
    <div className={`relative overflow-hidden rounded-3xl ${bgColors[color]} flex flex-col md:flex-row items-center justify-between p-8 md:p-16 shadow-lg`}>
      <div className="z-10 max-w-xl mb-8 md:mb-0">
        <h2 className="font-serif text-3xl sm:text-4xl md:text-5xl font-bold mb-4 leading-tight">
          {title}
        </h2>
        <p className="text-base sm:text-lg md:text-xl opacity-80 mb-6 sm:mb-8 font-light">
          {subtitle}
        </p>
        <Link
          to={link}
          className={`inline-flex items-center px-6 py-3 sm:px-8 sm:py-4 rounded-full font-medium transition-all transform hover:scale-105 ${
            color === 'light'
              ? 'bg-bel-dark text-bel-light hover:bg-bel-accent hover:text-bel-dark'
              : 'bg-white text-bel-dark hover:bg-bel-gray'
          }`}
        >
          {linkText}
          <ArrowRight className="ml-2" size={20} />
        </Link>
      </div>
      
      <div className="relative w-full md:w-1/2 h-64 md:h-96 rounded-2xl overflow-hidden shadow-2xl transform md:rotate-3 hover:rotate-0 transition-transform duration-500">
        <img
          src={image}
          alt={title}
          className="w-full h-full object-cover"
          referrerPolicy="no-referrer"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent"></div>
      </div>
    </div>
  );
}
