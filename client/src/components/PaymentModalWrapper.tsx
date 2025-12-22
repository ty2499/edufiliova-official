import { useState, useEffect } from "react";
import { Elements } from "@stripe/react-stripe-js";
import { Stripe } from "@stripe/stripe-js";
import NewPaymentModal from "./NewPaymentModal";
import { useEnabledGateways } from "@/hooks/useEnabledGateways";
import { getStripePromise } from "@/lib/stripe";

interface PaymentModalWrapperProps {
  courseId: string;
  course: {
    id: string;
    title: string;
    description: string;
    price: number;
  };
  onClose: () => void;
  purchaseMutation: any;
  confirmPurchaseMutation: any;
}

export default function PaymentModalWrapper(props: PaymentModalWrapperProps) {
  const { data: enabledGateways = [], isLoading } = useEnabledGateways();
  const [stripePromise, setStripePromise] = useState<Promise<Stripe | null> | null>(null);
  
  const isStripeEnabled = enabledGateways.some(g => g.gatewayId === 'stripe');

  useEffect(() => {
    if (isStripeEnabled && !stripePromise) {
      getStripePromise().then((stripe) => {
        if (stripe) {
          setStripePromise(Promise.resolve(stripe));
        }
      });
    }
  }, [isStripeEnabled, stripePromise]);

  if (isLoading) {
    return null;
  }

  if (!isStripeEnabled) {
    return <NewPaymentModal {...props} />;
  }

  if (!stripePromise) {
    return null;
  }

  return (
    <Elements stripe={stripePromise}>
      <NewPaymentModal {...props} />
    </Elements>
  );
}
