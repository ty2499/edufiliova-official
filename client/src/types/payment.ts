export type PaymentContextType = 'course' | 'wallet' | 'ads';

export interface PaymentItemDetails {
  id: string;
  title: string;
  description?: string;
  price: number;
}

export interface PaymentContextConfig {
  type: PaymentContextType;
  itemDetails: PaymentItemDetails;
  allowsCoupons: boolean;
  requiresBilling?: boolean;
  customSummaryRenderer?: React.ComponentType<{ itemDetails: PaymentItemDetails }>;
  onSuccess: () => void;
  onClose: () => void;
  purchaseMutation: any;
  confirmPurchaseMutation: any;
}

export interface GatewayDefinition {
  id: string;
  displayName: string;
  icon?: React.ReactNode;
  supportsSavedCards?: boolean;
  requiresRedirect?: boolean;
  component?: React.ComponentType<any>;
}

export const GATEWAY_DEFINITIONS: Record<string, GatewayDefinition> = {
  stripe: {
    id: 'stripe',
    displayName: 'Credit/Debit Card',
    supportsSavedCards: true,
  },
  paypal: {
    id: 'paypal',
    displayName: 'PayPal',
    requiresRedirect: true,
  },
  paystack: {
    id: 'paystack',
    displayName: 'Paystack',
  },
  square: {
    id: 'square',
    displayName: 'Square',
  },
  razorpay: {
    id: 'razorpay',
    displayName: 'Razorpay',
  },
  dodopay: {
    id: 'dodopay',
    displayName: 'DoDo Pay',
  },
  vodapay: {
    id: 'vodapay',
    displayName: 'VodaPay',
  },
};
