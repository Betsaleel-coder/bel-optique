import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Star, Quote } from 'lucide-react';
import { useLanguage } from '../contexts/LanguageContext';
import { supabase } from '../lib/supabase';

const testimonials = [
    {
        name: 'Marie L.',
        text: 'Une équipe formidable ! J\'ai pu essayer mes lunettes en ligne et le résultat dans Nos Officines est impeccable.',
        rating: 5,
        city: 'Brazzaville'
    },
    {
        name: 'Jean-Paul M.',
        text: 'Le service client est exceptionnel. On sent l\'expérience des opticiens dès le premier échange.',
        rating: 5,
        city: 'Pointe-Noire'
    },
    {
        name: 'Sarah K.',
        text: 'Large choix de montures de marques. Je recommande vivement pour le professionnalisme.',
        rating: 4,
        city: 'Brazzaville'
    }
];

export default function Testimonials() {
    const { t } = useLanguage();
    const [dynamicTestimonials, setDynamicTestimonials] = useState<any[]>([]);

    useEffect(() => {
        fetchApprovedReviews();
    }, []);

    async function fetchApprovedReviews() {
        const { data, error } = await supabase
            .from('reviews')
            .select('*')
            .eq('status', 'approved')
            .order('created_at', { ascending: false });
        
        if (data && data.length > 0) {
            setDynamicTestimonials(data);
        } else {
            setDynamicTestimonials(testimonials.map(t => ({
                name: t.name,
                comment: t.text,
                rating: t.rating,
                created_at: new Date().toISOString()
            })));
        }
    }

    return (
        <section className="py-24 bg-bel-gray/30">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="text-center mb-16">
                    <h2 className="font-serif text-3xl md:text-5xl font-bold text-bel-dark mb-4">
                        {t('home.testimonials_title')}
                    </h2>
                    <div className="w-24 h-1 bg-bel-accent mx-auto"></div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                    {dynamicTestimonials.map((testimonial, index) => (
                        <motion.div
                            key={index}
                            initial={{ opacity: 0, y: 20 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            transition={{ delay: index * 0.1 }}
                            viewport={{ once: true }}
                            className="bg-white p-8 rounded-3xl shadow-sm border border-bel-dark/5 relative"
                        >
                            <Quote className="text-bel-accent/20 absolute top-6 right-8" size={48} />

                            <div className="flex gap-1 mb-4">
                                {[...Array(5)].map((_, i) => (
                                    <Star
                                        key={i}
                                        size={16}
                                        className={i < testimonial.rating ? 'fill-bel-accent text-bel-accent' : 'text-bel-dark/10'}
                                    />
                                ))}
                            </div>

                            <p className="text-bel-dark/80 italic mb-6 leading-relaxed">
                                "{testimonial.comment || testimonial.text}"
                            </p>

                            <div>
                                <h4 className="font-bold text-bel-dark">{testimonial.name}</h4>
                                <p className="text-xs text-bel-accent font-medium uppercase tracking-wider">
                                    {testimonial.city || t('testimonial.client')}
                                </p>
                            </div>
                        </motion.div>
                    ))}
                </div>
            </div>
        </section>
    );
}
