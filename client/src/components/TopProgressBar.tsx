interface TopProgressBarProps {
  isLoading: boolean;
  progress: number;
}

const TopProgressBar = ({ isLoading, progress }: TopProgressBarProps) => {
  if (!isLoading && progress === 0) {
    return null;
  }

  return (
    <div className="fixed top-0 left-0 right-0 z-[9999] h-1.5 bg-gray-200/30 dark:bg-gray-800/30">
      <div 
        className="h-full bg-gradient-to-r from-[#2f5a4e] via-[#ff7a5c] to-[#2f5a4e] shadow-lg transition-all duration-500 ease-out"
        style={{ 
          width: `${progress}%`,
          opacity: isLoading ? 1 : 0,
          boxShadow: '0 0 10px rgba(47, 90, 78, 0.5)'
        }}
      />
    </div>
  );
};

export default TopProgressBar;
