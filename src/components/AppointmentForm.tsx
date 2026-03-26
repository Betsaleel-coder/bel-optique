import React, { useState } from 'react';
import { Calendar as CalendarIcon, Clock, User, Phone, Mail, FileText, CheckCircle2, Globe, MapPin } from 'lucide-react';
import { motion } from 'framer-motion';
import { supabase } from '../lib/supabase';
import { useLanguage } from '../contexts/LanguageContext';

export default function AppointmentForm() {
  const { t } = useLanguage();
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    date: '',
    time: '',
    service: '',
    name: '',
    phone: '',
    email: '',
    notes: '',
    country: 'République du Congo',
    city: '',
  });

  const handleNext = () => setStep(step + 1);
  const handlePrev = () => setStep(step - 1);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const { error: insertError } = await supabase
        .from('appointments')
        .insert([
          {
            service: formData.service,
            date: formData.date,
            time: formData.time,
            name: formData.name,
            phone: formData.phone,
            email: formData.email,
            notes: formData.notes,
            country: formData.country,
            city: formData.city,
          }
        ]);

      if (insertError) throw insertError;

      setStep(3);
    } catch (err: any) {
      console.error('Error saving appointment:', err);
      setError(err.message || 'Une erreur est survenue lors de la réservation.');
    } finally {
      setLoading(false);
    }
  };

  const services = [
    t('svc.style'),
    t('svc.repair'),
    t('svc.lens'),
  ];

  const timeSlots = [
    '09:00', '10:00', '11:00', '14:00', '15:00', '16:00', '17:00'
  ];

  return (
    <div className="bg-white rounded-3xl shadow-xl border border-bel-dark/5 overflow-hidden max-w-4xl mx-auto">
      <div className="flex flex-col md:flex-row">
        {/* Sidebar */}
        <div className="bg-bel-dark text-bel-light p-8 md:w-1/3 flex flex-col justify-between">
          <div>
            <h3 className="font-serif text-2xl sm:text-3xl font-bold mb-4 sm:mb-6">{t('nav.appointment')}</h3>
            <p className="text-bel-light/70 mb-12">
              {t('app.desc')}
            </p>

            <div className="space-y-6">
              <div className="flex items-center">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold mr-4 ${step >= 1 ? 'bg-bel-accent text-bel-dark' : 'bg-bel-light/20 text-bel-light/50'}`}>1</div>
                <span className={step >= 1 ? 'text-white font-medium' : 'text-bel-light/50'}>{t('app.step1')}</span>
              </div>
              <div className="flex items-center">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold mr-4 ${step >= 2 ? 'bg-bel-accent text-bel-dark' : 'bg-bel-light/20 text-bel-light/50'}`}>2</div>
                <span className={step >= 2 ? 'text-white font-medium' : 'text-bel-light/50'}>{t('app.step2')}</span>
              </div>
              <div className="flex items-center">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold mr-4 ${step >= 3 ? 'bg-bel-accent text-bel-dark' : 'bg-bel-light/20 text-bel-light/50'}`}>3</div>
                <span className={step >= 3 ? 'text-white font-medium' : 'text-bel-light/50'}>{t('app.step3')}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Form Area */}
        <div className="p-8 md:p-12 md:w-2/3">
          {step === 1 && (
            <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
              <h4 className="font-serif text-2xl font-medium mb-8">{t('app.choose_service')}</h4>

              <div className="space-y-4 mb-8">
                {services.map((service) => (
                  <label key={service} className="flex items-center p-4 border rounded-xl cursor-pointer hover:border-bel-accent transition-colors">
                    <input
                      type="radio"
                      name="service"
                      value={service}
                      checked={formData.service === service}
                      onChange={(e) => setFormData({ ...formData, service: e.target.value })}
                      className="w-5 h-5 text-bel-accent focus:ring-bel-accent border-gray-300"
                    />
                    <span className="ml-4 font-medium text-bel-dark">{service}</span>
                  </label>
                ))}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                <div>
                  <label className="block text-sm font-medium text-bel-dark/70 mb-2">{t('app.desired_date')}</label>
                  <div className="relative">
                    <CalendarIcon className="absolute left-4 top-1/2 transform -translate-y-1/2 text-bel-dark/40" size={20} />
                    <input
                      type="date"
                      value={formData.date}
                      onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                      className="w-full pl-12 pr-4 py-3 border border-bel-dark/20 rounded-xl focus:ring-2 focus:ring-bel-accent focus:border-transparent outline-none transition-all"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-bel-dark/70 mb-2">{t('app.time')}</label>
                  <div className="relative">
                    <Clock className="absolute left-4 top-1/2 transform -translate-y-1/2 text-bel-dark/40" size={20} />
                    <select
                      value={formData.time}
                      onChange={(e) => setFormData({ ...formData, time: e.target.value })}
                      className="w-full pl-12 pr-4 py-3 border border-bel-dark/20 rounded-xl focus:ring-2 focus:ring-bel-accent focus:border-transparent outline-none transition-all appearance-none bg-white"
                    >
                      <option value="">{t('app.select')}</option>
                      {timeSlots.map((time) => (
                        <option key={time} value={time}>{time}</option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>

              <button
                onClick={handleNext}
                disabled={!formData.service || !formData.date || !formData.time}
                className="w-full bg-bel-dark text-white py-4 rounded-xl font-medium hover:bg-bel-accent hover:text-bel-dark transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {t('app.continue')}
              </button>
            </motion.div>
          )}

          {step === 2 && (
            <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
              <h4 className="font-serif text-2xl font-medium mb-8">{t('app.your_info')}</h4>

              <form onSubmit={handleSubmit} className="space-y-6">
                <div>
                  <label className="block text-sm font-medium text-bel-dark/70 mb-2">{t('app.full_name')}</label>
                  <div className="relative">
                    <User className="absolute left-4 top-1/2 transform -translate-y-1/2 text-bel-dark/40" size={20} />
                    <input
                      type="text"
                      required
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      className="w-full pl-12 pr-4 py-3 border border-bel-dark/20 rounded-xl focus:ring-2 focus:ring-bel-accent focus:border-transparent outline-none transition-all"
                      placeholder="Jean Dupont"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-bel-dark/70 mb-2">{t('app.phone')}</label>
                    <div className="relative">
                      <Phone className="absolute left-4 top-1/2 transform -translate-y-1/2 text-bel-dark/40" size={20} />
                      <input
                        type="tel"
                        required
                        value={formData.phone}
                        onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                        className="w-full pl-12 pr-4 py-3 border border-bel-dark/20 rounded-xl focus:ring-2 focus:ring-bel-accent focus:border-transparent outline-none transition-all"
                        placeholder="+243 81 234 5678"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-bel-dark/70 mb-2">{t('app.email')}</label>
                    <div className="relative">
                      <Mail className="absolute left-4 top-1/2 transform -translate-y-1/2 text-bel-dark/40" size={20} />
                      <input
                        type="email"
                        required
                        value={formData.email}
                        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                        className="w-full pl-12 pr-4 py-3 border border-bel-dark/20 rounded-xl focus:ring-2 focus:ring-bel-accent focus:border-transparent outline-none transition-all"
                        placeholder="jean@exemple.com"
                      />
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-bel-dark/70 mb-2">{t('app.country')}</label>
                    <div className="relative">
                      <Globe className="absolute left-4 top-1/2 transform -translate-y-1/2 text-bel-dark/40" size={20} />
                      <select
                        required
                        value={formData.country}
                        onChange={(e) => setFormData({ ...formData, country: e.target.value })}
                        className="w-full pl-12 pr-4 py-3 border border-bel-dark/20 rounded-xl focus:ring-2 focus:ring-bel-accent focus:border-transparent outline-none transition-all appearance-none bg-white font-medium"
                      >
                        <option value="République du Congo">République du Congo</option>
                        <option value="République Démocratique du Congo">RDC</option>
                        <option value="Gabon">Gabon</option>
                        <option value="Cameroun">Cameroun</option>
                        <option value="Autre">Autre (Préciser en notes)</option>
                      </select>
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-bel-dark/70 mb-2">{t('app.city')}</label>
                    <div className="relative">
                      <MapPin className="absolute left-4 top-1/2 transform -translate-y-1/2 text-bel-dark/40" size={20} />
                      <select
                        required
                        value={formData.city}
                        onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                        className="w-full pl-12 pr-4 py-3 border border-bel-dark/20 rounded-xl focus:ring-2 focus:ring-bel-accent focus:border-transparent outline-none transition-all appearance-none bg-white font-medium"
                      >
                        <option value="">{t('app.select_city')}</option>
                        {formData.country === 'République du Congo' ? (
                          <>
                            <option value="Brazzaville">Brazzaville</option>
                            <option value="Pointe-Noire">Pointe-Noire</option>
                            <option value="Dolisie">Dolisie</option>
                            <option value="Nkayi">Nkayi</option>
                            <option value="Oyo">Oyo</option>
                          </>
                        ) : (
                          <option value="Autre">Autre (Préciser en notes)</option>
                        )}
                      </select>
                    </div>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-bel-dark/70 mb-2">{t('app.notes')}</label>
                  <div className="relative">
                    <FileText className="absolute left-4 top-4 text-bel-dark/40" size={20} />
                    <textarea
                      rows={3}
                      value={formData.notes}
                      onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                      className="w-full pl-12 pr-4 py-3 border border-bel-dark/20 rounded-xl focus:ring-2 focus:ring-bel-accent focus:border-transparent outline-none transition-all resize-none"
                      placeholder={t('app.notes_placeholder')}
                    ></textarea>
                  </div>
                </div>

                {error && (
                  <div className="bg-red-50 text-red-500 p-4 rounded-xl text-sm mb-4">
                    {error}
                  </div>
                )}

                <div className="flex space-x-4 pt-4">
                  <button
                    type="button"
                    onClick={handlePrev}
                    disabled={loading}
                    className="w-1/3 py-4 border border-bel-dark/20 rounded-xl font-medium text-bel-dark hover:bg-bel-gray transition-colors disabled:opacity-50"
                  >
                    {t('app.back')}
                  </button>
                  <button
                    type="submit"
                    disabled={loading}
                    className="w-2/3 bg-bel-dark text-white py-4 rounded-xl font-medium hover:bg-bel-accent hover:text-bel-dark transition-colors disabled:opacity-50 flex items-center justify-center"
                  >
                    {loading ? (
                      <span className="w-6 h-6 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
                    ) : (
                      t('app.confirm')
                    )}
                  </button>
                </div>
              </form>
            </motion.div>
          )}

          {step === 3 && (
            <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="text-center py-12">
              <div className="w-24 h-24 bg-green-100 text-green-500 rounded-full flex items-center justify-center mx-auto mb-6">
                <CheckCircle2 size={48} />
              </div>
              <h4 className="font-serif text-3xl font-bold mb-4">{t('app.success_title')}</h4>
              <p className="text-bel-dark/70 text-lg mb-8 max-w-md mx-auto">
                {t('app.success_desc')
                  .replace('{name}', formData.name)
                  .replace('{service}', formData.service)
                  .replace('{date}', formData.date)
                  .replace('{time}', formData.time)}
              </p>
              <p className="text-sm text-bel-dark/50 mb-8">
                {t('app.email_info').replace('{email}', formData.email)}
              </p>
              <button
                onClick={() => window.location.href = '/'}
                className="bg-bel-dark text-white px-8 py-4 rounded-full font-medium hover:bg-bel-accent hover:text-bel-dark transition-colors"
              >
                {t('app.back_home')}
              </button>
            </motion.div>
          )}
        </div>
      </div>
    </div>
  );
}
