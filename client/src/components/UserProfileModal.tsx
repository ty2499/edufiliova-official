import { ChevronLeft, Calendar, MapPin, GraduationCap, Shield, MessageCircle, BadgeCheck } from "lucide-react";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { format } from "date-fns";

interface UserProfile {
  id: string;
  userId: string;
  name: string;
  email: string;
  avatarUrl?: string;
  country: string;
  grade: number;
  role: string;
  createdAt: string;
  bio?: string;
  isOnline?: boolean;
  verificationBadge?: 'none' | 'green' | 'blue';
}

interface UserProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
  userProfile: UserProfile | null;
  onStartChat?: (userId: string) => void;
}

export const UserProfileModal = ({ isOpen, onClose, userProfile, onStartChat }: UserProfileModalProps) => {
  if (!userProfile) return null;

  const formatJoinDate = (date: string) => {
    try {
      return format(new Date(date), 'MMMM d, yyyy');
    } catch {
      return 'Recently joined';
    }
  };

  // Don't show modal if critical data is missing or fake
  const hasValidData = userProfile.name && userProfile.name !== 'Student User' && userProfile.name !== 'Unknown User';
  if (!hasValidData) return null;

  const getRoleBadge = (role: string) => {
    const badges = {
      admin: { color: 'bg-blue-500', icon: <Shield className="h-3 w-3" />, text: 'Admin' },
      teacher: { color: 'bg-green-500', icon: <GraduationCap className="h-3 w-3" />, text: 'Teacher' },
      student: { color: 'bg-purple-500', icon: <GraduationCap className="h-3 w-3" />, text: 'Student' }
    };
    
    const badge = badges[role as keyof typeof badges] || badges.student;
    
    return (
      <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-white text-xs font-medium ${badge.color}`}>
        {badge.icon}
        {badge.text}
      </span>
    );
  };

  const getGradeText = (grade: number, role: string) => {
    if (role === 'teacher' || role === 'admin') return null;
    if (grade >= 13) return 'University';
    if (grade === 12) return 'College';
    return `Grade ${grade}`;
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="w-full max-w-md sm:max-w-lg p-0 overflow-hidden max-h-[90vh] overflow-y-auto" showClose={false}>
        <DialogHeader className="sr-only">
          <DialogTitle>User Profile</DialogTitle>
          <DialogDescription>View detailed information about {userProfile.name || 'this user'}</DialogDescription>
        </DialogHeader>
        {/* Header with Cover */}
        <div className="bg-gradient-to-br from-[#A0FAB2] via-green-400 to-emerald-500 h-24 sm:h-28 relative">
          <button
            onClick={onClose}
            className="absolute top-3 left-3 sm:top-4 sm:left-4 p-1.5 hover:bg-white/20 rounded-full transition-colors z-10"
            data-testid="close-profile-modal"
          >
            <ChevronLeft className="h-4 w-4 sm:h-5 sm:w-5 text-white" />
          </button>
        </div>

        <div className="p-4 sm:p-6 -mt-10 sm:-mt-12">
          {/* Avatar Section */}
          <div className="flex flex-col items-center mb-6">
            <div className="relative">
              <Avatar className="h-24 w-24 sm:h-28 sm:w-28 border-4 border-white shadow-xl">
                <AvatarImage src={userProfile.avatarUrl} className="rounded-full object-cover" />
                <AvatarFallback className="bg-gradient-to-br from-blue-500 to-purple-600 text-white text-2xl sm:text-3xl font-bold">
                  {userProfile.name?.charAt(0)?.toUpperCase() || userProfile.email?.charAt(0)?.toUpperCase() || '?'}
                </AvatarFallback>
              </Avatar>
            </div>
            
            <div className="text-center mt-4">
              <div className="flex items-center justify-center gap-2">
                <h2 className="text-lg sm:text-xl font-bold text-gray-900">{userProfile.name || userProfile.email}</h2>
                {userProfile.verificationBadge === 'green' && (
                  <div title="Premium Verified">
                    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="none" viewBox="0 0 24 24" className="h-5 w-5" data-testid="badge-green">
                      <path fill="#000" fillRule="evenodd" d="M10.4521 1.31159C11.2522 0.334228 12.7469 0.334225 13.5471 1.31159L14.5389 2.52304L16.0036 1.96981C17.1853 1.52349 18.4796 2.2708 18.6839 3.51732L18.9372 5.06239L20.4823 5.31562C21.7288 5.51992 22.4761 6.81431 22.0298 7.99598L21.4765 9.46066L22.688 10.4525C23.6653 11.2527 23.6653 12.7473 22.688 13.5475L21.4765 14.5394L22.0298 16.004C22.4761 17.1857 21.7288 18.4801 20.4823 18.6844L18.9372 18.9376L18.684 20.4827C18.4796 21.7292 17.1853 22.4765 16.0036 22.0302L14.5389 21.477L13.5471 22.6884C12.7469 23.6658 11.2522 23.6658 10.4521 22.6884L9.46022 21.477L7.99553 22.0302C6.81386 22.4765 5.51948 21.7292 5.31518 20.4827L5.06194 18.9376L3.51687 18.6844C2.27035 18.4801 1.52305 17.1857 1.96937 16.004L2.5226 14.5394L1.31115 13.5475C0.333786 12.7473 0.333782 11.2527 1.31115 10.4525L2.5226 9.46066L1.96937 7.99598C1.52304 6.81431 2.27036 5.51992 3.51688 5.31562L5.06194 5.06239L5.31518 3.51732C5.51948 2.2708 6.81387 1.52349 7.99553 1.96981L9.46022 2.52304L10.4521 1.31159ZM11.2071 16.2071L18.2071 9.20712L16.7929 7.79291L10.5 14.0858L7.20711 10.7929L5.79289 12.2071L9.79289 16.2071C9.98043 16.3947 10.2348 16.5 10.5 16.5C10.7652 16.5 11.0196 16.3947 11.2071 16.2071Z" clipRule="evenodd" />
                    </svg>
                  </div>
                )}
                {userProfile.verificationBadge === 'blue' && (
                  <div title="Verified User">
                    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="none" viewBox="0 0 24 24" className="h-5 w-5" data-testid="badge-blue">
                      <g clipPath="url(#clip0_343_1428)">
                        <path fill="#3747D6" d="M13.548 1.31153C12.7479 0.334164 11.2532 0.334167 10.453 1.31153L9.46119 2.52298L7.99651 1.96975C6.81484 1.52343 5.52046 2.27074 5.31615 3.51726L5.06292 5.06232L3.51785 5.31556C2.27134 5.51986 1.52402 6.81424 1.97035 7.99591L2.52357 9.4606L1.31212 10.4524C0.334759 11.2526 0.334762 12.7473 1.31213 13.5475L2.52357 14.5393L1.97035 16.004C1.52402 17.1856 2.27133 18.48 3.51785 18.6843L5.06292 18.9376L5.31615 20.4826C5.52046 21.7291 6.81484 22.4765 7.99651 22.0301L9.46119 21.4769L10.453 22.6884C11.2532 23.6657 12.7479 23.6657 13.548 22.6884L14.5399 21.4769L16.0046 22.0301C17.1862 22.4765 18.4806 21.7291 18.6849 20.4826L18.9382 18.9376L20.4832 18.6843C21.7297 18.48 22.4771 17.1856 22.0307 16.004L21.4775 14.5393L22.689 13.5474C23.6663 12.7473 23.6663 11.2526 22.689 10.4524L21.4775 9.4606L22.0307 7.99591C22.4771 6.81425 21.7297 5.51986 20.4832 5.31556L18.9382 5.06232L18.6849 3.51726C18.4806 2.27074 17.1862 1.52342 16.0046 1.96975L14.5399 2.52298L13.548 1.31153Z" />
                        <path fill="#90CAEA" fillRule="evenodd" d="M18.2072 9.20711L11.2072 16.2071C11.0196 16.3946 10.7653 16.5 10.5001 16.5C10.2349 16.5 9.9805 16.3946 9.79297 16.2071L5.79297 12.2071L7.20718 10.7929L10.5001 14.0858L16.793 7.79289L18.2072 9.20711Z" clipRule="evenodd" />
                      </g>
                      <defs>
                        <clipPath id="clip0_343_1428">
                          <rect width="24" height="24" fill="#fff" />
                        </clipPath>
                      </defs>
                    </svg>
                  </div>
                )}
              </div>
              <div className="mt-2">
                {getRoleBadge(userProfile.role)}
              </div>
              {userProfile.isOnline !== undefined && (
                <p className="text-sm text-gray-500 mt-2">
                  {userProfile.isOnline ? 'Online now' : 'Last seen recently'}
                </p>
              )}
            </div>
          </div>

          {/* User Details */}
          <div className="space-y-4 mb-6">
            {/* Bio */}
            {userProfile.bio && userProfile.bio !== 'No bio available' && userProfile.bio.trim() && (
              <div className="bg-gradient-to-r from-blue-50 to-purple-50 p-4 rounded-xl border border-blue-100">
                <h3 className="font-semibold text-gray-800 mb-2 text-sm">About</h3>
                <p className="text-gray-700 text-sm leading-relaxed">{userProfile.bio}</p>
              </div>
            )}

            {/* Details Grid */}
            <div className="grid gap-3">
              {/* Country - Only show if not Unknown */}
              {userProfile.country && userProfile.country !== 'Unknown' && (
                <div className="flex items-center gap-3 p-4 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl border border-blue-100">
                  <div className="flex-shrink-0 w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center">
                    <MapPin className="h-4 w-4 text-white" />
                  </div>
                  <div className="flex-1">
                    <p className="text-xs font-medium text-blue-700 uppercase tracking-wide">Country</p>
                    <p className="text-sm font-semibold text-gray-900">{userProfile.country}</p>
                  </div>
                </div>
              )}

              {/* Grade */}
              {getGradeText(userProfile.grade, userProfile.role) && (
                <div className="flex items-center gap-3 p-4 bg-gradient-to-r from-purple-50 to-pink-50 rounded-xl border border-purple-100">
                  <div className="flex-shrink-0 w-8 h-8 bg-purple-500 rounded-full flex items-center justify-center">
                    <GraduationCap className="h-4 w-4 text-white" />
                  </div>
                  <div className="flex-1">
                    <p className="text-xs font-medium text-purple-700 uppercase tracking-wide">Education Level</p>
                    <p className="text-sm font-semibold text-gray-900">{getGradeText(userProfile.grade, userProfile.role)}</p>
                  </div>
                </div>
              )}

              {/* Join Date */}
              <div className="flex items-center gap-3 p-4 bg-gradient-to-r from-green-50 to-emerald-50 rounded-xl border border-green-100">
                <div className="flex-shrink-0 w-8 h-8 bg-green-500 rounded-full flex items-center justify-center">
                  <Calendar className="h-4 w-4 text-white" />
                </div>
                <div className="flex-1">
                  <p className="text-xs font-medium text-green-700 uppercase tracking-wide">Joined</p>
                  <p className="text-sm font-semibold text-gray-900">{formatJoinDate(userProfile.createdAt)}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Chat Guidelines - Simplified and cleaner */}
          <div className="bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-200 rounded-xl p-4 mb-6">
            <div className="flex items-center gap-2 mb-3">
              <div className="flex-shrink-0 w-6 h-6 bg-amber-500 rounded-full flex items-center justify-center">
                <Shield className="w-3 h-3 text-white" />
              </div>
              <h4 className="font-semibold text-amber-900 text-sm">Chat Guidelines</h4>
            </div>
            <div className="text-xs text-amber-800 space-y-1.5">
              <p>✅ Keep conversations educational and respectful</p>
              <p>❌ No inappropriate content or harassment</p>
              <p>🚫 Report violations to support</p>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-3">
            {onStartChat && (
              <Button 
                onClick={() => {
                  onStartChat(userProfile.userId);
                  onClose();
                }}
                className="flex-1 bg-gradient-to-r from-[#A0FAB2] to-green-500 hover:from-green-500 hover:to-green-600 text-white font-medium shadow-lg hover:shadow-xl transition-all duration-200"
                data-testid="start-chat-button"
              >
                <MessageCircle className="h-4 w-4 mr-2" />
                Start Chat
              </Button>
            )}
            <Button 
              variant="outline" 
              onClick={onClose}
              className={`${onStartChat ? 'flex-1' : 'w-full'} border-gray-300 hover:bg-gray-50`}
              data-testid="close-button"
            >
              Close
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default UserProfileModal;
