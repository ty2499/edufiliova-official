import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { 
  Calendar,
  Clock,
  Plus,
  User,
  BookOpen,
  Video,
  CheckCircle2,
  XCircle,
  AlertCircle,
  Edit,
  Trash2,
  Users
} from 'lucide-react';
import { apiRequest } from '@/lib/queryClient';
import { useAuth } from '@/hooks/useAuth';

interface Appointment {
  id: string;
  teacherId: string;
  studentId: string;
  subject?: string;
  description?: string;
  scheduledAt: string;
  duration: number;
  status: string;
  meetingLink?: string;
  notes?: string;
  price?: number;
  paymentStatus: string;
  teacherName?: string;
  studentName?: string;
  createdAt: string;
}

interface TeacherAvailability {
  id: string;
  teacherId: string;
  categoryId?: string;
  dayOfWeek: number;
  startTime: string;
  endTime: string;
  timeZone: string;
  isRecurring: boolean;
  specificDate?: string;
  isActive: boolean;
}

interface AvailableTeacher {
  id: string;
  name: string;
  email: string;
  avatarUrl?: string;
  availability: {
    timezone: string;
    weeklyAvailability: {
      Monday: boolean;
      Tuesday: boolean;
      Wednesday: boolean;
      Thursday: boolean;
      Friday: boolean;
      Saturday: boolean;
      Sunday: boolean;
    };
    startTime: string;
    endTime: string;
  };
}

const DAYS_OF_WEEK = [
  'Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'
];

const STATUS_COLORS = {
  scheduled: 'bg-blue-100 text-blue-800',
  confirmed: 'bg-green-100 text-green-800', 
  completed: 'bg-gray-100 text-gray-800',
  cancelled: 'bg-primary/15 text-red-800',
  no_show: 'bg-primary/15 text-primary'
};

export const SchedulingInterface: React.FC = () => {
  const { user, profile } = useAuth();
  const queryClient = useQueryClient();
  const [selectedTab, setSelectedTab] = useState('appointments');
  const [appointmentFilter, setAppointmentFilter] = useState<'all' | 'upcoming' | 'past' | 'completed' | 'cancelled'>('all');
  const [newAvailability, setNewAvailability] = useState({
    dayOfWeek: 1,
    startTime: '09:00',
    endTime: '17:00',
    timeZone: 'UTC',
    categoryId: ''
  });
  const [bookingForm, setBookingForm] = useState({
    teacherId: '',
    subjectId: '',
    subject: '',
    description: '',
    scheduledAt: '',
    duration: 60
  });
  const [filteredTeachers, setFilteredTeachers] = useState<any[]>([]);

  // Get user's appointments
  const { data: appointments = [], isLoading: appointmentsLoading, refetch: refetchAppointments } = useQuery({
    queryKey: ['appointments', user?.id],
    queryFn: async () => {
      if (!user?.id) return [];
      const sessionId = localStorage.getItem('sessionId');
      const response = await apiRequest(`/api/appointments/${user.id}`, {
        headers: { Authorization: `Bearer ${sessionId}` }
      });
      // Fix: apiRequest returns the array directly, not wrapped in .data
      return Array.isArray(response) ? response : (response?.data || []);
    },
    enabled: !!user?.id
  });

  // Get teacher availability (if user is a teacher)
  const { data: availability = [], isLoading: availabilityLoading, refetch: refetchAvailability } = useQuery({
    queryKey: ['teacher-availability', user?.id],
    queryFn: async () => {
      if (!user?.id || profile?.role !== 'teacher') return [];
      const sessionId = localStorage.getItem('sessionId');
      const response = await apiRequest(`/api/teachers/${user.id}/availability`, {
        headers: { Authorization: `Bearer ${sessionId}` }
      });
      return response?.data || [];
    },
    enabled: !!user?.id && profile?.role === 'teacher'
  });

  // Get available teachers with their availability settings
  const { data: availableTeachers = [], isLoading: teachersLoading, error: teachersError } = useQuery({
    queryKey: ['available-teachers-with-settings'],
    queryFn: async () => {
      try {
        const sessionId = localStorage.getItem('sessionId');
        const response = await fetch('/api/teachers/available-with-settings', {
          headers: sessionId ? { Authorization: `Bearer ${sessionId}` } : {}
        });
        const data = await response.json();
        return data?.success ? data.data : [];
      } catch (error) {
        console.error('Error fetching teachers:', error);
        return [];
      }
    },
    enabled: !!profile,
    staleTime: 5 * 60 * 1000
  });

  // Get subjects that have teachers
  const { data: subjectsWithTeachers = [], isLoading: subjectsLoading } = useQuery({
    queryKey: ['subjects-with-teachers'],
    queryFn: async () => {
      try {
        const response = await fetch('/api/subjects/with-teachers');
        const data = await response.json();
        return data?.success ? data.subjects : [];
      } catch (error) {
        console.error('Error fetching subjects:', error);
        return [];
      }
    },
    enabled: profile?.role === 'student',
    staleTime: 5 * 60 * 1000
  });

  // Get subject categories for teacher availability & student search
  const { data: allCategories = [], isLoading: allCategoriesLoading } = useQuery({
    queryKey: ['subject-categories'],
    queryFn: async () => {
      try {
        const response = await fetch('/api/subject-categories');
        const data = await response.json();
        return data?.success ? data.categories : [];
      } catch (error) {
        console.error('Error fetching categories:', error);
        return [];
      }
    },
    enabled: !!profile,
    staleTime: 5 * 60 * 1000
  });

  // Fetch teachers when category is selected
  const handleCategoryChange = async (categoryId: string) => {
    const category = allCategories.find((c: any) => c.id === categoryId);
    setBookingForm(prev => ({ ...prev, subjectId: categoryId, subject: category?.name || '', teacherId: '' }));
    setFilteredTeachers([]);
    
    if (categoryId) {
      try {
        console.log('🌐 [UI] Fetching teachers for category:', categoryId);
        // Explicitly use the full API path
        const response = await fetch(`/api/teachers/by-category/${categoryId}`);
        
        if (!response.ok) {
          console.error(`❌ [UI] HTTP error! status: ${response.status}`);
          return;
        }
        
        const contentType = response.headers.get("content-type");
        if (!contentType || !contentType.includes("application/json")) {
          const text = await response.text();
          console.error('❌ [UI] Expected JSON but received HTML/Text. First 100 chars:', text.substring(0, 100));
          return;
        }

        const data = await response.json();
        if (data.success) {
          console.log('✅ [UI] Received teachers:', data.teachers?.length);
          setFilteredTeachers(data.teachers || []);
        } else {
          console.error('❌ [UI] Server returned error:', data.error);
        }
      } catch (error) {
        console.error('❌ [UI] Fetch exception:', error);
      }
    }
  };


  // Add availability mutation
  const addAvailabilityMutation = useMutation({
    mutationFn: async (availabilityData: any) => {
      const sessionId = localStorage.getItem('sessionId');
      return apiRequest(`/api/teachers/${user?.id}/availability`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${sessionId}` },
        body: JSON.stringify(availabilityData)
      });
    },
    onSuccess: () => {
      refetchAvailability();
      setNewAvailability({
        dayOfWeek: 1,
        startTime: '09:00',
        endTime: '17:00',
        timeZone: 'UTC',
        categoryId: ''
      });
    }
  });

  // Book appointment mutation
  const bookAppointmentMutation = useMutation({
    mutationFn: async (appointmentData: any) => {
      const sessionId = localStorage.getItem('sessionId');
      return apiRequest('/api/appointments', {
        method: 'POST',
        headers: { Authorization: `Bearer ${sessionId}` },
        body: JSON.stringify({
          ...appointmentData,
          studentId: user?.id
        })
      });
    },
    onSuccess: (data) => {
      console.log('✅ Booking successful:', data);
      refetchAppointments();
      setBookingForm({
        teacherId: '',
        subjectId: '',
        subject: '',
        description: '',
        scheduledAt: '',
        duration: 60
      });
      setFilteredTeachers([]);
      // Show success message to user
      alert('Appointment booked successfully! Your session has been scheduled.');
    },
    onError: (error) => {
      console.error('❌ Booking failed:', error);
      alert('Failed to book appointment. Please try again.');
    }
  });

  // Cancel appointment mutation
  const cancelAppointmentMutation = useMutation({
    mutationFn: async (appointmentId: string) => {
      const sessionId = localStorage.getItem('sessionId');
      return apiRequest(`/api/appointments/${appointmentId}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${sessionId}` }
      });
    },
    onSuccess: () => {
      refetchAppointments();
    }
  });

  // Approve appointment mutation
  const approveAppointmentMutation = useMutation({
    mutationFn: async ({ appointmentId, meetingLink }: { appointmentId: string; meetingLink?: string }) => {
      const sessionId = localStorage.getItem('sessionId');
      return apiRequest(`/api/appointments/${appointmentId}/status`, {
        method: 'PATCH',
        headers: { Authorization: `Bearer ${sessionId}` },
        body: JSON.stringify({
          action: 'approve',
          meetingLink: meetingLink || ''
        })
      });
    },
    onSuccess: () => {
      refetchAppointments();
      alert('Appointment approved successfully! A chat thread has been created.');
    },
    onError: (error) => {
      console.error('❌ Approval failed:', error);
      alert('Failed to approve appointment. Please try again.');
    }
  });

  // Decline appointment mutation
  const declineAppointmentMutation = useMutation({
    mutationFn: async (appointmentId: string) => {
      const sessionId = localStorage.getItem('sessionId');
      return apiRequest(`/api/appointments/${appointmentId}/status`, {
        method: 'PATCH',
        headers: { Authorization: `Bearer ${sessionId}` },
        body: JSON.stringify({
          action: 'decline'
        })
      });
    },
    onSuccess: () => {
      refetchAppointments();
      alert('Appointment declined successfully.');
    },
    onError: (error) => {
      console.error('❌ Decline failed:', error);
      alert('Failed to decline appointment. Please try again.');
    }
  });

  // Delete availability mutation
  const deleteAvailabilityMutation = useMutation({
    mutationFn: async (slotId: string) => {
      const sessionId = localStorage.getItem('sessionId');
      return apiRequest(`/api/teachers/availability/${slotId}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${sessionId}` }
      });
    },
    onSuccess: () => {
      refetchAvailability();
    }
  });

  const handleAddAvailability = () => {
    if (!newAvailability.categoryId) {
      alert('Please select a category');
      return;
    }
    addAvailabilityMutation.mutate(newAvailability);
  };

  const handleBookAppointment = () => {
    console.log('📝 [UI] Attempting to book appointment with data:', bookingForm);
    if (!bookingForm.teacherId) {
      alert('Please select a teacher first');
      return;
    }
    if (!bookingForm.scheduledAt) {
      alert('Please select a date and time for your session');
      return;
    }
    bookAppointmentMutation.mutate(bookingForm);
  };

  const handleCancelAppointment = (appointmentId: string) => {
    cancelAppointmentMutation.mutate(appointmentId);
  };

  const handleApproveAppointment = (appointmentId: string) => {
    const meetingLink = prompt('Enter meeting link (optional):') || undefined;
    approveAppointmentMutation.mutate({ appointmentId, meetingLink });
  };

  const handleDeclineAppointment = (appointmentId: string) => {
    if (confirm('Are you sure you want to decline this appointment?')) {
      declineAppointmentMutation.mutate(appointmentId);
    }
  };

  const handleDeleteAvailability = (slotId: string) => {
    deleteAvailabilityMutation.mutate(slotId);
  };

  const formatDateTime = (dateTime: string) => {
    return new Date(dateTime).toLocaleString();
  };

  const getStatusBadge = (status: string) => {
    return (
      <Badge className={`${STATUS_COLORS[status as keyof typeof STATUS_COLORS] || 'bg-gray-100 text-gray-800'} capitalize`}>
        {status.replace('_', ' ')}
      </Badge>
    );
  };

  // Filter appointments based on selected filter
  const filteredAppointments = React.useMemo(() => {
    const now = new Date();
    
    switch (appointmentFilter) {
      case 'upcoming':
        return appointments.filter((apt: Appointment) => 
          new Date(apt.scheduledAt) > now && apt.status !== 'cancelled' && apt.status !== 'completed'
        );
      case 'past':
        return appointments.filter((apt: Appointment) => 
          new Date(apt.scheduledAt) < now && apt.status !== 'completed' && apt.status !== 'cancelled'
        );
      case 'completed':
        return appointments.filter((apt: Appointment) => apt.status === 'completed');
      case 'cancelled':
        return appointments.filter((apt: Appointment) => apt.status === 'cancelled');
      case 'all':
      default:
        return appointments;
    }
  }, [appointments, appointmentFilter]);

  return (
    <div className="p-3 md:p-6 space-y-4 md:space-y-6" data-testid="scheduling-interface">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl md:text-2xl font-bold">Book a Teacher</h2>
          <p className="text-sm md:text-base text-muted-foreground">
            {profile?.role === 'teacher' 
              ? 'Manage your availability and appointments' 
              : 'Schedule lessons with available teachers'}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Calendar className="h-4 w-4 md:h-5 md:w-5 text-foreground" />
          <Clock className="h-4 w-4 md:h-5 md:w-5 text-foreground" />
        </div>
      </div>

      <Tabs value={selectedTab} onValueChange={setSelectedTab} className="space-y-3 md:space-y-4 w-full">
        <TabsList className="grid w-full grid-cols-2 md:grid-cols-3 h-9 md:h-10">
          <TabsTrigger value="appointments" data-testid="tab-appointments" className="text-xs md:text-sm">
            <span className="hidden md:inline">My Appointments</span>
            <span className="md:hidden">Appointments</span>
            <span className="ml-1">({appointments.length})</span>
          </TabsTrigger>
          {profile?.role === 'teacher' && (
            <TabsTrigger value="availability" data-testid="tab-availability" className="text-xs md:text-sm">
              <span className="hidden md:inline">My Availability</span>
              <span className="md:hidden">Availability</span>
              <span className="ml-1">({availability.length})</span>
            </TabsTrigger>
          )}
          {profile?.role === 'student' && (
            <TabsTrigger value="book" data-testid="tab-book" className="text-xs md:text-sm">
              Book Session
            </TabsTrigger>
          )}
        </TabsList>

        {/* Appointments Tab */}
        <TabsContent value="appointments" className="space-y-4">
          <Card>
            <CardHeader className="px-3 md:px-6">
              <CardTitle className="flex items-center gap-2 text-lg md:text-xl">
                <BookOpen className="h-4 w-4 md:h-5 md:w-5" />
                My Appointments
              </CardTitle>
            </CardHeader>
            <CardContent className="px-3 py-4 md:px-6">
              {/* Appointment Filter Tabs */}
              <Tabs value={appointmentFilter} onValueChange={(value) => setAppointmentFilter(value as any)} className="mb-4">
                <TabsList className="grid w-full grid-cols-5 h-9">
                  <TabsTrigger value="all" className="text-xs" data-testid="filter-all">
                    All ({appointments.length})
                  </TabsTrigger>
                  <TabsTrigger value="upcoming" className="text-xs" data-testid="filter-upcoming">
                    Upcoming
                  </TabsTrigger>
                  <TabsTrigger value="past" className="text-xs" data-testid="filter-past">
                    Past
                  </TabsTrigger>
                  <TabsTrigger value="completed" className="text-xs" data-testid="filter-completed">
                    Completed
                  </TabsTrigger>
                  <TabsTrigger value="cancelled" className="text-xs" data-testid="filter-cancelled">
                    Cancelled
                  </TabsTrigger>
                </TabsList>
              </Tabs>

              <ScrollArea className="h-[400px] md:h-[500px]">
                <div className="space-y-3 md:space-y-4">
                  {appointmentsLoading ? (
                    <div className="text-center py-6 md:py-8">Loading appointments...</div>
                  ) : filteredAppointments.length === 0 ? (
                    <div className="text-center py-6 md:py-8 text-muted-foreground">
                      No {appointmentFilter !== 'all' ? appointmentFilter : ''} appointments found
                    </div>
                  ) : (
                    filteredAppointments.map((appointment: Appointment) => (
                      <div key={appointment.id} className="p-3 md:p-4 border rounded-lg" data-testid={`appointment-${appointment.id}`}>
                        <div className="flex items-start justify-between mb-2">
                          <div className="flex items-center gap-2">
                            <User className="h-4 w-4" />
                            <span className="font-medium">
                              {profile?.role === 'teacher' 
                                ? `Student: ${appointment.studentName}` 
                                : `Teacher: ${appointment.teacherName}`}
                            </span>
                            {getStatusBadge(appointment.status)}
                          </div>
                          <div className="flex items-center gap-1">
                            {appointment.status === 'scheduled' && (
                              <>
                                {profile?.role === 'teacher' ? (
                                  <>
                                  <Button
                                    size="sm"
                                    onClick={() => handleApproveAppointment(appointment.id)}
                                    className="bg-[#2f5a4e] text-white hover:bg-[#2f5a4e] active:bg-[#2f5a4e]"
                                    style={{ backgroundColor: '#2f5a4e', color: 'white', opacity: 1 }}
                                    data-testid={`approve-appointment-${appointment.id}`}
                                  >
                                    Approve
                                  </Button>
                                    <Button
                                      size="sm"
                                      variant="destructive"
                                      onClick={() => handleDeclineAppointment(appointment.id)}
                                      data-testid={`decline-appointment-${appointment.id}`}
                                    >
                                      <XCircle className="h-3 w-3" />
                                      Decline
                                    </Button>
                                  </>
                                ) : (
                                  <Button
                                    size="sm"
                                    variant="destructive"
                                    onClick={() => handleCancelAppointment(appointment.id)}
                                    data-testid={`cancel-appointment-${appointment.id}`}
                                  >
                                    <XCircle className="h-3 w-3" />
                                    Cancel
                                  </Button>
                                )}
                              </>
                            )}
                          </div>
                        </div>
                        <div className="space-y-1 text-sm text-muted-foreground">
                          <div className="flex items-center gap-2">
                            <Calendar className="h-3 w-3" />
                            {formatDateTime(appointment.scheduledAt)}
                          </div>
                          <div className="flex items-center gap-2">
                            <Clock className="h-3 w-3" />
                            {Math.round(appointment.duration)} minutes
                          </div>
                          {appointment.subject && (
                            <div className="flex items-center gap-2">
                              <BookOpen className="h-3 w-3" />
                              Subject: {appointment.subject}
                            </div>
                          )}
                          {appointment.description && (
                            <p className="mt-2">{appointment.description}</p>
                          )}
                          {appointment.meetingLink && (
                            <div className="flex items-center gap-2">
                              <Video className="h-3 w-3" />
                              <a href={appointment.meetingLink} target="_blank" rel="noopener noreferrer" className="text-foreground hover:underline transition-all duration-300">
                                Join Meeting
                              </a>
                            </div>
                          )}
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </ScrollArea>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Teacher Availability Tab */}
        {profile?.role === 'teacher' && (
          <TabsContent value="availability" className="space-y-4">
            <Card>
              <CardHeader className="px-3 md:px-6">
                <CardTitle className="flex items-center gap-2 text-lg md:text-xl">
                  <Clock className="h-4 w-4 md:h-5 md:w-5" />
                  Set Your Availability
                </CardTitle>
              </CardHeader>
              <CardContent className="px-3 py-4 md:px-6">
                <div className="space-y-4">
                  <div className="grid grid-cols-2 md:grid-cols-5 gap-3 md:gap-4">
                    <div>
                      <Label className="text-xs md:text-sm">Category</Label>
                      <Select 
                        value={newAvailability.categoryId} 
                        onValueChange={(value) => setNewAvailability({...newAvailability, categoryId: value})}
                      >
                        <SelectTrigger data-testid="availability-category-select" className="text-xs md:text-sm">
                          <SelectValue placeholder="Select category" />
                        </SelectTrigger>
                        <SelectContent>
                          {allCategories.map((cat: any) => (
                            <SelectItem key={cat.id} value={cat.id}>{cat.icon} {cat.name}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label className="text-xs md:text-sm">Day</Label>
                      <Select 
                        value={newAvailability.dayOfWeek.toString()} 
                        onValueChange={(value) => setNewAvailability({...newAvailability, dayOfWeek: parseInt(value)})}
                      >
                        <SelectTrigger data-testid="availability-day-select" className="text-xs md:text-sm">
                          <SelectValue placeholder="Day" />
                        </SelectTrigger>
                        <SelectContent>
                          {DAYS_OF_WEEK.map((day, index) => (
                            <SelectItem key={index} value={index.toString()}>{day}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label className="text-xs md:text-sm">Start</Label>
                      <Input
                        type="time"
                        value={newAvailability.startTime}
                        onChange={(e) => setNewAvailability({...newAvailability, startTime: e.target.value})}
                        data-testid="availability-start-time"
                        className="text-xs md:text-sm"
                      />
                    </div>
                    <div>
                      <Label className="text-xs md:text-sm">End</Label>
                      <Input
                        type="time"
                        value={newAvailability.endTime}
                        onChange={(e) => setNewAvailability({...newAvailability, endTime: e.target.value})}
                        data-testid="availability-end-time"
                        className="text-xs md:text-sm"
                      />
                    </div>
                    <div className="flex items-end">
                      <Button 
                        onClick={handleAddAvailability}
                        disabled={addAvailabilityMutation.isPending || !newAvailability.categoryId}
                        data-testid="add-availability-btn"
                        className="w-full text-xs md:text-sm"
                      >
                        <Plus className="h-3 w-3 md:h-4 md:w-4 mr-1" />
                        Add
                      </Button>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="px-3 md:px-6">
                <CardTitle className="text-lg md:text-xl">Current Availability</CardTitle>
              </CardHeader>
              <CardContent className="px-3 py-4 md:px-6">
                <ScrollArea className="h-[400px]">
                  <div className="space-y-3">
                    {availabilityLoading ? (
                      <div className="text-center py-8">Loading availability...</div>
                    ) : availability.length === 0 ? (
                      <div className="text-center py-8 text-muted-foreground">
                        No availability slots set
                      </div>
                    ) : (
                      availability.map((slot: TeacherAvailability) => {
                        const category = allCategories.find((c: any) => c.id === slot.categoryId);
                        return (
                          <div key={slot.id} className="flex items-center justify-between p-3 border rounded" data-testid={`availability-slot-${slot.id}`}>
                            <div>
                              <div className="flex gap-2 items-center mb-1">
                                <span className="font-medium">{DAYS_OF_WEEK[slot.dayOfWeek]}</span>
                                <span className="text-xs px-2 py-1 rounded" style={{ backgroundColor: category?.color + '20', color: category?.color }}>
                                  {category?.icon} {category?.name}
                                </span>
                              </div>
                              <span className="text-sm text-muted-foreground">
                                {slot.startTime} - {slot.endTime}
                              </span>
                            </div>
                            <Button
                              size="sm"
                              variant="destructive"
                              onClick={() => handleDeleteAvailability(slot.id)}
                              data-testid={`delete-slot-${slot.id}`}
                            >
                              <Trash2 className="h-3 w-3" />
                            </Button>
                          </div>
                        );
                      })
                    )}
                  </div>
                </ScrollArea>
              </CardContent>
            </Card>
          </TabsContent>
        )}

        {/* Book Session Tab (Students) */}
        {profile?.role === 'student' && (
          <TabsContent value="book" className="space-y-4">
            <Card>
              <CardHeader className="px-3 md:px-6">
                <CardTitle className="flex items-center gap-2 text-lg md:text-xl">
                  <Users className="h-4 w-4 md:h-5 md:w-5" />
                  Book a Session
                </CardTitle>
              </CardHeader>
              <CardContent className="px-3 py-4 md:px-6">
                <div className="space-y-4">
                  <div>
                    <Label>Select Subject Category</Label>
                    <Select 
                      value={bookingForm.subjectId} 
                      onValueChange={handleCategoryChange}
                    >
                      <SelectTrigger data-testid="category-select">
                        <SelectValue placeholder="Select a category" />
                      </SelectTrigger>
                      <SelectContent>
                        {allCategoriesLoading ? (
                          <SelectItem value="loading" disabled>Loading categories...</SelectItem>
                        ) : allCategories && allCategories.length > 0 ? (
                          allCategories.map((cat: any) => (
                            <SelectItem key={cat.id} value={cat.id}>
                              {cat.name}
                            </SelectItem>
                          ))
                        ) : (
                          <SelectItem value="no-categories" disabled>No categories available</SelectItem>
                        )}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label>Select Teacher</Label>
                    <Select 
                      value={bookingForm.teacherId} 
                      onValueChange={(value) => {
                        console.log('👤 [UI] Selected teacher:', value);
                        setBookingForm(prev => ({ ...prev, teacherId: value }));
                      }}
                      disabled={!bookingForm.subjectId}
                    >
                      <SelectTrigger data-testid="teacher-select">
                        <SelectValue placeholder={bookingForm.subjectId ? "Choose a teacher for this subject" : "Select a subject first"} />
                      </SelectTrigger>
                      <SelectContent>
                        {filteredTeachers && filteredTeachers.length > 0 ? (
                          filteredTeachers.map((teacher: any) => {
                            const teacherId = teacher.id || teacher.teacherId;
                            const specs = teacher.specializations?.map((s: any) => s.name).join(', ') || '';
                            return (
                              <SelectItem key={teacherId} value={teacherId}>
                                <div className="flex flex-col items-start">
                                  <span className="font-medium">{teacher.name} {teacher.hourlyRate ? `- $${teacher.hourlyRate}/hr` : ''}</span>
                                  {specs && <span className="text-xs text-muted-foreground">Teaches: {specs}</span>}
                                </div>
                              </SelectItem>
                            );
                          })
                        ) : bookingForm.subjectId ? (
                          <SelectItem value="no-teachers" disabled>No teachers for this subject yet</SelectItem>
                        ) : (
                          <SelectItem value="select-subject" disabled>Select a subject first</SelectItem>
                        )}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label>Date & Time</Label>
                    <Input
                      type="datetime-local"
                      value={bookingForm.scheduledAt}
                      onChange={(e) => setBookingForm({...bookingForm, scheduledAt: e.target.value})}
                      data-testid="booking-datetime"
                    />
                  </div>
                  <div>
                    <Label>Duration (minutes)</Label>
                    <Select 
                      value={bookingForm.duration.toString()} 
                      onValueChange={(value) => setBookingForm({...bookingForm, duration: parseInt(value)})}
                    >
                      <SelectTrigger data-testid="duration-select">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="30">30 minutes</SelectItem>
                        <SelectItem value="60">60 minutes</SelectItem>
                        <SelectItem value="90">90 minutes</SelectItem>
                        <SelectItem value="120">120 minutes</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label>Description (Optional)</Label>
                    <Textarea
                      placeholder="Any specific topics or requirements?"
                      value={bookingForm.description}
                      onChange={(e) => setBookingForm({...bookingForm, description: e.target.value})}
                      data-testid="booking-description"
                    />
                  </div>
                  <Button 
                    onClick={handleBookAppointment}
                    disabled={!bookingForm.teacherId || !bookingForm.scheduledAt || bookAppointmentMutation.isPending}
                    data-testid="book-appointment-btn"
                    className="bg-[#2f5a4e] hover:bg-[#2f5a4e] text-white"
                  >
                    <Calendar className="h-4 w-4 mr-2" />
                    {bookAppointmentMutation.isPending ? 'Booking...' : 'Book Session'}
                  </Button>
                  {bookAppointmentMutation.error && (
                    <div className="text-primary text-sm mt-2">
                      Booking failed. Please try again.
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="px-3 md:px-6">
                <CardTitle className="text-lg md:text-xl">
                  {bookingForm.subjectId ? 'Specialized Teachers' : 'Available Teachers'}
                </CardTitle>
                {bookingForm.subjectId && (
                  <p className="text-sm text-muted-foreground mt-1">
                    Teachers specializing in {subjectsWithTeachers.find((s: any) => s.id === bookingForm.subjectId)?.name || 'this subject'}
                  </p>
                )}
              </CardHeader>
              <CardContent className="px-3 py-4 md:px-6">
                {!bookingForm.subjectId ? (
                  <div className="text-center py-8 text-muted-foreground">
                    <BookOpen className="h-8 w-8 mx-auto mb-2 opacity-50" />
                    <p>Please select a subject first to see available teachers for that subject</p>
                  </div>
                ) : (
                  <ScrollArea className="h-[300px]">
                    <div className="space-y-3">
                      {teachersLoading ? (
                        <div className="text-center py-8">Loading teachers...</div>
                      ) : !filteredTeachers || filteredTeachers.length === 0 ? (
                        <div className="text-center py-8 text-muted-foreground">
                          <p>No teachers available for this subject</p>
                        </div>
                      ) : (
                        filteredTeachers.map((teacher: any) => {
                          const teacherId = teacher.id || teacher.teacherId;
                          // Find matching teacher in availableTeachers to get full availability data
                          const fullTeacherData = availableTeachers.find((t: any) => t.id === teacherId);
                          const availableDays = fullTeacherData 
                            ? Object.entries(fullTeacherData.availability.weeklyAvailability)
                                .filter(([day, isAvailable]) => isAvailable)
                                .map(([day]) => day)
                                .join(', ')
                            : 'Schedule not set';
                          
                          return (
                            <div key={teacherId} className="p-4 border rounded-lg hover:bg-muted/50 transition-colors" data-testid={`teacher-${teacherId}`}>
                              <div className="flex items-start gap-3">
                                {teacher.avatarUrl && (
                                  <Avatar className="h-12 w-12">
                                    <AvatarImage src={teacher.avatarUrl} alt={teacher.name} />
                                    <AvatarFallback>{teacher.name.charAt(0)}</AvatarFallback>
                                  </Avatar>
                                )}
                                <div className="flex-1 min-w-0">
                                  <div className="flex items-baseline gap-2 mb-1">
                                    <h4 className="font-semibold">{teacher.name}</h4>
                                    {teacher.hourlyRate && (
                                      <span className="text-sm text-green-600 font-medium">${teacher.hourlyRate}/hr</span>
                                    )}
                                  </div>
                                  <p className="text-sm text-muted-foreground mb-2">
                                    {teacher.email}
                                  </p>
                                  <div className="space-y-1 text-sm">
                                    <div className="flex items-center gap-2 text-muted-foreground">
                                      <Calendar className="h-3 w-3" />
                                      <span><strong>Available Days:</strong> {availableDays || 'Not set'}</span>
                                    </div>
                                    {fullTeacherData && (
                                      <div className="flex items-center gap-2 text-muted-foreground">
                                        <Clock className="h-3 w-3" />
                                        <span><strong>Time Slot:</strong> {fullTeacherData.availability?.startTime} - {fullTeacherData.availability?.endTime} ({fullTeacherData.availability?.timezone})</span>
                                      </div>
                                    )}
                                  </div>
                                </div>
                                <Button
                                  size="sm"
                                  onClick={() => {
                                    console.log('👤 [UI] Selected teacher via button:', teacher.id || teacher.teacherId);
                                    setBookingForm(prev => ({...prev, teacherId: teacher.id || teacher.teacherId}));
                                  }}
                                  data-testid={`select-teacher-${teacher.id || teacher.teacherId}`}
                                  className="whitespace-nowrap bg-[#2f5a4e] text-white hover:bg-[#2f5a4e] active:bg-[#2f5a4e]"
                                  style={{ backgroundColor: '#2f5a4e', color: 'white', opacity: 1 }}
                                >
                                  Select
                                </Button>
                              </div>
                            </div>
                          );
                        })
                      )}
                    </div>
                  </ScrollArea>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        )}
      </Tabs>
    </div>
  );
};

export default SchedulingInterface;
