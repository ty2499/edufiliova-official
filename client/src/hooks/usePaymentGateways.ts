import { useQuery } from "@tanstack/react-query";

export interface PaymentGateway {
  gatewayId: string;
  gatewayName: string;
  isPrimary: boolean;
  supportedCurrencies: string[];
  features: string[];
  testMode: boolean;
}

export function usePaymentGateways() {
  return useQuery<PaymentGateway[]>({
    queryKey: ['/api/payment-gateways/enabled'],
    select: (data: any) => data?.data || [],
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
