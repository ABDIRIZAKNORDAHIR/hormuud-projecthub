import { motion } from 'motion/react';
import { Link } from 'react-router';
import { ChevronRight } from 'lucide-react';

interface QuickActionTileProps {
  to: string;
  title: string;
  description: string;
  icon: React.ComponentType<{ size?: number; className?: string }>;
  gradient: string;
  accent: string;
  index?: number;
}

export function QuickActionTile({
  to, title, description, icon: Icon, gradient, accent, index = 0,
}: QuickActionTileProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.06 }}
    >
      <Link
        to={to}
        className="group relative block rounded-2xl overflow-hidden border border-gray-100 shadow-sm hover:shadow-xl transition-shadow duration-300"
      >
        <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300" style={{ background: gradient }} />
        <div className="relative p-5 bg-white group-hover:bg-white/95 transition-colors">
          <div
            className="w-12 h-12 rounded-xl flex items-center justify-center mb-3 shadow-sm group-hover:scale-110 transition-transform duration-300"
            style={{ background: gradient }}
          >
            <Icon size={22} className="text-white" />
          </div>
          <h3 className="font-bold text-gray-900 group-hover:text-gray-900">{title}</h3>
          <p className="text-sm text-gray-500 mt-1 leading-relaxed">{description}</p>
          <div className="mt-4 flex items-center gap-1 text-xs font-bold opacity-0 group-hover:opacity-100 transition-opacity" style={{ color: accent }}>
            Open <ChevronRight size={14} />
          </div>
        </div>
      </Link>
    </motion.div>
  );
}
