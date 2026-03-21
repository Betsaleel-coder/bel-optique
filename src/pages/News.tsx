import { motion } from 'framer-motion';
import { Play, Image as ImageIcon, Calendar } from 'lucide-react';
import { useLanguage } from '../contexts/LanguageContext';

const posters = [
    {
        title: 'Collection Été 2026',
        image: 'https://images.unsplash.com/photo-1572635196237-14b3f281503f?q=80&w=800&auto=format&fit=crop',
        date: 'Mars 2026'
    },
    {
        title: 'Expertise Art Lens',
        image: 'https://images.unsplash.com/photo-1509100104038-d39bb911403c?q=80&w=800&auto=format&fit=crop',
        date: 'Février 2026'
    }
];

const videos = [
    {
        title: 'Spot Publicitaire - Brazzaville 2025',
        thumbnail: 'https://images.unsplash.com/photo-1493863641943-9b68992a8d07?q=80&w=800&auto=format&fit=crop',
        duration: '0:30'
    },
    {
        title: 'Behind the Scenes - Bel\'Optique',
        thumbnail: 'https://images.unsplash.com/photo-1542596768-5d1d21f1cf98?q=80&w=800&auto=format&fit=crop',
        duration: '1:15'
    }
];

export default function News() {
    const { t } = useLanguage();

    return (
        <div className="bg-bel-light min-h-screen pt-32 pb-24">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="mb-16">
                    <h1 className="font-serif text-4xl md:text-6xl font-bold text-bel-dark mb-4">
                        {t('news.title')}
                    </h1>
                    <p className="text-bel-dark/60 max-w-2xl text-lg">
                        Plongez dans l'univers de Bel'Optique à travers nos dernières campagnes et vidéos.
                    </p>
                </div>

                {/* Posters Section */}
                <section className="mb-24">
                    <div className="flex items-center gap-3 mb-8">
                        <ImageIcon className="text-bel-accent" size={24} />
                        <h2 className="font-serif text-2xl md:text-3xl font-bold">{t('news.posters')}</h2>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
                        {posters.map((poster, index) => (
                            <motion.div
                                key={index}
                                initial={{ opacity: 0, scale: 0.95 }}
                                whileInView={{ opacity: 1, scale: 1 }}
                                viewport={{ once: true }}
                                className="group relative rounded-3xl overflow-hidden shadow-xl"
                            >
                                <img src={poster.image} alt={poster.title} className="w-full aspect-[3/4] object-cover transition-transform duration-700 group-hover:scale-105" />
                                <div className="absolute inset-0 bg-gradient-to-t from-bel-dark/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex flex-col justify-end p-8">
                                    <h3 className="text-white font-serif text-2xl mb-2">{poster.title}</h3>
                                    <div className="flex items-center text-white/70 text-sm">
                                        <Calendar size={14} className="mr-2" />
                                        {poster.date}
                                    </div>
                                </div>
                            </motion.div>
                        ))}
                    </div>
                </section>

                {/* Videos Section */}
                <section>
                    <div className="flex items-center gap-3 mb-8">
                        <Play className="text-bel-accent" size={24} />
                        <h2 className="font-serif text-2xl md:text-3xl font-bold">{t('news.videos')}</h2>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                        {videos.map((video, index) => (
                            <motion.div
                                key={index}
                                initial={{ opacity: 0, y: 20 }}
                                whileInView={{ opacity: 1, y: 0 }}
                                viewport={{ once: true }}
                                className="group cursor-pointer"
                            >
                                <div className="relative aspect-video rounded-3xl overflow-hidden mb-4">
                                    <img src={video.thumbnail} alt={video.title} className="w-full h-full object-cover" />
                                    <div className="absolute inset-0 bg-bel-dark/20 group-hover:bg-bel-dark/40 transition-colors flex items-center justify-center">
                                        <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center shadow-2xl transform group-hover:scale-110 transition-transform">
                                            <Play className="text-bel-dark ml-1" fill="currentColor" size={28} />
                                        </div>
                                    </div>
                                    <div className="absolute bottom-4 right-4 bg-bel-dark/60 backdrop-blur-md text-white text-[10px] font-bold px-2 py-1 rounded">
                                        {video.duration}
                                    </div>
                                </div>
                                <h3 className="font-serif text-xl font-medium text-bel-dark group-hover:text-bel-accent transition-colors">
                                    {video.title}
                                </h3>
                            </motion.div>
                        ))}
                    </div>
                </section>
            </div>
        </div>
    );
}
