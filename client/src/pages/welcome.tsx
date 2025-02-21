import { useCallback } from "react";
import { useLocation } from "wouter";
import { motion } from "framer-motion";
import { Crown } from '@/components/icons/Crown';

export default function Welcome() {
  const [_, setLocation] = useLocation();

  const handleClick = useCallback(() => {
    setLocation("/home");
  }, [setLocation]);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 1 }}
      onClick={handleClick}
      className="min-h-screen w-full flex items-center justify-center bg-[#F6F4F1] cursor-pointer"
    >
      <motion.div
        initial={{ scale: 0, opacity: 0 }}
        animate={{ 
          scale: 1,
          opacity: 1,
        }}
        transition={{
          duration: 1.2,
          type: "spring",
          stiffness: 100,
          damping: 15
        }}
      >
        <motion.div
          animate={{ 
            y: [-4, 4, -4],
          }}
          transition={{
            duration: 4,
            repeat: Infinity,
            ease: "easeInOut"
          }}
        >
          <Crown className="w-20 h-20 text-black" />
        </motion.div>
      </motion.div>
    </motion.div>
  );
}