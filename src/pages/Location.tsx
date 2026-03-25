import { MapPin, Clock, Mail } from 'lucide-react';
import WhatsAppIcon from '../components/WhatsAppIcon';
import { useLanguage } from '../contexts/LanguageContext';

export default function Location() {
  const { t } = useLanguage();
  return (
    <div className="bg-bel-light min-h-screen py-12 md:py-24">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <h1 className="font-serif text-3xl sm:text-4xl md:text-6xl font-bold mb-4 sm:mb-6">{t('loc.title')}</h1>
          <p className="text-lg sm:text-xl text-bel-dark/70 font-light max-w-2xl mx-auto">
            {t('loc.subtitle')}
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-start">
          {/* Brazzaville */}
          <div className="bg-white p-8 md:p-12 rounded-3xl shadow-xl border border-bel-dark/5">
            <h2 className="font-serif text-2xl sm:text-3xl font-bold mb-6 sm:mb-8">{t('loc.brazza_title')}</h2>

            <div className="space-y-8">
              <div className="flex items-start">
                <div className="w-12 h-12 bg-bel-gray rounded-full flex items-center justify-center mr-6 flex-shrink-0 text-bel-accent">
                  <MapPin size={24} />
                </div>
                <div>
                  <h3 className="font-medium text-lg mb-2">{t('app.city')}</h3>
                  <p className="text-bel-dark/70 leading-relaxed">
                    {t('loc.brazza_address')}
                  </p>
                </div>
              </div>

              <div className="flex items-start">
                <div className="w-12 h-12 bg-bel-gray rounded-full flex items-center justify-center mr-6 flex-shrink-0 text-bel-accent">
                  <Clock size={24} />
                </div>
                <div>
                  <h3 className="font-medium text-lg mb-2">{t('loc.hours')}</h3>
                  <ul className="text-bel-dark/70 space-y-2">
                    <li className="flex justify-between w-48"><span>{t('loc.mon_sat')}</span><span>09:00 - 18:00</span></li>
                    <li className="flex justify-between w-48 text-bel-accent font-medium"><span>{t('loc.sun')}</span><span>{t('loc.closed')}</span></li>
                  </ul>
                </div>
              </div>

              <div className="flex items-start">
                <div className="w-12 h-12 bg-bel-gray rounded-full flex items-center justify-center mr-6 flex-shrink-0 text-bel-accent">
                  <WhatsAppIcon size={24} />
                </div>
                <div>
                  <h3 className="font-medium text-lg mb-2">Contact</h3>
                  <p className="text-bel-dark/70 mb-1">+242 04 474 4456</p>
                  <p className="text-bel-dark/70">mailbusinessagencylearn@gmail.com</p>
                </div>
              </div>
            </div>
          </div>

          {/* Pointe-Noire */}
          <div className="bg-white p-8 md:p-12 rounded-3xl shadow-xl border border-bel-dark/5">
            <h2 className="font-serif text-2xl sm:text-3xl font-bold mb-6 sm:mb-8">{t('loc.pn_title')}</h2>

            <div className="space-y-8">
              <div className="flex items-start">
                <div className="w-12 h-12 bg-bel-gray rounded-full flex items-center justify-center mr-6 flex-shrink-0 text-bel-accent">
                  <MapPin size={24} />
                </div>
                <div>
                  <h3 className="font-medium text-lg mb-2">{t('app.city')}</h3>
                  <p className="text-bel-dark/70 leading-relaxed">
                    {t('loc.pn_address')}
                  </p>
                </div>
              </div>

              <div className="flex items-start">
                <div className="w-12 h-12 bg-bel-gray rounded-full flex items-center justify-center mr-6 flex-shrink-0 text-bel-accent">
                  <Clock size={24} />
                </div>
                <div>
                  <h3 className="font-medium text-lg mb-2">{t('loc.hours')}</h3>
                  <ul className="text-bel-dark/70 space-y-2">
                    <li className="flex justify-between w-48"><span>{t('loc.mon_sat')}</span><span>09:00 - 18:00</span></li>
                    <li className="flex justify-between w-48 text-bel-accent font-medium"><span>{t('loc.sun')}</span><span>{t('loc.closed')}</span></li>
                  </ul>
                </div>
              </div>

              <div className="flex items-start">
                <div className="w-12 h-12 bg-bel-gray rounded-full flex items-center justify-center mr-6 flex-shrink-0 text-bel-accent">
                  <WhatsAppIcon size={24} />
                </div>
                <div>
                  <h3 className="font-medium text-lg mb-2">Contact</h3>
                  <p className="text-bel-dark/70 mb-1">+242 04 474 4456</p>
                  <p className="text-bel-dark/70">mailbusinessagencylearn@gmail.com</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
