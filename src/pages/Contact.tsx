import React, { useState } from 'react';
import { Send, Mail, MapPin } from 'lucide-react';
import WhatsAppIcon from '../components/WhatsAppIcon';
import { motion } from 'framer-motion';
import { useLanguage } from '../contexts/LanguageContext';

export default function Contact() {
  const { t } = useLanguage();
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    subject: '',
    message: '',
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    alert(t('contact.success_alert'));
    setFormData({ name: '', email: '', subject: '', message: '' });
  };

  return (
    <div className="bg-bel-light min-h-screen py-12 md:py-24">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <h1 className="font-serif text-3xl sm:text-4xl md:text-6xl font-bold mb-4 sm:mb-6">{t('contact.title')}</h1>
          <p className="text-lg sm:text-xl text-bel-dark/70 font-light max-w-2xl mx-auto">
            {t('contact.subtitle')}
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-start">
          {/* Contact Info */}
          <div className="space-y-12">
            <div className="bg-white p-8 md:p-12 rounded-3xl shadow-xl border border-bel-dark/5">
              <h2 className="font-serif text-2xl sm:text-3xl font-bold mb-6 sm:mb-8">{t('contact.info')}</h2>

              <div className="space-y-8">
                <div className="flex items-start">
                  <div className="w-12 h-12 bg-bel-gray rounded-full flex items-center justify-center mr-6 flex-shrink-0 text-bel-accent">
                    <WhatsAppIcon size={24} />
                  </div>
                  <div>
                    <h3 className="font-medium text-lg mb-2">WhatsApp</h3>
                    <p className="text-bel-dark/70 mb-4">
                      {t('contact.whatsapp_desc')}
                    </p>
                    <a
                      href="https://wa.me/242044744456"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center text-bel-accent font-medium hover:text-bel-dark transition-colors"
                    >
                      +242 04 474 4456 <WhatsAppIcon size={18} className="ml-2" />
                    </a>
                  </div>
                </div>

                <div className="flex items-start">
                  <div className="w-12 h-12 bg-bel-gray rounded-full flex items-center justify-center mr-6 flex-shrink-0 text-bel-accent">
                    <Mail size={24} />
                  </div>
                  <div>
                    <h3 className="font-medium text-lg mb-2">Email</h3>
                    <p className="text-bel-dark/70 mb-4">
                      {t('contact.email_desc')}
                    </p>
                    <a href="mailto:mailbusinessagencylearn@gmail.com" className="inline-flex items-center text-bel-accent font-medium hover:text-bel-dark transition-colors">
                      mailbusinessagencylearn@gmail.com
                    </a>
                  </div>
                </div>

                <div className="flex items-start">
                  <div className="w-12 h-12 bg-bel-gray rounded-full flex items-center justify-center mr-6 flex-shrink-0 text-bel-accent">
                    <MapPin size={24} />
                  </div>
                  <div>
                    <h3 className="font-medium text-lg mb-2">{t('nav.location')}</h3>
                    <p className="text-bel-dark/70 mb-4">
                      {t('contact.store_desc')}
                    </p>
                    <a href="/location" className="inline-flex items-center text-bel-accent font-medium hover:text-bel-dark transition-colors">
                      {t('contact.view_map')}
                    </a>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Contact Form */}
          <div className="bg-white p-8 md:p-12 rounded-3xl shadow-xl border border-bel-dark/5">
            <h2 className="font-serif text-3xl font-bold mb-8">{t('contact.send_message')}</h2>

            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-bel-dark/70 mb-2">{t('app.full_name')}</label>
                  <input
                    type="text"
                    required
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full px-4 py-3 border border-bel-dark/20 rounded-xl focus:ring-2 focus:ring-bel-accent focus:border-transparent outline-none transition-all"
                    placeholder="Jean Dupont"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-bel-dark/70 mb-2">{t('app.email')}</label>
                  <input
                    type="email"
                    required
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    className="w-full px-4 py-3 border border-bel-dark/20 rounded-xl focus:ring-2 focus:ring-bel-accent focus:border-transparent outline-none transition-all"
                    placeholder="jean@exemple.com"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-bel-dark/70 mb-2">{t('contact.subject')}</label>
                <input
                  type="text"
                  required
                  value={formData.subject}
                  onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                  className="w-full px-4 py-3 border border-bel-dark/20 rounded-xl focus:ring-2 focus:ring-bel-accent focus:border-transparent outline-none transition-all"
                  placeholder="Demande d'information"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-bel-dark/70 mb-2">{t('contact.message')}</label>
                <textarea
                  required
                  rows={6}
                  value={formData.message}
                  onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                  className="w-full px-4 py-3 border border-bel-dark/20 rounded-xl focus:ring-2 focus:ring-bel-accent focus:border-transparent outline-none transition-all resize-none"
                  placeholder="Comment pouvons-nous vous aider ?"
                ></textarea>
              </div>

              <button
                type="submit"
                className="w-full bg-bel-dark text-white py-3 sm:py-4 rounded-xl font-medium hover:bg-bel-accent hover:text-bel-dark transition-colors flex items-center justify-center"
              >
                {t('contact.send_btn')} <Send size={20} className="ml-2" />
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
