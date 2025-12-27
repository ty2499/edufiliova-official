import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useMutation, useQuery } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { apiRequest } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import PhoneNumberInput from "@/components/PhoneNumberInput";
import { Progress } from "@/components/ui/progress";
import { Upload, ArrowLeft, ArrowRight, Loader2, X, Check } from "lucide-react";
import { cn } from "@/lib/utils";
import { CheckmarkIcon } from "@/components/ui/checkmark-icon";
import TeacherTermsModal from "@/components/TeacherTermsModal";

const teachingCategories = [
  "Mathematics",
  "Physical Sciences",
  "Life Sciences",
  "English",
  "Accounting",
  "Economics",
  "Geography",
  "Business Studies",
  "Technology",
  "Computer Science / IT",
  "Life Orientation",
  "Other"
];

const gradeLevels = [
  "Grade 1-3",
  "Grade 4-6",
  "Grade 7-9",
  "Grade 10-12",
  "Adult Learning / Skills Training"
];

const teachingStyles = [
  "Recorded lessons",
  "Live video classes",
  "Assignments & worksheets",
  "Course building",
  "Revision & tutoring",
  "Mixed teaching"
];

const qualifications = [
  "Diploma",
  "Degree",
  "Honours",
  "Masters",
  "PhD",
  "Teaching Certificate"
];

const experienceLevels = [
  "0-1 years",
  "2-4 years",
  "5-9 years",
  "10+ years"
];

const teacherSignupSchema = z.object({
  passportPhotoUrl: z.string().optional(),
  fullName: z.string().min(2, "Full name is required"),
  displayName: z.string().min(2, "Display name is required"),
  email: z.string().email("Valid email is required"),
  phoneNumber: z.string().min(10, "Valid phone number is required"),
  dateOfBirth: z.string().min(1, "Date of birth is required"),
  gender: z.string().optional(),
  country: z.string().min(1, "Country is required"),
  teachingCategories: z.array(z.string()).min(1, "Select at least one category"),
  gradeLevels: z.array(z.string()).min(1, "Select at least one grade level"),
  preferredTeachingStyle: z.string().optional(),
  highestQualification: z.string().min(1, "Qualification is required"),
  qualificationCertificates: z.array(z.string()).optional(),
  idPassportDocument: z.string().min(1, "ID/Passport document is required"),
  cvResume: z.string().optional(),
  yearsOfExperience: z.string().min(1, "Years of experience is required"),
  experienceSummary: z.string().min(50, "Please provide at least 50 characters"),
  proofOfTeaching: z.array(z.string()).optional(),
  sampleMaterials: z.array(z.string()).optional(),
  introductionVideo: z.string().optional(),
  agreementTruthful: z.boolean().refine((val) => val === true, "You must confirm this"),
  agreementContent: z.boolean().refine((val) => val === true, "You must confirm this"),
  agreementTerms: z.boolean().refine((val) => val === true, "You must accept terms"),
  agreementUnderstand: z.boolean().refine((val) => val === true, "You must confirm this"),
  agreementSafety: z.boolean().refine((val) => val === true, "You must confirm this"),
});

type TeacherSignupForm = z.infer<typeof teacherSignupSchema>;

export default function TeacherSignup() {
  const [, navigate] = useLocation();
  const [currentStep, setCurrentStep] = useState(1);
  const totalSteps = 7;
  const [uploadingFiles, setUploadingFiles] = useState<Record<string, boolean>>({});
  const [applicationId, setApplicationId] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [showTermsModal, setShowTermsModal] = useState(false);

  const { data: countries } = useQuery<Array<{id: number, name: string}>>({
    queryKey: ['/api/countries'],
  });

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const id = params.get('applicationId');
    setApplicationId(id);
  }, []);

  const { data: existingApplication, isLoading: loadingApplication } = useQuery<any>({
    queryKey: [`/api/teacher-applications/${applicationId}`],
    enabled: !!applicationId,
  });

  const form = useForm<TeacherSignupForm>({
    resolver: zodResolver(teacherSignupSchema),
    defaultValues: {
      teachingCategories: [],
      gradeLevels: [],
      qualificationCertificates: [],
      proofOfTeaching: [],
      sampleMaterials: [],
      agreementTruthful: false,
      agreementContent: false,
      agreementTerms: false,
      agreementUnderstand: false,
      agreementSafety: false,
    },
  });

  useEffect(() => {
    if (existingApplication) {
      form.reset({
        fullName: existingApplication.fullName || '',
        displayName: existingApplication.displayName || '',
        email: existingApplication.email || '',
        country: existingApplication.country || '',
        phoneNumber: existingApplication.phoneNumber || '',
        dateOfBirth: existingApplication.dateOfBirth || '',
        gender: existingApplication.gender || '',
        passportPhotoUrl: existingApplication.passportPhotoUrl || '',
        teachingCategories: existingApplication.teachingCategories || [],
        gradeLevels: existingApplication.gradeLevels || [],
        preferredTeachingStyle: existingApplication.preferredTeachingStyle || '',
        highestQualification: existingApplication.highestQualification || '',
        qualificationCertificates: existingApplication.qualificationCertificates || [],
        idPassportDocument: existingApplication.idPassportDocument || '',
        cvResume: existingApplication.cvResume || '',
        yearsOfExperience: existingApplication.yearsOfExperience || '',
        experienceSummary: existingApplication.experienceSummary || '',
        proofOfTeaching: existingApplication.proofOfTeaching || [],
        sampleMaterials: existingApplication.sampleMaterials || [],
        introductionVideo: existingApplication.introductionVideo || '',
        agreementTruthful: existingApplication.agreementTruthful || false,
        agreementContent: existingApplication.agreementContent || false,
        agreementTerms: existingApplication.agreementTerms || false,
        agreementUnderstand: existingApplication.agreementUnderstand || false,
        agreementSafety: existingApplication.agreementSafety || false,
      });
    }
  }, [existingApplication, form]);

  const handleFileUpload = async (files: FileList | null, documentType: string, fieldName: keyof TeacherSignupForm) => {
    if (!files || files.length === 0) return;

    setUploadingFiles(prev => ({ ...prev, [documentType]: true }));

    try {
      const formData = new FormData();
      Array.from(files).forEach(file => {
        formData.append('files', file);
      });
      formData.append('documentType', documentType);

      const response = await fetch('/api/teacher-applications/upload', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        throw new Error('Upload failed');
      }

      const data = await response.json();
      
      if (data.success && data.files && data.files.length > 0) {
        const urls = data.files.map((f: any) => f.url);
        
        if (Array.isArray(form.getValues(fieldName))) {
          form.setValue(fieldName as any, urls);
        } else {
          form.setValue(fieldName as any, urls[0]);
        }

        setSuccessMessage(`${data.files.length} file(s) uploaded successfully`);
        setTimeout(() => setSuccessMessage(""), 3000);
      }
    } catch (error) {
      setErrorMessage("Failed to upload files. Please try again.");
      setTimeout(() => setErrorMessage(""), 5000);
    } finally {
      setUploadingFiles(prev => ({ ...prev, [documentType]: false }));
    }
  };

  const submitMutation = useMutation({
    mutationFn: async (data: TeacherSignupForm) => {
      if (applicationId) {
        return apiRequest(`/api/teacher-applications/${applicationId}`, {
          method: "PUT",
          body: JSON.stringify(data),
        });
      } else {
        return apiRequest("/api/teacher-applications", {
          method: "POST",
          body: JSON.stringify(data),
        });
      }
    },
    onSuccess: (data) => {
      setSuccessMessage("Your teacher application has been submitted successfully.");
      setTimeout(() => {
        navigate(`/?page=teacher-application-status&id=${data.id}`);
      }, 1500);
    },
    onError: (error: Error) => {
      setErrorMessage(error.message);
    },
  });

  const onSubmit = (data: TeacherSignupForm) => {
    submitMutation.mutate(data);
  };

  const nextStep = async () => {
    const fieldsToValidate = getFieldsForStep(currentStep);
    const isValid = await form.trigger(fieldsToValidate);
    if (isValid) {
      setCurrentStep((prev) => Math.min(prev + 1, totalSteps));
    }
  };

  const prevStep = () => {
    setCurrentStep((prev) => Math.max(prev - 1, 1));
  };

  const getFieldsForStep = (step: number): (keyof TeacherSignupForm)[] => {
    switch (step) {
      case 1:
        return ["fullName", "displayName", "email", "phoneNumber", "dateOfBirth", "country"];
      case 2:
        return ["teachingCategories", "gradeLevels"];
      case 3:
        return ["highestQualification", "idPassportDocument"];
      case 4:
        return ["yearsOfExperience", "experienceSummary"];
      case 5:
        return [];
      case 6:
        return [];
      case 7:
        return ["agreementTruthful", "agreementContent", "agreementTerms", "agreementUnderstand", "agreementSafety"];
      default:
        return [];
    }
  };

  const handleCategoryToggle = (category: string) => {
    const current = form.getValues("teachingCategories");
    if (current.includes(category)) {
      form.setValue(
        "teachingCategories",
        current.filter((c) => c !== category)
      );
    } else {
      form.setValue("teachingCategories", [...current, category]);
    }
  };

  const handleGradeLevelToggle = (level: string) => {
    const current = form.getValues("gradeLevels");
    if (current.includes(level)) {
      form.setValue(
        "gradeLevels",
        current.filter((l) => l !== level)
      );
    } else {
      form.setValue("gradeLevels", [...current, level]);
    }
  };

  const progress = (currentStep / totalSteps) * 100;

  if (loadingApplication) {
    return (
      <div className="min-h-screen bg-white py-12 px-4 sm:px-6 lg:px-8 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-12 w-12 animate-spin text-foreground mx-auto mb-4" />
          <p className="text-muted-foreground">Loading your application...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-3xl mx-auto">
        <div className="mb-8">
          <h1 className="text-lg sm:text-2xl font-bold text-gray-900 mb-2">
            {applicationId ? "Complete Your Teacher Application" : "Apply as a Teacher on EduFiliova"}
          </h1>
          <p className="text-gray-700 text-sm sm:text-lg">
            {applicationId 
              ? "Fill in the remaining details to complete your application"
              : "Teach globally, earn from your lessons, and help students progress with quality education."}
          </p>
        </div>

        <Progress value={progress} className="mb-6 h-1.5 bg-gray-200" data-testid="progress-bar" />

        <div className="space-y-6">
          <div className="mb-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-2">
              Step {currentStep} of {totalSteps}
            </h2>
          <p className="text-gray-600 text-sm">
            {currentStep === 1 && "Basic Personal Information"}
            {currentStep === 2 && "Teaching Details"}
            {currentStep === 3 && "Qualifications & Identity Verification"}
            {currentStep === 4 && "Teaching Experience"}
            {currentStep === 5 && "Lesson Samples (Quality Check)"}
            {currentStep === 6 && "Account & Payment Setup (Later)"}
            {currentStep === 7 && "Agreements"}
          </p>
          </div>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              {errorMessage && (
                <div className="p-3 bg-primary/10 border border-red-200 rounded-lg text-primary-700 text-sm">
                  {errorMessage}
                </div>
              )}
              {successMessage && (
                <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg text-blue-700 text-sm">
                  {successMessage}
                </div>
              )}
              {currentStep === 1 && (
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="passportPhoto">Upload Passport Photo</Label>
                    <Input
                      id="passportPhoto"
                      type="file"
                      accept="image/jpeg,image/png"
                      data-testid="input-passport-photo"
                      className="mt-1"
                      onChange={(e) => handleFileUpload(e.target.files, 'passport-photo', 'passportPhotoUrl')}
                      disabled={uploadingFiles['passport-photo']}
                    />
                    {uploadingFiles['passport-photo'] && (
                      <p className="text-sm text-gray-600 mt-1 flex items-center gap-2">
                        <Loader2 className="w-4 h-4 animate-spin" />
                        Uploading...
                      </p>
                    )}
                    {form.watch('passportPhotoUrl') && (
                      <p className="text-sm text-[#2f5a4e] mt-1 flex items-center gap-2">
                        <CheckmarkIcon size="sm" />
                        Photo uploaded successfully
                      </p>
                    )}
                    <p className="text-sm text-gray-600 mt-1">
                      Clear, front-facing, professional photo. JPG/PNG only. Required.
                    </p>
                  </div>

                  <div className="border rounded-lg p-4 bg-gray-50">
                    <img 
                      src="/attached_assets/edf90f7f-b602-47d9-bf09-080d690654d2_1766854999031.png" 
                      alt="Profile picture guidelines - what is and isn't accepted"
                      className="w-full rounded-lg"
                    />
                    <div className="mt-3 space-y-2 text-sm">
                      <p className="font-medium text-gray-900">Requirements:</p>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="border-l-4 border-green-500 pl-3">
                          <p className="font-medium text-green-700">✓ Accepted</p>
                          <ul className="text-gray-600 space-y-1 mt-1">
                            <li>• Clear, professional photos</li>
                            <li>• Good lighting</li>
                            <li>• Face clearly visible</li>
                          </ul>
                        </div>
                        <div className="border-l-4 border-red-500 pl-3">
                          <p className="font-medium text-red-700">✗ Not Accepted</p>
                          <ul className="text-gray-600 space-y-1 mt-1">
                            <li>• Blurry or filtered</li>
                            <li>• Cartoons or logos</li>
                            <li>• Group photos</li>
                            <li>• Face hidden</li>
                          </ul>
                        </div>
                      </div>
                    </div>
                    <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                      <p className="text-sm text-blue-900">
                        <span className="font-medium">Why this matters:</span> A clear, professional profile photo helps build trust with students and families. It verifies your identity, ensures we can recognize you, and creates a professional first impression. Students and parents need to see who they're working with. Blurry, filtered, or hidden photos make it difficult to verify your identity and can raise security concerns.
                      </p>
                    </div>
                  </div>

                  <div>
                    <Label htmlFor="fullName">Full Name *</Label>
                    <Input
                      id="fullName"
                      placeholder="e.g. Purity Johns"
                      data-testid="input-full-name"
                      {...form.register("fullName")}
                      disabled={!!applicationId}
                    />
                    {form.formState.errors.fullName && (
                      <p className="text-sm text-destructive mt-1">{form.formState.errors.fullName.message}</p>
                    )}
                  </div>

                  <div>
                    <Label htmlFor="displayName">Display Name (Shown to Students) *</Label>
                    <Input
                      id="displayName"
                      placeholder="e.g. Mrs. P Johns"
                      data-testid="input-display-name"
                      {...form.register("displayName")}
                      disabled={!!applicationId}
                    />
                    {form.formState.errors.displayName && (
                      <p className="text-sm text-destructive mt-1">{form.formState.errors.displayName.message}</p>
                    )}
                  </div>

                  <div>
                    <Label htmlFor="email">Email Address *</Label>
                    <Input
                      id="email"
                      type="email"
                      placeholder="e.g. lebo@example.com"
                      data-testid="input-email"
                      {...form.register("email")}
                      disabled={!!applicationId}
                    />
                    {form.formState.errors.email && (
                      <p className="text-sm text-destructive mt-1">{form.formState.errors.email.message}</p>
                    )}
                  </div>

                  <div>
                    <Label htmlFor="phoneNumber">Phone Number *</Label>
                    <PhoneNumberInput
                      value={form.watch("phoneNumber") || ""}
                      onChange={(value) => form.setValue("phoneNumber", value)}
                      data-testid="input-phone"
                    />
                    {form.formState.errors.phoneNumber && (
                      <p className="text-sm text-destructive mt-1">{form.formState.errors.phoneNumber.message}</p>
                    )}
                  </div>

                  <div>
                    <Label htmlFor="dateOfBirth">Date of Birth *</Label>
                    <Input
                      id="dateOfBirth"
                      type="date"
                      data-testid="input-dob"
                      {...form.register("dateOfBirth")}
                    />
                    <p className="text-sm text-gray-600 mt-1">For teacher identity verification.</p>
                    {form.formState.errors.dateOfBirth && (
                      <p className="text-sm text-destructive mt-1">{form.formState.errors.dateOfBirth.message}</p>
                    )}
                  </div>

                  <div>
                    <Label htmlFor="gender">Gender (Optional)</Label>
                    <Select 
                      value={form.watch("gender")}
                      onValueChange={(value) => form.setValue("gender", value)}
                    >
                      <SelectTrigger data-testid="select-gender">
                        <SelectValue placeholder="Select gender" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="male">Male</SelectItem>
                        <SelectItem value="female">Female</SelectItem>
                        <SelectItem value="prefer_not_to_say">Prefer not to say</SelectItem>
                      </SelectContent>
                    </Select>
                    <p className="text-sm text-gray-600 mt-1">Used for identification only.</p>
                  </div>

                  <div>
                    <Label htmlFor="country">Country of Residence *</Label>
                    <Select
                      value={form.watch("country")}
                      onValueChange={(value) => form.setValue("country", value)}
                      disabled={!!applicationId}
                    >
                      <SelectTrigger data-testid="select-country">
                        <SelectValue placeholder="Select your country" />
                      </SelectTrigger>
                      <SelectContent>
                        {countries?.map((country) => (
                          <SelectItem key={country.id} value={country.name}>
                            {country.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    {form.formState.errors.country && (
                      <p className="text-sm text-destructive mt-1">{form.formState.errors.country.message}</p>
                    )}
                  </div>
                </div>
              )}

              {currentStep === 2 && (
                <div className="space-y-4">
                  <div>
                    <Label>Teaching Categories (Primary Focus Area) *</Label>
                    <p className="text-sm text-gray-600 mb-3">Must pick at least 1</p>
                          <div className="flex flex-wrap gap-2">
                            {teachingCategories.map((category) => (
                              <button
                                key={category}
                                type="button"
                                onClick={() => handleCategoryToggle(category)}
                                className={cn(
                                  "px-3 py-1.5 rounded-full text-xs font-medium border transition-colors",
                                  form.watch("teachingCategories").includes(category)
                                    ? "bg-[#0c332c] text-white border-[#0c332c]"
                                    : "bg-white text-gray-600 border-gray-200 hover:border-gray-300"
                                )}
                              >
                                {category}
                              </button>
                            ))}
                          </div>
                    {form.formState.errors.teachingCategories && (
                      <p className="text-sm text-destructive mt-2">{form.formState.errors.teachingCategories.message}</p>
                    )}
                  </div>

                  <div>
                    <Label>Grade Levels You Teach *</Label>
                    <p className="text-sm text-gray-600 mb-3">Select at least one</p>
                          <div className="flex flex-wrap gap-2">
                            {gradeLevels.map((level) => (
                              <button
                                key={level}
                                type="button"
                                onClick={() => handleGradeLevelToggle(level)}
                                className={cn(
                                  "px-3 py-1.5 rounded-full text-xs font-medium border transition-colors",
                                  form.watch("gradeLevels").includes(level)
                                    ? "bg-[#0c332c] text-white border-[#0c332c]"
                                    : "bg-white text-gray-600 border-gray-200 hover:border-gray-300"
                                )}
                              >
                                {level}
                              </button>
                            ))}
                          </div>
                    {form.formState.errors.gradeLevels && (
                      <p className="text-sm text-destructive mt-2">{form.formState.errors.gradeLevels.message}</p>
                    )}
                  </div>

                  <div>
                    <Label htmlFor="teachingStyle">Preferred Teaching Style (Optional)</Label>
                    <Select 
                      value={form.watch("preferredTeachingStyle")}
                      onValueChange={(value) => form.setValue("preferredTeachingStyle", value)}
                    >
                      <SelectTrigger data-testid="select-teaching-style">
                        <SelectValue placeholder="Select teaching style" />
                      </SelectTrigger>
                      <SelectContent>
                        {teachingStyles.map((style) => (
                          <SelectItem key={style} value={style}>{style}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              )}

              {currentStep === 3 && (
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="qualification">Highest Qualification *</Label>
                    <Select
                      value={form.watch("highestQualification")}
                      onValueChange={(value) => form.setValue("highestQualification", value)}
                    >
                      <SelectTrigger data-testid="select-qualification">
                        <SelectValue placeholder="Select qualification" />
                      </SelectTrigger>
                      <SelectContent>
                        {qualifications.map((qual) => (
                          <SelectItem key={qual} value={qual}>{qual}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    {form.formState.errors.highestQualification && (
                      <p className="text-sm text-destructive mt-1">{form.formState.errors.highestQualification.message}</p>
                    )}
                  </div>

                  <div>
                    <Label htmlFor="qualificationCert">Upload Qualification Certificate(s) *</Label>
                    <Input
                      id="qualificationCert"
                      type="file"
                      accept="application/pdf,image/jpeg,image/png"
                      multiple
                      data-testid="input-qualification-cert"
                      className="mt-1"
                      onChange={(e) => handleFileUpload(e.target.files, 'qualification-cert', 'qualificationCertificates')}
                      disabled={uploadingFiles['qualification-cert']}
                    />
                    <p className="text-sm text-gray-600 mt-1 flex items-center gap-2">
                        <Loader2 className="w-4 h-4 animate-spin" />
                        Uploading certificates...
                      </p>
                    {form.watch('qualificationCertificates')?.length ? (
                      <p className="text-sm text-[#2f5a4e] mt-1 flex items-center gap-2">
                        <CheckmarkIcon size="sm" />
                        {form.watch('qualificationCertificates')?.length || 0} certificate(s) uploaded
                      </p>
                    ) : null}
                    <p className="text-sm text-gray-600 mt-1">Accept: PDF, JPG, PNG. Required.</p>
                  </div>

                  <div className="border rounded-lg p-4 bg-gray-50">
                    <p className="font-medium text-gray-900 mb-3">Teaching Certificate Guidelines - Accepted Examples:</p>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                      <div className="text-center">
                        <img 
                          src="/attached_assets/image_1766855802891.png" 
                          alt="University teaching diploma - ACCEPTED"
                          className="w-full h-40 object-cover rounded-lg border-2 border-green-500 mb-2"
                        />
                        <p className="text-sm font-medium text-green-700">✓ University Diploma</p>
                        <p className="text-xs text-gray-600 mt-1">Formal teaching degree</p>
                      </div>
                      <div className="text-center">
                        <img 
                          src="/attached_assets/image_1766855812937.png" 
                          alt="Degree certificate in frame - ACCEPTED"
                          className="w-full h-40 object-cover rounded-lg border-2 border-green-500 mb-2"
                        />
                        <p className="text-sm font-medium text-green-700">✓ Degree Certificate</p>
                        <p className="text-xs text-gray-600 mt-1">Educational qualification</p>
                      </div>
                      <div className="text-center">
                        <img 
                          src="/attached_assets/image_1766855821676.png" 
                          alt="Professional teaching certificate - ACCEPTED"
                          className="w-full h-40 object-cover rounded-lg border-2 border-green-500 mb-2"
                        />
                        <p className="text-sm font-medium text-green-700">✓ Teaching Certificate</p>
                        <p className="text-xs text-gray-600 mt-1">Professional credential</p>
                      </div>
                    </div>
                    <div className="border-l-4 border-green-500 pl-3 mb-4">
                      <p className="font-medium text-green-700 mb-2">✓ What Makes Good Certificates</p>
                      <ul className="text-sm text-gray-600 space-y-1">
                        <li>• Clear, readable document (PDF or scanned image)</li>
                        <li>• Shows your name and qualification</li>
                        <li>• From recognized institution or organization</li>
                        <li>• Date of issue clearly visible</li>
                        <li>• Official seal, signature, or institution stamp</li>
                        <li>• Full page or both sides if double-sided</li>
                      </ul>
                    </div>
                    <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
                      <p className="text-sm text-blue-900">
                        <span className="font-medium">Why this matters:</span> Teaching certificates verify your qualifications and credentials. We need clear, official documentation to confirm you have the proper education and training to teach effectively. This protects students and ensures quality instruction.
                      </p>
                    </div>
                  </div>

                  <div>
                    <Label htmlFor="idPassport">Upload ID/Passport (Identity Proof) *</Label>
                    <Input
                      id="idPassport"
                      type="file"
                      accept="application/pdf,image/jpeg,image/png"
                      data-testid="input-id-passport"
                      className="mt-1"
                      onChange={(e) => handleFileUpload(e.target.files, 'id-passport', 'idPassportDocument')}
                      disabled={uploadingFiles['id-passport']}
                    />
                    {uploadingFiles['id-passport'] && (
                      <p className="text-sm text-gray-600 mt-1 flex items-center gap-2">
                        <Loader2 className="w-4 h-4 animate-spin" />
                        Uploading ID...
                      </p>
                    )}
                    {form.watch('idPassportDocument') && (
                      <p className="text-sm text-[#2f5a4e] mt-1 flex items-center gap-2">
                        <CheckmarkIcon size="sm" />
                        ID/Passport uploaded
                      </p>
                    )}
                    <p className="text-sm text-gray-600 mt-1">For teacher verification. Accept: PDF, JPG, PNG. Required.</p>
                    {form.formState.errors.idPassportDocument && (
                      <p className="text-sm text-destructive mt-1">{form.formState.errors.idPassportDocument.message}</p>
                    )}
                  </div>

                  <div>
                    <Label htmlFor="cvResume">Upload CV / Resume</Label>
                    <Input
                      id="cvResume"
                      type="file"
                      accept="application/pdf"
                      data-testid="input-cv"
                      className="mt-1"
                      onChange={(e) => handleFileUpload(e.target.files, 'cv-resume', 'cvResume')}
                      disabled={uploadingFiles['cv-resume']}
                    />
                    {uploadingFiles['cv-resume'] && (
                      <p className="text-sm text-gray-600 mt-1 flex items-center gap-2">
                        <Loader2 className="w-4 h-4 animate-spin" />
                        Uploading CV...
                      </p>
                    )}
                    {form.watch('cvResume') && (
                      <p className="text-sm text-[#2f5a4e] mt-1 flex items-center gap-2">
                        <CheckmarkIcon size="sm" />
                        CV uploaded
                      </p>
                    )}
                    <p className="text-sm text-gray-600 mt-1">Optional but boosts approval. Accept: PDF.</p>
                  </div>

                  <div className="border rounded-lg p-4 bg-gray-50">
                    <p className="font-medium text-gray-900 mb-3">Resume Guidelines - Examples We Do NOT Accept:</p>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                      <div className="text-center">
                        <img 
                          src="/attached_assets/image_1766855463199.png" 
                          alt="Generic professional resume - NOT ACCEPTED"
                          className="w-full h-40 object-cover rounded-lg border-2 border-red-500 mb-2"
                        />
                        <p className="text-sm font-medium text-red-700">✗ Non-Teaching Resume</p>
                        <p className="text-xs text-gray-600 mt-1">Not tailored for teaching role</p>
                      </div>
                      <div className="text-center">
                        <img 
                          src="/attached_assets/image_1766855472096.png" 
                          alt="Generic template - NOT ACCEPTED"
                          className="w-full h-40 object-cover rounded-lg border-2 border-red-500 mb-2"
                        />
                        <p className="text-sm font-medium text-red-700">✗ Generic Template</p>
                        <p className="text-xs text-gray-600 mt-1">Generic format without teaching focus</p>
                      </div>
                      <div className="text-center">
                        <img 
                          src="/attached_assets/image_1766855560025.png" 
                          alt="Personal CV format - NOT ACCEPTED"
                          className="w-full h-40 object-cover rounded-lg border-2 border-red-500 mb-2"
                        />
                        <p className="text-sm font-medium text-red-700">✗ Generic CV Format</p>
                        <p className="text-xs text-gray-600 mt-1">Not specific to teaching experience</p>
                      </div>
                    </div>
                    <div className="border-l-4 border-red-500 pl-3 mb-4">
                      <p className="font-medium text-red-700 mb-2">✗ Why We Reject Generic Resumes</p>
                      <ul className="text-sm text-gray-600 space-y-1">
                        <li>• Not focused on teaching experience and skills</li>
                        <li>• Don't highlight educational background or certifications</li>
                        <li>• Generic job experience (lawyers, business roles, etc.)</li>
                        <li>• Missing teaching methodology and subject expertise</li>
                        <li>• Don't demonstrate student impact or teaching achievements</li>
                      </ul>
                    </div>
                    <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
                      <p className="text-sm text-blue-900">
                        <span className="font-medium">What we need instead:</span> Please provide a resume that specifically highlights your teaching experience, qualifications, subjects you teach, student outcomes, teaching methods, and educational achievements. Focus on your teaching role, not generic job experience.
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {currentStep === 4 && (
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="experience">Years of Experience *</Label>
                    <Select
                      value={form.watch("yearsOfExperience")}
                      onValueChange={(value) => form.setValue("yearsOfExperience", value)}
                    >
                      <SelectTrigger data-testid="select-experience">
                        <SelectValue placeholder="Select experience level" />
                      </SelectTrigger>
                      <SelectContent>
                        {experienceLevels.map((level) => (
                          <SelectItem key={level} value={level}>{level}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    {form.formState.errors.yearsOfExperience && (
                      <p className="text-sm text-destructive mt-1">{form.formState.errors.yearsOfExperience.message}</p>
                    )}
                  </div>

                  <div>
                    <Label htmlFor="experienceSummary">Experience Summary *</Label>
                    <Textarea
                      id="experienceSummary"
                      placeholder="I have taught Grade 10-12 Maths for 4 years and specialize in exam preparation..."
                      rows={5}
                      data-testid="textarea-experience-summary"
                      {...form.register("experienceSummary")}
                    />
                    <p className="text-sm text-gray-600 mt-1">
                      Minimum 50 characters. Current: {form.watch("experienceSummary")?.length || 0}
                    </p>
                    {form.formState.errors.experienceSummary && (
                      <p className="text-sm text-destructive mt-1">{form.formState.errors.experienceSummary.message}</p>
                    )}
                  </div>

                  <div>
                    <Label htmlFor="proofTeaching">Proof of Previous Teaching</Label>
                    <Input
                      id="proofTeaching"
                      type="file"
                      accept="application/pdf,image/jpeg,image/png"
                      multiple
                      data-testid="input-proof-teaching"
                      className="mt-1"
                      onChange={(e) => handleFileUpload(e.target.files, 'proof-teaching', 'proofOfTeaching')}
                      disabled={uploadingFiles['proof-teaching']}
                    />
                    {uploadingFiles['proof-teaching'] && (
                      <p className="text-sm text-gray-600 mt-1 flex items-center gap-2">
                        <Loader2 className="w-4 h-4 animate-spin" />
                        Uploading documents...
                      </p>
                    )}
                    {form.watch('proofOfTeaching')?.length ? (
                      <p className="text-sm text-[#2f5a4e] mt-1 flex items-center gap-2">
                        <CheckmarkIcon size="sm" />
                        {form.watch('proofOfTeaching')?.length || 0} document(s) uploaded
                      </p>
                    ) : null}
                    <p className="text-sm text-gray-600 mt-1">
                      Reference letter, teaching license, or school employment letter. Optional but helpful.
                    </p>
                  </div>
                </div>
              )}

              {currentStep === 5 && (
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="sampleMaterials">Upload 2-3 Sample Teaching Materials *</Label>
                    <Input
                      id="sampleMaterials"
                      type="file"
                      accept="application/pdf,image/jpeg,image/png,video/mp4"
                      multiple
                      data-testid="input-sample-materials"
                      className="mt-1"
                      onChange={(e) => handleFileUpload(e.target.files, 'sample-materials', 'sampleMaterials')}
                      disabled={uploadingFiles['sample-materials']}
                    />
                    {uploadingFiles['sample-materials'] && (
                      <p className="text-sm text-gray-600 mt-1 flex items-center gap-2">
                        <Loader2 className="w-4 h-4 animate-spin" />
                        Uploading materials...
                      </p>
                    )}
                    {form.watch('sampleMaterials')?.length ? (
                      <p className="text-sm text-[#2f5a4e] mt-1 flex items-center gap-2">
                        <CheckmarkIcon size="sm" />
                        {form.watch('sampleMaterials')?.length || 0} material(s) uploaded
                      </p>
                    ) : null}
                    <p className="text-sm text-gray-600 mt-1">
                      Accepted: Lesson notes, worksheets, slides/PowerPoints, video clips (short), PDF summaries. Required.
                    </p>
                  </div>

                  <div>
                    <Label htmlFor="introVideo">Optional Introduction Video (30-60 seconds)</Label>
                    <Input
                      id="introVideo"
                      type="file"
                      accept="video/mp4,video/webm"
                      data-testid="input-intro-video"
                      className="mt-1"
                      onChange={(e) => handleFileUpload(e.target.files, 'intro-video', 'introductionVideo')}
                      disabled={uploadingFiles['intro-video']}
                    />
                    {uploadingFiles['intro-video'] && (
                      <p className="text-sm text-gray-600 mt-1 flex items-center gap-2">
                        <Loader2 className="w-4 h-4 animate-spin" />
                        Uploading video...
                      </p>
                    )}
                    {form.watch('introductionVideo') && (
                      <p className="text-sm text-[#2f5a4e] mt-1 flex items-center gap-2">
                        <CheckmarkIcon size="sm" />
                        Video uploaded
                      </p>
                    )}
                    <p className="text-sm text-gray-600 mt-1">Helpful for approval. Optional.</p>
                  </div>

                  <div className="border rounded-lg p-4 bg-gray-50">
                    <p className="font-medium text-gray-900 mb-3">Introduction Video - Great Examples (ACCEPTED):</p>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                      <div className="text-center">
                        <img 
                          src="/attached_assets/image_1766855676157.png" 
                          alt="Teacher in classroom with laptop - ACCEPTED"
                          className="w-full h-40 object-cover rounded-lg border-2 border-green-500 mb-2"
                        />
                        <p className="text-sm font-medium text-green-700">✓ Classroom Setting</p>
                        <p className="text-xs text-gray-600 mt-1">Engaging, expressive, authentic</p>
                      </div>
                      <div className="text-center">
                        <img 
                          src="/attached_assets/image_1766855686807.png" 
                          alt="Female ESL teacher with branding - ACCEPTED"
                          className="w-full h-40 object-cover rounded-lg border-2 border-green-500 mb-2"
                        />
                        <p className="text-sm font-medium text-green-700">✓ Professional Branding</p>
                        <p className="text-xs text-gray-600 mt-1">Warm smile, welcoming presence</p>
                      </div>
                      <div className="text-center">
                        <img 
                          src="/attached_assets/image_1766855695067.png" 
                          alt="Teacher with professional setup - ACCEPTED"
                          className="w-full h-40 object-cover rounded-lg border-2 border-green-500 mb-2"
                        />
                        <p className="text-sm font-medium text-green-700">✓ Professional Setup</p>
                        <p className="text-xs text-gray-600 mt-1">Good lighting, clear quality</p>
                      </div>
                    </div>
                    <div className="border-l-4 border-green-500 pl-3 mb-4">
                      <p className="font-medium text-green-700 mb-2">✓ Why These Work Well</p>
                      <ul className="text-sm text-gray-600 space-y-1">
                        <li>• Direct eye contact with genuine smile</li>
                        <li>• Speaking with passion about teaching</li>
                        <li>• Natural, engaging body language</li>
                        <li>• Professional but personable demeanor</li>
                        <li>• Clear audio and good lighting</li>
                        <li>• Shows personality and teaching environment</li>
                      </ul>
                    </div>
                  </div>

                  <div className="border rounded-lg p-4 bg-gray-50 mt-4">
                    <p className="font-medium text-gray-900 mb-3">Introduction Video Guidelines - What NOT to Do:</p>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                      <div className="text-center">
                        <img 
                          src="/attached_assets/image_1766855628741.png" 
                          alt="Eyes closed or looking down - NOT ACCEPTED"
                          className="w-full h-40 object-cover rounded-lg border-2 border-red-500 mb-2"
                        />
                        <p className="text-sm font-medium text-red-700">✗ Eyes Closed/Down</p>
                        <p className="text-xs text-gray-600 mt-1">Not engaging, unprofessional</p>
                      </div>
                      <div className="text-center">
                        <img 
                          src="/attached_assets/image_1766855638492.png" 
                          alt="Stressed or frustrated appearance - NOT ACCEPTED"
                          className="w-full h-40 object-cover rounded-lg border-2 border-red-500 mb-2"
                        />
                        <p className="text-sm font-medium text-red-700">✗ Stressed/Frustrated</p>
                        <p className="text-xs text-gray-600 mt-1">Negative emotions, off-putting</p>
                      </div>
                      <div className="text-center">
                        <img 
                          src="/attached_assets/image_1766855651046.png" 
                          alt="Shushing gesture or silence - NOT ACCEPTED"
                          className="w-full h-40 object-cover rounded-lg border-2 border-red-500 mb-2"
                        />
                        <p className="text-sm font-medium text-red-700">✗ Not Speaking/Silent</p>
                        <p className="text-xs text-gray-600 mt-1">Doesn't show teaching ability</p>
                      </div>
                    </div>
                    <div className="border-l-4 border-green-500 pl-3 mb-4">
                      <p className="font-medium text-green-700 mb-2">✓ What We Want Instead</p>
                      <ul className="text-sm text-gray-600 space-y-1">
                        <li>• Look directly at camera with a warm, welcoming smile</li>
                        <li>• Speak clearly about your teaching passion and expertise</li>
                        <li>• Show enthusiasm for teaching and students</li>
                        <li>• Keep it between 30-60 seconds</li>
                        <li>• Good lighting and clear audio</li>
                        <li>• Professional but personable tone</li>
                      </ul>
                    </div>
                    <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
                      <p className="text-sm text-blue-900">
                        <span className="font-medium">Why this matters:</span> Your introduction video gives students and families a first impression of who you are as a teacher. We need to see your personality, professionalism, and genuine passion for teaching. A good video builds trust and confidence in your ability to teach effectively.
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {currentStep === 6 && (
                <div className="space-y-4">
                  <div className="bg-muted p-6 rounded-lg">
                    <h3 className="font-medium mb-3 text-lg">Earnings & Payouts</h3>
                    <p className="text-sm text-gray-600 mb-4">
                      Your earnings will be calculated based on your region and teaching performance. Once your application is approved, you'll be able to set up your preferred payout method to receive payments directly to your account.
                    </p>
                  </div>

                  <div className="bg-muted p-6 rounded-lg">
                    <h3 className="font-medium mb-2">Tax Information</h3>
                    <p className="text-sm text-gray-600">
                      Only required after approval. Optional during signup.
                    </p>
                  </div>
                </div>
              )}

              {currentStep === 7 && (
                <div className="space-y-4">
                  <div className="space-y-3">
                    <div className="flex items-start space-x-2">
                      <div className="relative flex h-4 w-4 shrink-0 items-center justify-center mt-1">
                        <input
                          type="checkbox"
                          id="agreement1"
                          checked={form.watch("agreementTruthful")}
                          onChange={(e) => form.setValue("agreementTruthful", e.target.checked)}
                          className="h-3 w-3 accent-[#0c332c] cursor-pointer"
                          data-testid="checkbox-agreement-truthful"
                        />
                      </div>
                      <Label htmlFor="agreement1" className="text-sm font-normal leading-relaxed cursor-pointer">
                        I confirm all information is truthful and accurate.
                      </Label>
                    </div>

                    <div className="flex items-start space-x-2">
                      <div className="relative flex h-4 w-4 shrink-0 items-center justify-center mt-1">
                        <input
                          type="checkbox"
                          id="agreement2"
                          checked={form.watch("agreementContent")}
                          onChange={(e) => form.setValue("agreementContent", e.target.checked)}
                          data-testid="checkbox-agreement-content"
                          className="h-3 w-3 accent-[#0c332c] cursor-pointer"
                        />
                      </div>
                      <Label htmlFor="agreement2" className="text-sm font-normal leading-relaxed cursor-pointer">
                        I agree that any content I upload is original or legally licensed.
                      </Label>
                    </div>

                    <div className="flex items-start space-x-2">
                      <div className="relative flex h-4 w-4 shrink-0 items-center justify-center mt-1">
                        <input
                          type="checkbox"
                          id="agreement3"
                          checked={form.watch("agreementTerms")}
                          onChange={(e) => form.setValue("agreementTerms", e.target.checked)}
                          data-testid="checkbox-agreement-terms"
                          className="h-3 w-3 accent-[#0c332c] cursor-pointer"
                        />
                      </div>
                      <Label htmlFor="agreement3" className="text-sm font-normal leading-relaxed cursor-pointer">
                        I agree to EduFiliova's{" "}
                        <button
                          type="button"
                          onClick={(e) => {
                            e.preventDefault();
                            setShowTermsModal(true);
                          }}
                          className="text-foreground underline hover:text-foreground/80 transition-all duration-300"
                        >
                          Teacher Terms & Safety Policy
                        </button>.
                      </Label>
                    </div>

                    <div className="flex items-start space-x-2">
                      <div className="relative flex h-4 w-4 shrink-0 items-center justify-center mt-1">
                        <input
                          type="checkbox"
                          id="agreement4"
                          checked={form.watch("agreementUnderstand")}
                          onChange={(e) => form.setValue("agreementUnderstand", e.target.checked)}
                          data-testid="checkbox-agreement-understand"
                          className="h-3 w-3 accent-[#0c332c] cursor-pointer"
                        />
                      </div>
                      <Label htmlFor="agreement4" className="text-sm font-normal leading-relaxed cursor-pointer">
                        I understand EduFiliova may approve or reject my application.
                      </Label>
                    </div>

                    <div className="flex items-start space-x-2">
                      <div className="relative flex h-4 w-4 shrink-0 items-center justify-center mt-1">
                        <input
                          type="checkbox"
                          id="agreement5"
                          checked={form.watch("agreementSafety")}
                          onChange={(e) => form.setValue("agreementSafety", e.target.checked)}
                          data-testid="checkbox-agreement-safety"
                          className="h-3 w-3 accent-[#0c332c] cursor-pointer"
                        />
                      </div>
                      <Label htmlFor="agreement5" className="text-sm font-normal leading-relaxed cursor-pointer">
                        I understand students' safety is the highest priority.
                      </Label>
                    </div>
                  </div>
                </div>
              )}

              <div className="flex justify-between pt-6 border-t">
                <Button
                  type="button"
                  variant="outline"
                  onClick={prevStep}
                  disabled={currentStep === 1}
                  data-testid="button-previous"
                >
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Previous
                </Button>

                {currentStep < totalSteps ? (
                  <Button
                    type="button"
                    onClick={nextStep}
                    className="bg-[#0c332c] text-white hover:bg-[#0c332c]"
                    data-testid="button-next"
                  >
                    Next
                    <ArrowRight className="w-4 h-4 ml-2" />
                  </Button>
                ) : (
                  <Button
                    type="submit"
                    disabled={submitMutation.isPending}
                    className="bg-[#0c332c] text-white hover:bg-[#0c332c]"
                    data-testid="button-submit"
                  >
                    {submitMutation.isPending ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Submitting...
                      </>
                    ) : (
                      "Submit Application"
                    )}
                  </Button>
                )}
              </div>
            </form>
        </div>
      </div>

      <TeacherTermsModal
        isOpen={showTermsModal}
        onClose={() => setShowTermsModal(false)}
        onAccept={() => {
          form.setValue("agreementTerms", true);
          setShowTermsModal(false);
        }}
        onDecline={() => {
          form.setValue("agreementTerms", false);
          setShowTermsModal(false);
        }}
      />
    </div>
  );
}
