import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Search, TrendingUp, Users, Sparkles, Loader2, AlertCircle } from "lucide-react";
import { CheckmarkIcon } from "@/components/ui/checkmark-icon";

interface Profile {
  id: string;
  name: string;
  displayName: string;
  avatarUrl: string;
  likesCount: number;
  followersCount: number;
  role: string;
}

interface BoostStats {
  boostLikes: number;
  boostFollowers: number;
}

const BOOST_PACKAGES = [
  { value: "1", label: "1 Boost", count: 1 },
  { value: "5", label: "5 Boosts", count: 5 },
  { value: "10", label: "10 Boosts", count: 10 },
  { value: "100", label: "100 Boosts", count: 100 },
  { value: "1000", label: "1K Boosts", count: 1000 },
  { value: "10000", label: "10K Boosts", count: 10000 },
];

export function ProfileBoostManager() {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedProfile, setSelectedProfile] = useState<Profile | null>(null);
  const [boostType, setBoostType] = useState<"likes" | "followers">("likes");
  const [packageSize, setPackageSize] = useState("1");
  const [ajaxStatus, setAjaxStatus] = useState<{ type: 'idle' | 'loading' | 'success' | 'error'; message: string }>({ type: 'idle', message: '' });
  const queryClient = useQueryClient();

  const { data: profiles, isLoading: searchLoading } = useQuery<Profile[]>({
    queryKey: ["/api/admin/freelancers", { search: searchQuery }],
    enabled: searchQuery.length > 2,
  });

  const { data: boostStats } = useQuery<BoostStats>({
    queryKey: ["/api/admin/profile-boost/stats", selectedProfile?.id],
    enabled: !!selectedProfile,
  });

  const addBoostMutation = useMutation({
    mutationFn: async (data: { profileId: string; count: number; type: "likes" | "followers" }) => {
      setAjaxStatus({ type: 'loading', message: `Adding ${data.count} ${data.type}...` });
      const endpoint = data.type === "likes" 
        ? "/api/admin/profile-boost/add-likes"
        : "/api/admin/profile-boost/add-followers";
      
      return apiRequest(endpoint, {
        method: "POST",
        body: JSON.stringify({ profileId: data.profileId, count: data.count }),
      });
    },
    onSuccess: (_, variables) => {
      setAjaxStatus({ type: 'success', message: `Successfully added ${variables.count} ${variables.type}!` });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/profile-boost/stats", variables.profileId] });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/freelancers"] });
      setTimeout(() => setAjaxStatus({ type: 'idle', message: '' }), 3000);
    },
    onError: (error: any) => {
      setAjaxStatus({ type: 'error', message: error.message || 'Failed to add boost' });
      setTimeout(() => setAjaxStatus({ type: 'idle', message: '' }), 3000);
    },
  });

  const handleApplyBoost = () => {
    if (!selectedProfile) {
      return;
    }

    const pkg = BOOST_PACKAGES.find(p => p.value === packageSize);
    if (!pkg) return;

    addBoostMutation.mutate({
      profileId: selectedProfile.id,
      count: pkg.count,
      type: boostType,
    });
  };

  return (
    <div className="space-y-6">
      <Card data-testid="card-boost-manager">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-yellow-500" />
            Profile Boost Manager
          </CardTitle>
          <CardDescription>
            Add vanity likes and followers to freelancer profiles to help boost their visibility
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {ajaxStatus.type !== 'idle' && (
            <div className={`flex items-center gap-2 p-3 rounded-lg ${
              ajaxStatus.type === 'loading' ? 'bg-blue-50 text-blue-700' :
              ajaxStatus.type === 'success' ? 'bg-green-50 text-green-700' :
              'bg-red-50 text-red-700'
            }`} data-testid="ajax-status-inline">
              {ajaxStatus.type === 'loading' && <Loader2 className="h-4 w-4 animate-spin" />}
              {ajaxStatus.type === 'success' && <CheckmarkIcon size="sm" variant="success" />}
              {ajaxStatus.type === 'error' && <AlertCircle className="h-4 w-4" />}
              <span className="text-sm font-medium">{ajaxStatus.message}</span>
            </div>
          )}

          {/* Search Freelancer */}
          <div className="space-y-2">
            <Label htmlFor="search-freelancer">Search Freelancer</Label>
            <div className="relative">
              <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
              <Input
                id="search-freelancer"
                data-testid="input-search-freelancer"
                type="text"
                placeholder="Search by name or email..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>

          {/* Search Results */}
          {searchQuery.length > 2 && (
            <div className="space-y-2">
              {searchLoading ? (
                <p className="text-sm text-gray-500">Searching...</p>
              ) : profiles && profiles.length > 0 ? (
                <div className="space-y-2 max-h-64 overflow-y-auto">
                  {profiles
                    .filter(p => p.role === "freelancer")
                    .map((profile) => (
                      <Card
                        key={profile.id}
                        data-testid={`card-profile-${profile.id}`}
                        className={`cursor-pointer transition-colors ${
                          selectedProfile?.id === profile.id
                            ? "border-primary bg-primary/5"
                            : "hover:bg-gray-50"
                        }`}
                        onClick={() => setSelectedProfile(profile)}
                      >
                        <CardContent className="p-4">
                          <div className="flex items-center gap-3">
                            <img
                              src={profile.avatarUrl || `https://ui-avatars.com/api/?name=${encodeURIComponent(profile.name)}`}
                              alt={profile.name}
                              className="h-10 w-10 rounded-full"
                            />
                            <div className="flex-1">
                              <p className="font-medium" data-testid={`text-name-${profile.id}`}>
                                {profile.displayName || profile.name}
                              </p>
                              <p className="text-sm text-gray-500">
                                {profile.likesCount || 0} likes · {profile.followersCount || 0} followers
                              </p>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                </div>
              ) : (
                <p className="text-sm text-gray-500">No freelancers found</p>
              )}
            </div>
          )}

          {/* Selected Profile Info */}
          {selectedProfile && (
            <Card className="bg-blue-50 border-blue-200" data-testid="card-selected-profile">
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <img
                    src={selectedProfile.avatarUrl || `https://ui-avatars.com/api/?name=${encodeURIComponent(selectedProfile.name)}`}
                    alt={selectedProfile.name}
                    className="h-12 w-12 rounded-full"
                  />
                  <div className="flex-1">
                    <p className="font-medium text-lg" data-testid="text-selected-name">
                      {selectedProfile.displayName || selectedProfile.name}
                    </p>
                    <div className="flex gap-4 text-sm text-gray-600">
                      <span data-testid="text-current-likes">
                        {selectedProfile.likesCount || 0} likes
                      </span>
                      <span data-testid="text-current-followers">
                        {selectedProfile.followersCount || 0} followers
                      </span>
                    </div>
                    {boostStats && (
                      <div className="flex gap-4 text-xs text-blue-600 mt-1">
                        <span>({boostStats.boostLikes || 0} boost likes)</span>
                        <span>({boostStats.boostFollowers || 0} boost followers)</span>
                      </div>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Boost Configuration */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="boost-type">Boost Type</Label>
              <Select value={boostType} onValueChange={(value: "likes" | "followers") => setBoostType(value)}>
                <SelectTrigger id="boost-type" data-testid="select-boost-type">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="likes" data-testid="option-likes">
                    <div className="flex items-center gap-2">
                      <TrendingUp className="h-4 w-4" />
                      Likes
                    </div>
                  </SelectItem>
                  <SelectItem value="followers" data-testid="option-followers">
                    <div className="flex items-center gap-2">
                      <Users className="h-4 w-4" />
                      Followers
                    </div>
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="package-size">Package Size</Label>
              <Select value={packageSize} onValueChange={setPackageSize}>
                <SelectTrigger id="package-size" data-testid="select-package-size">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {BOOST_PACKAGES.map((pkg) => (
                    <SelectItem key={pkg.value} value={pkg.value} data-testid={`option-package-${pkg.value}`}>
                      {pkg.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Apply Button */}
          <Button
            data-testid="button-apply-boost"
            onClick={handleApplyBoost}
            disabled={!selectedProfile || addBoostMutation.isPending}
            className="w-full"
            size="lg"
          >
            {addBoostMutation.isPending ? (
              "Adding Boost..."
            ) : (
              <>
                <Sparkles className="h-4 w-4 mr-2" />
                Apply {BOOST_PACKAGES.find(p => p.value === packageSize)?.label || ""} {boostType}
              </>
            )}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
