import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { ChevronRight, FileText, Image as ImageIcon, Video as VideoIcon, Download, File } from "lucide-react";

interface ContentBlock {
  id: string;
  type: 'text' | 'image' | 'video' | 'accordion' | 'file';
  content: any;
  orderNum: number;
}

interface LessonBlockRendererProps {
  blocks: ContentBlock[];
}

export default function LessonBlockRenderer({ blocks }: LessonBlockRendererProps) {
  if (!blocks || blocks.length === 0) {
    return (
      <div className="text-center py-12">
        <FileText className="h-12 w-12 mx-auto mb-4 text-muted-foreground opacity-50" />
        <p className="text-muted-foreground">No content blocks for this lesson.</p>
      </div>
    );
  }

  const sortedBlocks = [...blocks].sort((a, b) => a.orderNum - b.orderNum);

  return (
    <div className="px-4 sm:px-6 py-4">
      {sortedBlocks.map((block) => (
        <BlockRenderer key={block.id} block={block} />
      ))}
    </div>
  );
}

function BlockRenderer({ block }: { block: ContentBlock }) {
  const [isOpen, setIsOpen] = useState(false);

  // Helper function to detect and convert YouTube URLs to embed format
  const getVideoEmbedUrl = (url: string) => {
    // YouTube URL patterns
    const youtubeRegex = /(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/)([^"&?\/\s]{11})/;
    const match = url.match(youtubeRegex);
    
    if (match && match[1]) {
      return {
        isYouTube: true,
        embedUrl: `https://www.youtube.com/embed/${match[1]}`
      };
    }
    
    return {
      isYouTube: false,
      embedUrl: url
    };
  };

  switch (block.type) {
    case 'text':
      const textContent = block.content.text || '';
      const hasHtmlTags = /<[a-z][\s\S]*>/i.test(textContent);
      
      if (hasHtmlTags) {
        return (
          <div 
            className="prose prose-sm sm:prose max-w-none dark:prose-invert mb-4
              prose-headings:mt-4 prose-headings:mb-3 prose-headings:font-bold
              prose-h2:text-xl prose-h3:text-lg prose-h4:text-base
              prose-p:mb-4 prose-p:leading-relaxed
              prose-ul:my-3 prose-ol:my-3 prose-li:my-1
              prose-div:mb-4 prose-img:rounded-xl prose-img:shadow-lg"
            dangerouslySetInnerHTML={{ __html: textContent }}
          />
        );
      }
      
      return (
        <div className="mb-4">
          <p className="leading-relaxed text-foreground whitespace-pre-wrap">{textContent}</p>
        </div>
      );

    case 'image':
      return (
        <div className="mb-6">
          {block.content.url && (
            <img
              src={block.content.url}
              alt={block.content.alt || 'Lesson image'}
              className="w-full max-w-2xl mx-auto rounded-lg shadow-md"
              onError={(e) => {
                console.error('Image failed to load:', block.content.url);
                (e.target as HTMLImageElement).src = '/api/placeholder/800/400';
              }}
            />
          )}
          {block.content.caption && (
            <p className="text-sm text-muted-foreground italic text-center mt-2">
              {block.content.caption}
            </p>
          )}
        </div>
      );

    case 'video':
      const videoInfo = block.content.url ? getVideoEmbedUrl(block.content.url) : null;
      return (
        <>
          {videoInfo && (
            <div className="aspect-video bg-black">
              {videoInfo.isYouTube ? (
                <iframe
                  src={videoInfo.embedUrl}
                  className="w-full h-full"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                  title="Lesson video"
                />
              ) : (
                <video
                  src={videoInfo.embedUrl}
                  controls
                  controlsList="nodownload"
                  className="w-full h-full"
                >
                  Your browser does not support the video tag.
                </video>
              )}
            </div>
          )}
          {block.content.caption && (
            <p className="text-sm text-muted-foreground italic text-center">
              {block.content.caption}
            </p>
          )}
        </>
      );

    case 'accordion':
      return (
        <Collapsible open={isOpen} onOpenChange={setIsOpen} className="mb-4">
          <div className="bg-card dark:bg-card border border-border rounded-lg overflow-hidden">
            <CollapsibleTrigger className="w-full p-4 hover:bg-muted/50 transition-colors transition-all duration-300">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 font-medium text-left text-foreground">
                  <ChevronRight className={`h-4 w-4 transition-transform duration-200 ${isOpen ? 'rotate-90' : ''}`} />
                  <span>{block.content.title || 'Collapsible Section'}</span>
                </div>
              </div>
            </CollapsibleTrigger>
            <CollapsibleContent>
              <div className="px-6 pb-6 pt-4 border-t border-border">
                <p className="leading-relaxed text-foreground whitespace-pre-wrap">{block.content.content}</p>
              </div>
            </CollapsibleContent>
          </div>
        </Collapsible>
      );

    case 'file':
      return (
        <div className="flex items-center gap-3 p-4 bg-muted/50 rounded-lg border">
          <File className="h-8 w-8 text-muted-foreground" />
          <div className="flex-1">
            <p className="font-medium">{block.content.title || 'Download File'}</p>
            {block.content.caption && (
              <p className="text-sm text-muted-foreground">{block.content.caption}</p>
            )}
          </div>
          {block.content.url && (
            <a
              href={block.content.url}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/80 hover:shadow-xl hover:scale-105 transition-colors transition-all duration-300"
            >
              <Download className="h-4 w-4" />
              Download
            </a>
          )}
        </div>
      );

    default:
      return null;
  }
}
