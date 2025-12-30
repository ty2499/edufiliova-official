import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { 
  Plus, 
  Trash2, 
  GripVertical, 
  Type, 
  Image as ImageIcon, 
  Video, 
  FileText, 
  ChevronDown,
  MoveUp,
  MoveDown
} from "lucide-react";

export interface ContentBlock {
  id?: string;
  blockType: 'text' | 'image' | 'video' | 'file' | 'accordion';
  title?: string;
  content?: string;
  mediaUrl?: string;
  mediaType?: 'image' | 'video' | 'pdf' | 'document';
  isCollapsible?: boolean;
  isExpandedByDefault?: boolean;
  displayOrder: number;
  file?: File;
}

interface LessonBlockEditorProps {
  blocks: ContentBlock[];
  onChange: (blocks: ContentBlock[]) => void;
  onFileUpload?: (file: File, type: string) => Promise<string>;
}

export default function LessonBlockEditor({ blocks, onChange, onFileUpload }: LessonBlockEditorProps) {
  const [showAddMenu, setShowAddMenu] = useState(false);

  const addBlock = (blockType: ContentBlock['blockType']) => {
    const newBlock: ContentBlock = {
      id: `temp-${Date.now()}`,
      blockType,
      displayOrder: blocks.length,
      isCollapsible: blockType === 'accordion',
      isExpandedByDefault: true,
      title: '',
      content: ''
    };
    onChange([...blocks, newBlock]);
    setShowAddMenu(false);
  };

  const updateBlock = (index: number, updates: Partial<ContentBlock>) => {
    const newBlocks = [...blocks];
    newBlocks[index] = { ...newBlocks[index], ...updates };
    onChange(newBlocks);
  };

  const removeBlock = (index: number) => {
    const newBlocks = blocks.filter((_, i) => i !== index);
    // Reorder remaining blocks
    const reorderedBlocks = newBlocks.map((block, i) => ({
      ...block,
      displayOrder: i
    }));
    onChange(reorderedBlocks);
  };

  const moveBlock = (index: number, direction: 'up' | 'down') => {
    const newBlocks = [...blocks];
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    
    if (targetIndex < 0 || targetIndex >= newBlocks.length) return;
    
    // Swap blocks
    [newBlocks[index], newBlocks[targetIndex]] = [newBlocks[targetIndex], newBlocks[index]];
    
    // Update display order
    const reorderedBlocks = newBlocks.map((block, i) => ({
      ...block,
      displayOrder: i
    }));
    onChange(reorderedBlocks);
  };

  const handleFileSelect = async (index: number, file: File, mediaType: ContentBlock['mediaType']) => {
    if (onFileUpload) {
      try {
        const url = await onFileUpload(file, mediaType || 'image');
        updateBlock(index, { mediaUrl: url, mediaType, file });
      } catch (error) {
        console.error('File upload failed:', error);
      }
    } else {
      // Store file temporarily
      updateBlock(index, { file, mediaType });
    }
  };

  const getBlockIcon = (blockType: ContentBlock['blockType']) => {
    switch (blockType) {
      case 'text': return <Type className="h-4 w-4" />;
      case 'image': return <ImageIcon className="h-4 w-4" />;
      case 'video': return <Video className="h-4 w-4" />;
      case 'file': return <FileText className="h-4 w-4" />;
      case 'accordion': return <ChevronDown className="h-4 w-4" />;
      default: return <Type className="h-4 w-4" />;
    }
  };

  const getBlockLabel = (blockType: ContentBlock['blockType']) => {
    switch (blockType) {
      case 'text': return 'Text Section';
      case 'image': return 'Image';
      case 'video': return 'Video';
      case 'file': return 'File/PDF';
      case 'accordion': return 'Collapsible Section';
      default: return 'Content Block';
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <Label className="text-base font-semibold">Lesson Content Blocks</Label>
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => setShowAddMenu(!showAddMenu)}
          data-testid="button-add-content-block"
        >
          <Plus className="h-4 w-4 mr-2" />
          Add Content Block
        </Button>
      </div>

      {showAddMenu && (
        <Card className="border-dashed">
          <CardContent className="pt-4">
            <div className="grid grid-cols-2 md:grid-cols-5 gap-2">
              <Button
                type="button"
                variant="outline"
                className="flex flex-col items-center gap-2 h-auto py-4"
                onClick={() => addBlock('text')}
                data-testid="button-add-text-block"
              >
                <Type className="h-5 w-5" />
                <span className="text-xs">Text</span>
              </Button>
              <Button
                type="button"
                variant="outline"
                className="flex flex-col items-center gap-2 h-auto py-4"
                onClick={() => addBlock('image')}
                data-testid="button-add-image-block"
              >
                <ImageIcon className="h-5 w-5" />
                <span className="text-xs">Image</span>
              </Button>
              <Button
                type="button"
                variant="outline"
                className="flex flex-col items-center gap-2 h-auto py-4"
                onClick={() => addBlock('video')}
                data-testid="button-add-video-block"
              >
                <Video className="h-5 w-5" />
                <span className="text-xs">Video</span>
              </Button>
              <Button
                type="button"
                variant="outline"
                className="flex flex-col items-center gap-2 h-auto py-4"
                onClick={() => addBlock('file')}
                data-testid="button-add-file-block"
              >
                <FileText className="h-5 w-5" />
                <span className="text-xs">PDF/File</span>
              </Button>
              <Button
                type="button"
                variant="outline"
                className="flex flex-col items-center gap-2 h-auto py-4"
                onClick={() => addBlock('accordion')}
                data-testid="button-add-accordion-block"
              >
                <ChevronDown className="h-5 w-5" />
                <span className="text-xs">Collapsible</span>
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {blocks.length === 0 && (
        <div className="text-center py-8 text-muted-foreground border-2 border-dashed rounded-lg">
          <Type className="h-8 w-8 mx-auto mb-2 opacity-50" />
          <p className="text-sm">No content blocks yet. Click "Add Content Block" to get started.</p>
        </div>
      )}

      <div className="space-y-3">
        {blocks.map((block, index) => (
          <Card key={block.id || index} className="relative">
            <CardHeader className="pb-3">
              <div className="flex items-center gap-3">
                <GripVertical className="h-4 w-4 text-muted-foreground cursor-move" />
                <div className="flex items-center gap-2 flex-1">
                  {getBlockIcon(block.blockType)}
                  <span className="text-sm font-medium">{getBlockLabel(block.blockType)}</span>
                </div>
                <div className="flex items-center gap-1">
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => moveBlock(index, 'up')}
                    disabled={index === 0}
                    className="h-8 w-8 p-0"
                  >
                    <MoveUp className="h-3 w-3" />
                  </Button>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => moveBlock(index, 'down')}
                    disabled={index === blocks.length - 1}
                    className="h-8 w-8 p-0"
                  >
                    <MoveDown className="h-3 w-3" />
                  </Button>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => removeBlock(index)}
                    className="h-8 w-8 p-0 text-destructive"
                    data-testid={`button-remove-block-${index}`}
                  >
                    <Trash2 className="h-3 w-3" />
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              {/* Title field (for accordion and optional for others) */}
              {(block.blockType === 'accordion' || block.blockType === 'text') && (
                <div className="space-y-2">
                  <Label className="text-xs">
                    {block.blockType === 'accordion' ? 'Section Title *' : 'Heading (optional)'}
                  </Label>
                  <Input
                    placeholder={block.blockType === 'accordion' ? 'Enter section title' : 'Enter heading'}
                    value={block.title || ''}
                    onChange={(e) => updateBlock(index, { title: e.target.value })}
                    data-testid={`input-block-title-${index}`}
                  />
                </div>
              )}

              {/* Content field for text and accordion blocks */}
              {(block.blockType === 'text' || block.blockType === 'accordion') && (
                <div className="space-y-2">
                  <Label className="text-xs">Content</Label>
                  <Textarea
                    placeholder="Enter your content here..."
                    value={block.content || ''}
                    onChange={(e) => updateBlock(index, { content: e.target.value })}
                    rows={block.blockType === 'accordion' ? 4 : 6}
                    data-testid={`textarea-block-content-${index}`}
                  />
                </div>
              )}

              {/* Image upload */}
              {block.blockType === 'image' && (
                <div className="space-y-2">
                  <Label className="text-xs">Image</Label>
                  <div className="space-y-2">
                    <Input
                      type="file"
                      accept="image/*"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) handleFileSelect(index, file, 'image');
                      }}
                      data-testid={`input-block-image-${index}`}
                    />
                    <Input
                      placeholder="Or enter image URL"
                      value={block.mediaUrl || ''}
                      onChange={(e) => updateBlock(index, { mediaUrl: e.target.value, mediaType: 'image' })}
                      data-testid={`input-block-image-url-${index}`}
                    />
                    {block.file && (
                      <p className="text-xs text-green-600">Selected: {block.file.name}</p>
                    )}
                  </div>
                  <div className="space-y-2">
                    <Label className="text-xs">Caption (optional)</Label>
                    <Input
                      placeholder="Image caption"
                      value={block.content || ''}
                      onChange={(e) => updateBlock(index, { content: e.target.value })}
                      data-testid={`input-block-image-caption-${index}`}
                    />
                  </div>
                </div>
              )}

              {/* Video upload or URL */}
              {block.blockType === 'video' && (
                <div className="space-y-2">
                  <Label className="text-xs">Video</Label>
                  <div className="space-y-2">
                    <div>
                      <Label className="text-xs text-muted-foreground">Upload Video File</Label>
                      <Input
                        type="file"
                        accept="video/*"
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) handleFileSelect(index, file, 'video');
                        }}
                        data-testid={`input-block-video-file-${index}`}
                      />
                      {block.file && (
                        <p className="text-xs text-green-600 mt-1">Selected: {block.file.name}</p>
                      )}
                    </div>
                    <div className="relative">
                      <div className="absolute inset-0 flex items-center">
                        <span className="w-full border-t" />
                      </div>
                      <div className="relative flex justify-center text-xs uppercase">
                        <span className="bg-background px-2 text-muted-foreground">Or</span>
                      </div>
                    </div>
                    <div>
                      <Label className="text-xs text-muted-foreground">Enter Video URL</Label>
                      <Input
                        placeholder="https://www.youtube.com/watch?v=... or direct video URL"
                        value={block.mediaUrl || ''}
                        onChange={(e) => updateBlock(index, { mediaUrl: e.target.value, mediaType: 'video' })}
                        data-testid={`input-block-video-url-${index}`}
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label className="text-xs">Video Title (optional)</Label>
                    <Input
                      placeholder="Video title"
                      value={block.title || ''}
                      onChange={(e) => updateBlock(index, { title: e.target.value })}
                      data-testid={`input-block-video-title-${index}`}
                    />
                  </div>
                </div>
              )}

              {/* File upload (PDF, documents) */}
              {block.blockType === 'file' && (
                <div className="space-y-2">
                  <Label className="text-xs">File Type</Label>
                  <Select
                    value={block.mediaType || 'pdf'}
                    onValueChange={(value) => updateBlock(index, { mediaType: value as ContentBlock['mediaType'] })}
                  >
                    <SelectTrigger data-testid={`select-file-type-${index}`}>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="pdf">PDF Document</SelectItem>
                      <SelectItem value="document">Document (.doc, .docx)</SelectItem>
                    </SelectContent>
                  </Select>
                  <Input
                    type="file"
                    accept={block.mediaType === 'pdf' ? '.pdf' : '.doc,.docx,.txt'}
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) handleFileSelect(index, file, block.mediaType);
                    }}
                    data-testid={`input-block-file-${index}`}
                  />
                  {block.file && (
                    <p className="text-xs text-green-600">Selected: {block.file.name}</p>
                  )}
                  <div className="space-y-2">
                    <Label className="text-xs">File Title</Label>
                    <Input
                      placeholder="File title or description"
                      value={block.title || ''}
                      onChange={(e) => updateBlock(index, { title: e.target.value })}
                      data-testid={`input-block-file-title-${index}`}
                    />
                  </div>
                </div>
              )}

              {/* Collapsible settings for accordion blocks */}
              {block.blockType === 'accordion' && (
                <div className="flex items-center justify-between p-3 bg-muted rounded">
                  <Label className="text-xs">Expanded by default</Label>
                  <Switch
                    checked={block.isExpandedByDefault ?? true}
                    onCheckedChange={(checked) => updateBlock(index, { isExpandedByDefault: checked })}
                    data-testid={`switch-expanded-${index}`}
                  />
                </div>
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      {blocks.length > 0 && (
        <div className="text-xs text-muted-foreground text-center pt-2">
          {blocks.length} content block{blocks.length !== 1 ? 's' : ''} • Use the arrows to reorder
        </div>
      )}
    </div>
  );
}
