import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Trash2 } from "lucide-react";
import { useAdminSettingsSections } from "@/hooks/useAdminSettingsSections";

export function DefaultCoverSection() {
  const {
    uploadingCover,
    defaultCoverData,
    loadingDefaultCover,
    deleteDefaultCoverMutation,
    handleDefaultCoverUpload
  } = useAdminSettingsSections();

  return (
    <Card className="p-6">
      <h2 className="text-xl font-semibold mb-4 text-gray-900 dark:text-white">Default Freelancer Cover Image</h2>
      <p className="text-sm text-gray-600 dark:text-gray-400 mb-6">
        Upload a default cover image that will be displayed for freelancer profiles that don't have a custom cover image.
      </p>
      
      {loadingDefaultCover ? (
        <div className="text-center py-8 text-gray-500">Loading...</div>
      ) : (
        <>
          {(defaultCoverData as any)?.url && (
            <div className="mb-6">
              <Label className="mb-2 block">Current Default Cover</Label>
              <div className="relative border rounded-lg overflow-hidden bg-gray-100 dark:bg-gray-800" style={{ height: '300px' }}>
                <img 
                  src={(defaultCoverData as any).url} 
                  alt="Default freelancer cover"
                  className="w-full h-full object-cover"
                />
              </div>
              <Button
                variant="destructive"
                size="sm"
                className="mt-3"
                onClick={() => deleteDefaultCoverMutation.mutate()}
                disabled={deleteDefaultCoverMutation.isPending}
                data-testid="button-remove-default-cover"
              >
                <Trash2 className="h-4 w-4 mr-2" />
                Remove Default Cover
              </Button>
            </div>
          )}

          <div className="border rounded-lg p-6 bg-gray-50 dark:bg-gray-800">
            <h3 className="text-lg font-medium mb-4 text-gray-900 dark:text-white">
              {(defaultCoverData as any)?.url ? 'Replace Default Cover' : 'Upload Default Cover'}
            </h3>
            <div className="space-y-4">
              <div>
                <Label htmlFor="cover-upload">Select Image</Label>
                <Input
                  id="cover-upload"
                  type="file"
                  accept="image/jpeg,image/png,image/webp,image/gif"
                  onChange={handleDefaultCoverUpload}
                  disabled={uploadingCover}
                  className="mt-2"
                  data-testid="input-default-cover-upload"
                />
                <p className="text-xs text-gray-500 mt-2">
                  Accepted formats: JPEG, PNG, WebP, GIF. Max size: 10MB. Recommended size: 1200x400px
                </p>
              </div>
              {uploadingCover && (
                <div className="flex items-center gap-2 text-blue-600">
                  <div className="h-4 w-4 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
                  <span className="text-sm">Uploading...</span>
                </div>
              )}
            </div>
          </div>

          {!(defaultCoverData as any)?.url && (
            <div className="mt-6 p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
              <p className="text-sm text-blue-800 dark:text-blue-300">
                <strong>Note:</strong> When no default cover is set, freelancer profiles without a custom cover will show a generic placeholder.
              </p>
            </div>
          )}
        </>
      )}
    </Card>
  );
}
