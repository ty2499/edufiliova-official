import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { 
  X, 
  Upload, 
  Trash2, 
  AlertCircle, 
  CheckCircle2, 
  Loader2,
  ChevronRight
} from 'lucide-react';
import Logo from '@/components/Logo';
import { countryCodes } from '@shared/countryCodes';
import FreelancerTermsModal from '@/components/FreelancerTermsModal';
import { resolveApiUrl } from '@/lib/queryClient';
import { useAuth } from '@/hooks/useAuth';

interface FreelancerSignupProps {
  onNavigate?: (page: string) => void;
}

interface PortfolioSample {
  title: string;
  category: string;
  description: string;
  files: File[];
}

const SKILLS_OPTIONS = [
  'Figma',
  'Adobe Photoshop',
  'Adobe Illustrator',
  'React',
  'Next.js',
  'Flutter',
  'HTML & CSS',
  'Node.js',
  'PowerPoint',
  'Word / PDF creation',
];

const PRIMARY_CATEGORIES = [
  'Graphic Design',
  'UI/UX Design',
  'Web Development',
  'Mobile App Development',
  'Study Notes & Documents',
  'Illustrations',
  'Other',
];

const PORTFOLIO_CATEGORIES = [
  'Design',
  'Code',
  'Notes / Documents',
  'Other',
];

export default function FreelancerSignup({ onNavigate }: FreelancerSignupProps) {
  const { user, profile } = useAuth();
  const [applicationId, setApplicationId] = useState<string | null>(null);
  const [currentSection, setCurrentSection] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessages, setErrorMessages] = useState<Record<string, string>>({});

  const [fullName, setFullName] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [email, setEmail] = useState('');
  const [country, setCountry] = useState('');
  const [primaryCategory, setPrimaryCategory] = useState('');
  const [tagline, setTagline] = useState('');
  const [about, setAbout] = useState('');

  const [selectedSkills, setSelectedSkills] = useState<string[]>([]);
  const [servicesOffered, setServicesOffered] = useState<string[]>([]);
  const [behanceUrl, setBehanceUrl] = useState('');
  const [githubUrl, setGithubUrl] = useState('');
  const [websiteUrl, setWebsiteUrl] = useState('');

  const [portfolioSamples, setPortfolioSamples] = useState<PortfolioSample[]>([]);
  const [currentSample, setCurrentSample] = useState<PortfolioSample>({
    title: '',
    category: '',
    description: '',
    files: [],
  });

  const [termsAccepted, setTermsAccepted] = useState(false);
  const [policyAccepted, setPolicyAccepted] = useState(false);
  const [reviewAccepted, setReviewAccepted] = useState(false);
  const [termsModalOpen, setTermsModalOpen] = useState(false);

  // Load user profile data first
  useEffect(() => {
    if (profile && !fullName) {
      setFullName(profile.name || '');
      setEmail(profile.email || '');
      setCountry(profile.country || '');
      setDisplayName(profile.displayName || '');
    }
  }, [profile]);

  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const appIdParam = urlParams.get('applicationId');

    const loadApplication = async (id: string) => {
      try {
        const res = await fetch(resolveApiUrl(`/api/freelancer/applications/${id}`));
        if (!res.ok) throw new Error(`Failed to fetch application: ${res.status}`);
        
        const data = await res.json();
        if (data && data.success !== false) {
          setFullName(data.fullName || '');
          setDisplayName(data.displayName || '');
          setEmail(data.email || '');
          setCountry(data.country || '');
          setPrimaryCategory(data.primaryCategory || '');
          setTagline(data.tagline || '');
          setAbout(data.about || '');
          
          if (data.skills) {
            const skillsArray = typeof data.skills === 'string' ? JSON.parse(data.skills) : data.skills;
            setSelectedSkills(Array.isArray(skillsArray) ? skillsArray : []);
          }
          
          if (data.servicesOffered) {
            const servicesArray = typeof data.servicesOffered === 'string' ? JSON.parse(data.servicesOffered) : data.servicesOffered;
            setServicesOffered(Array.isArray(servicesArray) ? servicesArray : []);
          }
          
          setBehanceUrl(data.behanceUrl || '');
          setGithubUrl(data.githubUrl || '');
          setWebsiteUrl(data.websiteUrl || '');
          console.log('✅ Application data loaded successfully');
        } else {
          throw new Error(data.error || 'Invalid application data');
        }
      } catch (err) {
        console.error('Failed to load application data:', err);
        setErrorMessages({ submit: 'Failed to load your application. Please try again or contact support.' });
      }
    };

    if (appIdParam) {
      setApplicationId(appIdParam);
      loadApplication(appIdParam);
    } else if (user?.id) {
      // No applicationId in URL - try to get or create one
      fetch(resolveApiUrl('/api/freelancer/applications/user/current'), {
        credentials: 'include'
      })
        .then(res => res.json())
        .then(data => {
          if (data.success && data.application) {
            const newAppId = data.application.id;
            setApplicationId(newAppId);
            window.history.replaceState({}, '', `?applicationId=${newAppId}`);
            loadApplication(newAppId);
          }
        })
        .catch(err => {
          console.error('Failed to get current application:', err);
          setErrorMessages({ submit: 'Failed to initialize your application. Please try again.' });
        });
    }
  }, [user?.id]);

  const clearError = (field: string) => {
    if (errorMessages[field]) {
      const newErrors = { ...errorMessages };
      delete newErrors[field];
      setErrorMessages(newErrors);
    }
  };

  const validateSection1 = () => {
    const errors: Record<string, string> = {};
    
    if (!primaryCategory) {
      errors.primaryCategory = 'Primary category is required';
    }
    if (!tagline.trim()) {
      errors.tagline = 'Tagline is required';
    }
    if (!about.trim()) {
      errors.about = 'About section is required';
    } else if (about.length < 300) {
      errors.about = 'Please write at least 300 characters';
    }

    setErrorMessages(errors);
    return Object.keys(errors).length === 0;
  };

  const validateSection2 = () => {
    const errors: Record<string, string> = {};
    
    if (selectedSkills.length === 0) {
      errors.skills = 'Please select at least one skill';
    }
    if (servicesOffered.length === 0) {
      errors.services = 'Please select at least one service offering';
    }

    setErrorMessages(errors);
    return Object.keys(errors).length === 0;
  };

  const validateSection3 = () => {
    const errors: Record<string, string> = {};
    
    if (portfolioSamples.length < 9) {
      errors.portfolio = `Please upload at least 9 portfolio samples before submitting your application.`;
    }

    setErrorMessages(errors);
    return Object.keys(errors).length === 0;
  };

  const validateSection4 = () => {
    const errors: Record<string, string> = {};
    
    if (!termsAccepted) errors.terms = 'You must accept the terms';
    if (!policyAccepted) errors.policy = 'You must accept the commission policy';
    if (!reviewAccepted) errors.review = 'You must acknowledge the review process';

    setErrorMessages(errors);
    return Object.keys(errors).length === 0;
  };

  const handleNext = async () => {
    let isValid = false;
    if (currentSection === 1) {
      isValid = validateSection1();
    } else if (currentSection === 2) {
      isValid = validateSection2();
    } else if (currentSection === 3) {
      isValid = validateSection3();
    }

    if (isValid) {
      setCurrentSection(currentSection + 1);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const toggleSkill = (skill: string) => {
    setSelectedSkills(prev => 
      prev.includes(skill) 
        ? prev.filter(s => s !== skill)
        : [...prev, skill]
    );
    clearError('skills');
  };

  const toggleService = (service: string) => {
    setServicesOffered(prev => 
      prev.includes(service) 
        ? prev.filter(s => s !== service)
        : [...prev, service]
    );
    clearError('services');
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const filesArray = Array.from(e.target.files);
      setCurrentSample(prev => ({ ...prev, files: filesArray }));
    }
  };

  const addPortfolioSample = () => {
    if (!currentSample.title.trim()) {
      setErrorMessages({ sampleTitle: 'Sample title is required' });
      return;
    }
    if (!currentSample.category) {
      setErrorMessages({ sampleCategory: 'Category is required' });
      return;
    }
    if (!currentSample.description.trim()) {
      setErrorMessages({ sampleDescription: 'Description is required' });
      return;
    }
    if (currentSample.files.length === 0) {
      setErrorMessages({ sampleFiles: 'Please upload at least one file' });
      return;
    }

    setPortfolioSamples([...portfolioSamples, currentSample]);
    setCurrentSample({ title: '', category: '', description: '', files: [] });
    setErrorMessages({});
  };

  const removePortfolioSample = (index: number) => {
    setPortfolioSamples(portfolioSamples.filter((_, i) => i !== index));
    clearError('portfolio');
  };

  const handleSubmit = async () => {
    if (!validateSection4()) return;
    if (!validateSection3()) return;

    if (!applicationId) {
      setErrorMessages({ submit: 'Invalid application. Please start from the signup page.' });
      return;
    }

    setIsSubmitting(true);
    setErrorMessages({});

    try {
      const formData = new FormData();
      
      formData.append('primaryCategory', primaryCategory);
      formData.append('tagline', tagline);
      formData.append('about', about);
      formData.append('skills', JSON.stringify(selectedSkills));
      formData.append('servicesOffered', JSON.stringify(servicesOffered));
      formData.append('behanceUrl', behanceUrl);
      formData.append('githubUrl', githubUrl);
      formData.append('websiteUrl', websiteUrl);

      portfolioSamples.forEach((sample, index) => {
        formData.append(`sample_${index}_title`, sample.title);
        formData.append(`sample_${index}_category`, sample.category);
        formData.append(`sample_${index}_description`, sample.description);
        sample.files.forEach((file, fileIndex) => {
          formData.append(`sample_${index}_file_${fileIndex}`, file);
        });
      });

      const response = await fetch(resolveApiUrl(`/api/freelancer/applications/${applicationId}`), {
        method: 'PUT',
        body: formData,
        credentials: 'include'
      });

      if (response.ok) {
        if (onNavigate) {
          onNavigate('freelancer-application-status');
        }
        const statusUrl = `/?page=freelancer-application-status&id=${applicationId}`;
        window.history.replaceState({}, '', statusUrl);
        window.dispatchEvent(new PopStateEvent('popstate'));
      } else {
        const data = await response.json();
        setErrorMessages({ submit: data.error || 'Failed to submit application. Please try again.' });
      }
    } catch (error) {
      setErrorMessages({ submit: 'An error occurred while submitting your application. Please try again.' });
    } finally {
      setIsSubmitting(false);
    }
  };


  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 to-red-50">
      <button
        onClick={() => onNavigate?.('portfolio-gallery')}
        className="absolute top-6 right-6 z-10 text-gray-600 hover:text-gray-900 transition-colors" transition-all duration-300
        data-testid="button-close"
        aria-label="Close"
      >
        <X className="h-6 w-6" />
      </button>

      <div className="max-w-4xl mx-auto py-12 px-6">
        <div className="mb-8 text-center">
          <Logo size="md" variant="default" type="freelancer" className="mx-auto mb-6" />
          <h1 className="text-4xl font-bold text-gray-900 mb-2">Freelancer Application</h1>
          <p className="text-gray-600">Complete all sections to apply as a freelancer on EduFiliova</p>
        </div>

        <div className="mb-8">
          <div className="flex items-center justify-between max-w-2xl mx-auto">
            {[1, 2, 3].map((section) => (
              <div key={section} className="flex items-center">
                <div 
                  className={`w-10 h-10 rounded-full flex items-center justify-center font-semibold ${
                    currentSection >= section 
                      ? 'bg-[#0C332C] text-white' 
                      : 'bg-gray-200 text-gray-500'
                  }`}
                >
                  {section}
                </div>
                {section < 3 && (
                  <div className={`h-1 w-12 md:w-24 mx-2 ${
                    currentSection > section ? 'bg-[#0C332C]' : 'bg-gray-200'
                  }`} />
                )}
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="w-full bg-white p-8 md:p-10">
        <div className="max-w-4xl mx-auto">
          {currentSection === 1 && (
            <div>
              <div className="grid md:grid-cols-3 gap-8">
                {/* Form Section */}
                <div className="md:col-span-2">
                  <h2 className="text-2xl font-bold text-gray-900 mb-6">1. Basic Details</h2>
                  
                  <div className="space-y-5">
                    <div>
                      <Label htmlFor="fullName" className="text-sm font-medium text-gray-700 mb-1.5 block">
                        Full name
                      </Label>
                      <Input
                        id="fullName"
                        type="text"
                        value={fullName}
                        disabled
                        className="bg-gray-50"
                        data-testid="input-full-name"
                      />
                    </div>

                    <div>
                      <Label htmlFor="displayName" className="text-sm font-medium text-gray-700 mb-1.5 block">
                        Display name / Brand
                      </Label>
                      <Input
                        id="displayName"
                        type="text"
                        value={displayName}
                        disabled
                        className="bg-gray-50"
                        data-testid="input-display-name"
                      />
                    </div>

                    <div>
                      <Label htmlFor="email" className="text-sm font-medium text-gray-700 mb-1.5 block">
                        Email
                      </Label>
                      <Input
                        id="email"
                        type="email"
                        value={email}
                        disabled
                        className="bg-gray-50"
                        data-testid="input-email"
                      />
                    </div>

                    <div>
                      <Label htmlFor="country" className="text-sm font-medium text-gray-700 mb-1.5 block">
                        Country
                      </Label>
                      <Input
                        id="country"
                        type="text"
                        value={country}
                        disabled
                        className="bg-gray-50"
                        data-testid="input-country"
                      />
                    </div>

                    <div>
                      <Label htmlFor="primaryCategory" className="text-sm font-medium text-gray-700 mb-1.5 block">
                        What do you mainly create? <span className="text-primary-600">*</span>
                      </Label>
                      <Select value={primaryCategory} onValueChange={(value) => { setPrimaryCategory(value); clearError('primaryCategory'); }}>
                        <SelectTrigger id="primaryCategory" data-testid="select-category">
                          <SelectValue placeholder="Select primary category" />
                        </SelectTrigger>
                        <SelectContent>
                          {PRIMARY_CATEGORIES.map((cat) => (
                            <SelectItem key={cat} value={cat}>
                              {cat}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      {errorMessages.primaryCategory && (
                        <p className="text-sm text-primary-600 mt-1 flex items-center gap-1">
                          <AlertCircle className="w-4 h-4" />
                          {errorMessages.primaryCategory}
                        </p>
                      )}
                    </div>

                    <div>
                      <Label htmlFor="tagline" className="text-sm font-medium text-gray-700 mb-1.5 block">
                        Short tagline <span className="text-primary-600">*</span>
                      </Label>
                      <p className="text-xs text-gray-500 mb-2">Describe your work in one sentence (max 80 characters).</p>
                      <Input
                        id="tagline"
                        type="text"
                        value={tagline}
                        onChange={(e) => { setTagline(e.target.value); clearError('tagline'); }}
                        placeholder="e.g. I design modern dashboards and education app UI"
                        maxLength={80}
                        data-testid="input-tagline"
                      />
                      <p className="text-xs text-gray-500 mt-1">{tagline.length}/80</p>
                      {errorMessages.tagline && (
                        <p className="text-sm text-primary-600 mt-1 flex items-center gap-1">
                          <AlertCircle className="w-4 h-4" />
                          {errorMessages.tagline}
                        </p>
                      )}
                    </div>

                    <div>
                      <Label htmlFor="about" className="text-sm font-medium text-gray-700 mb-1.5 block">
                        About you <span className="text-primary-600">*</span>
                      </Label>
                      <p className="text-xs text-gray-500 mb-2">Tell clients about your experience, style, and what you offer (300-500 characters).</p>
                      <Textarea
                        id="about"
                        value={about}
                        onChange={(e) => { setAbout(e.target.value); clearError('about'); }}
                        placeholder="I am a UI/UX designer with 3+ years of experience creating dashboards, landing pages and education platforms. I focus on clean, modern designs and responsive layouts."
                        rows={5}
                        maxLength={500}
                        data-testid="textarea-about"
                      />
                      <p className="text-xs text-gray-500 mt-1">{about.length}/500</p>
                      {errorMessages.about && (
                        <p className="text-sm text-primary-600 mt-1 flex items-center gap-1">
                          <AlertCircle className="w-4 h-4" />
                          {errorMessages.about}
                        </p>
                      )}
                    </div>
                  </div>
                </div>

                {/* Preview Panel */}
                <div className="md:col-span-1">
                  <div className="bg-gradient-to-br from-[#0C332C] to-[#0f4a3d] rounded-xl p-6 text-white sticky top-6">
                    <h3 className="text-lg font-bold mb-4">Profile Preview</h3>
                    
                    <div className="space-y-4">
                      {/* Full Name */}
                      <div>
                        <p className="text-xs font-semibold text-gray-300 uppercase mb-1">Full Name</p>
                        <p className="text-sm font-medium">{fullName || '—'}</p>
                      </div>
                      
                      {/* Display Name */}
                      <div className="pt-2 border-t border-white/20">
                        <p className="text-xs font-semibold text-gray-300 uppercase mb-1">Display Name / Brand</p>
                        <p className="text-sm font-medium">{displayName || '—'}</p>
                      </div>
                      
                      {/* Email */}
                      <div className="pt-2 border-t border-white/20">
                        <p className="text-xs font-semibold text-gray-300 uppercase mb-1">Email</p>
                        <p className="text-sm font-medium break-all">{email || '—'}</p>
                      </div>
                      
                      {/* Country */}
                      <div className="pt-2 border-t border-white/20">
                        <p className="text-xs font-semibold text-gray-300 uppercase mb-1">Country</p>
                        <p className="text-sm font-medium">{country || '—'}</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="mt-8 flex justify-end">
                <Button
                  onClick={handleNext}
                  className="text-[#ffffff] bg-[#0C332C]"
                  data-testid="button-next-1"
                >
                  Next <ChevronRight className="ml-2 w-4 h-4" />
                </Button>
              </div>
            </div>
          )}

          {currentSection === 2 && (
            <div>
              <h2 className="text-2xl font-bold text-gray-900 mb-6">2. Skills & Services</h2>
              
              <div className="space-y-6">
                <div>
                  <Label className="text-sm font-medium text-gray-700 mb-3 block">
                    Your skills <span className="text-primary-600">*</span>
                  </Label>
                  <div className="flex flex-wrap gap-2">
                    {SKILLS_OPTIONS.map((skill) => (
                      <button
                        key={skill}
                        type="button"
                        onClick={() => toggleSkill(skill)}
                        className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
                          selectedSkills.includes(skill)
                            ? 'bg-[#0C332C] text-white hover:bg-[#2448b8]'
                            : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                        }`}
                        data-testid={`skill-${skill.toLowerCase().replace(/\s+/g, '-')}`}
                      >
                        {skill}
                      </button>
                    ))}
                  </div>
                  {errorMessages.skills && (
                    <p className="text-sm text-primary-600 mt-2 flex items-center gap-1">
                      <AlertCircle className="w-4 h-4" />
                      {errorMessages.skills}
                    </p>
                  )}
                </div>

                <div>
                  <Label className="text-sm font-medium text-gray-700 mb-3 block">
                    What do you want to offer? <span className="text-primary-600">*</span>
                  </Label>
                  <div className="space-y-3">
                    {[
                      'Ready-made templates & designs',
                      'Code components / starter projects',
                      'Study notes, worksheets & documents',
                      'Custom services (design, coding, academic help)',
                    ].map((service) => (
                      <label
                        key={service}
                        className="flex items-center gap-3 cursor-pointer group"
                      >
                        <Checkbox
                          checked={servicesOffered.includes(service)}
                          onCheckedChange={() => toggleService(service)}
                          className="data-[state=checked]:bg-[#0C332C]"
                          data-testid={`service-${service.toLowerCase().replace(/\s+/g, '-')}`}
                        />
                        <span className="text-gray-700 group-hover:text-gray-900" transition-all duration-300>{service}</span>
                      </label>
                    ))}
                  </div>
                  {errorMessages.services && (
                    <p className="text-sm text-primary-600 mt-2 flex items-center gap-1">
                      <AlertCircle className="w-4 h-4" />
                      {errorMessages.services}
                    </p>
                  )}
                </div>

                <div>
                  <Label className="text-sm font-medium text-gray-700 mb-3 block">
                    Portfolio links (optional)
                  </Label>
                  <div className="space-y-3">
                    <Input
                      type="url"
                      value={behanceUrl}
                      onChange={(e) => setBehanceUrl(e.target.value)}
                      placeholder="https://behance.net/username"
                      data-testid="input-behance"
                    />
                    <Input
                      type="url"
                      value={githubUrl}
                      onChange={(e) => setGithubUrl(e.target.value)}
                      placeholder="https://github.com/username"
                      data-testid="input-github"
                    />
                    <Input
                      type="url"
                      value={websiteUrl}
                      onChange={(e) => setWebsiteUrl(e.target.value)}
                      placeholder="https://yourwebsite.com"
                      data-testid="input-website"
                    />
                  </div>
                </div>
              </div>

              <div className="mt-8 flex justify-between">
                <Button
                  onClick={() => setCurrentSection(1)}
                  variant="outline"
                  data-testid="button-back-1"
                >
                  Back
                </Button>
                <Button
                  onClick={handleNext}
                  className="bg-[#0C332C] hover:bg-[#2448b8] text-white" transition-all duration-300
                  data-testid="button-next-2"
                >
                  Next <ChevronRight className="ml-2 w-4 h-4" />
                </Button>
              </div>
            </div>
          )}

          {currentSection === 3 && (
            <div>
              <h2 className="text-2xl font-bold text-gray-900 mb-4">3. Portfolio samples (minimum 9 items)</h2>
              <p className="text-gray-600 mb-2">
                Upload at least 9 examples of your best work. This helps us review and approve your freelancer profile.
              </p>
              <p className="text-sm font-semibold text-gray-900 mb-6">
                You have added {portfolioSamples.length} / 9 samples.
              </p>

              {errorMessages.portfolio && (
                <div className="mb-6 p-4 bg-primary/10 border border-red-200 rounded-lg">
                  <p className="text-sm text-primary-700 flex items-center gap-2">
                    <AlertCircle className="w-5 h-5" />
                    {errorMessages.portfolio}
                  </p>
                </div>
              )}

              <div className="grid md:grid-cols-3 gap-6">
                <div className="md:col-span-2">
                  <div className="bg-gray-50 rounded-lg p-6 space-y-4">
                    <h3 className="font-semibold text-gray-900 mb-4">Add new sample</h3>
                    
                    <div>
                      <Label htmlFor="sampleTitle" className="text-sm font-medium text-gray-700 mb-1.5 block">Title</Label>
                      <Input
                        id="sampleTitle"
                        type="text"
                        value={currentSample.title}
                        onChange={(e) => setCurrentSample({ ...currentSample, title: e.target.value })}
                        placeholder="School Dashboard UI – Web App"
                        data-testid="input-sample-title"
                      />
                      {errorMessages.sampleTitle && (
                        <p className="text-sm text-primary-600 mt-1">{errorMessages.sampleTitle}</p>
                      )}
                    </div>

                    <div>
                      <Label htmlFor="sampleCategory" className="text-sm font-medium text-gray-700 mb-1.5 block">Category</Label>
                      <Select value={currentSample.category} onValueChange={(value) => setCurrentSample({ ...currentSample, category: value })}>
                        <SelectTrigger id="sampleCategory" data-testid="select-sample-category">
                          <SelectValue placeholder="Select category" />
                        </SelectTrigger>
                        <SelectContent>
                          {PORTFOLIO_CATEGORIES.map((cat) => (
                            <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      {errorMessages.sampleCategory && (
                        <p className="text-sm text-primary-600 mt-1">{errorMessages.sampleCategory}</p>
                      )}
                    </div>

                    <div>
                      <Label htmlFor="sampleDescription" className="text-sm font-medium text-gray-700 mb-1.5 block">Description</Label>
                      <Textarea
                        id="sampleDescription"
                        value={currentSample.description}
                        onChange={(e) => setCurrentSample({ ...currentSample, description: e.target.value })}
                        placeholder="Responsive admin dashboard for managing students, classes and payments. Designed in Figma with light and dark mode."
                        rows={3}
                        data-testid="textarea-sample-description"
                      />
                      {errorMessages.sampleDescription && (
                        <p className="text-sm text-primary-600 mt-1">{errorMessages.sampleDescription}</p>
                      )}
                    </div>

                    <div>
                      <Label htmlFor="sampleFiles" className="text-sm font-medium text-gray-700 mb-1.5 block">Upload files</Label>
                      <p className="text-xs text-gray-500 mb-2">Upload images, PDFs, or zipped files that clearly show this work.</p>
                      <Input
                        id="sampleFiles"
                        type="file"
                        onChange={handleFileChange}
                        multiple
                        accept=".png,.jpg,.jpeg,.pdf,.zip"
                        data-testid="input-sample-files"
                      />
                      {currentSample.files.length > 0 && (
                        <p className="text-xs text-gray-600 mt-1">{currentSample.files.length} file(s) selected</p>
                      )}
                      {errorMessages.sampleFiles && (
                        <p className="text-sm text-primary-600 mt-1">{errorMessages.sampleFiles}</p>
                      )}
                    </div>

                    <Button
                      onClick={addPortfolioSample}
                      className="w-full bg-[#0C332C] hover:bg-[#2448b8] text-white" transition-all duration-300
                      data-testid="button-add-sample"
                    >
                      <Upload className="w-4 h-4 mr-2" />
                      Add Sample
                    </Button>
                  </div>

                  {portfolioSamples.length > 0 && (
                    <div className="mt-6">
                      <h3 className="font-semibold text-gray-900 mb-4">Added samples ({portfolioSamples.length})</h3>
                      <div className="space-y-3">
                        {portfolioSamples.map((sample, index) => (
                          <div key={index} className="bg-white rounded-lg p-4 flex justify-between items-start">
                            <div className="flex-1">
                              <h4 className="font-semibold text-gray-900">{sample.title}</h4>
                              <p className="text-sm text-gray-600">{sample.category}</p>
                              <p className="text-xs text-gray-500 mt-1">{sample.files.length} file(s)</p>
                            </div>
                            <Button
                              onClick={() => removePortfolioSample(index)}
                              variant="ghost"
                              size="sm"
                              className="text-primary-600 hover:text-primary-700 hover:bg-primary/50" transition-all duration-300
                              data-testid={`button-remove-sample-${index}`}
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                <div className="hidden md:block">
                  <div className="bg-blue-50 rounded-lg p-5 sticky top-6">
                    <h4 className="font-semibold text-gray-900 mb-3">Need ideas for what to upload?</h4>
                    <ul className="text-sm text-gray-700 space-y-2">
                      <li>– Landing page UI</li>
                      <li>– Mobile app screens</li>
                      <li>– Dashboard or admin panel</li>
                      <li>– Logos & branding</li>
                      <li>– Social media post pack</li>
                      <li>– Web template (HTML/CSS)</li>
                      <li>– React / Flutter components</li>
                      <li>– Study notes or worksheets</li>
                      <li>– Exam prep summary / revision pack</li>
                    </ul>
                  </div>
                </div>
              </div>

              <div className="mt-8 flex justify-between">
                <Button
                  onClick={() => setCurrentSection(2)}
                  variant="outline"
                  data-testid="button-back-2"
                >
                  Back
                </Button>
                <Button
                  onClick={handleNext}
                  className="bg-[#0C332C] hover:bg-[#2448b8] text-white" transition-all duration-300
                  data-testid="button-next-3"
                >
                  Next <ChevronRight className="ml-2 w-4 h-4" />
                </Button>
              </div>
            </div>
          )}

          {currentSection === 4 && (
            <div>
              <h2 className="text-2xl font-bold text-gray-900 mb-4">4. Agreement</h2>
              
              <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                <p className="text-sm text-gray-700 mb-3">
                  Before accepting, please review our terms and policies:
                </p>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setTermsModalOpen(true)}
                  className="text-[#0C332C] border-[#0C332C] hover:bg-[#0C332C] hover:text-white" transition-all duration-300
                  data-testid="button-view-terms"
                >
                  View Freelancer Terms & Policies
                </Button>
              </div>

              <div className="space-y-4 mb-6">
                <label className="flex items-start gap-3 cursor-pointer group">
                  <Checkbox
                    checked={termsAccepted}
                    onCheckedChange={(checked) => { setTermsAccepted(!!checked); clearError('terms'); }}
                    className="mt-1 data-[state=checked]:bg-[#0C332C]"
                    data-testid="checkbox-terms"
                  />
                  <span className="text-gray-700 group-hover:text-gray-900" transition-all duration-300>
                    I confirm that all work I upload is my own or I have the legal right to sell it.
                  </span>
                </label>
                {errorMessages.terms && (
                  <p className="text-sm text-primary-600 flex items-center gap-1 ml-8">
                    <AlertCircle className="w-4 h-4" />
                    {errorMessages.terms}
                  </p>
                )}

                <label className="flex items-start gap-3 cursor-pointer group">
                  <Checkbox
                    checked={policyAccepted}
                    onCheckedChange={(checked) => { setPolicyAccepted(!!checked); clearError('policy'); }}
                    className="mt-1 data-[state=checked]:bg-[#0C332C]"
                    data-testid="checkbox-policy"
                  />
                  <span className="text-gray-700 group-hover:text-gray-900" transition-all duration-300>
                    I agree to EduFiliova's{' '}
                    <button
                      type="button"
                      onClick={() => setTermsModalOpen(true)}
                      className="text-[#0C332C] underline hover:text-[#2448b8]" transition-all duration-300
                    >
                      Freelancer Terms, Commission Policy, and Refund Policy
                    </button>.
                  </span>
                </label>
                {errorMessages.policy && (
                  <p className="text-sm text-primary-600 flex items-center gap-1 ml-8">
                    <AlertCircle className="w-4 h-4" />
                    {errorMessages.policy}
                  </p>
                )}

                <label className="flex items-start gap-3 cursor-pointer group">
                  <Checkbox
                    checked={reviewAccepted}
                    onCheckedChange={(checked) => { setReviewAccepted(!!checked); clearError('review'); }}
                    className="mt-1 data-[state=checked]:bg-[#0C332C]"
                    data-testid="checkbox-review"
                  />
                  <span className="text-gray-700 group-hover:text-gray-900" transition-all duration-300>
                    I understand that EduFiliova may review, approve or reject my freelancer application.
                  </span>
                </label>
                {errorMessages.review && (
                  <p className="text-sm text-primary-600 flex items-center gap-1 ml-8">
                    <AlertCircle className="w-4 h-4" />
                    {errorMessages.review}
                  </p>
                )}
              </div>

              {errorMessages.submit && (
                <div className="mb-6 p-4 bg-primary/10 border border-red-200 rounded-lg">
                  <p className="text-sm text-primary-700 flex items-center gap-2">
                    <AlertCircle className="w-5 h-5" />
                    {errorMessages.submit}
                  </p>
                </div>
              )}

              <div className="mt-8 flex justify-between">
                <Button
                  onClick={() => setCurrentSection(3)}
                  variant="outline"
                  data-testid="button-back-3"
                >
                  Back
                </Button>
                <Button
                  onClick={handleSubmit}
                  disabled={isSubmitting || portfolioSamples.length < 9}
                  className="bg-[#0C332C] hover:bg-[#2448b8] text-white disabled:opacity-50 disabled:cursor-not-allowed" transition-all duration-300
                  data-testid="button-submit"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Submitting...
                    </>
                  ) : (
                    'Submit application'
                  )}
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>

      <FreelancerTermsModal
        isOpen={termsModalOpen}
        onClose={() => setTermsModalOpen(false)}
      />
    </div>
  );
}
