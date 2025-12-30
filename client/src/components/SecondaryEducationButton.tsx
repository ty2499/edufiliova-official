import { Button } from "@/components/ui/button";
import { BookOpen, GraduationCap } from "lucide-react";

interface SecondaryEducationButtonProps {
  onNavigate: (page: string) => void;
}

export default function SecondaryEducationButton({ onNavigate }: SecondaryEducationButtonProps) {
  return (
    <Button
      onClick={() => onNavigate("secondary-education")}
      className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white px-6 py-3 rounded-lg transition-all duration-300 transform hover:scale-105" transition-all duration-300
      data-testid="button-secondary-education"
    >
      <GraduationCap className="w-5 h-5 mr-2" />
      <span className="font-semibold">Secondary Education Hub</span>
      <BookOpen className="w-4 h-4 ml-2" />
    </Button>
  );
}
