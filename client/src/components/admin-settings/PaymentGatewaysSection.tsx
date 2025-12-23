import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Plus, Trash2, Check, Smartphone, MessageCircle, Loader2 } from "lucide-react";
import { useAdminSettingsSections } from "@/hooks/useAdminSettingsSections";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

interface EcocashManualSettings {
  enabled: boolean;
  instructions: string;
  whatsappNumber: string;
  merchantNumber: string;
  merchantName: string;
}

export function PaymentGatewaysSection() {
  const { toast } = useToast();
  const {
    newGateway,
    setNewGateway,
    loadingGateways,
    gateways,
    saveGatewayMutation,
    setPrimaryMutation,
    toggleGatewayMutation,
    deleteGatewayMutation
  } = useAdminSettingsSections();

  // EcoCash manual payment settings state
  const [ecocashSettings, setEcocashSettings] = useState<EcocashManualSettings>({
    enabled: false,
    instructions: 'Send payment to our EcoCash merchant number and share your receipt via WhatsApp for verification.',
    whatsappNumber: '',
    merchantNumber: '',
    merchantName: ''
  });

  // Fetch EcoCash manual payment settings
  const { data: ecocashData, isLoading: loadingEcocash } = useQuery({
    queryKey: ['/api/ecocash/manual-payment-settings'],
    queryFn: async () => {
      const response = await apiRequest('/api/ecocash/manual-payment-settings');
      return response.data;
    }
  });

  // Update local state when data is fetched
  useEffect(() => {
    if (ecocashData) {
      setEcocashSettings({
        enabled: ecocashData.enabled || false,
        instructions: ecocashData.instructions || 'Send payment to our EcoCash merchant number and share your receipt via WhatsApp for verification.',
        whatsappNumber: ecocashData.whatsappNumber || '',
        merchantNumber: ecocashData.merchantNumber || '',
        merchantName: ecocashData.merchantName || ''
      });
    }
  }, [ecocashData]);

  // Save EcoCash manual payment settings mutation
  const saveEcocashSettingsMutation = useMutation({
    mutationFn: async (settings: EcocashManualSettings) => {
      return await apiRequest('/api/admin/ecocash/manual-payment-settings', {
        method: 'POST',
        body: JSON.stringify(settings)
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/ecocash/manual-payment-settings'] });
      toast({
        title: "Settings Saved",
        description: "EcoCash manual payment settings have been updated successfully."
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to save EcoCash manual payment settings.",
        variant: "destructive"
      });
    }
  });

  const getGatewayDisplayName = (gatewayId: string): string => {
    const nameMap: Record<string, string> = {
      'stripe': 'Stripe',
      'paypal': 'PayPal',
      'paystack': 'Paystack',
      'square': 'Square',
      'razorpay': 'Razorpay',
      'dodopay': 'DoDo Pay',
      'vodapay': 'VodaPay',
      'ecocash': 'EcoCash'
    };
    return nameMap[gatewayId] || gatewayId.charAt(0).toUpperCase() + gatewayId.slice(1);
  };

  return (
    <Card className="p-6">
      <h2 className="text-xl font-semibold mb-4 text-gray-900 dark:text-white">Payment Gateway Configuration</h2>
      
      <div className="border rounded-lg p-4 mb-6 bg-gray-50 dark:bg-gray-800">
        <h3 className="text-lg font-medium mb-4 text-gray-900 dark:text-white">Add New Payment Gateway</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <Label htmlFor="gateway-id">Gateway ID</Label>
            <Select value={newGateway.gatewayId} onValueChange={(value) => setNewGateway({ ...newGateway, gatewayId: value, gatewayName: getGatewayDisplayName(value) })}>
              <SelectTrigger data-testid="select-gateway-id">
                <SelectValue placeholder="Select gateway" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="stripe">Stripe</SelectItem>
                <SelectItem value="paypal">PayPal</SelectItem>
                <SelectItem value="paystack">Paystack</SelectItem>
                <SelectItem value="square">Square</SelectItem>
                <SelectItem value="razorpay">Razorpay</SelectItem>
                <SelectItem value="dodopay">DoDo Pay</SelectItem>
                <SelectItem value="vodapay">VodaPay</SelectItem>
                <SelectItem value="ecocash">EcoCash</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label htmlFor="gateway-name">Gateway Name</Label>
            <Input
              id="gateway-name"
              value={newGateway.gatewayName}
              onChange={(e) => setNewGateway({ ...newGateway, gatewayName: e.target.value })}
              data-testid="input-gateway-name"
            />
          </div>
          <div>
            <Label htmlFor="publishable-key">Publishable Key</Label>
            <Input
              id="publishable-key"
              type="password"
              placeholder="pk_..."
              value={newGateway.publishableKey}
              onChange={(e) => setNewGateway({ ...newGateway, publishableKey: e.target.value })}
              data-testid="input-publishable-key"
            />
          </div>
          <div>
            <Label htmlFor="secret-key">Secret Key</Label>
            <Input
              id="secret-key"
              type="password"
              placeholder="sk_..."
              value={newGateway.secretKey}
              onChange={(e) => setNewGateway({ ...newGateway, secretKey: e.target.value })}
              data-testid="input-secret-key"
            />
          </div>
          <div className="md:col-span-2">
            <Label htmlFor="webhook-secret">Webhook Secret</Label>
            <Input
              id="webhook-secret"
              type="password"
              placeholder="whsec_..."
              value={newGateway.webhookSecret}
              onChange={(e) => setNewGateway({ ...newGateway, webhookSecret: e.target.value })}
              data-testid="input-webhook-secret"
            />
          </div>
          <div className="flex items-center space-x-2">
            <Switch
              checked={newGateway.testMode}
              onCheckedChange={(checked) => setNewGateway({ ...newGateway, testMode: checked })}
              data-testid="switch-test-mode"
            />
            <Label>Test Mode</Label>
          </div>
        </div>
        <Button
          className="mt-4"
          onClick={() => saveGatewayMutation.mutate(newGateway)}
          disabled={!newGateway.gatewayId || !newGateway.secretKey || saveGatewayMutation.isPending}
          data-testid="button-add-gateway"
        >
          <Plus className="h-4 w-4 mr-2" />
          Add Payment Gateway
        </Button>
      </div>

      <div className="space-y-3">
        <h3 className="text-lg font-medium text-gray-900 dark:text-white">Configured Payment Gateways</h3>
        {loadingGateways ? (
          <div className="text-center py-8 text-gray-500">Loading...</div>
        ) : gateways.length === 0 ? (
          <div className="text-center py-8 text-gray-500">No payment gateways configured yet</div>
        ) : (
          gateways.map((gateway) => (
            <div
              key={gateway.id}
              className={`border rounded-lg p-4 ${gateway.isPrimary ? 'border-green-500 bg-green-50 dark:bg-green-900/20' : 'bg-white dark:bg-gray-800'}`}
              data-testid={`gateway-${gateway.gatewayId}`}
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <h4 className="font-medium text-gray-900 dark:text-white">{gateway.gatewayName}</h4>
                    {gateway.isPrimary && (
                      <span className="text-xs bg-green-600 text-white px-2 py-1 rounded flex items-center gap-1">
                        <Check className="h-3 w-3" />
                        Primary
                      </span>
                    )}
                    <span className={`text-xs px-2 py-1 rounded ${gateway.testMode ? 'bg-yellow-100 text-yellow-800' : 'bg-blue-100 text-blue-800'}`}>
                      {gateway.testMode ? 'Test Mode' : 'Live Mode'}
                    </span>
                  </div>
                  <div className="text-sm text-gray-600 dark:text-gray-400 space-y-1 mb-3">
                    <div>Publishable Key: <span className="font-mono">{"•".repeat(15)}</span></div>
                    <div>Secret Key: <span className="font-mono">{"•".repeat(15)}</span></div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Switch
                      checked={gateway.isEnabled}
                      onCheckedChange={(checked) => 
                        toggleGatewayMutation.mutate({ 
                          gatewayId: gateway.gatewayId, 
                          isEnabled: checked 
                        })
                      }
                      disabled={toggleGatewayMutation.isPending}
                      data-testid={`switch-enable-${gateway.gatewayId}`}
                    />
                    <Label className="text-sm font-medium">
                      {gateway.isEnabled ? 'Enabled' : 'Disabled'}
                    </Label>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {!gateway.isPrimary && gateway.isEnabled && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setPrimaryMutation.mutate(gateway.gatewayId)}
                      disabled={setPrimaryMutation.isPending}
                      data-testid={`button-set-primary-${gateway.gatewayId}`}
                    >
                      Set Primary
                    </Button>
                  )}
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => deleteGatewayMutation.mutate(gateway.gatewayId)}
                    disabled={deleteGatewayMutation.isPending}
                    data-testid={`button-delete-gateway-${gateway.gatewayId}`}
                  >
                    <Trash2 className="h-4 w-4 text-primary" />
                  </Button>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* EcoCash Manual Payment Settings Section */}
      <div className="border-t mt-8 pt-6">
        <div className="flex items-center gap-3 mb-4">
          <div className="p-2 bg-green-100 dark:bg-green-900/30 rounded-lg">
            <Smartphone className="h-6 w-6 text-green-600" />
          </div>
          <div>
            <h3 className="text-lg font-medium text-gray-900 dark:text-white">EcoCash Manual Payment (Zimbabwe)</h3>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Configure manual payment option for Zimbabwean users when EcoCash API is not available
            </p>
          </div>
        </div>

        {loadingEcocash ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-6 w-6 animate-spin text-gray-400" />
          </div>
        ) : (
          <div className="space-y-4 border rounded-lg p-4 bg-gray-50 dark:bg-gray-800">
            <div className="flex items-center justify-between">
              <div>
                <Label className="text-base font-medium">Enable Manual Payment</Label>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  Show manual payment option when EcoCash API is not configured
                </p>
              </div>
              <Switch
                checked={ecocashSettings.enabled}
                onCheckedChange={(checked) => setEcocashSettings({ ...ecocashSettings, enabled: checked })}
                data-testid="switch-ecocash-manual-enabled"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="ecocash-merchant-name">Merchant Name</Label>
                <Input
                  id="ecocash-merchant-name"
                  placeholder="e.g., EduFiliova"
                  value={ecocashSettings.merchantName}
                  onChange={(e) => setEcocashSettings({ ...ecocashSettings, merchantName: e.target.value })}
                  data-testid="input-ecocash-merchant-name"
                />
              </div>
              <div>
                <Label htmlFor="ecocash-merchant-number">Merchant EcoCash Number</Label>
                <Input
                  id="ecocash-merchant-number"
                  placeholder="e.g., 077 123 4567"
                  value={ecocashSettings.merchantNumber}
                  onChange={(e) => setEcocashSettings({ ...ecocashSettings, merchantNumber: e.target.value })}
                  data-testid="input-ecocash-merchant-number"
                />
                <p className="text-xs text-gray-500 mt-1">Users will send payment to this number</p>
              </div>
            </div>

            <div>
              <Label htmlFor="ecocash-whatsapp" className="flex items-center gap-2">
                <MessageCircle className="h-4 w-4 text-green-600" />
                WhatsApp Support Number
              </Label>
              <Input
                id="ecocash-whatsapp"
                placeholder="e.g., 263771234567 (include country code)"
                value={ecocashSettings.whatsappNumber}
                onChange={(e) => setEcocashSettings({ ...ecocashSettings, whatsappNumber: e.target.value })}
                data-testid="input-ecocash-whatsapp"
              />
              <p className="text-xs text-gray-500 mt-1">Users will contact this number on WhatsApp to share payment proof</p>
            </div>

            <div>
              <Label htmlFor="ecocash-instructions">Payment Instructions</Label>
              <Textarea
                id="ecocash-instructions"
                rows={4}
                placeholder="Enter instructions for manual payment..."
                value={ecocashSettings.instructions}
                onChange={(e) => setEcocashSettings({ ...ecocashSettings, instructions: e.target.value })}
                data-testid="textarea-ecocash-instructions"
              />
              <p className="text-xs text-gray-500 mt-1">These instructions will be shown to users when they select EcoCash</p>
            </div>

            <Button
              onClick={() => saveEcocashSettingsMutation.mutate(ecocashSettings)}
              disabled={saveEcocashSettingsMutation.isPending}
              className="w-full md:w-auto"
              data-testid="button-save-ecocash-settings"
            >
              {saveEcocashSettingsMutation.isPending ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Saving...
                </>
              ) : (
                'Save EcoCash Settings'
              )}
            </Button>
          </div>
        )}
      </div>
    </Card>
  );
}
