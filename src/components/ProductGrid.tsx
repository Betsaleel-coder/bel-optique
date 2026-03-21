import { motion } from 'framer-motion';
import ProductCard from './ProductCard';

interface Product {
  id: string;
  name: string;
  brand?: string;
  image: string;
  category: string;
  isNew?: boolean;
}

interface ProductGridProps {
  products: Product[];
}

export default function ProductGrid({ products }: ProductGridProps) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
      {products.map((product, index) => (
        <motion.div
          key={product.id}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: index * 0.1 }}
        >
          <ProductCard {...product} />
        </motion.div>
      ))}
    </div>
  );
}
