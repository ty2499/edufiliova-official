import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { ArrowLeft, CheckCircle, Loader2, AlertCircle } from "lucide-react";
import { useLocation } from "wouter";
import BuyVoucherSection from "@/components/BuyVoucherSection";
import { apiRequest } from "@/lib/queryClient";

export default function BuyVoucherPage() {
  const [, setLocation] = useLocation();
  const [whatsappCheckout, setWhatsappCheckout] = useState<{
    code: string;
    amount: string;
    loading: boolean;
    error: string | null;
    success: boolean;
    voucherData: any;
  } | null>(null);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const code = params.get('code');
    const success = params.get('success');
    const sessionId = params.get('session_id');
    const cancelled = params.get('cancelled');

    if (code) {
      setWhatsappCheckout({
        code,
        amount: '',
        loading: true,
        error: null,
        success: false,
        voucherData: null
      });

      if (success === 'true' && sessionId) {
        completeCheckout(code, sessionId);
      } else if (cancelled === 'true') {
        fetchVoucherDetails(code, 'Payment was cancelled. You can try again.');
      } else {
        fetchVoucherDetails(code);
      }
    }
  }, []);

  const fetchVoucherDetails = async (code: string, errorMessage?: string) => {
    try {
      const response = await fetch(`/api/gift-vouchers/pending/${code}`);
      const data = await response.json();

      if (!response.ok) {
        if (data.alreadyPaid) {
          setWhatsappCheckout(prev => prev ? {
            ...prev,
            loading: false,
            success: true,
            error: null,
            voucherData: { code, alreadyPaid: true }
          } : null);
        } else {
          setWhatsappCheckout(prev => prev ? {
            ...prev,
            loading: false,
            error: data.error || 'Voucher not found'
          } : null);
        }
        return;
      }

      setWhatsappCheckout(prev => prev ? {
        ...prev,
        loading: false,
        amount: data.amount,
        voucherData: data,
        error: errorMessage || null
      } : null);
    } catch (err: any) {
      setWhatsappCheckout(prev => prev ? {
        ...prev,
        loading: false,
        error: err.message || 'Failed to load voucher details'
      } : null);
    }
  };

  const completeCheckout = async (code: string, sessionId: string) => {
    try {
      const response = await apiRequest('/api/gift-vouchers/complete-checkout', {
        method: 'POST',
        body: JSON.stringify({ voucherCode: code, sessionId })
      });

      setWhatsappCheckout(prev => prev ? {
        ...prev,
        loading: false,
        success: true,
        voucherData: response
      } : null);
    } catch (err: any) {
      setWhatsappCheckout(prev => prev ? {
        ...prev,
        loading: false,
        error: err.message || 'Failed to complete payment'
      } : null);
    }
  };

  const handlePayNow = async () => {
    if (!whatsappCheckout?.code) return;

    setWhatsappCheckout(prev => prev ? { ...prev, loading: true, error: null } : null);

    try {
      const response = await apiRequest('/api/gift-vouchers/create-checkout-session', {
        method: 'POST',
        body: JSON.stringify({ voucherCode: whatsappCheckout.code })
      });

      if (response.url) {
        window.location.href = response.url;
      } else {
        throw new Error('No checkout URL returned');
      }
    } catch (err: any) {
      setWhatsappCheckout(prev => prev ? {
        ...prev,
        loading: false,
        error: err.message || 'Failed to create payment session'
      } : null);
    }
  };

  const handleBack = () => {
    setLocation('/');
  };

  const handleSuccess = () => {
    setLocation('/dashboard');
  };

  if (whatsappCheckout) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-orange-50 via-white to-green-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 p-4 md:p-8">
        <div className="max-w-md mx-auto">
          <Button
            variant="ghost"
            onClick={handleBack}
            className="mb-4"
            data-testid="button-back-home"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back
          </Button>

          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-8">
            {whatsappCheckout.loading ? (
              <div className="text-center py-12">
                <Loader2 className="w-12 h-12 animate-spin text-orange-500 mx-auto mb-4" />
                <p className="text-gray-600 dark:text-gray-400">Processing...</p>
              </div>
            ) : whatsappCheckout.success ? (
              <div className="text-center py-8">
                <div className="w-20 h-20 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center mx-auto mb-6">
                  <CheckCircle className="w-10 h-10 text-green-600" />
                </div>
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
                  {whatsappCheckout.voucherData?.alreadyPaid ? 'Voucher Already Paid' : 'Payment Successful!'}
                </h2>
                <p className="text-gray-600 dark:text-gray-400 mb-6">
                  {whatsappCheckout.voucherData?.alreadyPaid
                    ? 'This voucher has already been paid for.'
                    : `Your $${whatsappCheckout.voucherData?.amount || whatsappCheckout.amount} gift voucher has been sent!`}
                </p>
                {whatsappCheckout.voucherData?.recipientEmail && (
                  <p className="text-sm text-gray-500 dark:text-gray-500 mb-6">
                    Sent to: {whatsappCheckout.voucherData.recipientEmail}
                  </p>
                )}
                <Button
                  onClick={handleBack}
                  className="bg-gradient-to-r from-orange-500 to-green-500 text-white"
                  data-testid="button-go-home"
                >
                  Go to Homepage
                </Button>
              </div>
            ) : whatsappCheckout.error && !whatsappCheckout.voucherData ? (
              <div className="text-center py-8">
                <div className="w-20 h-20 bg-red-100 dark:bg-red-900/30 rounded-full flex items-center justify-center mx-auto mb-6">
                  <AlertCircle className="w-10 h-10 text-primary-600" />
                </div>
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">Error</h2>
                <p className="text-gray-600 dark:text-gray-400 mb-6">{whatsappCheckout.error}</p>
                <Button onClick={handleBack} variant="outline" data-testid="button-go-back">
                  Go Back
                </Button>
              </div>
            ) : (
              <div>
                <div className="text-center mb-8">
                  <div className="w-16 h-16 bg-gradient-to-br from-orange-400 to-green-500 rounded-full flex items-center justify-center mx-auto mb-4">
                    <span className="text-2xl">🎁</span>
                  </div>
                  <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
                    Complete Your Voucher Purchase
                  </h2>
                  <p className="text-gray-600 dark:text-gray-400">
                    Complete payment to send your gift voucher
                  </p>
                </div>

                {whatsappCheckout.error && (
                  <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4 mb-6">
                    <p className="text-yellow-800 dark:text-yellow-200 text-sm">
                      {whatsappCheckout.error}
                    </p>
                  </div>
                )}

                <div className="bg-gray-50 dark:bg-gray-700/50 rounded-xl p-6 mb-6">
                  <div className="flex justify-between items-center mb-4">
                    <span className="text-gray-600 dark:text-gray-400">Voucher Code</span>
                    <span className="font-mono font-bold text-orange-600">{whatsappCheckout.code}</span>
                  </div>
                  <div className="flex justify-between items-center mb-4">
                    <span className="text-gray-600 dark:text-gray-400">Amount</span>
                    <span className="text-2xl font-bold text-gray-900 dark:text-white">
                      ${whatsappCheckout.amount}
                    </span>
                  </div>
                  {whatsappCheckout.voucherData?.recipientEmail && (
                    <div className="flex justify-between items-center">
                      <span className="text-gray-600 dark:text-gray-400">Recipient</span>
                      <span className="text-gray-900 dark:text-white">
                        {whatsappCheckout.voucherData.recipientName || whatsappCheckout.voucherData.recipientEmail}
                      </span>
                    </div>
                  )}
                </div>

                <Button
                  onClick={handlePayNow}
                  disabled={whatsappCheckout.loading}
                  className="w-full bg-gradient-to-r from-orange-500 to-green-500 hover:from-orange-600 hover:to-green-600 text-white py-6 text-lg"
                  data-testid="button-pay-now"
                >
                  {whatsappCheckout.loading ? (
                    <>
                      <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                      Processing...
                    </>
                  ) : (
                    <>Pay ${whatsappCheckout.amount} Now</>
                  )}
                </Button>

                <p className="text-center text-xs text-gray-500 dark:text-gray-400 mt-4">
                  Secure payment powered by Stripe
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 via-white to-green-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 p-4 md:p-8">
      <div className="max-w-2xl mx-auto">
        <Button
          variant="ghost"
          onClick={handleBack}
          className="mb-4"
          data-testid="button-back-home"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back
        </Button>
        
        <BuyVoucherSection 
          onBack={handleBack} 
          onSuccess={handleSuccess} 
        />
      </div>
    </div>
  );
}
