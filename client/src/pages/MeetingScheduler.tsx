import { useState, useMemo } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useLocation } from "wouter";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useAuth } from "@/hooks/useAuth";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Loader2, Calendar, Clock, Users, Video, AlertCircle } from "lucide-react";
import { CheckmarkIcon } from "@/components/ui/checkmark-icon";
import { Alert, AlertDescription } from "@/components/ui/alert";

const GRADE_OPTIONS = [
  { value: "1", label: "Grade 1" },
  { value: "2", label: "Grade 2" },
  { value: "3", label: "Grade 3" },
  { value: "4", label: "Grade 4" },
  { value: "5", label: "Grade 5" },
  { value: "6", label: "Grade 6" },
  { value: "7", label: "Grade 7" },
  { value: "8", label: "Grade 8" },
  { value: "9", label: "Grade 9" },
  { value: "10", label: "Grade 10" },
  { value: "11", label: "Grade 11" },
  { value: "12", label: "Grade 12" },
  { value: "college", label: "College" },
  { value: "university", label: "University" },
];

const DURATION_OPTIONS = [
  { value: 30, label: "30 minutes" },
  { value: 45, label: "45 minutes" },
  { value: 60, label: "1 hour" },
  { value: 90, label: "1.5 hours" },
  { value: 120, label: "2 hours" },
];

const MAX_PARTICIPANT_OPTIONS = [
  { value: 25, label: "25 participants" },
  { value: 50, label: "50 participants (default)" },
  { value: 100, label: "100 participants" },
  { value: 150, label: "150 participants" },
  { value: 200, label: "200 participants" },
];

const meetingFormSchema = z.object({
  title: z.string().min(3, "Title must be at least 3 characters"),
  lessonDescription: z.string().min(10, "Please provide a detailed description of the lesson"),
  scheduledDate: z.string().min(1, "Date is required"),
  scheduledTime: z.string().min(1, "Time is required"),
  duration: z.number().min(15, "Duration must be at least 15 minutes"),
  targetGrades: z.array(z.string()).min(1, "Select at least one grade"),
  mode: z.enum(["interactive", "broadcast"]),
  maxParticipants: z.number().optional(),
});

type MeetingFormData = z.infer<typeof meetingFormSchema>;

export default function MeetingScheduler() {
  const { user, profile } = useAuth();
  const [, navigate] = useLocation();
  const queryClient = useQueryClient();
  const [selectedGrades, setSelectedGrades] = useState<string[]>([]);
  const [inlineMessage, setInlineMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const form = useForm<MeetingFormData>({
    resolver: zodResolver(meetingFormSchema),
    defaultValues: {
      title: "",
      lessonDescription: "",
      scheduledDate: "",
      scheduledTime: "",
      duration: 45,
      targetGrades: [],
      mode: "interactive",
      maxParticipants: 50,
    },
  });

  // Fetch grade counts
  const { data: gradeCountsData, isLoading: isLoadingGradeCounts } = useQuery<{ gradeCounts: Record<string, number> }>({
    queryKey: ['/api/stats/grade-counts'],
    enabled: !!user && profile?.role === 'teacher',
  });

  const gradeCounts = gradeCountsData?.gradeCounts || {};

  // Calculate total students to be notified
  const totalStudentsToNotify = useMemo(() => {
    return selectedGrades.reduce((sum, grade) => {
      return sum + (gradeCounts[grade] || 0);
    }, 0);
  }, [selectedGrades, gradeCounts]);

  const selectedMode = form.watch("mode");
  const selectedMaxParticipants = form.watch("maxParticipants") || 50;

  const createMeetingMutation = useMutation({
    mutationFn: async (data: MeetingFormData) => {
      const scheduledDateTime = new Date(`${data.scheduledDate}T${data.scheduledTime}`);
      
      return apiRequest('/api/meetings', {
        method: 'POST',
        body: JSON.stringify({
          title: data.title,
          lessonDescription: data.lessonDescription,
          scheduledTime: scheduledDateTime.toISOString(),
          duration: data.duration,
          targetGrades: data.targetGrades,
          mode: data.mode,
          maxParticipants: data.maxParticipants,
        }),
      });
    },
    onSuccess: (response) => {
      queryClient.invalidateQueries({ queryKey: ['/api/meetings'] });
      setInlineMessage({ type: 'success', text: 'Meeting scheduled successfully! Students will be notified.' });
      setTimeout(() => {
        navigate('/teacher-meetings');
      }, 2000);
    },
    onError: (error: Error) => {
      setInlineMessage({ type: 'error', text: `Failed to create meeting: ${error.message}` });
      setTimeout(() => setInlineMessage(null), 5000);
    },
  });

  const onSubmit = (data: MeetingFormData) => {
    createMeetingMutation.mutate(data);
  };

  const handleGradeToggle = (gradeValue: string) => {
    const updated = selectedGrades.includes(gradeValue)
      ? selectedGrades.filter((g) => g !== gradeValue)
      : [...selectedGrades, gradeValue];
    
    setSelectedGrades(updated);
    form.setValue("targetGrades", updated);
  };

  const handleSelectAll = () => {
    const allGrades = GRADE_OPTIONS.map((g) => g.value);
    setSelectedGrades(allGrades);
    form.setValue("targetGrades", allGrades);
  };

  const handleClearAll = () => {
    setSelectedGrades([]);
    form.setValue("targetGrades", []);
  };

  if (!user || profile?.role !== 'teacher') {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Card className="max-w-md">
          <CardHeader>
            <CardTitle>Access Denied</CardTitle>
            <CardDescription>Only teachers can access this page</CardDescription>
          </CardHeader>
        </Card>
      </div>
    );
  }

  // Get minimum datetime (now + 1 hour)
  const minDateTime = new Date();
  minDateTime.setHours(minDateTime.getHours() + 1);
  const minDate = minDateTime.toISOString().split('T')[0];
  const minTime = minDateTime.toTimeString().slice(0, 5);

  return (
    <>
      {/* Inline Message */}
      {inlineMessage && (
        <div className={`fixed top-4 left-1/2 transform -translate-x-1/2 z-50 max-w-md w-full mx-4 px-4 py-3 rounded-lg shadow-lg flex items-center gap-3 ${
          inlineMessage.type === 'error' 
            ? 'bg-red-500/90 text-white' 
            : 'bg-green-500/90 text-white'
        }`}>
          {inlineMessage.type === 'error' ? (
            <AlertCircle className="h-5 w-5 flex-shrink-0" />
          ) : (
            <CheckmarkIcon size="md" variant="success" className="flex-shrink-0" />
          )}
          <p className="text-sm font-medium">{inlineMessage.text}</p>
        </div>
      )}
        <Card className="shadow-none border-0">
          <CardHeader className="bg-gradient-to-r from-purple-600 to-blue-600 text-white">
            <div className="flex items-center gap-3">
              <Video className="h-8 w-8" />
              <div>
                <CardTitle className="font-bold tracking-tight text-[16px] text-[#ffffff]">Schedule a Video Meeting</CardTitle>
                <CardDescription className="text-purple-100">
                  Create a live lesson for your students
                </CardDescription>
              </div>
            </div>
          </CardHeader>

          <CardContent className="px-0 py-4">
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                
                {/* Meeting Title */}
                <FormField
                  control={form.control}
                  name="title"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-lg font-semibold">Meeting Title</FormLabel>
                      <FormControl>
                        <Input 
                          {...field} 
                          placeholder="e.g., Introduction to Algebra"
                          className="text-lg"
                          data-testid="input-meeting-title"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Lesson Description */}
                <FormField
                  control={form.control}
                  name="lessonDescription"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-lg font-semibold">Lesson Description / Reason</FormLabel>
                      <FormControl>
                        <Textarea
                          {...field}
                          placeholder="Describe what will be covered in this meeting and why students should attend..."
                          rows={4}
                          className="resize-none"
                          data-testid="input-lesson-description"
                        />
                      </FormControl>
                      <FormDescription>
                        Students will see this description in their dashboard
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Date and Time */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="scheduledDate"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="flex items-center gap-2">
                          <Calendar className="h-4 w-4" />
                          Date
                        </FormLabel>
                        <FormControl>
                          <Input 
                            {...field} 
                            type="date"
                            min={minDate}
                            data-testid="input-meeting-date"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="scheduledTime"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="flex items-center gap-2">
                          <Clock className="h-4 w-4" />
                          Time
                        </FormLabel>
                        <FormControl>
                          <Input 
                            {...field} 
                            type="time"
                            data-testid="input-meeting-time"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                {/* Duration */}
                <FormField
                  control={form.control}
                  name="duration"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Duration</FormLabel>
                      <Select
                        value={field.value?.toString()}
                        onValueChange={(value) => field.onChange(parseInt(value))}
                      >
                        <FormControl>
                          <SelectTrigger data-testid="select-duration">
                            <SelectValue placeholder="Select duration" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {DURATION_OPTIONS.map((option) => (
                            <SelectItem key={option.value} value={option.value.toString()}>
                              {option.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Meeting Mode */}
                <FormField
                  control={form.control}
                  name="mode"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Meeting Mode</FormLabel>
                      <Select value={field.value} onValueChange={field.onChange}>
                        <FormControl>
                          <SelectTrigger data-testid="select-mode">
                            <SelectValue />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="interactive">
                            Interactive (up to 50 students with video/audio)
                          </SelectItem>
                          <SelectItem value="broadcast">
                            Broadcast (unlimited students, view-only)
                          </SelectItem>
                        </SelectContent>
                      </Select>
                      <FormDescription>
                        {field.value === 'interactive' 
                          ? 'Students can turn on video/audio and participate actively' 
                          : 'Students can watch and use text chat, but cannot turn on video/audio'}
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Target Grades */}
                <FormField
                  control={form.control}
                  name="targetGrades"
                  render={() => (
                    <FormItem>
                      <div className="flex items-center justify-between mb-3">
                        <FormLabel className="text-lg font-semibold flex items-center gap-2">
                          <Users className="h-5 w-5" />
                          Select Student Grades*
                        </FormLabel>
                        <div className="flex gap-2">
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={handleSelectAll}
                            data-testid="button-select-all"
                          >
                            Select All
                          </Button>
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={handleClearAll}
                            data-testid="button-clear-all"
                          >
                            Clear All
                          </Button>
                        </div>
                      </div>
                      
                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-1 sm:gap-2 p-2 sm:p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
                        {GRADE_OPTIONS.map((grade) => {
                          const studentCount = gradeCounts[grade.value] || 0;
                          return (
                            <div 
                              key={grade.value} 
                              className={`flex items-center justify-between p-1.5 sm:p-2 rounded border ${
                                selectedGrades.includes(grade.value) 
                                  ? 'bg-blue-50 dark:bg-blue-900/20 border-blue-300 dark:border-blue-600' 
                                  : 'bg-white dark:bg-gray-700 border-gray-200 dark:border-gray-600'
                              }`}
                            >
                              <div className="flex items-center space-x-1.5 sm:space-x-2">
                                <Checkbox
                                  checked={selectedGrades.includes(grade.value)}
                                  onCheckedChange={() => handleGradeToggle(grade.value)}
                                  data-testid={`checkbox-grade-${grade.value}`}
                                />
                                <label className="text-xs sm:text-sm font-medium leading-none cursor-pointer">
                                  {grade.label}
                                </label>
                              </div>
                              <span className="text-xs text-gray-600 dark:text-gray-400 font-medium">
                                {isLoadingGradeCounts ? '...' : `${studentCount.toLocaleString()}`}
                              </span>
                            </div>
                          );
                        })}
                      </div>
                      
                      <FormDescription>
                        Only students in the selected grades will receive notifications
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Meeting Capacity Settings */}
                {selectedMode === 'interactive' && (
                  <Card className="border-yellow-200 dark:border-yellow-800 bg-yellow-50 dark:bg-yellow-900/10">
                    <CardContent className="pt-4">
                      <div className="flex items-start gap-3">
                        <AlertCircle className="h-5 w-5 text-yellow-600 dark:text-yellow-500 mt-0.5" />
                        <div className="space-y-3 flex-1">
                          <h3 className="font-semibold text-sm">Meeting Capacity Settings</h3>
                          
                          <FormField
                            control={form.control}
                            name="maxParticipants"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Max Participants with Video/Audio</FormLabel>
                                <Select
                                  value={field.value?.toString()}
                                  onValueChange={(value) => field.onChange(parseInt(value))}
                                >
                                  <FormControl>
                                    <SelectTrigger data-testid="select-max-participants">
                                      <SelectValue placeholder="50 participants (default)" />
                                    </SelectTrigger>
                                  </FormControl>
                                  <SelectContent>
                                    {MAX_PARTICIPANT_OPTIONS.map((option) => (
                                      <SelectItem key={option.value} value={option.value.toString()}>
                                        {option.label}
                                      </SelectItem>
                                    ))}
                                  </SelectContent>
                                </Select>
                                <FormDescription className="text-xs">
                                  First {selectedMaxParticipants} students can join with video/audio. 
                                  Late students can still watch (video-only mode) and use text chat.
                                </FormDescription>
                              </FormItem>
                            )}
                          />
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                )}

                {/* Summary Section */}
                {selectedGrades.length > 0 && (
                  <Alert className="bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800">
                    <Users className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                    <AlertDescription className="text-sm">
                      <div className="space-y-1">
                        <p className="font-semibold text-blue-900 dark:text-blue-100">
                          {totalStudentsToNotify.toLocaleString()} students will be notified
                        </p>
                        {selectedMode === 'interactive' ? (
                          <p className="text-blue-800 dark:text-blue-200">
                            Up to {selectedMaxParticipants} can join with video/audio (first-come, first-served)
                          </p>
                        ) : (
                          <p className="text-blue-800 dark:text-blue-200">
                            Broadcast mode: Unlimited viewers (only teacher has video/audio)
                          </p>
                        )}
                      </div>
                    </AlertDescription>
                  </Alert>
                )}

                {/* Submit Button */}
                <div className="flex gap-3 pt-4">
                  <Button
                    type="submit"
                    className="flex-1 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white"
                    disabled={createMeetingMutation.isPending}
                    data-testid="button-create-meeting"
                  >
                    {createMeetingMutation.isPending && (
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    )}
                    Schedule Meeting
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => navigate('/teacher-meetings')}
                    data-testid="button-cancel"
                  >
                    Cancel
                  </Button>
                </div>
              </form>
            </Form>
          </CardContent>
        </Card>
    </>
  );
}
