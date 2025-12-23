import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Key, Copy, Trash2, Plus, Eye, EyeOff, AlertCircle, Loader2 } from "lucide-react";
import { CheckmarkIcon } from "@/components/ui/checkmark-icon";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Alert, AlertDescription } from "@/components/ui/alert";

interface ApiKey {
  id: string;
  name: string;
  tier: string;
  permissions: string[];
  keyPreview: string;
  lastUsedAt: string | null;
  expiresAt: string | null;
  createdAt: string;
}

export default function ApiKeysPage() {
  const [showNewKey, setShowNewKey] = useState(false);
  const [newKeyData, setNewKeyData] = useState<{ key: string; name: string } | null>(null);
  const [keyName, setKeyName] = useState("");
  const [keyTier, setKeyTier] = useState<"basic" | "advanced">("basic");
  const [showFullKey, setShowFullKey] = useState<string | null>(null);
  const [ajaxStatus, setAjaxStatus] = useState<{ type: 'idle' | 'loading' | 'success' | 'error'; message: string }>({ type: 'idle', message: '' });

  const { data: apiKeys = [], isLoading } = useQuery<ApiKey[]>({
    queryKey: ["/api/api-keys"],
  });

  const generateKeyMutation = useMutation({
    mutationFn: async (data: { name: string; tier: string }) => {
      setAjaxStatus({ type: 'loading', message: 'Generating API key...' });
      return await apiRequest("/api/api-keys/generate", {
        method: "POST",
        body: JSON.stringify(data),
      });
    },
    onSuccess: (data) => {
      setAjaxStatus({ type: 'success', message: 'API key generated successfully!' });
      setNewKeyData({ key: data.key, name: data.name });
      setShowNewKey(false);
      setKeyName("");
      queryClient.invalidateQueries({ queryKey: ["/api/api-keys"] });
      setTimeout(() => setAjaxStatus({ type: 'idle', message: '' }), 3000);
    },
    onError: (error: any) => {
      setAjaxStatus({ type: 'error', message: error.message || 'Failed to generate API key' });
      setTimeout(() => setAjaxStatus({ type: 'idle', message: '' }), 3000);
    },
  });

  const revokeKeyMutation = useMutation({
    mutationFn: async (keyId: string) => {
      setAjaxStatus({ type: 'loading', message: 'Revoking API key...' });
      return await apiRequest(`/api/api-keys/${keyId}`, {
        method: "DELETE",
      });
    },
    onSuccess: () => {
      setAjaxStatus({ type: 'success', message: 'API key revoked successfully!' });
      queryClient.invalidateQueries({ queryKey: ["/api/api-keys"] });
      setTimeout(() => setAjaxStatus({ type: 'idle', message: '' }), 3000);
    },
    onError: (error: any) => {
      setAjaxStatus({ type: 'error', message: error.message || 'Failed to revoke API key' });
      setTimeout(() => setAjaxStatus({ type: 'idle', message: '' }), 3000);
    },
  });

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
  };

  const handleGenerateKey = () => {
    if (!keyName.trim()) {
      return;
    }
    generateKeyMutation.mutate({ name: keyName, tier: keyTier });
  };

  const formatDate = (date: string | null) => {
    if (!date) return "Never";
    return new Date(date).toLocaleDateString();
  };

  return (
    <div className="container max-w-6xl mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <Key className="h-8 w-8" />
            API Keys
          </h1>
          <p className="text-muted-foreground mt-2">
            Manage your API keys for programmatic access to your marketplace data
          </p>
        </div>
        <Button
          onClick={() => setShowNewKey(true)}
          data-testid="button-create-api-key"
        >
          <Plus className="h-4 w-4 mr-2" />
          Create API Key
        </Button>
      </div>

      {ajaxStatus.type !== 'idle' && (
        <div className={`flex items-center gap-2 p-3 rounded-lg ${
          ajaxStatus.type === 'loading' ? 'bg-blue-50 text-blue-700' :
          ajaxStatus.type === 'success' ? 'bg-green-50 text-green-700' :
          'bg-primary/10 text-primary-700'
        }`} data-testid="ajax-status-inline">
          {ajaxStatus.type === 'loading' && <Loader2 className="h-4 w-4 animate-spin" />}
          {ajaxStatus.type === 'success' && <CheckmarkIcon size="sm" variant="success" />}
          {ajaxStatus.type === 'error' && <AlertCircle className="h-4 w-4" />}
          <span className="text-sm font-medium">{ajaxStatus.message}</span>
        </div>
      )}

      {newKeyData && (
        <Alert className="bg-blue-50 border-blue-200" data-testid="alert-new-key">
          <AlertCircle className="h-4 w-4 text-blue-600" />
          <AlertDescription>
            <div className="space-y-2">
              <p className="font-semibold text-blue-900">
                Your API key has been generated!
              </p>
              <p className="text-sm text-blue-800">
                Make sure to copy it now - you won't be able to see it again.
              </p>
              <div className="flex items-center gap-2 mt-2">
                <code className="flex-1 bg-white p-2 rounded border text-sm font-mono break-all">
                  {newKeyData.key}
                </code>
                <Button
                  onClick={() => copyToClipboard(newKeyData.key)}
                  variant="outline"
                  size="sm"
                  data-testid="button-copy-new-key"
                >
                  <Copy className="h-4 w-4" />
                </Button>
              </div>
              <Button
                onClick={() => setNewKeyData(null)}
                variant="ghost"
                size="sm"
                className="mt-2"
                data-testid="button-dismiss-alert"
              >
                I've copied my key
              </Button>
            </div>
          </AlertDescription>
        </Alert>
      )}

      {showNewKey && (
        <Card data-testid="card-create-key-form">
          <CardHeader>
            <CardTitle>Create New API Key</CardTitle>
            <CardDescription>
              Generate a new API key for your application
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="keyName">Key Name</Label>
              <Input
                id="keyName"
                placeholder="My Application"
                value={keyName}
                onChange={(e) => setKeyName(e.target.value)}
                data-testid="input-key-name"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="keyTier">Access Tier</Label>
              <Select value={keyTier} onValueChange={(value: "basic" | "advanced") => setKeyTier(value)}>
                <SelectTrigger data-testid="select-key-tier">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="basic" data-testid="option-basic">
                    Basic (Pro tier required)
                  </SelectItem>
                  <SelectItem value="advanced" data-testid="option-advanced">
                    Advanced (Business tier required)
                  </SelectItem>
                </SelectContent>
              </Select>
              <p className="text-sm text-muted-foreground">
                {keyTier === "basic" 
                  ? "Basic access includes read operations on your data" 
                  : "Advanced access includes read and write operations"}
              </p>
            </div>
            <div className="flex gap-2">
              <Button
                onClick={handleGenerateKey}
                disabled={generateKeyMutation.isPending}
                data-testid="button-confirm-generate"
              >
                {generateKeyMutation.isPending ? "Generating..." : "Generate Key"}
              </Button>
              <Button
                onClick={() => setShowNewKey(false)}
                variant="outline"
                data-testid="button-cancel-generate"
              >
                Cancel
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      <div className="space-y-4">
        {isLoading ? (
          <div className="text-center py-8 text-muted-foreground">
            Loading API keys...
          </div>
        ) : apiKeys.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12">
              <Key className="h-12 w-12 text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold mb-2">No API Keys</h3>
              <p className="text-muted-foreground text-center mb-4">
                You haven't created any API keys yet. Create one to get started with programmatic access.
              </p>
              <Button onClick={() => setShowNewKey(true)} data-testid="button-create-first-key">
                <Plus className="h-4 w-4 mr-2" />
                Create Your First API Key
              </Button>
            </CardContent>
          </Card>
        ) : (
          apiKeys.map((key) => (
            <Card key={key.id} data-testid={`card-api-key-${key.id}`}>
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <CardTitle className="text-lg">{key.name}</CardTitle>
                      <Badge variant={key.tier === "advanced" ? "default" : "secondary"}>
                        {key.tier}
                      </Badge>
                    </div>
                    <CardDescription className="mt-2">
                      <div className="flex items-center gap-2 font-mono text-sm">
                        {showFullKey === key.id ? key.keyPreview : key.keyPreview}
                        <Button
                          onClick={() => copyToClipboard(key.keyPreview)}
                          variant="ghost"
                          size="sm"
                          data-testid={`button-copy-${key.id}`}
                        >
                          <Copy className="h-3 w-3" />
                        </Button>
                      </div>
                    </CardDescription>
                  </div>
                  <Button
                    onClick={() => {
                      if (confirm("Are you sure you want to revoke this API key? This action cannot be undone.")) {
                        revokeKeyMutation.mutate(key.id);
                      }
                    }}
                    variant="ghost"
                    size="sm"
                    className="text-destructive hover:text-destructive"
                    data-testid={`button-revoke-${key.id}`}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-3 gap-4 text-sm">
                  <div>
                    <p className="text-muted-foreground">Created</p>
                    <p className="font-medium" data-testid={`text-created-${key.id}`}>
                      {formatDate(key.createdAt)}
                    </p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Last Used</p>
                    <p className="font-medium" data-testid={`text-last-used-${key.id}`}>
                      {formatDate(key.lastUsedAt)}
                    </p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Expires</p>
                    <p className="font-medium" data-testid={`text-expires-${key.id}`}>
                      {formatDate(key.expiresAt)}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>

      <Card className="bg-muted/50">
        <CardHeader>
          <CardTitle className="text-lg">API Documentation</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <h4 className="font-semibold mb-2">Authentication</h4>
            <p className="text-sm text-muted-foreground mb-2">
              Include your API key in the request headers:
            </p>
            <code className="block bg-white p-3 rounded text-sm font-mono">
              X-API-Key: your_api_key_here
            </code>
            <p className="text-sm text-muted-foreground mt-2">Or as a Bearer token:</p>
            <code className="block bg-white p-3 rounded text-sm font-mono">
              Authorization: Bearer your_api_key_here
            </code>
          </div>
          <div>
            <h4 className="font-semibold mb-2">Example Endpoints</h4>
            <ul className="space-y-2 text-sm">
              <li>
                <code className="bg-white px-2 py-1 rounded">GET /api/v1/profile</code>
                <span className="text-muted-foreground ml-2">- Get your profile information</span>
              </li>
              <li>
                <code className="bg-white px-2 py-1 rounded">GET /api/v1/purchases</code>
                <span className="text-muted-foreground ml-2">- List your purchases</span>
              </li>
            </ul>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
