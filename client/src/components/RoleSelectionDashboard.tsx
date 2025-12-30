import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useAuth } from "@/hooks/useAuth";
import { useLocation } from 'wouter';
import { supabase } from "@/lib/supabase";
import { GraduationCap, Users, Briefcase, Loader2, ChevronRight } from "lucide-react";

interface RoleSelectionDashboardProps {
  isFromCheckout?: boolean;
}

export function RoleSelectionDashboard({ isFromCheckout = false }: RoleSelectionDashboardProps) {
  const [, navigate] = useLocation();
  const { refreshAuth } = useAuth();
  const [selectedRole, setSelectedRole] = useState<string>("");
  const [loading, setLoading] = useState(false);

  const roles = [
    {
      id: "student",
      title: "Student",
      description: "Access courses, lessons, and study materials",
      icon: GraduationCap,
      features: [
        "Access to course materials",
        "Track your progress", 
        "Take quizzes and tests",
        "Connect with teachers"
      ]
    },
    {
      id: "teacher",
      title: "Teacher",
      description: "Create courses and teach students",
      icon: Users,
      features: [
        "Create and manage courses",
        "Schedule lessons",
        "Track student progress",
        "Earn from teaching"
      ]
    },
    {
      id: "freelancer",
      title: "Freelancer",
      description: "Sell services and showcase your portfolio",
      icon: Briefcase,
      features: [
        "Create portfolio showcase",
        "Sell digital products",
        "Offer freelance services",
        "Build your brand"
      ]
    }
  ];

  const handleRoleSelection = async (role: string) => {
    if (!role) return;
    
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

      const response = await fetch('/api/auth/select-role', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${authToken}`,
        },
        body: JSON.stringify({ role }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Failed to select role');
      }

      await refreshAuth();// Navigate based on role and context
      if (isFromCheckout) {
        navigate('/checkout/dashboard');
      } else {
        switch (role) {
          case 'teacher':
            navigate('/?page=teacher-dashboard');
            break;
          case 'freelancer':
            navigate('/?page=freelancer-dashboard');
            break;
          case 'general':
            navigate('/?page=product-shop');
            break;
          case 'student':
          default:
            navigate('/?page=student-dashboard');
            break;
        }
      }
    } catch (error: any) {
      console.error('Role selection error:', error);} finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
            Choose Your Role
          </h1>
          <p className="mt-2 text-gray-600 dark:text-gray-400">
            {isFromCheckout 
              ? "Select how you'd like to use our platform during checkout"
              : "How would you like to use our platform?"
            }
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {roles.map((role) => {
            const Icon = role.icon;
            const isSelected = selectedRole === role.id;
            
            return (
              <Card
                key={role.id}
                className={`cursor-pointer transition-all duration-200 hover:shadow-lg ${
                  isSelected 
                    ? 'ring-2 ring-blue-500 border-blue-500' 
                    : 'hover:border-gray-300 dark:hover:border-gray-600'
                }`}
                onClick={() => setSelectedRole(role.id)}
                data-testid={`card-role-${role.id}`}
              >
                <CardHeader className="text-center">
                  <div className={`w-16 h-16 mx-auto rounded-full flex items-center justify-center mb-4 ${
                    isSelected 
                      ? 'bg-blue-100 dark:bg-blue-900' 
                      : 'bg-gray-100 dark:bg-gray-800'
                  }`}>
                    <Icon className={`w-8 h-8 ${
                      isSelected 
                        ? 'text-blue-600 dark:text-blue-400' 
                        : 'text-gray-600 dark:text-gray-400'
                    }`} />
                  </div>
                  <CardTitle className="text-xl">
                    {role.title}
                  </CardTitle>
                  <CardDescription>
                    {role.description}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-2">
                    {role.features.map((feature, index) => (
                      <li key={index} className="flex items-center text-sm text-gray-600 dark:text-gray-400">
                        <ChevronRight className="w-4 h-4 mr-2 text-green-500" />
                        {feature}
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            );
          })}
        </div>

        <div className="mt-8 text-center">
          <Button
            onClick={() => handleRoleSelection(selectedRole)}
            disabled={!selectedRole || loading}
            size="lg"
            className="px-8"
            data-testid="button-select-role"
          >
            {loading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Setting up your account...
              </>
            ) : (
              `Continue as ${selectedRole ? roles.find(r => r.id === selectedRole)?.title : 'Selected Role'}`
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}
