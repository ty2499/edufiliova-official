import React from 'react';
import { motion } from 'framer-motion';

export const BouncingBoxesLoader = () => {
  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-[#0C332C]">
      <div className="flex gap-2">
        {[0, 1, 2, 3].map((index) => (
          <motion.div
            key={index}
            className="w-4 h-4 bg-[#c4ee3d] rounded-sm"
            animate={{
              y: [0, -20, 0],
              scale: [1, 1.2, 1],
              rotate: [0, 90, 0],
            }}
            transition={{
              duration: 0.6,
              repeat: Infinity,
              ease: "easeInOut",
              delay: index * 0.1,
            }}
          />
        ))}
      </div>
      <motion.p
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="absolute mt-20 text-white font-medium tracking-wide"
      >
        Setting things up...
      </motion.p>
    </div>
  );
};
