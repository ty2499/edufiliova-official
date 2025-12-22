export const CARD_GATEWAYS = ['stripe', 'vodapay', 'dodopay', 'dodo'] as const;
export const ALWAYS_VISIBLE_GATEWAYS = ['paypal', 'google-pay', 'apple-pay', 'ecocash'] as const;

export type CardGatewayId = typeof CARD_GATEWAYS[number];
export type AlwaysVisibleGatewayId = typeof ALWAYS_VISIBLE_GATEWAYS[number];

export function isCardGateway(gatewayId: string): gatewayId is CardGatewayId {
  return CARD_GATEWAYS.includes(gatewayId as CardGatewayId);
}

export function isAlwaysVisibleGateway(gatewayId: string): gatewayId is AlwaysVisibleGatewayId {
  return ALWAYS_VISIBLE_GATEWAYS.includes(gatewayId as AlwaysVisibleGatewayId);
}

export function getGatewayDisplayName(gatewayId: string): string {
  const displayNames: Record<string, string> = {
    stripe: 'Card',
    vodapay: 'VodaPay',
    dodopay: 'Card',
    dodo: 'Card',
    paypal: 'PayPal',
    'google-pay': 'Google Pay',
    'apple-pay': 'Apple Pay',
    ecocash: 'EcoCash',
    wallet: 'Wallet'
  };
  return displayNames[gatewayId] || gatewayId;
}

export function normalizeGatewayId(gatewayId: string): string {
  if (gatewayId === 'dodo') return 'dodopay';
  return gatewayId;
}
