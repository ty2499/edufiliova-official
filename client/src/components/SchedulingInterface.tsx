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
  cancelled: 'bg-red-100 text-red-800',
  no_show: 'bg-orange-100 text-orange-800'
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
    timeZone: 'UTC'
  });
  const [bookingForm, setBookingForm] = useState({
    teacherId: '',
    subject: '',
    description: '',
    scheduledAt: '',
    duration: 60
  });

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
        timeZone: 'UTC'
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
        subject: '',
        description: '',
        scheduledAt: '',
        duration: 60
      });
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
    addAvailabilityMutation.mutate(newAvailability);
  };

  const handleBookAppointment = () => {
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
                                      variant="default"
                                      onClick={() => handleApproveAppointment(appointment.id)}
                                      data-testid={`approve-appointment-${appointment.id}`}
                                      className="bg-green-600 hover:bg-green-700 text-white dark:bg-green-500 dark:hover:bg-green-600"
                                    >
                                      <CheckCircle2 className="h-3 w-3" />
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
                              <a href={appointment.meetingLink} target="_blank" rel="noopener noreferrer" className="text-foreground hover:underline">
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
                  <div className="grid grid-cols-4 gap-4">
                    <div>
                      <Label>Day</Label>
                      <Select 
                        value={newAvailability.dayOfWeek.toString()} 
                        onValueChange={(value) => setNewAvailability({...newAvailability, dayOfWeek: parseInt(value)})}
                      >
                        <SelectTrigger data-testid="availability-day-select">
                          <SelectValue placeholder="Select day" />
                        </SelectTrigger>
                        <SelectContent>
                          {DAYS_OF_WEEK.map((day, index) => (
                            <SelectItem key={index} value={index.toString()}>{day}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label>Start Time</Label>
                      <Input
                        type="time"
                        value={newAvailability.startTime}
                        onChange={(e) => setNewAvailability({...newAvailability, startTime: e.target.value})}
                        data-testid="availability-start-time"
                      />
                    </div>
                    <div>
                      <Label>End Time</Label>
                      <Input
                        type="time"
                        value={newAvailability.endTime}
                        onChange={(e) => setNewAvailability({...newAvailability, endTime: e.target.value})}
                        data-testid="availability-end-time"
                      />
                    </div>
                    <div className="flex items-end">
                      <Button 
                        onClick={handleAddAvailability}
                        disabled={addAvailabilityMutation.isPending}
                        data-testid="add-availability-btn"
                      >
                        <Plus className="h-4 w-4 mr-1" />
                        Add Slot
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
                      availability.map((slot: TeacherAvailability) => (
                        <div key={slot.id} className="flex items-center justify-between p-3 border rounded" data-testid={`availability-slot-${slot.id}`}>
                          <div>
                            <span className="font-medium">{DAYS_OF_WEEK[slot.dayOfWeek]}</span>
                            <span className="ml-2 text-muted-foreground">
                              {slot.startTime} - {slot.endTime} ({slot.timeZone})
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
                      ))
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
                    <Label>Select Teacher</Label>
                    <Select 
                      value={bookingForm.teacherId} 
                      onValueChange={(value) => setBookingForm({...bookingForm, teacherId: value})}
                    >
                      <SelectTrigger data-testid="teacher-select">
                        <SelectValue placeholder="Choose a teacher" />
                      </SelectTrigger>
                      <SelectContent>
                        {availableTeachers && availableTeachers.length > 0 ? (
                          availableTeachers.map((teacher: any) => (
                            <SelectItem key={teacher.id} value={teacher.id}>
                              {teacher.name} - {teacher.availability?.startTime || '9:00'}-{teacher.availability?.endTime || '17:00'} ({teacher.availability?.timezone || 'UTC'})
                            </SelectItem>
                          ))
                        ) : (
                          <SelectItem value="no-teachers" disabled>No teachers available</SelectItem>
                        )}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label>Subject</Label>
                    <Input
                      placeholder="What would you like to learn?"
                      value={bookingForm.subject}
                      onChange={(e) => setBookingForm({...bookingForm, subject: e.target.value})}
                      data-testid="booking-subject"
                    />
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
                  >
                    <Calendar className="h-4 w-4 mr-2" />
                    {bookAppointmentMutation.isPending ? 'Booking...' : 'Book Session'}
                  </Button>
                  {bookAppointmentMutation.error && (
                    <div className="text-red-600 text-sm mt-2">
                      Booking failed. Please try again.
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="px-3 md:px-6">
                <CardTitle className="text-lg md:text-xl">Available Teachers</CardTitle>
              </CardHeader>
              <CardContent className="px-3 py-4 md:px-6">
                <ScrollArea className="h-[300px]">
                  <div className="space-y-3">
                    {teachersLoading ? (
                      <div className="text-center py-8">Loading teachers...</div>
                    ) : !availableTeachers || availableTeachers.length === 0 ? (
                      <div className="text-center py-8 text-muted-foreground">
                        <p>No teachers available at the moment</p>
                        {teachersError && <p className="text-red-500 text-sm">Error: {teachersError.message}</p>}
                      </div>
                    ) : (
                      availableTeachers.map((teacher: any) => {
                        // Get available days from weekly schedule
                        const availableDays = Object.entries(teacher.availability.weeklyAvailability)
                          .filter(([day, isAvailable]) => isAvailable)
                          .map(([day]) => day)
                          .join(', ');
                        
                        return (
                          <div key={teacher.id} className="p-3 border rounded" data-testid={`teacher-${teacher.id}`}>
                            <div className="flex items-center gap-3">
                              {teacher.avatarUrl && (
                                <Avatar className="h-10 w-10">
                                  <AvatarImage src={teacher.avatarUrl} alt={teacher.name} />
                                  <AvatarFallback>{teacher.name.charAt(0)}</AvatarFallback>
                                </Avatar>
                              )}
                              <div className="flex-1">
                                <h4 className="font-medium">{teacher.name}</h4>
                                <p className="text-sm text-muted-foreground">
                                  Available: {availableDays || 'No days set'}
                                </p>
                                <p className="text-sm text-muted-foreground">
                                  Time: {teacher.availability?.startTime} - {teacher.availability?.endTime} ({teacher.availability?.timezone})
                                </p>
                              </div>
                              <Button
                                size="sm"
                                onClick={() => setBookingForm({...bookingForm, teacherId: teacher.id})}
                                data-testid={`select-teacher-${teacher.id}`}
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
              </CardContent>
            </Card>
          </TabsContent>
        )}
      </Tabs>
    </div>
  );
};

export default SchedulingInterface;
