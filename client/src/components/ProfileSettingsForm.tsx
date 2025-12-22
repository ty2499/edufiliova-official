import { useState, useEffect, useCallback } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { 
  User, 
  Camera,
  Loader2,
  CheckCircle2,
  Edit2
} from "lucide-react";

export function ProfileSettingsForm() {
  const { user, profile, refreshAuth } = useAuth();
  const queryClient = useQueryClient();
  
  // Form states
  const [profileForm, setProfileForm] = useState({
    name: profile?.name || "",
    displayName: profile?.displayName || profile?.name || "",
    pronouns: profile?.pronouns || "",
    bio: profile?.bio || ""
  });

  // Loading states
  const [isProfileLoading, setIsProfileLoading] = useState(false);
  const [isAvatarLoading, setIsAvatarLoading] = useState(false);
  const [autoSaving, setAutoSaving] = useState(false);
  const [saveTimeout, setSaveTimeout] = useState<NodeJS.Timeout | null>(null);
  
  // Editing state
  const [isEditing, setIsEditing] = useState(false);

  // Update profile form when profile changes
  useEffect(() => {
    if (profile) {
      setProfileForm({
        name: profile.name || "",
        displayName: profile.displayName || profile.name || "",
        pronouns: profile.pronouns || "",
        bio: profile.bio || ""
      });
    }
  }, [profile]);

  // Auto-save debounced function
  const debouncedAutoSave = useCallback(async (formData: Partial<typeof profileForm>) => {
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
          body: JSON.stringify(formData)
        });

        const result = await response.json();
        if (!result.success) throw new Error(result.error);

        // Refresh auth to update localStorage with fresh data
        await refreshAuth();
        await queryClient.invalidateQueries({ queryKey: ['/api/auth/profile'] });
      } catch (error: any) {
        console.error('ProfileSettings: Auto-save failed:', error.message);
      } finally {
        setAutoSaving(false);
      }
    }, 1500);

    setSaveTimeout(newTimeout);
  }, [queryClient, saveTimeout]);

  // Handle profile update
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

      console.log('ProfileSettings: Profile updated successfully');
      
      // Refresh auth to update localStorage with fresh data
      await refreshAuth();
      await queryClient.invalidateQueries({ queryKey: ['/api/auth/profile'] });
      await queryClient.refetchQueries({ queryKey: ['/api/auth/profile'] });
      
      // Close the form after successful save
      setTimeout(() => {
        setIsEditing(false);
      }, 500);

    } catch (error: any) {
      console.error('ProfileSettings: Failed to update profile:', error.message);
    } finally {
      setIsProfileLoading(false);
    }
  };

  // Handle avatar upload
  const handleAvatarUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    
    if (!file || !user) return;

    // Validate file
    if (!file.type.startsWith('image/')) {
      console.error('ProfileSettings: Invalid file type:', file.type);
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      console.error('ProfileSettings: File too large:', file.size);
      return;
    }

    setIsAvatarLoading(true);
    
    try {
      const formData = new FormData();
      formData.append('avatar', file);

      const response = await fetch('/api/settings/upload-avatar', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('sessionId')}`
        },
        body: formData
      });

      const result = await response.json();
      if (!result.success) throw new Error(result.error);

      console.log('ProfileSettings: Profile picture updated successfully');

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

      // Refresh user data
      await queryClient.invalidateQueries({ queryKey: ['/api/auth/profile'] });
      await queryClient.refetchQueries({ queryKey: ['/api/auth/profile'] });

    } catch (error: any) {
      console.error('ProfileSettings: Failed to upload avatar:', error.message);
    } finally {
      setIsAvatarLoading(false);
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
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <User className="w-5 h-5" />
          Profile Settings
          {autoSaving && (
            <Badge variant="outline" className="ml-2 animate-pulse">
              Auto-saving...
            </Badge>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {!isEditing ? (
          /* Summary View */
          <div className="space-y-4">
            <div className="flex flex-col sm:flex-row items-center sm:items-start gap-4 sm:gap-6">
              <Avatar className="w-16 h-16 sm:w-20 sm:h-20 flex-shrink-0">
                <AvatarImage src={profile.avatarUrl || undefined} />
                <AvatarFallback className="text-lg">
                  {profile.displayName?.split(' ').map(n => n[0]).join('').toUpperCase() || 
                   profile.name?.split(' ').map(n => n[0]).join('').toUpperCase() || 
                   profile.email?.charAt(0).toUpperCase() || "U"}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1 text-center sm:text-left w-full">
                <h3 className="font-semibold text-lg text-foreground">
                  {profile.displayName || profile.name || "No name set"}
                </h3>
                <p className="text-sm text-muted-foreground mb-2 break-words">
                  {profile.email}
                </p>
                {profile.bio && (
                  <p className="text-sm text-muted-foreground line-clamp-2">
                    {profile.bio}
                  </p>
                )}
              </div>
            </div>
            
            <Button 
              onClick={() => setIsEditing(true)}
              variant="outline"
              className="w-full sm:w-auto"
              data-testid="button-edit-profile"
            >
              <Edit2 className="w-4 h-4 mr-2" />
              Edit Profile
            </Button>
          </div>
        ) : (
          /* Edit Form */
          <div className="space-y-6">
        {/* Avatar Section */}
        <div className="flex flex-col sm:flex-row items-center sm:items-start gap-4 sm:gap-6">
          <Avatar className="w-16 h-16 sm:w-20 sm:h-20 flex-shrink-0">
            <AvatarImage src={profile.avatarUrl || undefined} />
            <AvatarFallback className="text-lg">
              {profile.displayName?.split(' ').map(n => n[0]).join('').toUpperCase() || 
               profile.name?.split(' ').map(n => n[0]).join('').toUpperCase() || 
               profile.email?.charAt(0).toUpperCase() || "U"}
            </AvatarFallback>
          </Avatar>
          <div className="flex-1 text-center sm:text-left w-full">
            <h3 className="font-medium text-foreground">Profile Picture</h3>
            <p className="text-sm text-muted-foreground mb-3 break-words">
              {profile.email}
            </p>
            <div className="flex flex-col sm:flex-row items-center gap-3">
              <input
                type="file"
                accept="image/*"
                onChange={handleAvatarUpload}
                className="hidden"
                id="avatar-upload"
                data-testid="avatar-input"
              />
              <Button 
                asChild
                variant="outline"
                disabled={isAvatarLoading}
                data-testid="button-change-photo"
                className="w-full sm:w-auto"
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
                      Change Photo
                    </>
                  )}
                </label>
              </Button>
            </div>
          </div>
        </div>

        <Separator />

        {/* Profile Form */}
        <div className="space-y-5">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="display-name">Display Name</Label>
              <Input
                id="display-name"
                value={profileForm.displayName}
                onChange={(e) => {
                  const newDisplayName = e.target.value;
                  setProfileForm(prev => ({ ...prev, displayName: newDisplayName }));
                  debouncedAutoSave({ displayName: newDisplayName });
                }}
                placeholder="Enter your display name"
                data-testid="input-display-name"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                value={user?.email || ""}
                disabled
                className="bg-muted"
                data-testid="input-email"
              />
            </div>
          </div>

          <div className="space-y-3">
            <Label htmlFor="bio" className="text-base font-medium">Professional Bio</Label>
            <Textarea
              id="bio"
              value={profileForm.bio}
              onChange={(e) => {
                const newBio = e.target.value;
                setProfileForm(prev => ({ ...prev, bio: newBio }));
                debouncedAutoSave({ bio: newBio });
              }}
              placeholder="Tell clients about your skills and experience..."
              className="min-h-[120px] resize-none"
              data-testid="textarea-bio"
              rows={5}
            />
          </div>

          <Button 
            onClick={handleProfileUpdate}
            disabled={isProfileLoading}
            className="w-full py-3 text-base font-medium"
            data-testid="button-save-changes"
          >
            {isProfileLoading ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Saving Changes...
              </>
            ) : (
              <>
                <CheckCircle2 className="w-4 h-4 mr-2" />
                Save Changes
              </>
            )}
          </Button>
        </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
