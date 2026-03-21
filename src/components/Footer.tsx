import { Link } from 'react-router-dom';
import { Facebook, Instagram, Linkedin, MapPin, Phone, Mail } from 'lucide-react';
import { useLanguage } from '../contexts/LanguageContext';
import logo from '../assets/logo.png';

const TikTokIcon = ({ size = 20, className = "" }) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
  >
    <path d="M9 12a4 4 0 1 0 4 4V4a5 5 0 0 0 5 5v3a3 3 0 0 1-3-3" />
  </svg>
);

export default function Footer() {
  const { t } = useLanguage();

  return (
    <footer className="bg-bel-dark text-bel-light py-12 md:py-16">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-12 md:gap-8">
          {/* Brand */}
          <div className="col-span-1 md:col-span-1">
            <Link to="/" className="mb-6 block">
              <img
                src={logo}
                alt="Bel'Optique"
                className="h-14 md:h-16 w-auto"
              />
            </Link>
            <p className="text-bel-light/70 text-sm leading-relaxed mb-6">
              {t('footer.brand_desc')}
            </p>
            <div className="flex space-x-4">
              <a href="#" className="text-bel-light/70 hover:text-bel-accent transition-colors">
                <Instagram size={20} />
              </a>
              <a href="#" className="text-bel-light/70 hover:text-bel-accent transition-colors">
                <Facebook size={20} />
              </a>
              <a href="#" className="text-bel-light/70 hover:text-bel-accent transition-colors">
                <Linkedin size={20} />
              </a>
              <a href="#" className="text-bel-light/70 hover:text-bel-accent transition-colors">
                <TikTokIcon size={20} />
              </a>
            </div>
          </div>

          {/* Links */}
          <div>
            <h4 className="font-serif text-lg font-semibold mb-4 uppercase tracking-wider">{t('footer.collections')}</h4>
            <ul className="space-y-3 text-sm text-bel-light/70">
              <li><Link to="/catalog?category=homme" className="hover:text-bel-accent transition-colors">{t('footer.men')}</Link></li>
              <li><Link to="/catalog?category=femme" className="hover:text-bel-accent transition-colors">{t('footer.women')}</Link></li>
              <li><Link to="/catalog?category=solaires" className="hover:text-bel-accent transition-colors">{t('footer.sunglasses')}</Link></li>
              <li><Link to="/catalog?category=medicales" className="hover:text-bel-accent transition-colors">{t('footer.medical')}</Link></li>
            </ul>
          </div>

          {/* Services */}
          <div>
            <h4 className="font-serif text-lg font-semibold mb-4 uppercase tracking-wider">{t('footer.services')}</h4>
            <ul className="space-y-3 text-sm text-bel-light/70">
              <li><Link to="/appointment" className="hover:text-bel-accent transition-colors">{t('footer.appointment')}</Link></li>
              <li><Link to="/news" className="hover:text-bel-accent transition-colors">{t('news.title')}</Link></li>
              <li><Link to="/promotions" className="hover:text-bel-accent transition-colors">{t('footer.promotions')}</Link></li>
              <li><Link to="/contact" className="hover:text-bel-accent transition-colors">{t('footer.contact')}</Link></li>
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h4 className="font-serif text-lg font-semibold mb-4 uppercase tracking-wider">{t('footer.location')}</h4>
            <ul className="space-y-4 text-sm text-bel-light/70">
              <li className="flex items-start">
                <MapPin size={18} className="mr-3 mt-0.5 flex-shrink-0 text-bel-accent" />
                <span><strong>{t('app.city') || 'Brazzaville'}:</strong> Hôtel Saphir<br /><strong>{t('app.city') ? 'Pointe-Noire' : 'Pointe-Noire'}:</strong> Marché Plateau</span>
              </li>
              <li className="flex items-center">
                <Phone size={18} className="mr-3 flex-shrink-0 text-bel-accent" />
                <span>+242 04 474 4456</span>
              </li>
              <li className="flex items-center">
                <Mail size={18} className="mr-3 flex-shrink-0 text-bel-accent" />
                <span>mailbusinessagencylearn@gmail.com</span>
              </li>
            </ul>
          </div>
        </div>

        <div className="border-t border-bel-light/10 mt-12 pt-8 flex flex-col md:flex-row justify-between items-center text-xs text-bel-light/50">
          <p>&copy; {new Date().getFullYear()} Bel'Optique. {t('footer.rights')}</p>
          <div className="flex space-x-6 mt-4 md:mt-0">
            <a href="#" className="hover:text-bel-light transition-colors">{t('footer.privacy')}</a>
            <a href="#" className="hover:text-bel-light transition-colors">{t('footer.terms')}</a>
          </div>
        </div>
      </div>
    </footer>
  );
}
