import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Search, MessageSquare, Sparkles, Image, ChevronDown, ChevronUp } from "lucide-react";

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
  commentsCount: number;
  createdAt: string;
}

interface BoostStats {
  boostComments: number;
}

const BOOST_PACKAGES = [
  { value: "1", label: "1 Comment", count: 1 },
  { value: "5", label: "5 Comments", count: 5 },
  { value: "10", label: "10 Comments", count: 10 },
  { value: "25", label: "25 Comments", count: 25 },
  { value: "50", label: "50 Comments", count: 50 },
  { value: "100", label: "100 Comments", count: 100 },
];

// Realistic comment templates for portfolio works
const REALISTIC_COMMENTS = [
  "Incredible work! The attention to detail is outstanding.",
  "This is absolutely stunning! Love the color palette.",
  "Amazing execution! How long did this take?",
  "The composition is perfect. Really inspiring!",
  "This is next level! Would love to see more.",
  "Beautiful work! The lighting is spot on.",
  "Absolutely love this! The creativity shines through.",
  "This is fire! 🔥 Keep creating!",
  "Wow, this is professional grade work!",
  "The quality here is incredible. Well done!",
  "This deserves way more recognition!",
  "Outstanding! The concept is brilliantly executed.",
  "So clean and polished. Great job!",
  "This is exactly the kind of work I aspire to create.",
  "The details in this are insane! Love it.",
  "Perfect execution from start to finish.",
  "This is portfolio worthy material right here.",
  "The mood and atmosphere are captured perfectly.",
  "Brilliant use of space and balance.",
  "This stands out from everything else. Amazing!",
  "The technical skill here is evident. Impressive!",
  "Love the modern aesthetic of this piece.",
  "This tells a great story. Beautiful work!",
  "The energy in this is contagious. Well done!",
  "Top tier work! Can't wait to see what's next.",
  "This is exactly what good design looks like.",
  "The professionalism here is unmatched.",
  "Absolutely gorgeous! The vision is clear.",
  "This is a masterclass in creativity.",
  "Love everything about this! Keep it up!",
  "The precision and care in every detail shows.",
  "This is the kind of work that inspires others.",
  "Clean, modern, and absolutely beautiful.",
  "The concept execution is flawless here.",
  "This deserves to be featured everywhere!",
  "Stunning work! The composition is chef's kiss.",
  "The creativity level here is off the charts.",
  "This is what peak performance looks like.",
  "Love the unique approach to this project.",
  "The quality and attention to detail are amazing.",
  "This is going straight into my inspiration folder!",
  "Brilliant work! The innovation is clear.",
  "This proves that simplicity can be powerful.",
  "The artistic vision here is phenomenal.",
  "Every element works together perfectly.",
  "This is the definition of high-quality work.",
  "The craftsmanship is evident throughout.",
  "Love the bold choices made in this piece.",
  "This is refreshingly original. Great job!",
  "The execution matches the ambition perfectly.",
];

export function WorkCommentBoostManager() {
  const [isOpen, setIsOpen] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedProfile, setSelectedProfile] = useState<Profile | null>(null);
  const [selectedWork, setSelectedWork] = useState<ShowcaseProject | null>(null);
  const [packageSize, setPackageSize] = useState("5");
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
    queryKey: [`/api/admin/work-boost/comment-stats/${selectedWork?.id}`],
    enabled: !!selectedWork,
  });

  const addCommentsMutation = useMutation({
    mutationFn: async (data: { showcaseProjectId: string; count: number }) => {
      return apiRequest("/api/admin/work-boost/add-comments", {
        method: "POST",
        body: JSON.stringify(data),
      });
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: [`/api/admin/work-boost/comment-stats/${variables.showcaseProjectId}`] });
      queryClient.invalidateQueries({ queryKey: [`/api/admin/work-boost/projects/${selectedProfile?.userId}`] });
    },
  });

  const handleApplyBoost = () => {
    if (!selectedWork) return;

    const packageData = BOOST_PACKAGES.find(p => p.value === packageSize);
    if (!packageData) return;

    addCommentsMutation.mutate({
      showcaseProjectId: selectedWork.id,
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
      <Collapsible open={isOpen} onOpenChange={setIsOpen}>
        <Card data-testid="card-work-comment-boost-manager">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <CardTitle className="flex items-center gap-2">
                  <MessageSquare className="h-5 w-5 text-blue-500" />
                  Work Comment Boost Manager
                </CardTitle>
                <CardDescription>
                  Add realistic, engaging comments to portfolio works to boost engagement and visibility
                </CardDescription>
              </div>
              <CollapsibleTrigger asChild>
                <Button variant="ghost" size="sm" className="w-9 p-0" data-testid="button-toggle-collapse-comments">
                  {isOpen ? (
                    <ChevronUp className="h-4 w-4" />
                  ) : (
                    <ChevronDown className="h-4 w-4" />
                  )}
                  <span className="sr-only">Toggle</span>
                </Button>
              </CollapsibleTrigger>
            </div>
          </CardHeader>
          <CollapsibleContent>
            <CardContent className="space-y-6">
          {/* Search Freelancer */}
          <div className="space-y-2">
            <Label htmlFor="search-freelancer-comments">Search Freelancer</Label>
            <div className="relative">
              <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
              <Input
                id="search-freelancer-comments"
                data-testid="input-search-freelancer-comments"
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
                        data-testid={`card-profile-comments-${profile.id}`}
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
                              <p className="font-medium" data-testid={`text-name-comments-${profile.id}`}>
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
              <Card className="bg-blue-50 border-blue-200" data-testid="card-selected-profile-comments">
                <CardContent className="p-4">
                  <div className="flex items-center gap-3">
                    <img
                      src={selectedProfile.avatarUrl || `https://ui-avatars.com/api/?name=${encodeURIComponent(selectedProfile.name)}`}
                      alt={selectedProfile.name}
                      className="h-12 w-12 rounded-full"
                    />
                    <div className="flex-1">
                      <p className="font-medium text-lg" data-testid="text-selected-name-comments">
                        {selectedProfile.displayName || selectedProfile.name}
                      </p>
                      <p className="text-sm text-gray-600">Select a work below to add comments</p>
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
                          data-testid={`card-work-comments-${work.id}`}
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
                                <p className="font-medium" data-testid={`text-work-title-comments-${work.id}`}>
                                  {work.title}
                                </p>
                                <p className="text-sm text-gray-500 line-clamp-2">
                                  {work.description}
                                </p>
                                <div className="flex gap-4 text-xs text-gray-600 mt-1">
                                  <span>{work.likeCount || 0} likes</span>
                                  <span>{work.viewCount || 0} views</span>
                                  <span data-testid={`text-work-comments-${work.id}`}>
                                    {work.commentsCount || 0} comments
                                  </span>
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
            <Card className="bg-green-50 border-green-200" data-testid="card-selected-work-comments">
              <CardContent className="p-4">
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <MessageSquare className="h-5 w-5 text-green-600" />
                    <p className="font-medium text-lg" data-testid="text-selected-work-title-comments">
                      {selectedWork.title}
                    </p>
                  </div>
                  <div className="flex gap-4 text-sm text-gray-600">
                    <span data-testid="text-current-work-comments">
                      {selectedWork.commentsCount || 0} total comments
                    </span>
                    {boostStats && (
                      <span className="text-green-600">
                        ({boostStats.boostComments || 0} boost comments)
                      </span>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Boost Configuration */}
          <div className="space-y-2">
            <Label htmlFor="package-size-comments">Package Size</Label>
            <Select value={packageSize} onValueChange={setPackageSize}>
              <SelectTrigger id="package-size-comments" data-testid="select-package-size-comments">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {BOOST_PACKAGES.map((pkg) => (
                  <SelectItem key={pkg.value} value={pkg.value} data-testid={`option-package-comments-${pkg.value}`}>
                    {pkg.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Apply Button */}
          <Button
            data-testid="button-apply-comment-boost"
            onClick={handleApplyBoost}
            disabled={!selectedWork || addCommentsMutation.isPending}
            className="w-full"
            size="lg"
          >
            {addCommentsMutation.isPending ? (
              "Adding Comments..."
            ) : (
              <>
                <Sparkles className="h-4 w-4 mr-2" />
                Add {BOOST_PACKAGES.find(p => p.value === packageSize)?.label || ""} to work
              </>
            )}
          </Button>

          {/* Sample Comments Preview */}
          <Card className="bg-gray-50">
            <CardContent className="p-4">
              <p className="text-sm font-medium text-gray-700 mb-2">Sample Comment Examples:</p>
              <div className="space-y-1 text-xs text-gray-600 max-h-32 overflow-y-auto">
                {REALISTIC_COMMENTS.slice(0, 10).map((comment, idx) => (
                  <p key={idx} className="italic">&quot;{comment}&quot;</p>
                ))}
              </div>
              <p className="text-xs text-gray-500 mt-2">
                Comments are randomly selected from a pool of {REALISTIC_COMMENTS.length} realistic messages
              </p>
            </CardContent>
          </Card>
        </CardContent>
      </CollapsibleContent>
    </Card>
  </Collapsible>
    </div>
  );
}

// Export the realistic comments for use in the backend
export { REALISTIC_COMMENTS };
