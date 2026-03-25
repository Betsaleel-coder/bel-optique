import { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Menu, X, ShoppingBag, Search, User, Globe, Sparkles } from 'lucide-react';
import clsx from 'clsx';
import { useLanguage } from '../contexts/LanguageContext';
import logo from '../assets/logo.png';

export default function Navbar() {
  const [isOpen, setIsOpen] = useState(false);
  const location = useLocation();
  const { language, setLanguage, t } = useLanguage();

  interface NavLink {
    name: string;
    path: string;
    icon?: React.ReactNode;
  }

  const navLinks: NavLink[] = [
    { name: t('nav.collections'), path: '/catalog' },
    { name: t('nav.vto'), path: '/vto' },
    { name: t('nav.appointment'), path: '/appointment' },
    { name: t('home.news_title'), path: '/news' },
    { name: t('nav.location'), path: '/location' },
  ];

  const isActive = (path: string) => location.pathname === path;

  return (
    <nav className="sticky top-0 z-40 bg-bel-light/90 backdrop-blur-md border-b border-bel-dark/10">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-24 md:h-28">
          {/* Mobile menu button */}
          <div className="flex items-center md:hidden">
            <button
              onClick={() => setIsOpen(!isOpen)}
              className="text-bel-dark hover:text-bel-accent transition-colors"
            >
              {isOpen ? <X size={24} /> : <Menu size={24} />}
            </button>
          </div>

          {/* Logo */}
          <div className="flex-shrink-0 flex items-center justify-center flex-1 md:flex-none">
            <Link to="/" className="flex items-center">
              <img
                src={logo}
                alt="Bel'Optique"
                className="h-20 md:h-28 w-auto"
              />
            </Link>
          </div>

          {/* Desktop Menu */}
          <div className="hidden md:flex md:items-center md:space-x-8">
            {navLinks.map((link) => (
              <Link
                key={link.name}
                to={link.path}
                className={clsx(
                  'flex items-center text-sm font-medium transition-colors hover:text-bel-accent uppercase tracking-wider',
                  isActive(link.path) ? 'text-bel-accent' : 'text-bel-dark/80'
                )}
              >
                {link.icon && link.icon}
                {link.name}
              </Link>
            ))}
          </div>

          {/* Icons & Language */}
          <div className="flex items-center space-x-4 md:space-x-6">
            <button
              onClick={() => setLanguage(language === 'fr' ? 'en' : 'fr')}
              className="flex items-center space-x-1 text-bel-dark hover:text-bel-accent transition-colors font-medium text-sm"
              title={language === 'fr' ? 'Switch to English' : 'Passer en Français'}
            >
              <Globe size={18} />
              <span className="uppercase">{language}</span>
            </button>
            <button className="text-bel-dark hover:text-bel-accent transition-colors hidden sm:block">
              <Search size={20} />
            </button>
            <button className="text-bel-dark hover:text-bel-accent transition-colors hidden sm:block">
              <User size={20} />
            </button>
            <button className="text-bel-dark hover:text-bel-accent transition-colors">
              <ShoppingBag size={20} />
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Menu */}
      {isOpen && (
        <div className="md:hidden bg-bel-light border-b border-bel-dark/10">
          <div className="px-2 pt-2 pb-3 space-y-1 sm:px-3">
            {navLinks.map((link) => (
              <Link
                key={link.name}
                to={link.path}
                onClick={() => setIsOpen(false)}
                className={clsx(
                  'flex items-center px-3 py-2 text-base font-medium uppercase tracking-wider',
                  isActive(link.path) ? 'text-bel-accent' : 'text-bel-dark hover:text-bel-accent'
                )}
              >
                {link.icon && link.icon}
                {link.name}
              </Link>
            ))}
          </div>
        </div>
      )}
    </nav>
  );
}
