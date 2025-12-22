import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useAuth } from "@/hooks/useAuth";
import { useLocation } from "wouter";

export interface AdminSetting {
  id: string;
  settingKey: string;
  settingValue: string | null;
  category: string;
  description: string | null;
  isEncrypted: boolean;
  isActive: boolean;
  updatedBy: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface PaymentGateway {
  id: string;
  gatewayId: string;
  gatewayName: string;
  isEnabled: boolean;
  isPrimary: boolean;
  publishableKey: string | null;
  secretKey: string | null;
  webhookSecret: string | null;
  testMode: boolean;
  supportedCurrencies: string[] | null;
  features: string[] | null;
  additionalConfig: Record<string, any> | null;
  updatedBy: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export function useAdminSettingsSections() {
  const { profile } = useAuth();
  const [, navigate] = useLocation();
  const [selectedTab, setSelectedTab] = useState("api-keys");
  const [editingKey, setEditingKey] = useState<string | null>(null);
  const [newKey, setNewKey] = useState({ key: "", value: "", category: "api", description: "" });
  const [editingGateway, setEditingGateway] = useState<string | null>(null);
  const [newGateway, setNewGateway] = useState({
    gatewayId: "",
    gatewayName: "",
    publishableKey: "",
    secretKey: "",
    webhookSecret: "",
    testMode: true,
    supportedCurrencies: ["USD"],
    features: ["one_time"]
  });
  const [appStoreUrl, setAppStoreUrl] = useState("");
  const [googlePlayUrl, setGooglePlayUrl] = useState("");
  const [uploadingCover, setUploadingCover] = useState(false);
  const [themeSettings, setThemeSettings] = useState({
    primaryColor: "#0C332C",
    secondaryColor: "#e7ebee",
    accentColor: "#0C332C",
    primaryFont: "Satoshi",
    headingFont: "Satoshi"
  });
  
  const isModerator = profile?.role === 'moderator';
  const isAdmin = profile?.role === 'admin';

  const hslToHex = (hsl: string): string => {
    const [h, s, l] = hsl.split(' ').map((v, i) => {
      const num = parseFloat(v.replace('%', ''));
      return i === 0 ? num : num / 100;
    });
    
    const hue = h / 360;
    const a = s * Math.min(l, 1 - l);
    const f = (n: number) => {
      const k = (n + hue * 12) % 12;
      const color = l - a * Math.max(Math.min(k - 3, 9 - k, 1), -1);
      return Math.round(255 * color).toString(16).padStart(2, '0');
    };
    return `#${f(0)}${f(8)}${f(4)}`;
  };

  const hexToHsl = (hex: string): string => {
    const r = parseInt(hex.slice(1, 3), 16) / 255;
    const g = parseInt(hex.slice(3, 5), 16) / 255;
    const b = parseInt(hex.slice(5, 7), 16) / 255;

    const max = Math.max(r, g, b);
    const min = Math.min(r, g, b);
    let h = 0, s = 0;
    const l = (max + min) / 2;

    if (max !== min) {
      const d = max - min;
      s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
      
      switch (max) {
        case r: h = ((g - b) / d + (g < b ? 6 : 0)) / 6; break;
        case g: h = ((b - r) / d + 2) / 6; break;
        case b: h = ((r - g) / d + 4) / 6; break;
      }
    }

    return `${Math.round(h * 360)} ${Math.round(s * 100)}% ${Math.round(l * 100)}%`;
  };

  const { data: settingsData, isLoading: loadingSettings } = useQuery({
    queryKey: ["/api/admin/settings"]
  });

  const { data: gatewaysData, isLoading: loadingGateways } = useQuery({
    queryKey: ["/api/admin/payment-gateways"]
  });

  const { data: downloadLinksData, isLoading: loadingDownloadLinks } = useQuery({
    queryKey: ["/api/app-download-links"]
  });

  const { data: defaultCoverData, isLoading: loadingDefaultCover } = useQuery({
    queryKey: ["/api/admin/settings/freelancer-default-cover"]
  });

  const { data: themeData, isLoading: loadingTheme } = useQuery({
    queryKey: ["/api/theme-settings"]
  });

  useEffect(() => {
    if ((downloadLinksData as any)?.data) {
      setAppStoreUrl((downloadLinksData as any).data.appStoreUrl || "");
      setGooglePlayUrl((downloadLinksData as any).data.googlePlayUrl || "");
    }
  }, [downloadLinksData]);

  useEffect(() => {
    if (themeData) {
      const data = (themeData as any)?.data || themeData;
      setThemeSettings({
        primaryColor: data.theme_primary_color ? hslToHex(data.theme_primary_color) : "#0C332C",
        secondaryColor: data.theme_secondary_color ? hslToHex(data.theme_secondary_color) : "#e7ebee",
        accentColor: data.theme_accent_color ? hslToHex(data.theme_accent_color) : "#0C332C",
        primaryFont: data.theme_primary_font || "Satoshi",
        headingFont: data.theme_heading_font || "Satoshi"
      });
    }
  }, [themeData]);

  const settings: AdminSetting[] = Array.isArray(settingsData) ? settingsData : (settingsData as any)?.data || [];
  const gateways: PaymentGateway[] = Array.isArray(gatewaysData) ? gatewaysData : (gatewaysData as any)?.data || [];

  const saveKeyMutation = useMutation({
    mutationFn: async (data: { key: string; value: string; category: string; description: string }) => {
      return await apiRequest(`/api/admin/settings/${data.key}`, {
        method: "PUT",
        body: JSON.stringify(data)
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/settings"] });
      setNewKey({ key: "", value: "", category: "api", description: "" });
      setEditingKey(null);
    }
  });

  const deleteKeyMutation = useMutation({
    mutationFn: async (key: string) => {
      return await apiRequest(`/api/admin/settings/${key}`, { method: "DELETE" });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/settings"] });
    }
  });

  const saveGatewayMutation = useMutation({
    mutationFn: async (data: any) => {
      return await apiRequest(`/api/admin/payment-gateways/${data.gatewayId}`, {
        method: "PUT",
        body: JSON.stringify(data)
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/payment-gateways"] });
      setNewGateway({
        gatewayId: "",
        gatewayName: "",
        publishableKey: "",
        secretKey: "",
        webhookSecret: "",
        testMode: true,
        supportedCurrencies: ["USD"],
        features: ["one_time"]
      });
      setEditingGateway(null);
    }
  });

  const setPrimaryMutation = useMutation({
    mutationFn: async (gatewayId: string) => {
      return await apiRequest(`/api/admin/payment-gateways/${gatewayId}/set-primary`, {
        method: "POST"
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/payment-gateways"] });
    }
  });

  const toggleGatewayMutation = useMutation({
    mutationFn: async ({ gatewayId, isEnabled }: { gatewayId: string; isEnabled: boolean }) => {
      const gateway = gateways.find(g => g.gatewayId === gatewayId);
      if (!gateway) throw new Error('Gateway not found');
      
      return await apiRequest(`/api/admin/payment-gateways/${gatewayId}`, {
        method: "PUT",
        body: JSON.stringify({
          ...gateway,
          isEnabled
        })
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/payment-gateways"] });
    }
  });

  const deleteGatewayMutation = useMutation({
    mutationFn: async (gatewayId: string) => {
      return await apiRequest(`/api/admin/payment-gateways/${gatewayId}`, { method: "DELETE" });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/payment-gateways"] });
    }
  });

  const updateAppLinksMutation = useMutation({
    mutationFn: async ({ appStoreUrl, googlePlayUrl }: { appStoreUrl: string; googlePlayUrl: string }) => {
      return await apiRequest(`/api/admin/app-download-links`, {
        method: "POST",
        body: JSON.stringify({ appStoreUrl, googlePlayUrl })
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/app-download-links"] });
    }
  });

  const deleteDefaultCoverMutation = useMutation({
    mutationFn: async () => {
      return await apiRequest(`/api/admin/settings/freelancer-default-cover`, {
        method: "DELETE"
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/settings/freelancer-default-cover"] });
      queryClient.invalidateQueries({ queryKey: ["/api/system-settings/freelancer-default-cover"] });
    }
  });

  const saveThemeMutation = useMutation({
    mutationFn: async () => {
      return await apiRequest(`/api/admin/theme-settings`, {
        method: "POST",
        body: JSON.stringify({
          primaryColor: hexToHsl(themeSettings.primaryColor),
          secondaryColor: hexToHsl(themeSettings.secondaryColor),
          accentColor: hexToHsl(themeSettings.accentColor),
          primaryFont: themeSettings.primaryFont,
          headingFont: themeSettings.headingFont
        })
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/theme-settings"] });
    }
  });

  const resetThemeMutation = useMutation({
    mutationFn: async () => {
      return await apiRequest(`/api/admin/theme-settings/reset`, {
        method: "POST"
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/theme-settings"] });
      setThemeSettings({
        primaryColor: "#0C332C",
        secondaryColor: "#e7ebee",
        accentColor: "#0C332C",
        primaryFont: "Satoshi",
        headingFont: "Satoshi"
      });
    }
  });

  const handleDefaultCoverUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      return;
    }

    if (file.size > 10 * 1024 * 1024) {
      return;
    }

    try {
      setUploadingCover(true);
      const formData = new FormData();
      formData.append('cover', file);

      const sessionId = localStorage.getItem('sessionId');
      const headers: Record<string, string> = {};
      
      if (sessionId) {
        headers['Authorization'] = `Bearer ${sessionId}`;
        headers['x-session-id'] = sessionId;
      }

      const response = await fetch('/api/admin/settings/freelancer-default-cover', {
        method: 'POST',
        body: formData,
        credentials: 'include',
        headers
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'Upload failed' }));
        throw new Error(errorData.error || `Server error: ${response.status}`);
      }

      const data = await response.json();

      if (data.success) {
        queryClient.invalidateQueries({ queryKey: ["/api/admin/settings/freelancer-default-cover"] });
        queryClient.invalidateQueries({ queryKey: ["/api/system-settings/freelancer-default-cover"] });
      } else {
        throw new Error(data.error || 'Upload failed');
      }
    } catch (error) {
      console.error('Upload error:', error);
    } finally {
      setUploadingCover(false);
      event.target.value = '';
    }
  };

  return {
    profile,
    isModerator,
    isAdmin,
    selectedTab,
    setSelectedTab,
    editingKey,
    setEditingKey,
    newKey,
    setNewKey,
    editingGateway,
    setEditingGateway,
    newGateway,
    setNewGateway,
    appStoreUrl,
    setAppStoreUrl,
    googlePlayUrl,
    setGooglePlayUrl,
    uploadingCover,
    themeSettings,
    setThemeSettings,
    settingsData,
    loadingSettings,
    gatewaysData,
    loadingGateways,
    downloadLinksData,
    loadingDownloadLinks,
    defaultCoverData,
    loadingDefaultCover,
    themeData,
    loadingTheme,
    settings,
    gateways,
    saveKeyMutation,
    deleteKeyMutation,
    saveGatewayMutation,
    setPrimaryMutation,
    toggleGatewayMutation,
    deleteGatewayMutation,
    updateAppLinksMutation,
    deleteDefaultCoverMutation,
    saveThemeMutation,
    resetThemeMutation,
    handleDefaultCoverUpload,
    hslToHex,
    hexToHsl
  };
}
