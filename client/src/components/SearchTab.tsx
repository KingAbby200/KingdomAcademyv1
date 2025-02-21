import { Search } from "lucide-react";
import { motion } from "framer-motion";
import { useLocation } from "wouter";

interface SearchTabProps {
  className?: string;
}

export function SearchTab({ className }: SearchTabProps) {
  const [, navigate] = useLocation();

  return (
    <div className={`${className || ''}`}>
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        className="relative"
      >
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          className="w-14 h-14 rounded-full bg-gradient-to-br from-primary to-primary/80 shadow-lg hover:shadow-xl transition-all flex items-center justify-center"
          onClick={() => navigate('/search')}
        >
          <Search className="h-6 w-6 text-primary-foreground" />
        </motion.button>
      </motion.div>
    </div>
  );
}