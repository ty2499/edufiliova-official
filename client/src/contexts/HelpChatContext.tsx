import { createContext, useContext, useState, ReactNode } from 'react';

interface HelpChatContextType {
  isChatOpen: boolean;
  setIsChatOpen: (open: boolean) => void;
}

const HelpChatContext = createContext<HelpChatContextType | undefined>(undefined);

export const HelpChatProvider = ({ children }: { children: ReactNode }) => {
  const [isChatOpen, setIsChatOpen] = useState(false);

  return (
    <HelpChatContext.Provider value={{ isChatOpen, setIsChatOpen }}>
      {children}
    </HelpChatContext.Provider>
  );
};

export const useHelpChat = () => {
  const context = useContext(HelpChatContext);
  if (context === undefined) {
    throw new Error('useHelpChat must be used within a HelpChatProvider');
  }
  return context;
};
