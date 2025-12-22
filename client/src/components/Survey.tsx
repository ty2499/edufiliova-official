import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Upload, User, GraduationCap } from "lucide-react";
// Using direct fetch calls like other components

// Simple profanity filter - basic implementation
const containsProfanity = (text: string): boolean => {
  const prohibitedWords = ['fuck', 'shit', 'damn', 'bitch', 'asshole', 'bastard'];
  const lowerText = text.toLowerCase();
  return prohibitedWords.some(word => lowerText.includes(word));
};

interface Country {
  id: number;
  name: string;
}

interface GradeSystem {
  id: number;
  gradeNumber: number;
  displayName: string;
}

interface SurveyProps {
  onComplete: () => void;
  userId: string;
}

export default function Survey({ onComplete, userId }: SurveyProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string>("");
  const [success, setSuccess] = useState(false);
  const [countries, setCountries] = useState<Country[]>([]);
  const [gradeSystems, setGradeSystems] = useState<GradeSystem[]>([]);
  const [currentStep, setCurrentStep] = useState(1);
  const [uploading, setUploading] = useState(false);
  
  const [formData, setFormData] = useState({
    country: "",
    countryId: "",
    gradeGroup: "", // "primary", "high_school", "college", "university"
    grade: "",
    pronouns: "",
    customPronouns: "",
    profilePictureUrl: ""
  });

  // Fetch countries on mount
  useEffect(() => {
    const fetchCountries = async () => {
      try {
        const response = await fetch('/api/countries');
        const result = await response.json();
        if (result.success) {
          setCountries(result.data);
        }
      } catch (error) {
        console.error('Failed to fetch countries:', error);
      }
    };
    fetchCountries();
  }, []);

  // Fetch grade systems when country changes
  useEffect(() => {
    if (formData.countryId) {
      const fetchGradeSystems = async () => {
        try {
          const response = await fetch(`/api/grade-systems/${formData.countryId}`);
          const result = await response.json();
          if (result.success) {
            setGradeSystems(result.data);
          }
        } catch (error) {
          console.error('Failed to fetch grade systems:', error);
        }
      };
      fetchGradeSystems();
    }
  }, [formData.countryId]);

  const handleCountryChange = (value: string) => {
    const selectedCountry = countries.find(c => c.id.toString() === value);
    setFormData(prev => ({
      ...prev,
      countryId: value,
      country: selectedCountry?.name || "",
      grade: "" // Reset grade when country changes
    }));
  };

  const handleGradeGroupChange = (value: string) => {
    setFormData(prev => ({
      ...prev,
      gradeGroup: value,
      grade: "" // Reset specific grade when group changes
    }));
  };

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      setError('Please select an image file');
      return;
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      setError('Image size must be less than 5MB');
      return;
    }

    setUploading(true);
    setError('');

    try {
      const formDataUpload = new FormData();
      formDataUpload.append('avatar', file);

      const sessionId = localStorage.getItem('sessionId');
      const response = await fetch('/api/settings/upload-avatar', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${sessionId}`
        },
        body: formDataUpload,
      });

      const result = await response.json();
      
      if (!result.success) {
        throw new Error(result.error || 'Failed to upload image');
      }

      setFormData(prev => ({ ...prev, profilePictureUrl: result.avatarUrl || result.url }));
    } catch (error: any) {
      setError(error.message || 'Failed to upload image');
    } finally {
      setUploading(false);
    }
  };

  const triggerFileInput = () => {
    document.getElementById('fileInput')?.click();
  };

  const handleSubmit = async () => {
    setLoading(true);
    try {
      // Map grade group to education level
      let educationLevel = "primary";
      let specificGrade = "";
      
      if (formData.gradeGroup === "primary") {
        educationLevel = "primary";
        specificGrade = formData.grade;
      } else if (formData.gradeGroup === "high_school") {
        educationLevel = "secondary";
        specificGrade = formData.grade;
      } else if (formData.gradeGroup === "college") {
        educationLevel = "college";
        specificGrade = "college";
      } else if (formData.gradeGroup === "university") {
        educationLevel = "university";
        specificGrade = "university";
      }

      // Determine final pronouns value
      const finalPronouns = formData.pronouns === "custom" 
        ? formData.customPronouns.trim() 
        : formData.pronouns;

      // Validate custom pronouns
      if (formData.pronouns === "custom") {
        if (!formData.customPronouns.trim()) {
          throw new Error("Please enter your custom pronouns");
        }
        if (containsProfanity(formData.customPronouns)) {
          throw new Error("Please use appropriate language for your pronouns");
        }
      }

      const response = await fetch("/api/profile/complete-survey", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          userId,
          country: formData.country,
          countryId: parseInt(formData.countryId),
          educationLevel,
          grade: specificGrade,
          pronouns: finalPronouns,
          avatarUrl: formData.profilePictureUrl
        })
      });

      const result = await response.json();
      if (!result.success) {
        throw new Error(result.error || "Failed to update profile");
      }

      setSuccess(true);
      setTimeout(() => {
        onComplete();
      }, 1500);
    } catch (error: any) {
      setError(error.message || "Failed to update profile");
    } finally {
      setLoading(false);
    }
  };

  const isStepValid = (step: number) => {
    switch (step) {
      case 1: return formData.country && formData.gradeGroup;
      case 2: return formData.gradeGroup === "college" || formData.gradeGroup === "university" || formData.grade;
      case 3: return formData.pronouns && (formData.pronouns !== "custom" || formData.customPronouns.trim());
      default: return true;
    }
  };

  const nextStep = () => {
    if (currentStep < 4) setCurrentStep(currentStep + 1);
  };

  const prevStep = () => {
    if (currentStep > 1) setCurrentStep(currentStep - 1);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/5 via-background to-accent/5 flex items-center justify-center p-4">
      <Card className="w-full max-w-2xl border-2 border-primary/20">
        <CardHeader className="text-center pb-6">
          <div className="mx-auto w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mb-4">
            <GraduationCap className="w-8 h-8 text-primary" />
          </div>
          <CardTitle className="text-3xl font-bold text-foreground">Complete Your Profile</CardTitle>
          <p className="text-muted-foreground">Help us personalize your learning experience</p>
          <div className="flex justify-center mt-4">
            <div className="flex space-x-2">
              {[1, 2, 3, 4].map((step) => (
                <div
                  key={step}
                  className={`w-3 h-3 rounded-full transition-colors ${
                    currentStep >= step ? "bg-primary" : "bg-muted"
                  }`}
                />
              ))}
            </div>
          </div>
        </CardHeader>

        <CardContent className="space-y-6">
          {/* Step 1: Country and Grade Group */}
          {currentStep === 1 && (
            <div className="space-y-6">
              <div className="text-center mb-6">
                <h3 className="text-xl font-semibold mb-2">Where are you from?</h3>
                <p className="text-muted-foreground">This helps us show you the right curriculum</p>
              </div>
              
              <div className="space-y-4">
                <div>
                  <Label htmlFor="country">Country</Label>
                  <Select value={formData.countryId} onValueChange={handleCountryChange}>
                    <SelectTrigger className="mt-1" data-testid="select-country">
                      <SelectValue placeholder="Select your country" />
                    </SelectTrigger>
                    <SelectContent>
                      {countries.map((country) => (
                        <SelectItem key={country.id} value={country.id.toString()}>
                          {country.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="gradeGroup">Education Level</Label>
                  <RadioGroup 
                    value={formData.gradeGroup} 
                    onValueChange={handleGradeGroupChange}
                    className="mt-2"
                  >
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="primary" id="primary" data-testid="radio-primary" />
                      <Label htmlFor="primary">Primary School (Grades 1-7)</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="high_school" id="high_school" data-testid="radio-high-school" />
                      <Label htmlFor="high_school">High School (Grades 8-12)</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="college" id="college" data-testid="radio-college" />
                      <Label htmlFor="college">College</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="university" id="university" data-testid="radio-university" />
                      <Label htmlFor="university">University</Label>
                    </div>
                  </RadioGroup>
                </div>
              </div>
            </div>
          )}

          {/* Step 2: Specific Grade */}
          {currentStep === 2 && (
            <div className="space-y-6">
              <div className="text-center mb-6">
                <h3 className="text-xl font-semibold mb-2">What's your grade level?</h3>
                <p className="text-muted-foreground">This helps us show age-appropriate content</p>
              </div>
              
              {(formData.gradeGroup === "primary" || formData.gradeGroup === "high_school") && (
                <div>
                  <Label htmlFor="grade">Grade Level</Label>
                  <Select value={formData.grade} onValueChange={(value) => setFormData(prev => ({ ...prev, grade: value }))}>
                    <SelectTrigger className="mt-1" data-testid="select-grade">
                      <SelectValue placeholder="Select your grade" />
                    </SelectTrigger>
                    <SelectContent>
                      {gradeSystems.map((grade) => (
                        <SelectItem key={grade.id} value={grade.gradeNumber.toString()}>
                          {grade.displayName}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}

              {(formData.gradeGroup === "college" || formData.gradeGroup === "university") && (
                <div className="text-center py-8">
                  <GraduationCap className="w-16 h-16 text-primary mx-auto mb-4" />
                  <p className="text-lg font-medium">Perfect! You're all set for higher education content.</p>
                  <p className="text-muted-foreground">We'll show you courses designed for your level.</p>
                </div>
              )}
            </div>
          )}

          {/* Step 3: Pronouns */}
          {currentStep === 3 && (
            <div className="space-y-6">
              <div className="text-center mb-6">
                <h3 className="text-xl font-semibold mb-2">How should we refer to you?</h3>
                <p className="text-muted-foreground">Choose your preferred pronouns</p>
              </div>
              
              <div className="space-y-4">
                <div>
                  <Label htmlFor="pronouns">Pronouns</Label>
                  <Select 
                    value={formData.pronouns} 
                    onValueChange={(value) => {
                      setFormData(prev => ({ 
                        ...prev, 
                        pronouns: value,
                        customPronouns: value === "custom" ? prev.customPronouns : ""
                      }));
                    }}
                  >
                    <SelectTrigger className="mt-1" data-testid="select-pronouns">
                      <SelectValue placeholder="Select your pronouns" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="he/him">He/Him</SelectItem>
                      <SelectItem value="she/her">She/Her</SelectItem>
                      <SelectItem value="they/them">They/Them</SelectItem>
                      <SelectItem value="custom">Custom</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {formData.pronouns === "custom" && (
                  <div>
                    <Label htmlFor="customPronouns">Custom Pronouns</Label>
                    <Input
                      id="customPronouns"
                      type="text"
                      placeholder="e.g., xe/xem, ze/zir"
                      value={formData.customPronouns}
                      onChange={(e) => {
                        const value = e.target.value.slice(0, 30); // 30 character limit
                        setFormData(prev => ({ ...prev, customPronouns: value }));
                      }}
                      className="mt-1"
                      maxLength={30}
                      data-testid="input-custom-pronouns"
                    />
                    <p className="text-xs text-muted-foreground mt-1">
                      {formData.customPronouns.length}/30 characters
                    </p>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Step 4: Profile Picture */}
          {currentStep === 4 && (
            <div className="space-y-6">
              <div className="text-center mb-6">
                <h3 className="text-xl font-semibold mb-2">Add a profile picture</h3>
                <p className="text-muted-foreground">Help others recognize you (optional)</p>
              </div>
              
              <div className="flex flex-col items-center space-y-4">
                <Avatar className="w-24 h-24">
                  <AvatarImage src={formData.profilePictureUrl} />
                  <AvatarFallback className="bg-primary/10">
                    <User className="w-8 h-8 text-primary" />
                  </AvatarFallback>
                </Avatar>
                
                <div className="w-full max-w-sm">
                  <Label htmlFor="profilePicture">Profile Picture URL (optional)</Label>
                  <Input
                    id="profilePicture"
                    type="url"
                    placeholder="https://example.com/your-photo.jpg"
                    value={formData.profilePictureUrl}
                    onChange={(e) => setFormData(prev => ({ ...prev, profilePictureUrl: e.target.value }))}
                    className="mt-1"
                    data-testid="input-profile-picture"
                  />
                </div>
                
                <input
                  type="file"
                  id="fileInput"
                  accept="image/*"
                  onChange={handleFileUpload}
                  className="hidden"
                  data-testid="file-input-hidden"
                />
                
                <Button 
                  variant="outline" 
                  className="w-full max-w-sm" 
                  onClick={triggerFileInput}
                  disabled={uploading}
                  data-testid="upload-picture-btn"
                >
                  <Upload className="w-4 h-4 mr-2" />
                  {uploading ? "Uploading..." : "Upload Picture"}
                </Button>

                {error && (
                  <p className="text-sm text-red-500" data-testid="upload-error">
                    {error}
                  </p>
                )}
              </div>
            </div>
          )}

          {/* Navigation Buttons */}
          <div className="flex justify-between pt-6">
            <Button
              variant="outline"
              onClick={prevStep}
              disabled={currentStep === 1}
              data-testid="btn-previous"
            >
              Previous
            </Button>
            
            {currentStep < 4 ? (
              <Button
                onClick={nextStep}
                disabled={!isStepValid(currentStep)}
                data-testid="btn-next"
              >
                Next
              </Button>
            ) : (
              <Button
                onClick={handleSubmit}
                disabled={loading}
                data-testid="btn-complete-survey"
              >
                {loading ? "Saving..." : "Complete Profile"}
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
