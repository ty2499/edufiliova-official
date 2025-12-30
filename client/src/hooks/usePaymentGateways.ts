import { useQuery } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";

export interface PaymentGateway {
  gatewayId: string;
  gatewayName: string;
  isPrimary: boolean;
  supportedCurrencies: string[];
  features: string[];
  testMode: boolean;
  isEnabled?: boolean;
}

// DodoPay is always available as the primary card payment method
// DodoPay fallback - admin settings take priority when configured
const DODOPAY_FALLBACK: PaymentGateway = {
  gatewayId: 'dodopay',
  gatewayName: 'Card',
  isPrimary: false,
  supportedCurrencies: ['USD'],
  features: ['card'],
  testMode: true,  // Fallback only
  isEnabled: true
};

export function usePaymentGateways() {
  return useQuery<PaymentGateway[]>({
    queryKey: ['/api/payment-gateways/enabled'],
    queryFn: async () => {
      const response = await apiRequest('/api/payment-gateways/enabled');
      const gateways: PaymentGateway[] = Array.isArray(response) ? response : response?.data || [];
      
      // Always include DodoPay if not already in the list
      const hasDodoPay = gateways.some(g => g.gatewayId === 'dodopay' || g.gatewayId === 'dodo');
      if (!hasDodoPay) {
        return [DODOPAY_FALLBACK, ...gateways];
      }
      
      return gateways;
    },
    staleTime: 5 * 60 * 1000,
  });
}

export function getGatewayIcon(gatewayId: string): string {
  const icons: Record<string, string> = {
    stripe: "💳",
    paypal: "🅿️",
    ecocash: "📱",
    vodapay: "📲",
    dodopay: "🦤",
    innbucks: "💰",
    paynow: "💵",
  };
  return icons[gatewayId] || "💳";
}

export function getGatewayDisplayName(gateway: PaymentGateway): string {
  return gateway.gatewayName || gateway.gatewayId.charAt(0).toUpperCase() + gateway.gatewayId.slice(1);
}

export function isCardGateway(gatewayId: string): boolean {
  return gatewayId === 'stripe';
}

export function isRedirectGateway(gatewayId: string): boolean {
  return ['paypal', 'ecocash', 'vodapay', 'dodopay', 'innbucks', 'paynow'].includes(gatewayId);
}
