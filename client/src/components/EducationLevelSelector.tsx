import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { GraduationCap, BookOpen, ArrowLeft } from "lucide-react";

interface EducationLevelSelectorProps {
  onNavigate: (page: string) => void;
  userRole: string;
}

export default function EducationLevelSelector({ onNavigate, userRole }: EducationLevelSelectorProps) {
  // Check if user is allowed to create subjects (admin/teacher only)
  const canCreateSubjects = ['admin', 'teacher'].includes(userRole);
  
  // Check if user is allowed to create courses (admin/teacher/freelancer)
  const canCreateCourses = ['admin', 'teacher', 'freelancer'].includes(userRole);

  // Determine the appropriate dashboard based on user role
  const getDashboardRoute = () => {
    switch (userRole) {
      case 'admin':
        return 'admin-dashboard';
      case 'teacher':
        return 'teacher-dashboard';
      case 'freelancer':
        return 'freelancer-dashboard';
      default:
        return 'student-dashboard';
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
      <div className="container mx-auto p-4 md:p-6 max-w-5xl">
        <Button
          variant="ghost"
          onClick={() => onNavigate(getDashboardRoute())}
          className="mb-4"
          data-testid="button-back"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Dashboard
        </Button>

        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold mb-2">Create Educational Content</h1>
          <p className="text-muted-foreground text-lg">
            Choose the type of educational content you want to create
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-6">
          {/* Course Creator Card */}
          {canCreateCourses && (
            <Card 
              className={`cursor-pointer hover:shadow-xl transition-all duration-300 border-2 ${
                canCreateCourses ? 'hover:border-blue-500' : 'opacity-50 cursor-not-allowed'
              }`}
              onClick={() => canCreateCourses && onNavigate('course-creator')}
              data-testid="card-select-course"
            >
              <CardHeader>
                <div className="flex items-center gap-3 mb-2">
                  <div className="p-3 bg-blue-100 dark:bg-blue-900 rounded-lg">
                    <GraduationCap className="h-8 w-8 text-blue-600 dark:text-blue-400" />
                  </div>
                  <CardTitle className="text-2xl">Courses</CardTitle>
                </div>
                <CardDescription className="text-base">
                  For college and university students
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-sm text-muted-foreground">
                  Create comprehensive courses with modules, lessons, and quizzes for higher education students.
                </p>
                <div className="space-y-2">
                  <h4 className="font-semibold text-sm">Features:</h4>
                  <ul className="text-sm text-muted-foreground space-y-1 list-disc list-inside">
                    <li>Module-based structure</li>
                    <li>Video lessons and quizzes</li>
                    <li>Certificate of completion</li>
                    <li>For freelancers, teachers, and admins</li>
                  </ul>
                </div>
                <Button 
                  className="w-full mt-4" 
                  disabled={!canCreateCourses}
                  data-testid="button-create-course"
                >
                  Create Course
                </Button>
              </CardContent>
            </Card>
          )}

          {/* Subject Creator Card */}
          {canCreateSubjects && (
            <Card 
              className={`cursor-pointer hover:shadow-xl transition-all duration-300 border-2 ${
                canCreateSubjects ? 'hover:border-purple-500' : 'opacity-50 cursor-not-allowed'
              }`}
              onClick={() => canCreateSubjects && onNavigate('subject-creator')}
              data-testid="card-select-subject"
            >
              <CardHeader>
                <div className="flex items-center gap-3 mb-2">
                  <div className="p-3 bg-purple-100 dark:bg-purple-900 rounded-lg">
                    <BookOpen className="h-8 w-8 text-purple-600 dark:text-purple-400" />
                  </div>
                  <CardTitle className="text-2xl">Subjects</CardTitle>
                </div>
                <CardDescription className="text-base">
                  For primary and secondary education (Grades 1-12)
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-sm text-muted-foreground">
                  Create structured subjects with chapters, lessons, and exercises for K-12 students.
                </p>
                <div className="space-y-2">
                  <h4 className="font-semibold text-sm">Features:</h4>
                  <ul className="text-sm text-muted-foreground space-y-1 list-disc list-inside">
                    <li>Chapter-based curriculum</li>
                    <li>Interactive exercises (15 per lesson)</li>
                    <li>Grade level targeting</li>
                    <li>For teachers and admins only</li>
                  </ul>
                </div>
                <Button 
                  className="w-full mt-4" 
                  disabled={!canCreateSubjects}
                  variant="default"
                  data-testid="button-create-subject"
                >
                  Create Subject
                </Button>
              </CardContent>
            </Card>
          )}
        </div>

        {!canCreateCourses && !canCreateSubjects && (
          <div className="text-center mt-8">
            <Card className="border-destructive">
              <CardContent className="pt-6">
                <p className="text-muted-foreground">
                  You don't have permission to create educational content. 
                  Please contact an administrator if you believe this is an error.
                </p>
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </div>
  );
}
