interface TopProgressBarProps {
  isLoading: boolean;
  progress: number;
}

const TopProgressBar = ({ isLoading, progress }: TopProgressBarProps) => {
  if (!isLoading && progress === 0) {
    return null;
  }

  return (
    <div className="fixed top-0 left-0 right-0 z-[9999] h-1 bg-gray-200/30 dark:bg-gray-800/30">
      <div 
        className="h-full transition-all duration-500 ease-out shadow-[0_0_10px_#a0fab2,0_0_5px_#a0fab2]"
        style={{ 
          width: `${progress}%`,
          opacity: isLoading ? 1 : 0,
          backgroundColor: '#a0fab2',
        }}
      />
    </div>
  );
};

export default TopProgressBar;
