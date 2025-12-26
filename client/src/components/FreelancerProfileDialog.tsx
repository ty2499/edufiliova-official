import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useMutation } from '@tanstack/react-query';
import {
  Dialog,
  DialogContent,
  DialogTrigger,
  DialogTitle,
} from '@/components/ui/dialog';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Camera,
  MapPin,
  Mail,
  User,
  Briefcase,
  Info,
  LogOut,
  CheckCircle2,
  MoreVertical,
  Edit2,
} from 'lucide-react';
import { apiRequest, queryClient } from '@/lib/queryClient';

interface ProfileStats {
  views: number;
  likes: number;
  followers: number;
}

interface ProfileDialogProps {
  profile: any;
  userProfile: any;
  profileStats?: ProfileStats;
  onLogout: () => void;
  onStatisticsClick?: () => void;
  children: React.ReactNode;
}

const profileUpdateSchema = z.object({
  firstName: z.string().min(1, 'First name is required'),
  lastName: z.string().min(1, 'Last name is required'),
  email: z.string().email('Invalid email address'),
  bio: z.string().optional(),
  professionalTitle: z.string().optional(),
  location: z.string().optional(),
});

type ProfileUpdateForm = z.infer<typeof profileUpdateSchema>;

function formatNumber(num: number): string {
  if (num >= 1000000) return (num / 1000000).toFixed(1).replace(/\.0$/, '') + 'M';
  if (num >= 1000) return (num / 1000).toFixed(1).replace(/\.0$/, '') + 'K';
  return num.toString();
}

export function FreelancerProfileDialog({
  profile,
  userProfile,
  profileStats,
  onLogout,
  onStatisticsClick,
  children,
}: ProfileDialogProps) {
  const [open, setOpen] = useState(false);
  const [activeTab, setActiveTab] = useState('profile');
  const [isEditing, setIsEditing] = useState(false);

  const fullName = profile?.displayName || profile?.name || '';
  const nameParts = fullName.trim().split(' ');
  const firstName = nameParts[0] || '';
  const lastName = nameParts.slice(1).join(' ') || '';

  const form = useForm<ProfileUpdateForm>({
    resolver: zodResolver(profileUpdateSchema),
    defaultValues: {
      firstName,
      lastName,
      email: profile?.email || '',
      bio: profile?.bio || '',
      professionalTitle: profile?.professionalTitle || '',
      location: profile?.location || '',
    },
  });

  const updateProfileMutation = useMutation({
    mutationFn: async (data: ProfileUpdateForm) => {
      const fullName = `${data.firstName} ${data.lastName}`.trim();
      return apiRequest(`/api/profiles/${profile.userId}`, {
        method: 'PATCH',
        body: JSON.stringify({
          name: fullName,
          displayName: fullName,
          email: data.email,
          bio: data.bio || '',
          professionalTitle: data.professionalTitle || '',
          location: data.location || '',
        }),
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/me/profile'] });
      setIsEditing(false);
    },
  });

  const handleSave = (data: ProfileUpdateForm) => {
    updateProfileMutation.mutate(data);
  };

  const handleDiscard = () => {
    form.reset();
    setIsEditing(false);
  };

  const userSkills = userProfile?.skills || ['Business', 'Product', 'AI'];

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {children}
      </DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto p-0 w-[95vw] sm:w-full">
        <DialogTitle className="sr-only">Profile Settings</DialogTitle>
        <div className="relative">
          <div className="flex items-start justify-between p-4 sm:p-6 border-b bg-gradient-to-r from-gray-50 to-white">
            <div className="flex items-start gap-4">
              <div className="relative group">
                <Avatar className="h-24 w-24 border-4 border-white shadow-lg">
                  <AvatarImage src={profile?.avatarUrl || undefined} alt={fullName} />
                  <AvatarFallback className="text-xl bg-gradient-to-br from-pink-500 to-purple-600 text-white">
                    {fullName?.split(' ').map((n: string) => n[0]).join('').toUpperCase() || 'FL'}
                  </AvatarFallback>
                </Avatar>
                <button
                  className="absolute bottom-0 right-0 rounded-full p-2 shadow-md transition-all group-hover:scale-110 hover:opacity-80 hover:shadow-lg hover:scale-105" transition-all duration-300
                  style={{ backgroundColor: '#c4f03b' }}
                  aria-label="Change profile photo"
                  data-testid="button-edit-avatar"
                >
                  <Camera className="h-3.5 w-3.5 text-gray-900" />
                </button>
              </div>
              
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <h2 className="text-2xl font-bold text-gray-900" data-testid="text-profile-name">
                    {fullName}
                  </h2>
                  {userProfile?.verificationBadge && userProfile.verificationBadge !== 'none' && (
                    <CheckCircle2 className="h-5 w-5 text-blue-600" />
                  )}
                </div>
                
                {userProfile?.professionalTitle && (
                  <p className="text-sm text-gray-600 font-medium mt-1">
                    {userProfile.professionalTitle}
                  </p>
                )}
                
                <div className="flex items-center gap-4 mt-2">
                  <div className="flex items-center gap-1.5 text-sm text-gray-500">
                    <Mail className="h-3.5 w-3.5" />
                    <span data-testid="text-profile-email">{profile?.email}</span>
                  </div>
                  
                  {userProfile?.location && (
                    <div className="flex items-center gap-1.5 text-sm text-gray-500">
                      <MapPin className="h-3.5 w-3.5" />
                      <span data-testid="text-profile-location">{userProfile.location}</span>
                    </div>
                  )}
                </div>
                
                <div className="flex flex-wrap gap-2 mt-3">
                  {userSkills.slice(0, 3).map((skill: string, idx: number) => (
                    <Badge 
                      key={idx} 
                      variant="secondary" 
                      className="bg-gradient-to-r from-gray-100 to-gray-200 text-gray-700 hover:from-gray-200 hover:to-gray-300 border border-gray-300" transition-all duration-300
                      data-testid={`badge-skill-${idx}`}
                    >
                      {skill}
                    </Badge>
                  ))}
                </div>
              </div>
            </div>
            
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="outline"
                  size="icon"
                  className="h-9 w-9 rounded-full"
                  aria-label="Profile options menu"
                  data-testid="button-profile-menu"
                >
                  <MoreVertical className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-48">
                <DropdownMenuItem 
                  onClick={onLogout}
                  className="cursor-pointer text-primary focus:text-primary"
                  data-testid="menu-signout"
                >
                  <LogOut className="h-4 w-4 mr-2" />
                  Sign out
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>

          <div className="p-4 sm:p-8 space-y-6">
              <div className="mb-6 flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">Personal Information</h3>
                  <p className="text-sm text-gray-500 mt-1">
                    {isEditing ? 'Update your personal details and how others see you' : 'View your profile information'}
                  </p>
                </div>
                {!isEditing && (
                  <button
                    onClick={() => setIsEditing(true)}
                    className="text-gray-700 hover:text-gray-900 transition-colors" transition-all duration-300
                    aria-label="Edit profile"
                    data-testid="button-edit-profile"
                  >
                    <Edit2 className="h-5 w-5" />
                  </button>
                )}
              </div>
              
              {!isEditing ? (
                <div className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <Label className="text-sm font-semibold text-gray-700 flex items-center gap-2">
                        <User className="h-4 w-4 text-gray-400" />
                        First Name
                      </Label>
                      <p className="text-base text-gray-900 bg-gray-50 px-4 py-3 rounded-lg" data-testid="text-firstname-preview">
                        {firstName || 'Not set'}
                      </p>
                    </div>

                    <div className="space-y-2">
                      <Label className="text-sm font-semibold text-gray-700 flex items-center gap-2">
                        <User className="h-4 w-4 text-gray-400" />
                        Last Name
                      </Label>
                      <p className="text-base text-gray-900 bg-gray-50 px-4 py-3 rounded-lg" data-testid="text-lastname-preview">
                        {lastName || 'Not set'}
                      </p>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label className="text-sm font-semibold text-gray-700 flex items-center gap-2">
                      <Mail className="h-4 w-4 text-gray-400" />
                      Email Address
                    </Label>
                    <p className="text-base text-gray-900 bg-gray-50 px-4 py-3 rounded-lg" data-testid="text-email-preview">
                      {profile?.email || 'Not set'}
                    </p>
                  </div>

                  <div className="space-y-2">
                    <Label className="text-sm font-semibold text-gray-700 flex items-center gap-2">
                      <Briefcase className="h-4 w-4 text-gray-400" />
                      Professional Title
                    </Label>
                    <p className="text-base text-gray-900 bg-gray-50 px-4 py-3 rounded-lg" data-testid="text-professional-title-preview">
                      {userProfile?.professionalTitle || 'Not set'}
                    </p>
                  </div>

                  <div className="space-y-2">
                    <Label className="text-sm font-semibold text-gray-700 flex items-center gap-2">
                      <MapPin className="h-4 w-4 text-gray-400" />
                      Location
                    </Label>
                    <p className="text-base text-gray-900 bg-gray-50 px-4 py-3 rounded-lg" data-testid="text-location-preview">
                      {userProfile?.location || 'Not set'}
                    </p>
                  </div>

                  <div className="space-y-2">
                    <Label className="text-sm font-semibold text-gray-700 flex items-center gap-2">
                      <Info className="h-4 w-4 text-gray-400" />
                      Bio
                    </Label>
                    <p className="text-base text-gray-900 bg-gray-50 px-4 py-3 rounded-lg min-h-[120px]" data-testid="text-bio-preview">
                      {profile?.bio || 'No bio added yet'}
                    </p>
                  </div>
                </div>
              ) : (
                <form onSubmit={form.handleSubmit((data) => handleSave(data as ProfileUpdateForm))} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label htmlFor="firstName" className="text-sm font-semibold text-gray-700 flex items-center gap-2">
                      <User className="h-4 w-4 text-gray-400" />
                      First Name
                    </Label>
                    <Input
                      {...form.register('firstName')}
                      placeholder="Enter your first name"
                      className="bg-white border-gray-300 focus:border-pink-500 focus:ring-pink-500"
                      data-testid="input-firstname"
                    />
                    {form.formState.errors.firstName && (
                      <p className="text-xs text-primary mt-1 flex items-center gap-1">
                        {form.formState.errors.firstName.message}
                      </p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="lastName" className="text-sm font-semibold text-gray-700 flex items-center gap-2">
                      <User className="h-4 w-4 text-gray-400" />
                      Last Name
                    </Label>
                    <Input
                      {...form.register('lastName')}
                      placeholder="Enter your last name"
                      className="bg-white border-gray-300 focus:border-pink-500 focus:ring-pink-500"
                      data-testid="input-lastname"
                    />
                    {form.formState.errors.lastName && (
                      <p className="text-xs text-primary mt-1 flex items-center gap-1">
                        {form.formState.errors.lastName.message}
                      </p>
                    )}
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="email" className="text-sm font-semibold text-gray-700 flex items-center gap-2">
                    <Mail className="h-4 w-4 text-gray-400" />
                    Email Address
                  </Label>
                  <Input
                    {...form.register('email')}
                    type="email"
                    placeholder="your.email@example.com"
                    className="bg-white border-gray-300 focus:border-pink-500 focus:ring-pink-500"
                    data-testid="input-email"
                  />
                  {form.formState.errors.email && (
                    <p className="text-xs text-primary mt-1">{form.formState.errors.email.message}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="professionalTitle" className="text-sm font-semibold text-gray-700 flex items-center gap-2">
                    <Briefcase className="h-4 w-4 text-gray-400" />
                    Professional Title
                  </Label>
                  <Input
                    {...form.register('professionalTitle')}
                    placeholder="e.g., Full-Stack Developer, UI/UX Designer"
                    className="bg-white border-gray-300 focus:border-pink-500 focus:ring-pink-500"
                    data-testid="input-professional-title"
                  />
                  <p className="text-xs text-gray-500">This will be displayed on your public profile</p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="location" className="text-sm font-semibold text-gray-700 flex items-center gap-2">
                    <MapPin className="h-4 w-4 text-gray-400" />
                    Location
                  </Label>
                  <Input
                    {...form.register('location')}
                    placeholder="e.g., New York, USA"
                    className="bg-white border-gray-300 focus:border-pink-500 focus:ring-pink-500"
                    data-testid="input-location"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="bio" className="text-sm font-semibold text-gray-700 flex items-center gap-2">
                    <Info className="h-4 w-4 text-gray-400" />
                    Bio
                  </Label>
                  <textarea
                    {...form.register('bio')}
                    placeholder="Tell us about yourself, your experience, and what makes you unique..."
                    className="w-full min-h-[120px] px-4 py-3 bg-white border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-500 focus:border-transparent resize-none"
                    data-testid="input-bio"
                  />
                  <p className="text-xs text-gray-500">Brief description for your profile. Maximum 500 characters.</p>
                </div>

                <div className="flex justify-between items-center pt-6 border-t">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={handleDiscard}
                    className="px-6"
                    data-testid="button-discard"
                  >
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    className="px-8 shadow-md text-gray-900 hover:opacity-80 hover:shadow-lg hover:scale-105" transition-all duration-300
                    style={{ backgroundColor: '#c4f03b' }}
                    disabled={updateProfileMutation.isPending}
                    data-testid="button-save-changes"
                  >
                    {updateProfileMutation.isPending ? 'Saving...' : 'Save Changes'}
                  </Button>
                </div>
              </form>
              )}
            </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
