import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, Trash2 } from "lucide-react";
import { useAdminSettingsSections } from "@/hooks/useAdminSettingsSections";

export function ApiKeysSection() {
  const {
    editingKey,
    newKey,
    setNewKey,
    loadingSettings,
    settings,
    saveKeyMutation,
    deleteKeyMutation
  } = useAdminSettingsSections();

  return (
    <Card className="p-6">
      <h2 className="text-xl font-semibold mb-4 text-gray-900 dark:text-white">API Keys & Configuration</h2>
      
      <div className="border rounded-lg p-4 mb-6 bg-gray-50 dark:bg-gray-800">
        <h3 className="text-lg font-medium mb-4 text-gray-900 dark:text-white">Add New API Key</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <Label htmlFor="key-name">Key Name</Label>
            <Input
              id="key-name"
              placeholder="e.g., openai_api_key"
              value={newKey.key}
              onChange={(e) => setNewKey({ ...newKey, key: e.target.value })}
              data-testid="input-key-name"
            />
          </div>
          <div>
            <Label htmlFor="key-category">Category</Label>
            <Select value={newKey.category} onValueChange={(value) => setNewKey({ ...newKey, category: value })}>
              <SelectTrigger data-testid="select-category">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="api">API</SelectItem>
                <SelectItem value="payment">Payment</SelectItem>
                <SelectItem value="email">Email</SelectItem>
                <SelectItem value="sms">SMS</SelectItem>
                <SelectItem value="messaging">Messaging (WhatsApp)</SelectItem>
                <SelectItem value="general">General</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="md:col-span-2">
            <Label htmlFor="key-value">Value</Label>
            <Input
              id="key-value"
              type="password"
              placeholder="Enter API key value"
              value={newKey.value}
              onChange={(e) => setNewKey({ ...newKey, value: e.target.value })}
              data-testid="input-key-value"
            />
          </div>
          <div className="md:col-span-2">
            <Label htmlFor="key-description">Description</Label>
            <Input
              id="key-description"
              placeholder="What is this key used for?"
              value={newKey.description}
              onChange={(e) => setNewKey({ ...newKey, description: e.target.value })}
              data-testid="input-key-description"
            />
          </div>
        </div>
        <Button
          className="mt-4"
          onClick={() => saveKeyMutation.mutate(newKey)}
          disabled={!newKey.key || !newKey.value || saveKeyMutation.isPending}
          data-testid="button-add-key"
        >
          <Plus className="h-4 w-4 mr-2" />
          Add API Key
        </Button>
      </div>

      <div className="space-y-3">
        <h3 className="text-lg font-medium text-gray-900 dark:text-white">Existing API Keys</h3>
        {loadingSettings ? (
          <div className="text-center py-8 text-gray-500">Loading...</div>
        ) : settings.length === 0 ? (
          <div className="text-center py-8 text-gray-500">No API keys configured yet</div>
        ) : (
          settings.map((setting) => (
            <div
              key={setting.id}
              className="border rounded-lg p-4 bg-white dark:bg-gray-800"
              data-testid={`setting-${setting.settingKey}`}
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <h4 className="font-medium text-gray-900 dark:text-white">{setting.settingKey}</h4>
                    <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded">
                      {setting.category}
                    </span>
                  </div>
                  {setting.description && (
                    <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">{setting.description}</p>
                  )}
                  <div className="text-xs text-gray-500">
                    Value: {editingKey === setting.settingKey ? (
                      <Input
                        type="password"
                        value={setting.settingValue || ""}
                        className="inline-block w-64 ml-2"
                        onChange={(e) => {
                        }}
                        data-testid={`input-edit-${setting.settingKey}`}
                      />
                    ) : (
                      <span className="font-mono">{"•".repeat(20)}</span>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => deleteKeyMutation.mutate(setting.settingKey)}
                    disabled={deleteKeyMutation.isPending}
                    data-testid={`button-delete-${setting.settingKey}`}
                  >
                    <Trash2 className="h-4 w-4 text-red-600" />
                  </Button>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </Card>
  );
}
