import { motion } from 'framer-motion';
import { useLanguage } from '../contexts/LanguageContext';

import raybanLogo from '../assets/ray ban.png';
import bossLogo from '../assets/Hugo-Boss-Logo.png';
import versaceLogo from '../assets/Versace.png';
import gucciLogo from '../assets/Gucci-Logo.wine.png';
import oakleyLogo from '../assets/Oakley.jpg';

const brands = [
    { name: 'Ray-Ban', logo: raybanLogo },
    { name: 'Boss', logo: bossLogo },
    { name: 'Versace', logo: versaceLogo },
    { name: 'Gucci', logo: gucciLogo },
    { name: 'Oakley', logo: oakleyLogo },
];

export default function BrandShowcase() {
    const { t } = useLanguage();

    return (
        <section className="py-20 bg-white overflow-hidden">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <h2 className="text-center font-serif text-3xl md:text-4xl font-bold mb-12 text-bel-dark">
                    {t('home.brands_title')}
                </h2>

                <div className="flex flex-wrap justify-center items-center gap-12 md:gap-20 opacity-60">
                    {brands.map((brand) => (
                        <motion.div
                            key={brand.name}
                            whileHover={{ opacity: 1, scale: 1.1 }}
                            className="w-24 md:w-32 h-12 flex items-center justify-center grayscale hover:grayscale-0 transition-all duration-300"
                        >
                            <img
                                src={brand.logo}
                                alt={brand.name}
                                className="max-w-full max-h-full object-contain"
                            />
                        </motion.div>
                    ))}
                </div>
            </div>
        </section>
    );
}
