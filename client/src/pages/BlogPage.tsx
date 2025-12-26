import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ArrowRight, Search, ChevronDown, Calendar } from "lucide-react";

interface BlogPost {
  id: number;
  title: string;
  slug: string;
  excerpt: string;
  content: string;
  category: string;
  coverImage: string | null;
  authorName: string | null;
  authorAvatar: string | null;
  publishedAt: string;
}

interface BlogPageProps {
  onNavigate: (page: string) => void;
}

function BlogPage({ onNavigate }: BlogPageProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");

  const { data: posts } = useQuery<BlogPost[]>({
    queryKey: ['/api/blog-posts'],
  });

  const handleNavigateToPost = (slug: string) => {
    onNavigate(`blog-post-${slug}`);
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric', 
      year: 'numeric' 
    });
  };

  const categories = Array.from(new Set(posts?.map(p => p.category) || []));

  const filteredPosts = posts?.filter(post => {
    const matchesSearch = searchQuery === "" || 
      post.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      post.excerpt.toLowerCase().includes(searchQuery.toLowerCase()) ||
      post.content.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = selectedCategory === "all" || post.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  return (
    <div className="min-h-screen bg-white dark:bg-gray-900 pt-16 md:pt-20">
      {/* Compact Hero Section */}
      <div className="bg-gradient-to-b from-slate-900 via-slate-800 to-slate-900 dark:from-gray-950 dark:via-gray-900 dark:to-gray-950">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-12 md:py-16">
          {/* Header */}
          <div className="text-center mb-8">
            <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold text-white mb-4">
              Our Blog
            </h1>
            <p className="text-base md:text-lg text-slate-300 max-w-2xl mx-auto leading-relaxed">
              Stay updated with the latest insights, tutorials, and news from EduFiliova. 
              Discover tips for learning, teaching strategies, and platform updates to help you succeed.
            </p>
          </div>

          {/* Search & Filter Row */}
          <div className="flex flex-col sm:flex-row items-center gap-4 max-w-3xl mx-auto">
            {/* Search */}
            <div className="relative flex-1 w-full">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400" />
              <Input
                type="text"
                placeholder="Search articles..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-12 pr-4 py-3 h-12 bg-white/10 backdrop-blur-sm border-white/20 text-white placeholder:text-slate-400 rounded-xl focus:bg-white/15 focus:border-white/30 transition-all"
                data-testid="input-blog-search"
              />
            </div>

            {/* Category Filter */}
            <div className="flex items-center gap-2 overflow-x-auto pb-1 sm:pb-0 w-full sm:w-auto">
              <Button
                onClick={() => setSelectedCategory("all")}
                size="sm"
                className={`rounded-full px-4 h-10 whitespace-nowrap transition-all ${
                  selectedCategory === "all"
                    ? "bg-white text-slate-900 hover:bg-white/90"
                    : "bg-white/10 text-white border border-white/20 hover:bg-white/20"
                }`}
                data-testid="category-filter-all"
              >
                All
              </Button>
              {categories.slice(0, 2).map((category) => (
                <Button
                  key={category}
                  onClick={() => setSelectedCategory(category)}
                  size="sm"
                  className={`rounded-full px-4 h-10 whitespace-nowrap transition-all ${
                    selectedCategory === category
                      ? "bg-white text-slate-900 hover:bg-white/90"
                      : "bg-white/10 text-white border border-white/20 hover:bg-white/20"
                  }`}
                  data-testid={`category-filter-${category}`}
                >
                  {category}
                </Button>
              ))}
              {categories.length > 2 && (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button
                      size="sm"
                      className="rounded-full px-4 h-10 bg-white/10 text-white border border-white/20 hover:bg-white/20" transition-all duration-300
                      data-testid="dropdown-more-categories"
                    >
                      More
                      <ChevronDown className="ml-1 h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="bg-white dark:bg-gray-800">
                    {categories.slice(2).map((category) => (
                      <DropdownMenuItem
                        key={category}
                        onClick={() => setSelectedCategory(category)}
                        className={`cursor-pointer ${
                          selectedCategory === category ? "bg-[#2f5a4e]/10 dark:bg-[#2f5a4e]/20 text-[#2f5a4e]" : ""
                        }`}
                        data-testid={`category-filter-${category}`}
                      >
                        {category}
                      </DropdownMenuItem>
                    ))}
                  </DropdownMenuContent>
                </DropdownMenu>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Blog Content */}
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-10 md:py-12">
        {filteredPosts && filteredPosts.length > 0 ? (
          <div className="space-y-10">
            {/* Featured Post (First Post) */}
            {filteredPosts.length > 0 && (
              <div 
                className="group cursor-pointer"
                onClick={() => handleNavigateToPost(filteredPosts[0].slug)}
                data-testid={`blog-card-featured-${filteredPosts[0].id}`}
              >
                <Card className="overflow-hidden border border-gray-100 dark:border-gray-700 bg-white dark:bg-gray-800">
                  <div className="grid md:grid-cols-2 gap-0">
                    {/* Image */}
                    <div className="aspect-[16/10] md:aspect-auto md:h-full overflow-hidden bg-slate-100 dark:bg-slate-800">
                      {filteredPosts[0].coverImage ? (
                        <img 
                          src={filteredPosts[0].coverImage} 
                          alt={filteredPosts[0].title}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" transition-all duration-300
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-[#2f5a4e] to-[#1a3a33]">
                          <span className="text-white text-6xl font-bold opacity-30">
                            {filteredPosts[0].title[0]}
                          </span>
                        </div>
                      )}
                    </div>
                    {/* Content */}
                    <CardContent className="p-6 md:p-8 flex flex-col justify-center">
                      <Badge className="w-fit mb-4 bg-[#2f5a4e]/10 text-[#2f5a4e] hover:bg-[#2f5a4e]/10 border-0" transition-all duration-300>
                        {filteredPosts[0].category}
                      </Badge>
                      <h2 className="text-2xl md:text-3xl font-bold text-gray-900 dark:text-white mb-3 group-hover:text-[#2f5a4e] transition-colors line-clamp-2 font-['StackSans_Headline']" transition-all duration-300>
                        {filteredPosts[0].title}
                      </h2>
                      <p className="text-gray-600 dark:text-gray-400 mb-6 line-clamp-3 text-base leading-relaxed">
                        {filteredPosts[0].excerpt}
                      </p>
                      <div className="flex items-center gap-4 text-sm text-gray-500 dark:text-gray-400">
                        <div className="flex items-center gap-2">
                          <Calendar className="h-4 w-4" />
                          <span>{formatDate(filteredPosts[0].publishedAt)}</span>
                        </div>
                      </div>
                    </CardContent>
                  </div>
                </Card>
              </div>
            )}

            {/* Other Posts Grid */}
            {filteredPosts.length > 1 && (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredPosts.slice(1).map((post) => (
                  <Card 
                    key={post.id}
                    className="group cursor-pointer overflow-hidden border border-gray-100 dark:border-gray-700 hover:border-gray-200 dark:hover:border-gray-600 transition-all bg-white dark:bg-gray-800" transition-all duration-300
                    onClick={() => handleNavigateToPost(post.slug)}
                    data-testid={`blog-card-${post.id}`}
                  >
                    {/* Image */}
                    <div className="aspect-[16/10] overflow-hidden bg-slate-100 dark:bg-slate-800">
                      {post.coverImage ? (
                        <img 
                          src={post.coverImage} 
                          alt={post.title}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" transition-all duration-300
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-slate-200 to-slate-300 dark:from-slate-700 dark:to-slate-600">
                          <span className="text-slate-400 dark:text-slate-500 text-4xl font-bold">
                            {post.title[0]}
                          </span>
                        </div>
                      )}
                    </div>
                    
                    <CardContent className="p-5">
                      {/* Category & Date */}
                      <div className="flex items-center justify-between mb-3">
                        <Badge className="bg-slate-100 text-slate-600 hover:bg-slate-100 border-0 text-xs" transition-all duration-300>
                          {post.category}
                        </Badge>
                        <span className="text-xs text-gray-400">
                          {formatDate(post.publishedAt)}
                        </span>
                      </div>

                      {/* Title */}
                      <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2 line-clamp-2 group-hover:text-[#2f5a4e] transition-colors font-['StackSans_Headline']" transition-all duration-300>
                        {post.title}
                      </h3>

                      {/* Excerpt */}
                      <p className="text-sm text-gray-500 dark:text-gray-400 mb-4 line-clamp-2">
                        {post.excerpt}
                      </p>

                      {/* Read More */}
                      <div className="flex items-center gap-1 text-[#2f5a4e] dark:text-[#2f5a4e] text-sm font-medium group-hover:gap-2 transition-all" transition-all duration-300>
                        Read article
                        <ArrowRight className="h-4 w-4" />
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </div>
        ) : (
          <div className="text-center py-16">
            <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center">
              <Search className="h-8 w-8 text-slate-400" />
            </div>
            <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
              {searchQuery || selectedCategory !== "all" ? "No articles found" : "No blog posts yet"}
            </h3>
            <p className="text-gray-500 dark:text-gray-400 mb-6">
              {searchQuery || selectedCategory !== "all" 
                ? "Try adjusting your search or filters" 
                : "Check back soon for new content"}
            </p>
            {(searchQuery || selectedCategory !== "all") && (
              <Button
                onClick={() => {
                  setSearchQuery("");
                  setSelectedCategory("all");
                }}
                variant="outline"
                data-testid="button-reset-filters"
              >
                Clear filters
              </Button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

export default BlogPage;
