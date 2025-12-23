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
        className="h-full bg-gradient-to-r from-[#0C332C] via-[#ff7a5c] to-[#0C332C] shadow-lg shadow-[#0C332C]/50 transition-all duration-500 ease-out"
        style={{ 
          width: `${progress}%`,
          opacity: isLoading ? 1 : 0,
        }}
      />
    </div>
  );
};

export default TopProgressBar;
