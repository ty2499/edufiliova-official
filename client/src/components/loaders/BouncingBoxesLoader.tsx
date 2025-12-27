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
              duration: 2,
              repeat: Infinity,
              ease: "easeInOut",
              delay: index * 0.1,
            }}
          />
        ))}
      </div>
    </div>
  );
};
