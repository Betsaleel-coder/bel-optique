import React, { useState } from 'react';
import { Send, Mail, MapPin, Star } from 'lucide-react';
import WhatsAppIcon from '../components/WhatsAppIcon';
import { motion } from 'framer-motion';
import { useLanguage } from '../contexts/LanguageContext';
import { supabase } from '../lib/supabase';
import clsx from 'clsx';

export default function Contact() {
  const { t } = useLanguage();
  const [activeTab, setActiveTab] = useState<'message' | 'review'>('message');
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    subject: '',
    message: '',
  });

  const [reviewData, setReviewData] = useState({
    name: '',
    email: '',
    comment: '',
    rating: 5,
  });

  const [submittingReview, setSubmittingReview] = useState(false);
  const [submittingContact, setSubmittingContact] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmittingContact(true);

    try {
      const { error } = await supabase.from('contacts').insert([
        {
          name: formData.name,
          email: formData.email,
          phone: formData.phone,
          subject: formData.subject,
          message: formData.message,
          status: 'unread'
        }
      ]);

      if (error) throw error;

      alert(t('contact.success_alert'));
      setFormData({ name: '', email: '', phone: '', subject: '', message: '' });
    } catch (error: any) {
      console.error('Error submitting contact:', error);
      alert(`Erreur: ${error.message || 'Erreur lors de l\'envoi du message'}`);
    } finally {
      setSubmittingContact(false);
    }
  };

  const handleReviewSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmittingReview(true);
    
    try {
      const { error } = await supabase.from('reviews').insert([
        { 
          name: reviewData.name, 
          email: reviewData.email, 
          comment: reviewData.comment, 
          rating: reviewData.rating,
          status: 'pending'
        }
      ]);

      if (error) throw error;

      alert(t('contact.review_success'));
      setReviewData({ name: '', email: '', comment: '', rating: 5 });
    } catch (error) {
      console.error('Error submitting review:', error);
      alert('Erreur lors de l\'envoi de l\'avis.');
    } finally {
      setSubmittingReview(false);
    }
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

        <div className="flex justify-center mb-12">
          <div className="bg-white p-1.5 rounded-2xl shadow-sm border border-bel-dark/5 flex">
            <button
              onClick={() => setActiveTab('message')}
              className={clsx(
                "px-8 py-3 rounded-xl text-sm font-bold transition-all uppercase tracking-widest",
                activeTab === 'message' ? "bg-bel-dark text-white shadow-lg" : "text-bel-dark/40 hover:text-bel-dark"
              )}
            >
              {t('contact.send_message')}
            </button>
            <button
              onClick={() => setActiveTab('review')}
              className={clsx(
                "px-8 py-3 rounded-xl text-sm font-bold transition-all uppercase tracking-widest",
                activeTab === 'review' ? "bg-bel-dark text-white shadow-lg" : "text-bel-dark/40 hover:text-bel-dark"
              )}
            >
              {t('contact.reviews_title')}
            </button>
          </div>
        </div>

        <div className="max-w-4xl mx-auto">
          {activeTab === 'message' ? (
            <div className="grid grid-cols-1 lg:grid-cols-5 gap-12 items-start">
              {/* Contact Info */}
              <div className="lg:col-span-2 space-y-6">
                <div className="bg-white p-8 rounded-[2rem] shadow-xl border border-bel-dark/5">
                  <h2 className="font-serif text-2xl font-bold mb-8">{t('contact.info')}</h2>

                  <div className="space-y-6">
                    <div className="flex items-start">
                      <div className="w-10 h-10 bg-bel-gray rounded-full flex items-center justify-center mr-4 flex-shrink-0 text-bel-accent">
                        <WhatsAppIcon size={20} />
                      </div>
                      <div>
                        <h3 className="font-bold text-sm mb-1 uppercase tracking-wider">WhatsApp</h3>
                        <a href="https://wa.me/242044744456" className="text-bel-dark/70 hover:text-bel-accent transition-colors text-sm">+242 04 474 4456</a>
                      </div>
                    </div>

                    <div className="flex items-start">
                      <div className="w-10 h-10 bg-bel-gray rounded-full flex items-center justify-center mr-4 flex-shrink-0 text-bel-accent">
                        <Mail size={20} />
                      </div>
                      <div>
                        <h3 className="font-bold text-sm mb-1 uppercase tracking-wider">Email</h3>
                        <a href="mailto:mailbusinessagencylearn@gmail.com" className="text-bel-dark/70 hover:text-bel-accent transition-colors text-sm break-all">mailbusinessagencylearn@gmail.com</a>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Contact Form */}
              <div className="lg:col-span-3 bg-white p-8 md:p-12 rounded-[2rem] shadow-xl border border-bel-dark/5">
                <form onSubmit={handleSubmit} className="space-y-6">
                  <div className="space-y-4">
                    <input
                      type="text"
                      required
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      className="w-full px-5 py-4 bg-bel-gray/50 border border-transparent rounded-2xl focus:bg-white focus:border-bel-accent focus:ring-4 focus:ring-bel-accent/10 outline-none transition-all placeholder-bel-dark/30"
                      placeholder={t('app.full_name')}
                    />
                    <input
                      type="email"
                      required
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      className="w-full px-5 py-4 bg-bel-gray/50 border border-transparent rounded-2xl focus:bg-white focus:border-bel-accent focus:ring-4 focus:ring-bel-accent/10 outline-none transition-all placeholder-bel-dark/30"
                      placeholder={t('app.email')}
                    />
                    <div className="relative group">
                      <div className="absolute left-5 top-1/2 -translate-y-1/2 text-green-500">
                        <WhatsAppIcon size={20} />
                      </div>
                      <input
                        type="tel"
                        value={formData.phone}
                        onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                        className="w-full pl-12 pr-5 py-4 bg-bel-gray/50 border border-transparent rounded-2xl focus:bg-white focus:border-bel-accent focus:ring-4 focus:ring-bel-accent/10 outline-none transition-all placeholder-bel-dark/30"
                        placeholder={`${t('app.phone')} (WhatsApp)`}
                      />
                    </div>
                    <input
                      type="text"
                      required
                      value={formData.subject}
                      onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                      className="w-full px-5 py-4 bg-bel-gray/50 border border-transparent rounded-2xl focus:bg-white focus:border-bel-accent focus:ring-4 focus:ring-bel-accent/10 outline-none transition-all placeholder-bel-dark/30"
                      placeholder={t('contact.subject')}
                    />
                    <textarea
                      required
                      rows={5}
                      value={formData.message}
                      onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                      className="w-full px-5 py-4 bg-bel-gray/50 border border-transparent rounded-2xl focus:bg-white focus:border-bel-accent focus:ring-4 focus:ring-bel-accent/10 outline-none transition-all resize-none placeholder-bel-dark/30"
                      placeholder={t('contact.message')}
                    ></textarea>
                  </div>

                  <button
                    type="submit"
                    disabled={submittingContact}
                    className="w-full bg-bel-dark text-white py-4 rounded-2xl font-bold hover:bg-bel-accent hover:text-bel-dark transition-all shadow-lg hover:shadow-bel-accent/20 flex items-center justify-center disabled:opacity-50"
                  >
                    {submittingContact ? '...' : t('contact.send_btn')} <Send size={20} className="ml-2" />
                  </button>
                </form>
              </div>
            </div>
          ) : (
            /* Reviews Section */
            <div className="bg-bel-dark text-white p-8 md:p-16 rounded-[3rem] shadow-2xl relative overflow-hidden">
              <div className="absolute top-0 right-0 w-64 h-64 bg-bel-accent/10 rounded-full blur-3xl -mr-32 -mt-32"></div>
              
              <div className="relative z-10 grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
                <div>
                  <h2 className="font-serif text-3xl sm:text-4xl font-bold mb-6">
                    {t('contact.reviews_title')}
                  </h2>
                  <p className="text-lg text-bel-light/70 font-light mb-8 max-w-sm">
                    {t('contact.reviews_subtitle')}
                  </p>
                  
                  <div className="flex items-center space-x-2 mb-8">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <button
                        key={star}
                        onClick={() => setReviewData({ ...reviewData, rating: star })}
                        className="focus:outline-none transition-transform hover:scale-110"
                      >
                        <Star
                          size={32}
                          className={star <= reviewData.rating ? "fill-bel-accent text-bel-accent" : "text-white/20"}
                        />
                      </button>
                    ))}
                  </div>
                </div>

                <form onSubmit={handleReviewSubmit} className="space-y-4">
                  <input
                    type="text"
                    required
                    value={reviewData.name}
                    onChange={(e) => setReviewData({ ...reviewData, name: e.target.value })}
                    className="w-full px-6 py-4 bg-white/10 border border-white/20 rounded-2xl focus:ring-2 focus:ring-bel-accent outline-none text-white placeholder-white/40 backdrop-blur-sm"
                    placeholder={t('contact.review_name')}
                  />
                  <input
                    type="email"
                    required
                    value={reviewData.email}
                    onChange={(e) => setReviewData({ ...reviewData, email: e.target.value })}
                    className="w-full px-6 py-4 bg-white/10 border border-white/20 rounded-2xl focus:ring-2 focus:ring-bel-accent outline-none text-white placeholder-white/40 backdrop-blur-sm"
                    placeholder={t('contact.review_email')}
                  />
                  <textarea
                    required
                    rows={4}
                    value={reviewData.comment}
                    onChange={(e) => setReviewData({ ...reviewData, comment: e.target.value })}
                    className="w-full px-6 py-4 bg-white/10 border border-white/20 rounded-2xl focus:ring-2 focus:ring-bel-accent outline-none text-white placeholder-white/40 backdrop-blur-sm resize-none"
                    placeholder={t('contact.review_comment')}
                  ></textarea>
                  <button
                    type="submit"
                    disabled={submittingReview}
                    className="w-full bg-bel-accent text-bel-dark py-4 rounded-2xl font-bold hover:bg-white transition-all transform hover:scale-[1.02] disabled:opacity-50"
                  >
                    {submittingReview ? '...' : t('contact.review_submit')}
                  </button>
                </form>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
