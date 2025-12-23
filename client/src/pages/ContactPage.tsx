import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { Loader2, Check, Mail, Clock } from "lucide-react";

interface ContactPageProps {
  onNavigate: (page: string) => void;
}

const ContactPage = ({ onNavigate }: ContactPageProps) => {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    message: ""
  });
  
  const [selectedServices, setSelectedServices] = useState<string[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  const services = [
    { id: "course-question", label: "Course questions" },
    { id: "technical-support", label: "Technical support" },
    { id: "account-help", label: "Account help" },
    { id: "partnership", label: "Partnership inquiry" },
    { id: "teacher-application", label: "Become a teacher" },
    { id: "other", label: "Other" }
  ];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const response = await fetch('/api/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: formData.name,
          email: formData.email,
          subject: selectedServices.join(', ') || 'General Inquiry',
          message: formData.message
        })
      });

      const data = await response.json();

      if (response.ok) {
        setIsSuccess(true);
        setFormData({ name: "", email: "", message: "" });
        setSelectedServices([]);
        setTimeout(() => setIsSuccess(false), 3000);
      }
    } catch (error) {
      // Silent error handling - AJAX only
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData(prev => ({
      ...prev,
      [e.target.name]: e.target.value
    }));
  };

  const handleServiceToggle = (serviceId: string) => {
    setSelectedServices(prev => 
      prev.includes(serviceId)
        ? prev.filter(id => id !== serviceId)
        : [...prev, serviceId]
    );
  };

  return (
    <div className="min-h-screen flex flex-col pt-16">
      <Header onNavigate={onNavigate} currentPage="contact" />
      <main className="flex-1 bg-gray-50 py-8 md:py-16">
        <div className="container mx-auto px-4">
          <div className="max-w-7xl mx-auto">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {/* Contact Form with Lime Green Background */}
              <div 
                className="rounded-3xl p-8 md:p-12 bg-[#a0fab2]"
                style={{ backgroundColor: '#CCFF00' }}
              >
                <h1 className="text-3xl md:text-4xl font-bold mb-4 text-black">
                  Have questions? We're here to help you succeed.
                </h1>
                <p className="text-base md:text-lg text-black mb-8">
                  Tell us more about yourself and how we can assist you.
                </p>

                <form onSubmit={handleSubmit} className="space-y-6">
                  <div className="space-y-2">
                    <label htmlFor="name" className="text-sm font-medium text-black">
                      Your name
                    </label>
                    <Input
                      id="name"
                      name="name"
                      value={formData.name}
                      onChange={handleChange}
                      placeholder=""
                      className="bg-transparent border-b-2 border-black border-t-0 border-l-0 border-r-0 rounded-none px-0 focus-visible:ring-0 focus-visible:ring-offset-0 focus-visible:border-black placeholder:text-black/40"
                      required
                      data-testid="input-name"
                    />
                  </div>

                  <div className="space-y-2">
                    <label htmlFor="email" className="text-sm font-medium text-black">
                      you@company.com
                    </label>
                    <Input
                      id="email"
                      name="email"
                      type="email"
                      value={formData.email}
                      onChange={handleChange}
                      placeholder=""
                      className="bg-transparent border-b-2 border-black border-t-0 border-l-0 border-r-0 rounded-none px-0 focus-visible:ring-0 focus-visible:ring-offset-0 focus-visible:border-black placeholder:text-black/40"
                      required
                      data-testid="input-email"
                    />
                  </div>

                  <div className="space-y-2">
                    <label htmlFor="message" className="text-sm font-medium text-black">
                      How can we help you?
                    </label>
                    <Textarea
                      id="message"
                      name="message"
                      value={formData.message}
                      onChange={handleChange}
                      placeholder=""
                      rows={4}
                      className="bg-transparent border-b-2 border-black border-t-0 border-l-0 border-r-0 rounded-none px-0 resize-none focus-visible:ring-0 focus-visible:ring-offset-0 focus-visible:border-black placeholder:text-black/40"
                      required
                      data-testid="textarea-message"
                    />
                  </div>

                  <div className="space-y-3">
                    <label className="text-sm font-medium text-black">
                      How can we help?
                    </label>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      {services.map((service) => (
                        <div 
                          key={service.id} 
                          className="flex items-center space-x-3"
                        >
                          <Checkbox
                            id={service.id}
                            checked={selectedServices.includes(service.id)}
                            onCheckedChange={() => handleServiceToggle(service.id)}
                            className="border-2 border-black data-[state=checked]:bg-black data-[state=checked]:border-black data-[state=checked]:text-[#CCFF00] rounded-sm"
                            data-testid={`checkbox-${service.id}`}
                          />
                          <label
                            htmlFor={service.id}
                            className="text-sm font-medium text-black cursor-pointer select-none"
                          >
                            {service.label}
                          </label>
                        </div>
                      ))}
                    </div>
                  </div>

                  <Button 
                    type="submit" 
                    className="w-full bg-black text-white hover:bg-gray-800 rounded-lg py-6 text-base font-medium mt-8" transition-all duration-300
                    disabled={isSubmitting}
                    data-testid="button-submit"
                  >
                    {isSubmitting ? (
                      <>
                        <Loader2 className="h-5 w-5 mr-2 animate-spin" />
                        Sending...
                      </>
                    ) : isSuccess ? (
                      <>
                        <Check className="h-5 w-5 mr-2" />
                        Sent Successfully!
                      </>
                    ) : (
                      "Send Message"
                    )}
                  </Button>
                </form>
              </div>

              {/* Contact Information Side */}
              <div className="space-y-6">
                <div className="bg-white rounded-3xl p-8 md:p-12">
                  <h2 className="text-2xl md:text-3xl font-bold mb-6 text-black">
                    Get in Touch
                  </h2>
                  <p className="text-base text-gray-600 mb-8">
                    We're always happy to help! Whether you have questions about our courses, 
                    need technical support, or want to learn more about our premium features, 
                    our team is here for you.
                  </p>

                  <div className="space-y-6">
                    <div className="flex items-start space-x-4">
                      <div className="w-12 h-12 rounded-full flex items-center justify-center flex-shrink-0" style={{ backgroundColor: '#CCFF00' }}>
                        <Mail className="h-6 w-6 text-black" />
                      </div>
                      <div>
                        <h3 className="font-semibold text-black mb-1">
                          Email Us
                        </h3>
                        <p className="text-sm text-gray-600 mb-1">
                          support@edufiliova.com
                        </p>
                        <p className="text-xs text-gray-500">
                          We typically respond within 24 hours
                        </p>
                      </div>
                    </div>

                    <div className="flex items-start space-x-4">
                      <div className="w-12 h-12 rounded-full flex items-center justify-center flex-shrink-0" style={{ backgroundColor: '#CCFF00' }}>
                        <Clock className="h-6 w-6 text-black" />
                      </div>
                      <div>
                        <h3 className="font-semibold text-black mb-1">
                          Support Hours
                        </h3>
                        <p className="text-sm text-gray-600 mb-1">
                          24/7 Customer Support
                        </p>
                        <p className="text-xs text-gray-500">
                          Available for premium subscribers
                        </p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* FAQ Section */}
                <div className="bg-white rounded-3xl p-8 md:p-12">
                  <h3 className="text-xl font-bold mb-6 text-black">
                    Frequently Asked Questions
                  </h3>
                  <div className="space-y-4">
                    <div>
                      <h4 className="font-semibold text-black mb-2">
                        How can I access my courses after subscribing?
                      </h4>
                      <p className="text-sm text-gray-600">
                        Once you subscribe, all courses for your grade level are instantly available in your dashboard. Simply log in and start learning!
                      </p>
                    </div>
                    <div>
                      <h4 className="font-semibold text-black mb-2">
                        What if I need help with a specific lesson?
                      </h4>
                      <p className="text-sm text-gray-600">
                        Our support team is available 24/7 for premium subscribers. You can also connect with teachers for personalized help through our platform.
                      </p>
                    </div>
                    <div>
                      <h4 className="font-semibold text-black mb-2">
                        How do I become a teacher on the platform?
                      </h4>
                      <p className="text-sm text-gray-600">
                        Select "Become a teacher" above and submit your application with your qualifications. We review all applications within 48 hours.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
      <Footer onNavigate={onNavigate} />
    </div>
  );
};

export default ContactPage;
