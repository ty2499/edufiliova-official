import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Slider } from "@/components/ui/slider";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ArrowLeft, Clock, Target, Zap, CreditCard, Landmark, DollarSign, Shield, Plus, Edit, Trash2, User, Upload, Camera } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";

// Simple profanity filter - basic implementation
const containsProfanity = (text: string): boolean => {
  const prohibitedWords = ['fuck', 'shit', 'damn', 'bitch', 'asshole', 'bastard'];
  const lowerText = text.toLowerCase();
  return prohibitedWords.some(word => lowerText.includes(word));
};

interface StudySettingsProps {
  onBack: () => void;
}

const StudySettings = ({ onBack }: StudySettingsProps) => {
  const { user, profile: userProfile } = useAuth();
  const [loading, setLoading] = useState(false);
  const [settings, setSettings] = useState({
    dailyGoal: 180, // minutes
    sessionLength: 45, // minutes
    difficulty: "medium",
    notifications: true,
    reminderTime: "19:00",
    weekendStudy: true,
    autoAdvance: false,
    soundEffects: true,
  });

  const [profile, setProfile] = useState({
    name: "",
    pronouns: "",
    customPronouns: "",
    pictureUrl: "",
  });

  const [paymentMethods, setPaymentMethods] = useState([]);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);

  // Load user profile data on mount
  useEffect(() => {
    if (userProfile) {
      setProfile({
        name: userProfile.name || "",
        pronouns: userProfile.pronouns || "",
        customPronouns: userProfile.pronouns && !["he/him", "she/her", "they/them"].includes(userProfile.pronouns) ? userProfile.pronouns : "",
        pictureUrl: userProfile.picture || "",
      });
    }
  }, [userProfile]);

  const [showAddPayment, setShowAddPayment] = useState(false);
  const [newPaymentMethod, setNewPaymentMethod] = useState({
    type: 'bank_transfer',
    displayName: '',
    accountNumber: '',
    routingNumber: '',
    paypalEmail: '',
    fullName: ''
  });


  const handleSave = async () => {
    if (!user?.id) {return;
    }

    setLoading(true);
    try {
      // Validate custom pronouns
      if (profile.pronouns === "custom") {
        if (!profile.customPronouns.trim()) {
          throw new Error("Please enter your custom pronouns");
        }
        if (containsProfanity(profile.customPronouns)) {
          throw new Error("Please use appropriate language for your pronouns");
        }
      }

      // Save profile changes including pronouns
      const finalPronouns = profile.pronouns === "custom" 
        ? profile.customPronouns.trim() 
        : profile.pronouns;

      const response = await fetch(`/api/profile/${user.id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: profile.name,
          pronouns: finalPronouns,
          picture: profile.pictureUrl || null,
        }),
      });

      const result = await response.json();
      
      if (!result.success) {
        throw new Error(result.error || "Failed to save settings");
      }} catch (error: any) {} finally {
      setLoading(false);
    }
  };

  const formatTime = (minutes: number) => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return hours > 0 ? `${hours}h ${mins}m` : `${mins}m`;
  };

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      alert('Please select an image file');
      return;
    }

    // Validate file size (5MB max)
    if (file.size > 5 * 1024 * 1024) {
      alert('File size must be less than 5MB');
      return;
    }

    setUploadingAvatar(true);
    try {
      const formData = new FormData();
      formData.append('avatar', file);

      const sessionId = localStorage.getItem('sessionId');
      const response = await fetch('/api/settings/upload-avatar', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${sessionId}`
        },
        body: formData,
        credentials: 'include',
      });

      const result = await response.json();

      if (result.success && result.avatarUrl) {
        setProfile(prev => ({ ...prev, pictureUrl: result.avatarUrl }));
      } else {
        throw new Error(result.error || 'Upload failed');
      }
    } catch (error: any) {
      console.error('Avatar upload error:', error);
      alert('Failed to upload avatar. Please try again.');
    } finally {
      setUploadingAvatar(false);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b bg-card/50 backdrop-blur-sm">
        <div className="container mx-auto px-4 py-4 flex items-center gap-4">
          <Button variant="outline" size="sm" onClick={onBack} className="bg-white text-gray-800 border-gray-300 shadow-sm">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Button>
          <h1 className="text-xl font-bold">Study Settings</h1>
        </div>
      </header>

      <div className="container mx-auto px-4 py-8 max-w-2xl">
        <div className="space-y-6">
          {/* Profile Information */}
          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <User className="h-5 w-5 text-primary" />
                <CardTitle>Profile Information</CardTitle>
              </div>
              <CardDescription>
                Update your personal information and pronouns
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="profile-name">Display Name</Label>
                <Input
                  id="profile-name"
                  value={profile.name}
                  onChange={(e) => setProfile(prev => ({ ...prev, name: e.target.value }))}
                  placeholder="Your display name"
                  data-testid="input-profile-name"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="profile-pronouns">Pronouns</Label>
                <Select 
                  value={profile.pronouns} 
                  onValueChange={(value) => {
                    setProfile(prev => ({ 
                      ...prev, 
                      pronouns: value,
                      customPronouns: value === "custom" ? prev.customPronouns : ""
                    }));
                  }}
                >
                  <SelectTrigger data-testid="select-profile-pronouns">
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

              {profile.pronouns === "custom" && (
                <div className="space-y-2">
                  <Label htmlFor="custom-pronouns">Custom Pronouns</Label>
                  <Input
                    id="custom-pronouns"
                    type="text"
                    placeholder="e.g., xe/xem, ze/zir"
                    value={profile.customPronouns}
                    onChange={(e) => {
                      const value = e.target.value.slice(0, 30); // 30 character limit
                      setProfile(prev => ({ ...prev, customPronouns: value }));
                    }}
                    maxLength={30}
                    data-testid="input-custom-pronouns"
                  />
                  <p className="text-xs text-muted-foreground">
                    {profile.customPronouns.length}/30 characters
                  </p>
                </div>
              )}

              <div className="space-y-2">
                <Label htmlFor="profile-picture">Profile Picture</Label>
                <div className="flex gap-2">
                  <Input
                    id="profile-picture"
                    value={profile.pictureUrl}
                    onChange={(e) => setProfile(prev => ({ ...prev, pictureUrl: e.target.value }))}
                    placeholder="https://example.com/your-photo.jpg or upload a file"
                    data-testid="input-profile-picture"
                  />
                  <input
                    type="file"
                    id="avatar-file-input"
                    className="hidden"
                    accept="image/*"
                    onChange={handleAvatarUpload}
                  />
                  <Button
                    variant="outline"
                    size="icon"
                    type="button"
                    onClick={() => document.getElementById('avatar-file-input')?.click()}
                    disabled={uploadingAvatar}
                    data-testid="button-upload-picture"
                  >
                    {uploadingAvatar ? (
                      <div className="animate-spin h-4 w-4 border-2 border-current border-t-transparent rounded-full" />
                    ) : (
                      <Camera className="h-4 w-4" />
                    )}
                  </Button>
                </div>
                {profile.pictureUrl && (
                  <div className="flex items-center gap-2 mt-2">
                    <img 
                      src={profile.pictureUrl} 
                      alt="Profile preview" 
                      className="w-16 h-16 rounded-full object-cover border-2 border-primary"
                      onError={(e) => {
                        const target = e.target as HTMLImageElement;
                        target.style.display = 'none';
                      }}
                    />
                    <p className="text-xs text-muted-foreground">Preview of your profile picture</p>
                  </div>
                )}
                <p className="text-xs text-muted-foreground">
                  Enter a URL or click the camera button to upload an image file (max 5MB)
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Study Goals */}
          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <Target className="h-5 w-5 text-primary" />
                <CardTitle>Study Goals</CardTitle>
              </div>
              <CardDescription>
                Set your daily learning targets and session preferences
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-3">
                <Label>Daily Study Goal: {formatTime(settings.dailyGoal)}</Label>
                <Slider
                  value={[settings.dailyGoal]}
                  onValueChange={(value) => setSettings(prev => ({ ...prev, dailyGoal: value[0] }))}
                  max={300}
                  min={30}
                  step={15}
                  className="w-full"
                />
                <div className="flex justify-between text-sm text-muted-foreground">
                  <span>30 min</span>
                  <span>5 hours</span>
                </div>
              </div>

              <div className="space-y-3">
                <Label>Session Length: {formatTime(settings.sessionLength)}</Label>
                <Slider
                  value={[settings.sessionLength]}
                  onValueChange={(value) => setSettings(prev => ({ ...prev, sessionLength: value[0] }))}
                  max={120}
                  min={15}
                  step={15}
                  className="w-full"
                />
                <div className="flex justify-between text-sm text-muted-foreground">
                  <span>15 min</span>
                  <span>2 hours</span>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="difficulty">Difficulty Level</Label>
                <Select 
                  value={settings.difficulty} 
                  onValueChange={(value) => setSettings(prev => ({ ...prev, difficulty: value }))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="easy">Easy - Building Foundations</SelectItem>
                    <SelectItem value="medium">Medium - Balanced Challenge</SelectItem>
                    <SelectItem value="hard">Hard - Advanced Problems</SelectItem>
                    <SelectItem value="adaptive">Adaptive - AI Adjusts</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

          {/* Notifications */}
          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <Clock className="h-5 w-5 text-accent" />
                <CardTitle>Notifications & Reminders</CardTitle>
              </div>
              <CardDescription>
                Stay on track with helpful reminders
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Study Reminders</Label>
                  <p className="text-sm text-muted-foreground">
                    Get notified when it's time to study
                  </p>
                </div>
                <Switch
                  checked={settings.notifications}
                  onCheckedChange={(checked) => setSettings(prev => ({ ...prev, notifications: checked }))}
                />
              </div>

              {settings.notifications && (
                <div className="space-y-2">
                  <Label htmlFor="reminder-time">Daily Reminder Time</Label>
                  <Input
                    id="reminder-time"
                    type="time"
                    value={settings.reminderTime}
                    onChange={(e) => setSettings(prev => ({ ...prev, reminderTime: e.target.value }))}
                  />
                </div>
              )}

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Weekend Study</Label>
                  <p className="text-sm text-muted-foreground">
                    Include weekends in your study schedule
                  </p>
                </div>
                <Switch
                  checked={settings.weekendStudy}
                  onCheckedChange={(checked) => setSettings(prev => ({ ...prev, weekendStudy: checked }))}
                />
              </div>
            </CardContent>
          </Card>

          {/* Payment Settings */}
          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <CreditCard className="h-5 w-5 text-green-600" />
                <CardTitle>Payment Settings</CardTitle>
              </div>
              <CardDescription>
                Manage your payment methods for earnings and commissions
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Current Payment Methods */}
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <Label className="text-sm font-medium">Payment Methods</Label>
                  <Button 
                    size="sm" 
                    variant="outline"
                    onClick={() => setShowAddPayment(true)}
                    className="h-8"
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Add Method
                  </Button>
                </div>
                
                {paymentMethods.map((method) => (
                  <div key={method.id} className="border rounded-lg p-4 space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="p-2 bg-gray-100 rounded-lg">
                          {method.type === 'bank_transfer' ? (
                            <Landmark className="h-4 w-4 text-gray-600" />
                          ) : (
                            <DollarSign className="h-4 w-4 text-blue-600" />
                          )}
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-medium">{method.displayName}</span>
                            {method.isDefault && (
                              <span className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded">
                                Default
                              </span>
                            )}
                            {method.isVerified && (
                              <Shield className="h-4 w-4 text-green-600" />
                            )}
                          </div>
                          <span className="text-sm text-gray-500">
                            {method.type === 'bank_transfer' ? `****${method.lastFour}` : method.lastFour}
                          </span>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Button size="sm" variant="ghost">
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button size="sm" variant="ghost" className="text-primary-600">
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Add Payment Method Form */}
              {showAddPayment && (
                <div className="border-2 border-dashed border-gray-200 rounded-lg p-4 space-y-4">
                  <div className="flex items-center justify-between">
                    <Label className="text-sm font-medium">Add Payment Method</Label>
                    <Button 
                      size="sm" 
                      variant="ghost"
                      onClick={() => setShowAddPayment(false)}
                    >
                      Cancel
                    </Button>
                  </div>
                  
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="payment-type">Payment Type</Label>
                      <Select 
                        value={newPaymentMethod.type}
                        onValueChange={(value) => setNewPaymentMethod(prev => ({ ...prev, type: value }))}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="bank_transfer">Bank Transfer</SelectItem>
                          <SelectItem value="paypal">PayPal</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="display-name">Display Name</Label>
                      <Input
                        id="display-name"
                        placeholder="e.g., My Primary Bank Account"
                        value={newPaymentMethod.displayName}
                        onChange={(e) => setNewPaymentMethod(prev => ({ ...prev, displayName: e.target.value }))}
                      />
                    </div>

                    {newPaymentMethod.type === 'bank_transfer' ? (
                      <>
                        <div className="space-y-2">
                          <Label htmlFor="full-name">Full Name on Account</Label>
                          <Input
                            id="full-name"
                            placeholder="John Doe"
                            value={newPaymentMethod.fullName}
                            onChange={(e) => setNewPaymentMethod(prev => ({ ...prev, fullName: e.target.value }))}
                          />
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                          <div className="space-y-2">
                            <Label htmlFor="account-number">Account Number</Label>
                            <Input
                              id="account-number"
                              placeholder="123456789"
                              value={newPaymentMethod.accountNumber}
                              onChange={(e) => setNewPaymentMethod(prev => ({ ...prev, accountNumber: e.target.value }))}
                            />
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor="routing-number">Routing Number</Label>
                            <Input
                              id="routing-number"
                              placeholder="021000021"
                              value={newPaymentMethod.routingNumber}
                              onChange={(e) => setNewPaymentMethod(prev => ({ ...prev, routingNumber: e.target.value }))}
                            />
                          </div>
                        </div>
                      </>
                    ) : (
                      <div className="space-y-2">
                        <Label htmlFor="paypal-email">PayPal Email</Label>
                        <Input
                          id="paypal-email"
                          type="email"
                          placeholder="your@email.com"
                          value={newPaymentMethod.paypalEmail}
                          onChange={(e) => setNewPaymentMethod(prev => ({ ...prev, paypalEmail: e.target.value }))}
                        />
                      </div>
                    )}

                    <Button 
                      onClick={() => {
                        // Add payment method logic here
                        setShowAddPayment(false);}}
                      className="w-full"
                    >
                      Add Payment Method
                    </Button>
                  </div>
                </div>
              )}

              {/* Payment Security Notice */}
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                <div className="flex items-start gap-2">
                  <Shield className="h-4 w-4 text-blue-600 mt-0.5" />
                  <div className="text-sm">
                    <p className="font-medium text-blue-900">Security Notice</p>
                    <p className="text-blue-700">
                      Your payment information is encrypted and securely stored. 
                      We never store your full account numbers.
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Learning Preferences */}
          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <Zap className="h-5 w-5 text-accent" />
                <CardTitle>Learning Preferences</CardTitle>
              </div>
              <CardDescription>
                Customize your learning experience
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Auto-Advance Lessons</Label>
                  <p className="text-sm text-muted-foreground">
                    Automatically move to next lesson after completion
                  </p>
                </div>
                <Switch
                  checked={settings.autoAdvance}
                  onCheckedChange={(checked) => setSettings(prev => ({ ...prev, autoAdvance: checked }))}
                />
              </div>

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Sound Effects</Label>
                  <p className="text-sm text-muted-foreground">
                    Play sounds for correct answers and achievements
                  </p>
                </div>
                <Switch
                  checked={settings.soundEffects}
                  onCheckedChange={(checked) => setSettings(prev => ({ ...prev, soundEffects: checked }))}
                />
              </div>
            </CardContent>
          </Card>

          {/* Save Button */}
          <div className="flex gap-4">
            <Button variant="secondary" onClick={onBack} className="flex-1 bg-background/90 border-border hover:bg-accent hover:text-accent-foreground">
              Cancel
            </Button>
            <Button onClick={handleSave} className="flex-1 bg-white text-primary-foreground hover:shadow-sm" disabled={loading}>
              {loading ? "Saving..." : "Save Settings"}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default StudySettings;
