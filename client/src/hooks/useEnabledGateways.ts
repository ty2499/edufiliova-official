import { useQuery } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";

export interface PaymentGateway {
  gatewayId: string;
  gatewayName: string;
  isPrimary: boolean;
  supportedCurrencies: string[] | null;
  features: string[] | null;
  testMode: boolean;
  isEnabled?: boolean;
}

// DodoPay is always available as the primary card payment method
const DODOPAY_GATEWAY: PaymentGateway = {
  gatewayId: 'dodopay',
  gatewayName: 'Card',
  isPrimary: true,
  supportedCurrencies: ['USD'],
  features: ['card'],
  testMode: true,
  isEnabled: true
};

export function useEnabledGateways() {
  return useQuery<PaymentGateway[]>({
    queryKey: ['/api/payment-gateways/enabled'],
    queryFn: async () => {
      const response = await apiRequest('/api/payment-gateways/enabled');
      const gateways: PaymentGateway[] = Array.isArray(response) ? response : response.data || [];
      
      // Always include DodoPay if not already in the list
      const hasDodoPay = gateways.some(g => g.gatewayId === 'dodopay' || g.gatewayId === 'dodo');
      if (!hasDodoPay) {
        // Add DodoPay as the first (primary) gateway
        return [DODOPAY_GATEWAY, ...gateways];
      }
      
      return gateways;
    },
    staleTime: 60000,
  });
}
