import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { HelpCircle } from "lucide-react";

interface TeacherPricingPageProps {
  onNavigate: (page: string) => void;
}

const TeacherPricingPage = ({ onNavigate }: TeacherPricingPageProps) => {
  return (
    <div className="min-h-screen bg-white dark:bg-gray-900">
      <Header />

      {/* Hero Section */}
      <section className="bg-[#0C332C] text-white py-32 px-4">
        <div className="max-w-4xl mx-auto text-center">
          <h1 className="text-5xl md:text-6xl font-bold mb-6">
            Inspire the Next<br />Generation of Learners
          </h1>
          <p className="text-xl md:text-2xl mb-12 opacity-95 max-w-3xl mx-auto">
            Share your knowledge, earn competitive income, and make a lasting impact on students worldwide
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button 
              size="lg"
              onClick={() => onNavigate("teacher-application")}
              className="bg-white text-foreground hover:bg-white font-semibold rounded-full px-8 py-6 text-lg"
            >
              Start Your Application →
            </Button>
            <Button 
              size="lg" 
              variant="outline"
              onClick={() => onNavigate("help")}
              className="border-2 border-white text-white hover:bg-[#a0fab2] hover:text-[#2f5a4e] font-semibold rounded-full px-8 py-6 text-lg flex items-center gap-2"
            >
              <HelpCircle className="w-5 h-5" />
              Have Questions?
            </Button>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default TeacherPricingPage;
