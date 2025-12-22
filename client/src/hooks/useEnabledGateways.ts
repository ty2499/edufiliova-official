import { useQuery } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";

export interface PaymentGateway {
  gatewayId: string;
  gatewayName: string;
  isPrimary: boolean;
  supportedCurrencies: string[] | null;
  features: string[] | null;
  testMode: boolean;
}

export function useEnabledGateways() {
  return useQuery<PaymentGateway[]>({
    queryKey: ['/api/payment-gateways/enabled'],
    queryFn: async () => {
      const response = await apiRequest('/api/payment-gateways/enabled');
      return Array.isArray(response) ? response : response.data || [];
    },
    staleTime: 60000,
  });
}
