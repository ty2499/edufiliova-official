import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useMutation } from "@tanstack/react-query";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { Mail, Clock, Send, Loader2, Check, Upload, FileText } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";

interface DesignTeamContactProps {
  onNavigate: (page: string) => void;
}

const designTeamContactSchema = z.object({
  name: z.string().min(1, "Name is required"),
  email: z.string().email("Invalid email address"),
  company: z.string().optional(),
  phone: z.string().optional(),
  projectType: z.string().min(1, "Project type is required"),
  budget: z.string().optional(),
  timeline: z.string().optional(),
  message: z.string().min(10, "Message must be at least 10 characters")
});

type DesignTeamContactForm = z.infer<typeof designTeamContactSchema>;

const DesignTeamContact = ({ onNavigate }: DesignTeamContactProps) => {
  const [attachedFile, setAttachedFile] = useState<File | null>(null);
  const [isSuccess, setIsSuccess] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string>("");
  
  const form = useForm<DesignTeamContactForm>({
    resolver: zodResolver(designTeamContactSchema),
    defaultValues: {
      name: "",
      email: "",
      company: "",
      phone: "",
      projectType: "",
      budget: "",
      timeline: "",
      message: ""
    }
  });

  const mutation = useMutation({
    mutationFn: async (data: DesignTeamContactForm & { fileUrl?: string }) => {
      setErrorMessage("");
      return await apiRequest('/api/design-team-contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      });
    },
    onSuccess: (data) => {
      console.log('✅ Form submission successful:', data);
      setIsSuccess(true);
      form.reset();
      setAttachedFile(null);
      setErrorMessage("");
      setTimeout(() => setIsSuccess(false), 3000);
    },
    onError: (error: any) => {
      console.error('❌ Form submission error:', error);
      setErrorMessage(error.message || "Failed to send your message. Please try again later.");
    }
  });

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 10 * 1024 * 1024) {
        setErrorMessage("Please select a file smaller than 10MB");
        return;
      }
      setAttachedFile(file);
    }
  };

  const onSubmit = async (data: DesignTeamContactForm) => {
    console.log('📝 Form submission started:', data);
    let fileUrl = "";
    
    if (attachedFile) {
      console.log('📎 Uploading file:', attachedFile.name);
      setUploading(true);
      try {
        const formData = new FormData();
        formData.append('file', attachedFile);
        formData.append('type', 'design-inquiries');
        
        const uploadResult = await apiRequest('/api/upload', {
          method: 'POST',
          body: formData
        });
        
        fileUrl = uploadResult.url;
        console.log('✅ File uploaded:', fileUrl);
      } catch (error) {
        console.error('❌ File upload failed:', error);
        setErrorMessage("File upload failed. We'll send your inquiry without the attachment.");
      } finally {
        setUploading(false);
      }
    }
    
    console.log('🚀 Submitting form to API...');
    mutation.mutate({ ...data, fileUrl });
  };

  return (
    <div className="min-h-screen flex flex-col pt-16">
      <Header onNavigate={onNavigate} currentPage="design-team-contact" />
      
      <main className="flex-1 bg-gray-50 py-8 md:py-16">
        <div className="container mx-auto px-4">
          <div className="max-w-7xl mx-auto">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {/* Contact Form with Lime Green Background */}
              <div 
                className="rounded-3xl p-8 md:p-12"
                style={{ backgroundColor: '#CCFF00' }}
              >
                <h1 className="text-3xl md:text-4xl font-bold mb-4 text-black">
                  Let's create something amazing together.
                </h1>
                <p className="text-base md:text-lg text-black mb-8">
                  Tell us about your design project and we'll bring your vision to life.
                </p>

                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                  <div className="space-y-2">
                    <label htmlFor="name" className="text-sm font-medium text-black">
                      Your name
                    </label>
                    <Input
                      id="name"
                      {...form.register("name")}
                      placeholder=""
                      className="bg-transparent border-b-2 border-black border-t-0 border-l-0 border-r-0 rounded-none px-0 focus-visible:ring-0 focus-visible:ring-offset-0 focus-visible:border-black placeholder:text-black/40"
                      data-testid="input-name"
                    />
                    {form.formState.errors.name && (
                      <p className="text-xs text-red-600">{form.formState.errors.name.message}</p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <label htmlFor="email" className="text-sm font-medium text-black">
                      you@company.com
                    </label>
                    <Input
                      id="email"
                      type="email"
                      {...form.register("email")}
                      placeholder=""
                      className="bg-transparent border-b-2 border-black border-t-0 border-l-0 border-r-0 rounded-none px-0 focus-visible:ring-0 focus-visible:ring-offset-0 focus-visible:border-black placeholder:text-black/40"
                      data-testid="input-email"
                    />
                    {form.formState.errors.email && (
                      <p className="text-xs text-red-600">{form.formState.errors.email.message}</p>
                    )}
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <label htmlFor="company" className="text-sm font-medium text-black">
                        Company (optional)
                      </label>
                      <Input
                        id="company"
                        {...form.register("company")}
                        placeholder=""
                        className="bg-transparent border-b-2 border-black border-t-0 border-l-0 border-r-0 rounded-none px-0 focus-visible:ring-0 focus-visible:ring-offset-0 focus-visible:border-black placeholder:text-black/40"
                        data-testid="input-company"
                      />
                    </div>

                    <div className="space-y-2">
                      <label htmlFor="phone" className="text-sm font-medium text-black">
                        Phone (optional)
                      </label>
                      <Input
                        id="phone"
                        {...form.register("phone")}
                        placeholder=""
                        className="bg-transparent border-b-2 border-black border-t-0 border-l-0 border-r-0 rounded-none px-0 focus-visible:ring-0 focus-visible:ring-offset-0 focus-visible:border-black placeholder:text-black/40"
                        data-testid="input-phone"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label htmlFor="projectType" className="text-sm font-medium text-black">
                      Project type
                    </label>
                    <Select onValueChange={(value) => form.setValue("projectType", value)}>
                      <SelectTrigger 
                        className="bg-transparent border-b-2 border-black border-t-0 border-l-0 border-r-0 rounded-none px-0 focus:ring-0 focus:ring-offset-0"
                        data-testid="select-project-type"
                      >
                        <SelectValue placeholder="Select project type" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="banner-ad">Banner Advertisement</SelectItem>
                        <SelectItem value="logo-design">Logo Design</SelectItem>
                        <SelectItem value="website-design">Website Design</SelectItem>
                        <SelectItem value="branding">Branding Package</SelectItem>
                        <SelectItem value="marketing-materials">Marketing Materials</SelectItem>
                        <SelectItem value="social-media">Social Media Graphics</SelectItem>
                        <SelectItem value="other">Other</SelectItem>
                      </SelectContent>
                    </Select>
                    {form.formState.errors.projectType && (
                      <p className="text-xs text-red-600">{form.formState.errors.projectType.message}</p>
                    )}
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <label htmlFor="budget" className="text-sm font-medium text-black">
                        Budget (optional)
                      </label>
                      <Select onValueChange={(value) => form.setValue("budget", value)}>
                        <SelectTrigger 
                          className="bg-transparent border-b-2 border-black border-t-0 border-l-0 border-r-0 rounded-none px-0 focus:ring-0 focus:ring-offset-0"
                          data-testid="select-budget"
                        >
                          <SelectValue placeholder="Select budget" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="under-500">Under $500</SelectItem>
                          <SelectItem value="500-1000">$500 - $1,000</SelectItem>
                          <SelectItem value="1000-2500">$1,000 - $2,500</SelectItem>
                          <SelectItem value="2500-5000">$2,500 - $5,000</SelectItem>
                          <SelectItem value="5000-plus">$5,000+</SelectItem>
                          <SelectItem value="flexible">Flexible</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <label htmlFor="timeline" className="text-sm font-medium text-black">
                        Timeline (optional)
                      </label>
                      <Select onValueChange={(value) => form.setValue("timeline", value)}>
                        <SelectTrigger 
                          className="bg-transparent border-b-2 border-black border-t-0 border-l-0 border-r-0 rounded-none px-0 focus:ring-0 focus:ring-offset-0"
                          data-testid="select-timeline"
                        >
                          <SelectValue placeholder="Select timeline" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="urgent">Urgent (1-2 weeks)</SelectItem>
                          <SelectItem value="normal">Normal (2-4 weeks)</SelectItem>
                          <SelectItem value="flexible">Flexible (1+ months)</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label htmlFor="message" className="text-sm font-medium text-black">
                      Tell us about your project
                    </label>
                    <Textarea
                      id="message"
                      {...form.register("message")}
                      placeholder=""
                      rows={4}
                      className="bg-transparent border-b-2 border-black border-t-0 border-l-0 border-r-0 rounded-none px-0 resize-none focus-visible:ring-0 focus-visible:ring-offset-0 focus-visible:border-black placeholder:text-black/40"
                      data-testid="textarea-message"
                    />
                    {form.formState.errors.message && (
                      <p className="text-xs text-red-600">{form.formState.errors.message.message}</p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-medium text-black">
                      Attach file (optional)
                    </label>
                    <div className="flex items-center gap-4">
                      <label
                        htmlFor="file-upload"
                        className="flex items-center gap-2 px-4 py-2 bg-black text-white rounded-lg cursor-pointer hover:bg-gray-800 transition-colors"
                      >
                        <Upload className="h-4 w-4" />
                        <span className="text-sm">
                          {attachedFile ? 'Change File' : 'Choose File'}
                        </span>
                      </label>
                      <input
                        id="file-upload"
                        type="file"
                        onChange={handleFileChange}
                        className="hidden"
                        accept=".pdf,.doc,.docx,.png,.jpg,.jpeg,.zip"
                        data-testid="input-file"
                      />
                      {attachedFile && (
                        <div className="flex items-center gap-2 text-sm">
                          <FileText className="h-4 w-4 text-black" />
                          <span className="font-medium">{attachedFile.name}</span>
                          <button
                            type="button"
                            onClick={() => setAttachedFile(null)}
                            className="text-red-500 hover:text-red-700 text-xl"
                          >
                            ×
                          </button>
                        </div>
                      )}
                    </div>
                    <p className="text-xs text-black/70">
                      PDF, DOC, DOCX, PNG, JPG, ZIP (Max 10MB)
                    </p>
                  </div>

                  {errorMessage && (
                    <div className="p-4 bg-red-100 border-2 border-red-500 rounded-lg" data-testid="error-message">
                      <p className="text-red-700 font-medium text-sm">{errorMessage}</p>
                    </div>
                  )}

                  <Button 
                    type="submit" 
                    className="w-full bg-black text-white hover:bg-gray-800 rounded-lg py-6 text-base font-medium mt-8"
                    disabled={mutation.isPending || uploading}
                    data-testid="button-submit-form"
                  >
                    {uploading ? (
                      <>
                        <Loader2 className="h-5 w-5 mr-2 animate-spin" />
                        Uploading File...
                      </>
                    ) : mutation.isPending ? (
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
                      <>
                        <Send className="h-5 w-5 mr-2" />
                        Send Project Inquiry
                      </>
                    )}
                  </Button>
                </form>
              </div>

              {/* Contact Information Side */}
              <div className="space-y-6">
                <div className="bg-white rounded-3xl p-8 md:p-12">
                  <h2 className="text-2xl md:text-3xl font-bold mb-6 text-black">
                    Why Choose Our Design Team
                  </h2>
                  <p className="text-base text-gray-600 mb-8">
                    We're a team of creative designers dedicated to bringing your vision to life with stunning visuals and innovative solutions.
                  </p>

                  <div className="space-y-6">
                    <div className="flex items-start space-x-4">
                      <div className="w-12 h-12 rounded-full flex items-center justify-center flex-shrink-0" style={{ backgroundColor: '#CCFF00' }}>
                        <Check className="h-6 w-6 text-black" />
                      </div>
                      <div>
                        <h3 className="font-semibold text-black mb-1">
                          Expert Designers
                        </h3>
                        <p className="text-sm text-gray-600">
                          10+ years of experience in creative design
                        </p>
                      </div>
                    </div>

                    <div className="flex items-start space-x-4">
                      <div className="w-12 h-12 rounded-full flex items-center justify-center flex-shrink-0" style={{ backgroundColor: '#CCFF00' }}>
                        <Check className="h-6 w-6 text-black" />
                      </div>
                      <div>
                        <h3 className="font-semibold text-black mb-1">
                          Fast Turnaround
                        </h3>
                        <p className="text-sm text-gray-600">
                          Quick delivery without compromising quality
                        </p>
                      </div>
                    </div>

                    <div className="flex items-start space-x-4">
                      <div className="w-12 h-12 rounded-full flex items-center justify-center flex-shrink-0" style={{ backgroundColor: '#CCFF00' }}>
                        <Check className="h-6 w-6 text-black" />
                      </div>
                      <div>
                        <h3 className="font-semibold text-black mb-1">
                          Unlimited Revisions
                        </h3>
                        <p className="text-sm text-gray-600">
                          We work with you until you're 100% satisfied
                        </p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Services */}
                <div className="bg-white rounded-3xl p-8 md:p-12">
                  <h3 className="text-xl font-bold mb-6 text-black">
                    Our Services
                  </h3>
                  <ul className="space-y-3 text-sm text-gray-600">
                    <li className="flex items-center gap-2">
                      <Check className="h-4 w-4 text-black" />
                      Banner & Display Ads
                    </li>
                    <li className="flex items-center gap-2">
                      <Check className="h-4 w-4 text-black" />
                      Logo & Brand Identity
                    </li>
                    <li className="flex items-center gap-2">
                      <Check className="h-4 w-4 text-black" />
                      Website & UI/UX Design
                    </li>
                    <li className="flex items-center gap-2">
                      <Check className="h-4 w-4 text-black" />
                      App & Website Development
                    </li>
                    <li className="flex items-center gap-2">
                      <Check className="h-4 w-4 text-black" />
                      Social Media Graphics
                    </li>
                    <li className="flex items-center gap-2">
                      <Check className="h-4 w-4 text-black" />
                      Marketing Materials
                    </li>
                  </ul>
                </div>

                {/* Contact Info */}
                <div className="bg-white rounded-3xl p-8 md:p-12">
                  <div className="flex items-start space-x-4 mb-6">
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
                        Response Time
                      </h3>
                      <p className="text-sm text-gray-600">
                        Your message goes straight to our creative team for a quick response!
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

export default DesignTeamContact;
