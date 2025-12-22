import { createContext, useContext, useState, ReactNode } from 'react';

interface FreelancerChatContextType {
  isChatOpen: boolean;
  setIsChatOpen: (open: boolean) => void;
  freelancerInfo: {
    id: string;
    name: string;
    avatarUrl?: string;
    professionalTitle?: string;
  } | null;
  setFreelancerInfo: (info: {
    id: string;
    name: string;
    avatarUrl?: string;
    professionalTitle?: string;
  } | null) => void;
  currentUserId: string | null;
  setCurrentUserId: (id: string | null) => void;
}

const FreelancerChatContext = createContext<FreelancerChatContextType | undefined>(undefined);

export const FreelancerChatProvider = ({ children }: { children: ReactNode }) => {
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [freelancerInfo, setFreelancerInfo] = useState<{
    id: string;
    name: string;
    avatarUrl?: string;
    professionalTitle?: string;
  } | null>(null);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);

  return (
    <FreelancerChatContext.Provider value={{ 
      isChatOpen, 
      setIsChatOpen,
      freelancerInfo,
      setFreelancerInfo,
      currentUserId,
      setCurrentUserId
    }}>
      {children}
    </FreelancerChatContext.Provider>
  );
};

export const useFreelancerChat = () => {
  const context = useContext(FreelancerChatContext);
  if (context === undefined) {
    throw new Error('useFreelancerChat must be used within a FreelancerChatProvider');
  }
  return context;
};
