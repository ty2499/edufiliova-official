import { useState, useEffect, useCallback } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { 
  User, 
  Mail, 
  Globe, 
  CreditCard, 
  Bell, 
  Download, 
  Trash2, 
  Camera,
  Calendar,
  DollarSign,
  AlertTriangle,
  Check,
  X,
  Loader2,
  Settings
} from "lucide-react";
import { apiRequest } from "@/lib/queryClient";

interface NotificationPreferences {
  emailLessons: boolean;
  emailProgress: boolean;
  emailMessages: boolean;
  emailMarketing: boolean;
  smsLessons: boolean;
  smsProgress: boolean;
  smsMessages: boolean;
  pushNotifications: boolean;
}


export function StudentSettings() {
  const { user, profile } = useAuth();
  const queryClient = useQueryClient();
  
  // Form states
  const [profileForm, setProfileForm] = useState({
    name: profile?.name || "",
    pronouns: profile?.pronouns || "",
    bio: profile?.bio || "",
    gradeLevel: profile?.gradeLevel || "7"
  });
  const [deleteConfirmation, setDeleteConfirmation] = useState("");

  // Loading states
  const [isProfileLoading, setIsProfileLoading] = useState(false);
  const [isAvatarLoading, setIsAvatarLoading] = useState(false);
  const [isNotificationLoading, setIsNotificationLoading] = useState(false);
  const [isDeleteLoading, setIsDeleteLoading] = useState(false);
  const [isExportLoading, setIsExportLoading] = useState(false);
  const [autoSaving, setAutoSaving] = useState(false);
  const [saveTimeout, setSaveTimeout] = useState<NodeJS.Timeout | null>(null);

  // Fetch notification preferences
  const { data: notificationPrefs, refetch: refetchNotifications } = useQuery({
    queryKey: ['/api/settings/notifications'],
    queryFn: async () => {
      const response = await fetch('/api/settings/notifications', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('sessionId')}`
        }
      });
      const result = await response.json();
      if (!result.success) throw new Error(result.error);
      return result.data;
    },
    enabled: !!user
  });


  // Update profile form when profile changes
  useEffect(() => {
    if (profile) {
      setProfileForm({
        name: profile.name || "",
        pronouns: profile.pronouns || "",
        bio: profile.bio || "",
        gradeLevel: profile.gradeLevel || "7"
      });
    }
  }, [profile]);

  // Auto-save debounced function
  const debouncedAutoSave = useCallback(async (formData: any) => {
    if (saveTimeout) {
      clearTimeout(saveTimeout);
    }

    const newTimeout = setTimeout(async () => {
      setAutoSaving(true);
      try {
        const response = await fetch('/api/settings/profile', {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${localStorage.getItem('sessionId')}`
          },
          body: JSON.stringify({ ...profileForm, ...formData })
        });

        const result = await response.json();
        if (result.success) {
          queryClient.invalidateQueries({ queryKey: ['/api/auth/profile'] });
        } else {
          console.error('StudentSettings: Auto-save failed:', result.error);
        }
      } catch (error) {
        console.error('StudentSettings: Auto-save error:', error);
      } finally {
        setAutoSaving(false);
      }
    }, 1500); // 1.5 second debounce

    setSaveTimeout(newTimeout);
  }, [profileForm, saveTimeout, queryClient]);


  // Update profile
  const handleProfileUpdate = async () => {
    if (!user) return;
    
    setIsProfileLoading(true);
    try {
      const response = await fetch('/api/settings/profile', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('sessionId')}`
        },
        body: JSON.stringify(profileForm)
      });

      const result = await response.json();
      if (!result.success) throw new Error(result.error);

      console.log('StudentSettings: Profile updated successfully');

      // Refresh user data
      queryClient.invalidateQueries({ queryKey: ['/api/auth/profile'] });

    } catch (error: any) {
      console.error('StudentSettings: Failed to update profile:', error.message);
    } finally {
      setIsProfileLoading(false);
    }
  };

  // Handle new avatar upload with direct file input
  const handleNewAvatarUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    console.log('🎯 File input triggered!', event.target.files);
    
    const file = event.target.files?.[0];
    
    console.log('📁 Selected file:', file ? {
      name: file.name,
      type: file.type,
      size: file.size
    } : 'None');
    
    console.log('👤 Current user:', user ? user.id : 'None');
    
    if (!file || !user) {
      console.log('❌ Missing file or user, aborting');
      return;
    }

    // Validate file
    if (!file.type.startsWith('image/')) {
      console.log('❌ Invalid file type:', file.type);
      console.error('StudentSettings: Invalid file type:', file.type);
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      console.log('❌ File too large:', file.size);
      console.error('StudentSettings: File too large:', file.size);
      return;
    }

    console.log('✅ File validation passed, starting upload...');
    setIsAvatarLoading(true);
    
    try {
      const formData = new FormData();
      formData.append('avatar', file);
      
      console.log('📤 Making upload request to /api/settings/upload-avatar');
      console.log('🔐 Auth token:', localStorage.getItem('sessionId'));

      const response = await fetch('/api/settings/upload-avatar', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('sessionId')}`
        },
        body: formData
      });

      console.log('📥 Upload response status:', response.status);
      const result = await response.json();
      console.log('📥 Upload response data:', result);
      
      if (!result.success) throw new Error(result.error);

      console.log('StudentSettings: Profile picture updated successfully');

      // Update localStorage profile with new avatar URL
      const storedProfile = localStorage.getItem('profile');
      if (storedProfile && result.avatarUrl) {
        try {
          const profile = JSON.parse(storedProfile);
          profile.avatarUrl = result.avatarUrl;
          localStorage.setItem('profile', JSON.stringify(profile));
        } catch (e) {
          console.log('Failed to update localStorage profile');
        }
      }

      // Refresh user data and force reload
      await queryClient.invalidateQueries({ queryKey: ['/api/auth/profile'] });
      await queryClient.refetchQueries({ queryKey: ['/api/auth/profile'] });
      
      // Also refresh settings page data
      window.location.reload();

    } catch (error: any) {
      console.log('❌ Upload error:', error);
      console.error('StudentSettings: Failed to upload avatar:', error.message);
    } finally {
      setIsAvatarLoading(false);
    }
  };

  // Update notification preferences
  const handleNotificationUpdate = async (updates: Partial<NotificationPreferences>) => {
    if (!user || !notificationPrefs) return;

    setIsNotificationLoading(true);
    try {
      const updatedPrefs = { ...notificationPrefs, ...updates };
      
      const response = await fetch('/api/settings/notifications', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('sessionId')}`
        },
        body: JSON.stringify(updatedPrefs)
      });

      const result = await response.json();
      if (!result.success) throw new Error(result.error);

      console.log('StudentSettings: Notification preferences updated');

      refetchNotifications();

    } catch (error: any) {
      console.error('StudentSettings: Failed to update preferences:', error.message);
    } finally {
      setIsNotificationLoading(false);
    }
  };


  // Export data
  const handleExportData = async () => {
    if (!user) return;

    setIsExportLoading(true);
    try {
      const response = await fetch('/api/settings/export-data', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('sessionId')}`
        }
      });

      const result = await response.json();
      if (!result.success) throw new Error(result.error);

      // Download as JSON file
      const blob = new Blob([JSON.stringify(result.data, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `edufiliova-data-${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      console.log('StudentSettings: Data exported successfully');

    } catch (error: any) {
      console.error('StudentSettings: Failed to export data:', error.message);
    } finally {
      setIsExportLoading(false);
    }
  };

  // Delete account
  const handleDeleteAccount = async () => {
    if (!user || deleteConfirmation !== "DELETE MY ACCOUNT") return;

    setIsDeleteLoading(true);
    try {
      const response = await fetch('/api/settings/delete-account', {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('sessionId')}`
        },
        body: JSON.stringify({ confirmation: deleteConfirmation })
      });

      const result = await response.json();
      if (!result.success) throw new Error(result.error);

      console.log('StudentSettings: Account deleted successfully');

      // Clear local storage and redirect
      localStorage.clear();
      window.location.href = '/';

    } catch (error: any) {
      console.error('StudentSettings: Failed to delete account:', error.message);
    } finally {
      setIsDeleteLoading(false);
    }
  };

  if (!user || !profile) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-foreground mb-2">Settings</h1>
        <p className="text-muted-foreground">
          Manage your account preferences and settings
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Profile Settings */}
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User className="w-5 h-5" />
                Profile Information
                {autoSaving && (
                  <Badge variant="outline" className="ml-2 animate-pulse">
                    Auto-saving...
                  </Badge>
                )}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Avatar Section */}
              <div className="flex items-center gap-6">
                <Avatar className="w-20 h-20">
                  <AvatarImage src={profile.avatarUrl || undefined} />
                  <AvatarFallback className="text-lg">
                    {profile.name?.charAt(0) || "S"}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1">
                  <h3 className="font-medium text-foreground">Profile Picture</h3>
                  <p className="text-sm text-muted-foreground mb-3">
                    Upload a new profile picture
                  </p>
                  <div className="flex items-center gap-3">
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleNewAvatarUpload}
                      className="hidden"
                      id="avatar-upload"
                      data-testid="avatar-input"
                    />
                    <Button 
                      asChild
                      variant="outline"
                      disabled={isAvatarLoading}
                      data-testid="upload-avatar-btn"
                    >
                      <label htmlFor="avatar-upload" className="cursor-pointer">
                        {isAvatarLoading ? (
                          <>
                            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                            Uploading...
                          </>
                        ) : (
                          <>
                            <Camera className="w-4 h-4 mr-2" />
                            Choose Image
                          </>
                        )}
                      </label>
                    </Button>
                  </div>
                </div>
              </div>

              <Separator />

              {/* Profile Form */}
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="display-name">Display Name</Label>
                  <Input
                    id="display-name"
                    value={profileForm.name}
                    onChange={(e) => {
                      const newName = e.target.value;
                      setProfileForm(prev => ({ ...prev, name: newName }));
                      debouncedAutoSave({ name: newName });
                    }}
                    placeholder="Enter your display name"
                    data-testid="input-display-name"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="email">Email Address</Label>
                  <Input
                    id="email"
                    value={user.email}
                    disabled
                    className="bg-muted"
                    data-testid="input-email"
                  />
                  <p className="text-xs text-muted-foreground">
                    Email cannot be changed. Contact support if you need to update your email.
                  </p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="pronouns">Pronouns (Optional)</Label>
                  <Input
                    id="pronouns"
                    value={profileForm.pronouns}
                    onChange={(e) => {
                      const newPronouns = e.target.value;
                      setProfileForm(prev => ({ ...prev, pronouns: newPronouns }));
                      debouncedAutoSave({ pronouns: newPronouns });
                    }}
                    placeholder="e.g., they/them, she/her, he/him"
                    data-testid="input-pronouns"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="country">Country</Label>
                  <Input
                    id="country"
                    value={profile.country}
                    disabled
                    className="bg-muted"
                    data-testid="input-country"
                  />
                  <p className="text-xs text-muted-foreground">
                    Country affects available subjects and curriculum. Contact support to change.
                  </p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="grade">Grade Level</Label>
                  <Select
                    value={profileForm.gradeLevel}
                    onValueChange={(value: any) => {
                      setProfileForm(prev => ({ ...prev, gradeLevel: value as any }));
                      
                      let gradeNumber = 7;
                      if (value === 'college') {
                        gradeNumber = 13;
                      } else if (value === 'university') {
                        gradeNumber = 14;
                      } else {
                        gradeNumber = parseInt(value) || 7;
                      }
                      
                      const educationLevel = value === 'college' || value === 'university' ? value : 'grade';
                      
                      debouncedAutoSave({ 
                        gradeLevel: value as any, 
                        grade: gradeNumber,
                        educationLevel: educationLevel as any
                      });
                    }}
                  >
                    <SelectTrigger id="grade" data-testid="select-grade">
                      <SelectValue placeholder="Select your grade level" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="1">Grade 1</SelectItem>
                      <SelectItem value="2">Grade 2</SelectItem>
                      <SelectItem value="3">Grade 3</SelectItem>
                      <SelectItem value="4">Grade 4</SelectItem>
                      <SelectItem value="5">Grade 5</SelectItem>
                      <SelectItem value="6">Grade 6</SelectItem>
                      <SelectItem value="7">Grade 7</SelectItem>
                      <SelectItem value="8">Grade 8</SelectItem>
                      <SelectItem value="9">Grade 9</SelectItem>
                      <SelectItem value="10">Grade 10</SelectItem>
                      <SelectItem value="11">Grade 11</SelectItem>
                      <SelectItem value="12">Grade 12</SelectItem>
                      <SelectItem value="college">College</SelectItem>
                      <SelectItem value="university">University</SelectItem>
                    </SelectContent>
                  </Select>
                  <p className="text-xs text-muted-foreground">
                    Your grade level helps personalize your learning experience
                  </p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="bio">Bio (Optional)</Label>
                  <Textarea
                    id="bio"
                    value={profileForm.bio}
                    onChange={(e) => {
                      const newBio = e.target.value;
                      setProfileForm(prev => ({ ...prev, bio: newBio }));
                      debouncedAutoSave({ bio: newBio });
                    }}
                    placeholder="Tell us a bit about yourself..."
                    className="min-h-[100px]"
                    data-testid="input-bio"
                  />
                </div>

                <Button 
                  onClick={handleProfileUpdate}
                  disabled={isProfileLoading}
                  className="w-full"
                  data-testid="save-profile-btn"
                  variant="outline"
                >
                  {isProfileLoading ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Saving Changes...
                    </>
                  ) : (
                    <>
                      <Check className="w-4 h-4 mr-2" />
                      Manual Save
                    </>
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Notification Preferences */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Bell className="w-5 h-5" />
                Notification Preferences
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {notificationPrefs ? (
                <>
                  <div className="space-y-4">
                    <div>
                      <h4 className="font-medium mb-3">Email Notifications</h4>
                      <div className="space-y-3">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-sm font-medium">Lesson Updates</p>
                            <p className="text-xs text-muted-foreground">Get notified about new lessons and course updates</p>
                          </div>
                          <Switch
                            checked={notificationPrefs.emailLessons}
                            onCheckedChange={(checked) => handleNotificationUpdate({ emailLessons: checked })}
                            disabled={isNotificationLoading}
                            data-testid="switch-email-lessons"
                          />
                        </div>
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-sm font-medium">Progress Reports</p>
                            <p className="text-xs text-muted-foreground">Weekly progress summaries and achievements</p>
                          </div>
                          <Switch
                            checked={notificationPrefs.emailProgress}
                            onCheckedChange={(checked) => handleNotificationUpdate({ emailProgress: checked })}
                            disabled={isNotificationLoading}
                            data-testid="switch-email-progress"
                          />
                        </div>
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-sm font-medium">Messages</p>
                            <p className="text-xs text-muted-foreground">Messages from teachers and community</p>
                          </div>
                          <Switch
                            checked={notificationPrefs.emailMessages}
                            onCheckedChange={(checked) => handleNotificationUpdate({ emailMessages: checked })}
                            disabled={isNotificationLoading}
                            data-testid="switch-email-messages"
                          />
                        </div>
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-sm font-medium">Marketing Updates</p>
                            <p className="text-xs text-muted-foreground">Product updates and promotional offers</p>
                          </div>
                          <Switch
                            checked={notificationPrefs.emailMarketing}
                            onCheckedChange={(checked) => handleNotificationUpdate({ emailMarketing: checked })}
                            disabled={isNotificationLoading}
                            data-testid="switch-email-marketing"
                          />
                        </div>
                      </div>
                    </div>

                    <Separator />

                    <div>
                      <h4 className="font-medium mb-3">Push Notifications</h4>
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm font-medium">Browser Notifications</p>
                          <p className="text-xs text-muted-foreground">Instant notifications in your browser</p>
                        </div>
                        <Switch
                          checked={notificationPrefs.pushNotifications}
                          onCheckedChange={(checked) => handleNotificationUpdate({ pushNotifications: checked })}
                          disabled={isNotificationLoading}
                          data-testid="switch-push-notifications"
                        />
                      </div>
                    </div>
                  </div>
                </>
              ) : (
                <div className="flex items-center justify-center py-4">
                  <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
                </div>
              )}
            </CardContent>
          </Card>

          {/* Data Management */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Download className="w-5 h-5" />
                Data Management
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between p-4 border rounded-lg">
                <div>
                  <h4 className="font-medium">Export Your Data</h4>
                  <p className="text-sm text-muted-foreground">
                    Download all your profile data, progress, notes, and messages
                  </p>
                </div>
                <Button 
                  variant="outline" 
                  onClick={handleExportData}
                  disabled={isExportLoading}
                  data-testid="export-data-btn"
                >
                  {isExportLoading ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Exporting...
                    </>
                  ) : (
                    <>
                      <Download className="w-4 h-4 mr-2" />
                      Export Data
                    </>
                  )}
                </Button>
              </div>

              <ReferralSection />

              <div className="border border-destructive/20 rounded-lg p-4 bg-destructive/5">
                <div className="flex items-start gap-3 mb-4">
                  <AlertTriangle className="w-5 h-5 text-destructive mt-0.5" />
                  <div>
                    <h4 className="font-medium text-destructive">Delete Account</h4>
                    <p className="text-sm text-muted-foreground">
                      To delete your account and all associated data, please contact our customer service team.
                    </p>
                  </div>
                </div>
                <div className="space-y-3">
                  <div className="bg-white rounded-lg p-3 border border-gray-200">
                    <p className="text-sm font-medium text-gray-700 mb-2">Contact Customer Service:</p>
                    <div className="space-y-2">
                      <div className="flex items-center gap-2">
                        <Mail className="w-4 h-4 text-gray-500" />
                        <a 
                          href="mailto:erase@edufiliova.com" 
                          className="text-sm text-[#2f5a4e] hover:underline" transition-all duration-300
                          data-testid="link-delete-email"
                        >
                          erase@edufiliova.com
                        </a>
                      </div>
                      <div className="flex items-center gap-2">
                        <Bell className="w-4 h-4 text-gray-500" />
                        <span className="text-sm text-gray-600">
                          Or contact support via chat
                        </span>
                      </div>
                    </div>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Our customer service team will assist you with the account deletion process. This action cannot be undone.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

      </div>
    </div>
  );
}

// Referral Section Component
function ReferralSection() {
  const [copied, setCopied] = useState(false);
  const { data: stats, isLoading } = useQuery<{
    referralCode: string;
    referralLink: string;
    referralCount: number;
    earnedRewards: number;
    rewardThreshold: number;
    rewardAmount: number;
    referralsToNextReward: number;
  }>({
    queryKey: ['/api/shop/referral'],
  });

  const handleCopy = () => {
    if (stats?.referralLink) {
      navigator.clipboard.writeText(stats.referralLink);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  if (isLoading) {
    return (
      <div className="p-4 border rounded-lg" data-testid="card-referral">
        <div className="flex items-center gap-2 mb-2">
          <DollarSign className="h-5 w-5 text-green-600" />
          <h4 className="font-medium">Refer Friends & Earn</h4>
        </div>
        <p className="text-sm text-muted-foreground">Loading referral information...</p>
      </div>
    );
  }

  return (
    <div className="border rounded-lg p-4" data-testid="card-referral">
      <div className="flex items-center gap-2 mb-2">
        <DollarSign className="h-5 w-5 text-[#2f5a4e]" />
        <h4 className="font-bold text-[#1F1E30] tracking-tight">Refer Friends & Earn</h4>
      </div>
      <p className="text-sm text-muted-foreground mb-4">
        Refer 50 people and get $15 in your wallet
      </p>

      {/* Reward Progress */}
      <div className="bg-gradient-to-r from-[#2f5a4e]/10 to-blue-50 rounded-lg p-4 mb-4">
        <div className="flex justify-between items-center mb-2">
          <span className="text-sm font-medium text-gray-700">Referral Progress</span>
          <span className="text-sm font-bold text-[#2f5a4e]">
            {stats?.referralCount || 0} / {stats?.rewardThreshold || 50}
          </span>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-3 mb-2">
          <div
            className="bg-gradient-to-r from-[#2f5a4e] to-blue-500 h-3 rounded-full transition-all duration-300"
            style={{ width: `${((stats?.referralCount || 0) / (stats?.rewardThreshold || 50)) * 100}%` }}
          />
        </div>
        <p className="text-xs text-gray-600">
          {stats?.referralsToNextReward === 0
            ? '🎉 Congratulations! You\'ve earned a reward!'
            : `${stats?.referralsToNextReward} more referral${stats?.referralsToNextReward === 1 ? '' : 's'} to earn $${stats?.rewardAmount}`}
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 gap-4 mb-4">
        <div className="text-center p-4 bg-gray-50 rounded-lg">
          <p className="text-lg font-bold text-gray-900" data-testid="text-referral-count">
            {stats?.referralCount || 0}
          </p>
          <p className="text-xs text-gray-600 mt-1">Total Referrals</p>
        </div>
        <div className="text-center p-4 bg-[#2f5a4e]/10 rounded-lg">
          <p className="text-lg font-bold text-[#2f5a4e]" data-testid="text-earned-rewards">
            ${stats?.earnedRewards || 0}
          </p>
          <p className="text-xs text-gray-600 mt-1">Earned Rewards</p>
        </div>
      </div>

      {/* Referral Link */}
      <div>
        <Label className="text-sm font-medium text-gray-700 mb-2 block">
          Your Referral Link
        </Label>
        <div className="flex gap-2">
          <Input
            value={stats?.referralLink || ''}
            readOnly
            className="flex-1 font-mono text-sm"
            data-testid="input-referral-link"
          />
          <Button
            onClick={handleCopy}
            className="bg-[#2f5a4e] text-white" transition-all duration-300
            data-testid="button-copy-referral"
          >
            {copied ? (
              <>
                <Check className="h-4 w-4 mr-2" />
                Copied!
              </>
            ) : (
              'Copy'
            )}
          </Button>
        </div>
        <p className="text-xs text-gray-500 mt-2">
          Share this link with your friends. When 50 people sign up using your link, you'll earn $15!
        </p>
      </div>
    </div>
  );
}
