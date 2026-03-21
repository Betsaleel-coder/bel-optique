import AppointmentForm from '../components/AppointmentForm';
import { useLanguage } from '../contexts/LanguageContext';

export default function Appointment() {
  const { t } = useLanguage();
  return (
    <div className="bg-bel-light min-h-screen py-12 md:py-24">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <h1 className="font-serif text-3xl sm:text-4xl md:text-5xl font-bold mb-4 sm:mb-6">{t('app.page_title')}</h1>
          <p className="text-lg sm:text-xl text-bel-dark/70 font-light max-w-2xl mx-auto">
            {t('app.page_desc')}
          </p>
        </div>

        <AppointmentForm />
      </div>
    </div>
  );
}
