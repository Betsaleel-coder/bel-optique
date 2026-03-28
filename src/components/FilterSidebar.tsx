import { useState } from 'react';
import { ChevronDown, ChevronUp, Check } from 'lucide-react';
import clsx from 'clsx';
import { useLanguage } from '../contexts/LanguageContext';

interface FilterCategory {
  id: string;
  name: string;
  options: { id: string; label: string; count: number }[];
}

interface FilterSidebarProps {
  categories: FilterCategory[];
  selectedFilters: Record<string, string[]>;
  onFilterChange: (categoryId: string, optionId: string) => void;
}

export default function FilterSidebar({ categories, selectedFilters, onFilterChange }: FilterSidebarProps) {
  const { t } = useLanguage();
  const [openCategories, setOpenCategories] = useState<Record<string, boolean>>(
    categories.reduce((acc, cat) => ({ ...acc, [cat.id]: true }), {})
  );

  const toggleCategory = (id: string) => {
    setOpenCategories((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  return (
    <div className="w-full lg:w-64 flex-shrink-0 pr-8 border-r border-bel-dark/10">
      <div className="sticky top-28 space-y-8">
        <div>
          <h3 className="font-serif text-2xl font-medium mb-6">{t('filter.title')}</h3>
          <div className="h-px bg-bel-dark/10 w-full mb-6"></div>
        </div>

        {categories.map((category) => (
          <div key={category.id} className="border-b border-bel-dark/5 pb-6">
            <button
              onClick={() => toggleCategory(category.id)}
              className="flex w-full items-center justify-between text-left font-medium uppercase tracking-wider text-sm mb-4 hover:text-bel-accent transition-colors"
            >
              {category.name}
              {openCategories[category.id] ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
            </button>
            
            {openCategories[category.id] && (
              <div className="space-y-3 mt-4">
                {category.options.map((option) => {
                  const isSelected = selectedFilters[category.id]?.includes(option.id);
                  return (
                    <label
                      key={option.id}
                      className="flex items-center cursor-pointer group"
                      onClick={() => onFilterChange(category.id, option.id)}
                    >
                      <div
                        className={clsx(
                          'w-5 h-5 border rounded flex items-center justify-center mr-3 transition-colors',
                          isSelected
                            ? 'bg-bel-accent border-bel-accent text-bel-dark'
                            : 'border-bel-dark/20 group-hover:border-bel-accent'
                        )}
                      >
                        {isSelected && <Check size={14} strokeWidth={3} />}
                      </div>
                      <span className={clsx(
                        'text-sm transition-colors',
                        isSelected ? 'font-medium text-bel-dark' : 'text-bel-dark/70 group-hover:text-bel-dark'
                      )}>
                        {option.label}
                      </span>
                      <span className="ml-auto text-xs text-bel-dark/40 font-mono">
                        {option.count}
                      </span>
                    </label>
                  );
                })}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
