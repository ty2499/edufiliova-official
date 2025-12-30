import { motion } from 'framer-motion';

interface TopProgressBarProps {
  isLoading: boolean;
  progress: number;
}

const TopProgressBar = ({ isLoading, progress }: TopProgressBarProps) => {
  if (!isLoading && progress === 0) {
    return null;
  }

  return (
    <motion.div 
      className="fixed top-0 left-0 right-0 z-[9999] h-20 backdrop-blur-sm bg-white/10 flex items-center justify-center pointer-events-none"
      initial={{ opacity: 0 }}
      animate={{ opacity: isLoading ? 1 : 0 }}
      transition={{ duration: 0.3 }}
    >
      <div className="flex gap-2">
        {[0, 1, 2, 3].map((index) => (
          <motion.div
            key={index}
            className="w-3 h-3 bg-[#0c332c] rounded-full shadow-sm"
            animate={{
              y: [0, -20, 0],
              scale: [1, 1.2, 1],
              opacity: [0.7, 1, 0.7]
            }}
            transition={{
              duration: 1.2,
              repeat: Infinity,
              ease: "easeInOut",
              delay: index * 0.15,
            }}
          />
        ))}
      </div>
    </motion.div>
  );
};

export default TopProgressBar;
