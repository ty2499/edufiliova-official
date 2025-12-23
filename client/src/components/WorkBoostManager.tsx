import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Search, TrendingUp, Sparkles, Image } from "lucide-react";

interface Profile {
  id: string;
  name: string;
  displayName: string;
  avatarUrl: string;
  likesCount: number;
  followersCount: number;
  role: string;
  userId: string;
}

interface ShowcaseProject {
  id: string;
  title: string;
  description: string;
  media: any;
  likeCount: number;
  viewCount: number;
  createdAt: string;
}

interface BoostStats {
  boostLikesCount: number;
  boostViewsCount: number;
}

const BOOST_PACKAGES = [
  { value: "1", label: "1 Boost", count: 1 },
  { value: "5", label: "5 Boosts", count: 5 },
  { value: "10", label: "10 Boosts", count: 10 },
  { value: "100", label: "100 Boosts", count: 100 },
  { value: "1000", label: "1K Boosts", count: 1000 },
  { value: "10000", label: "10K Boosts", count: 10000 },
];

export function WorkBoostManager() {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedProfile, setSelectedProfile] = useState<Profile | null>(null);
  const [selectedWork, setSelectedWork] = useState<ShowcaseProject | null>(null);
  const [packageSize, setPackageSize] = useState("1");
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const queryClient = useQueryClient();

  const { data: profiles, isLoading: searchLoading } = useQuery<Profile[]>({
    queryKey: ["/api/admin/freelancers", { search: searchQuery }],
    enabled: searchQuery.length > 2,
  });

  const { data: showcaseProjects, isLoading: projectsLoading } = useQuery<ShowcaseProject[]>({
    queryKey: [`/api/admin/work-boost/projects/${selectedProfile?.userId}`],
    enabled: !!selectedProfile?.userId,
  });

  const { data: boostStats } = useQuery<BoostStats>({
    queryKey: [`/api/admin/work-boost/stats/${selectedWork?.id}`],
    enabled: !!selectedWork,
  });

  const addBoostMutation = useMutation({
    mutationFn: async (data: { workId: string; count: number }) => {
      return apiRequest("/api/admin/work-boost/add-likes", {
        method: "POST",
        body: JSON.stringify(data),
      });
    },
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: [`/api/admin/work-boost/stats/${variables.workId}`] });
      queryClient.invalidateQueries({ queryKey: [`/api/admin/work-boost/projects/${selectedProfile?.userId}`] });
      
      setSuccessMessage(`Successfully added ${variables.count} boost likes! Total boost: ${data.boostLikesCount} likes, ${data.boostViewsCount} views`);
      setErrorMessage(null);
      
      setTimeout(() => setSuccessMessage(null), 5000);
    },
    onError: (error: any) => {
      setErrorMessage(error.message || "Failed to add boost likes. Please try again.");
      setSuccessMessage(null);
      
      setTimeout(() => setErrorMessage(null), 5000);
    },
  });

  const handleApplyBoost = () => {
    if (!selectedWork) {
      console.error('No work selected');
      return;
    }

    console.log('handleApplyBoost called', { selectedWork, workId: selectedWork.id });

    setSuccessMessage(null);
    setErrorMessage(null);

    const packageData = BOOST_PACKAGES.find(p => p.value === packageSize);
    if (!packageData) {
      console.error('No package data found');
      return;
    }

    console.log('Calling mutation with:', { workId: selectedWork.id, count: packageData.count });

    addBoostMutation.mutate({
      workId: selectedWork.id,
      count: packageData.count,
    });
  };

  const getMediaUrl = (work: ShowcaseProject) => {
    if (work.media && Array.isArray(work.media) && work.media.length > 0) {
      return work.media[0].url || work.media[0];
    }
    if (work.media && typeof work.media === 'object' && work.media.url) {
      return work.media.url;
    }
    return null;
  };

  return (
    <div className="space-y-6">
      <Card data-testid="card-work-boost-manager">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-yellow-500" />
            Work Boost Manager
          </CardTitle>
          <CardDescription>
            Add vanity likes to individual portfolio works to help boost their visibility
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
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
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  setSelectedProfile(null);
                  setSelectedWork(null);
                }}
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
                        onClick={() => {
                          setSelectedProfile(profile);
                          setSelectedWork(null);
                        }}
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
                                {profile.likesCount || 0} profile likes · {profile.followersCount || 0} followers
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

          {/* Selected Profile's Works */}
          {selectedProfile && (
            <>
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
                      <p className="text-sm text-gray-600">Select a work below to boost</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <div className="space-y-2">
                <Label>Portfolio Works</Label>
                {projectsLoading ? (
                  <p className="text-sm text-gray-500">Loading works...</p>
                ) : showcaseProjects && showcaseProjects.length > 0 ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-h-96 overflow-y-auto">
                    {showcaseProjects.map((work) => {
                      const mediaUrl = getMediaUrl(work);
                      return (
                        <Card
                          key={work.id}
                          data-testid={`card-work-${work.id}`}
                          className={`cursor-pointer transition-colors ${
                            selectedWork?.id === work.id
                              ? "border-primary bg-primary/5"
                              : "hover:bg-gray-50"
                          }`}
                          onClick={() => setSelectedWork(work)}
                        >
                          <CardContent className="p-4">
                            <div className="space-y-2">
                              {mediaUrl && (
                                <img
                                  src={mediaUrl}
                                  alt={work.title}
                                  className="w-full h-32 object-cover rounded"
                                />
                              )}
                              <div>
                                <p className="font-medium" data-testid={`text-work-title-${work.id}`}>
                                  {work.title}
                                </p>
                                <p className="text-sm text-gray-500 line-clamp-2">
                                  {work.description}
                                </p>
                                <div className="flex gap-4 text-xs text-gray-600 mt-1">
                                  <span data-testid={`text-work-likes-${work.id}`}>
                                    {work.likeCount || 0} likes
                                  </span>
                                  <span>{work.viewCount || 0} views</span>
                                </div>
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      );
                    })}
                  </div>
                ) : (
                  <p className="text-sm text-gray-500">No portfolio works found</p>
                )}
              </div>
            </>
          )}

          {/* Selected Work Info */}
          {selectedWork && (
            <Card className="bg-green-50 border-green-200" data-testid="card-selected-work">
              <CardContent className="p-4">
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <TrendingUp className="h-5 w-5 text-green-600" />
                    <p className="font-medium text-lg" data-testid="text-selected-work-title">
                      {selectedWork.title}
                    </p>
                  </div>
                  <div className="flex gap-4 text-sm text-gray-600">
                    <span data-testid="text-current-work-likes">
                      {selectedWork.likeCount || 0} total likes
                    </span>
                    {boostStats && (
                      <>
                        <span className="text-green-600">
                          ({boostStats.boostLikesCount || 0} boost likes)
                        </span>
                        <span className="text-blue-600">
                          ({boostStats.boostViewsCount || 0} boost views)
                        </span>
                      </>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Success/Error Messages */}
          {successMessage && (
            <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded relative" data-testid="alert-success">
              <strong className="font-bold">Success! </strong>
              <span className="block sm:inline">{successMessage}</span>
            </div>
          )}

          {errorMessage && (
            <div className="bg-primary/15 border border-primary text-primary px-4 py-3 rounded relative" data-testid="alert-error">
              <strong className="font-bold">Error! </strong>
              <span className="block sm:inline">{errorMessage}</span>
            </div>
          )}

          {/* Boost Configuration */}
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

          {/* Apply Button */}
          <Button
            data-testid="button-apply-boost"
            onClick={handleApplyBoost}
            disabled={!selectedWork || addBoostMutation.isPending}
            className="w-full"
            size="lg"
          >
            {addBoostMutation.isPending ? (
              "Adding Boost..."
            ) : (
              <>
                <Sparkles className="h-4 w-4 mr-2" />
                Apply {BOOST_PACKAGES.find(p => p.value === packageSize)?.label || ""} likes to work
              </>
            )}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
