import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/lib/supabase";
import { User, MapPin, Calendar, GraduationCap, Loader2 } from "lucide-react";

interface ProfileCompletionFormProps {
  onComplete: () => void;
}

export function ProfileCompletionForm({ onComplete }: ProfileCompletionFormProps) {
  const { user, refreshAuth } = useAuth();
  const [loading, setLoading] = useState(false);
  
  const [countries, setCountries] = useState<Array<{ id: number, name: string }>>([]);
  const [gradeSystems, setGradeSystems] = useState<Array<{ id: number, gradeNumber: number, displayName: string }>>([]);
  
  const [formData, setFormData] = useState({
    name: "",
    age: "",
    grade: "",
    country_id: "",
  });

  // Fetch countries and grade systems on component mount
  useEffect(() => {
    const fetchData = async () => {
      try {
        // Fetch countries
        const countriesResponse = await fetch('/api/countries');
        if (countriesResponse.ok) {
          const countriesData = await countriesResponse.json();
          setCountries(countriesData.data || []);
        }
      } catch (error) {
        console.error('Failed to fetch countries:', error);
      }
    };
    fetchData();
  }, []);

  // Fetch grade systems when country changes
  const handleCountryChange = async (countryId: string) => {
    setFormData({ ...formData, country_id: countryId, grade: "" });
    
    try {
      const response = await fetch(`/api/grade-systems/${countryId}`);
      if (response.ok) {
        const data = await response.json();
        setGradeSystems(data.data || []);
      }
    } catch (error) {
      console.error('Failed to fetch grade systems:', error);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name || !formData.age || !formData.grade || !formData.country_id) {return;
    }

    setLoading(true);

    try {
      // Get current session for authentication
      let authToken = localStorage.getItem('sessionId');
      if (supabase) {
        const { data: { session } } = await supabase.auth.getSession();
        authToken = session?.access_token || authToken;
      }
      
      if (!authToken) {
        throw new Error('No authentication token available');
      }

      const response = await fetch('/api/auth/complete-profile', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${authToken}`,
        },
        body: JSON.stringify({
          name: formData.name,
          age: parseInt(formData.age),
          grade: parseInt(formData.grade),
          country_id: parseInt(formData.country_id),
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Failed to complete profile');
      }

      await refreshAuth();onComplete();
    } catch (error: any) {
      console.error('Profile completion error:', error);} finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900 py-12 px-4 sm:px-6 lg:px-8">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-1">
          <CardTitle className="text-2xl font-bold text-center">
            Complete Your Profile
          </CardTitle>
          <CardDescription className="text-center">
            Please provide some basic information to get started
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4" data-testid="form-profile-completion">
            <div className="space-y-2">
              <Label htmlFor="name">Full Name</Label>
              <div className="relative">
                <User className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                <Input
                  id="name"
                  type="text"
                  placeholder="Enter your full name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="pl-10"
                  required
                  data-testid="input-name"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="age">Age</Label>
              <div className="relative">
                <Calendar className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                <Input
                  id="age"
                  type="number"
                  placeholder="Enter your age"
                  value={formData.age}
                  onChange={(e) => setFormData({ ...formData, age: e.target.value })}
                  className="pl-10"
                  min="5"
                  max="100"
                  required
                  data-testid="input-age"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="country">Country</Label>
              <div className="relative">
                <MapPin className="absolute left-3 top-3 h-4 w-4 text-gray-400 z-10" />
                <Select value={formData.country_id} onValueChange={handleCountryChange} required>
                  <SelectTrigger className="pl-10" data-testid="select-country">
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
            </div>

            <div className="space-y-2">
              <Label htmlFor="grade">Grade Level</Label>
              <div className="relative">
                <GraduationCap className="absolute left-3 top-3 h-4 w-4 text-gray-400 z-10" />
                <Select
                  value={formData.grade}
                  onValueChange={(value) => setFormData({ ...formData, grade: value })}
                  required
                  disabled={!formData.country_id}
                >
                  <SelectTrigger className="pl-10" data-testid="select-grade">
                    <SelectValue placeholder={!formData.country_id ? "First select a country" : "Select your grade"} />
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
            </div>

            <Button
              type="submit"
              className="w-full"
              disabled={loading}
              data-testid="button-complete-profile"
            >
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Completing Profile...
                </>
              ) : (
                "Complete Profile"
              )}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
