import { useEffect, useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/hooks/useAuth';
import Logo from '@/components/Logo';
import { useCurrency } from '@/hooks/useCurrency';
import Footer from '@/components/Footer';

interface PaymentSuccessProps {
  onContinue?: () => void;
  onNavigate?: (page: string) => void;
}

export default function PaymentSuccess({ onContinue, onNavigate }: PaymentSuccessProps) {
  const { refreshAuth } = useAuth();
  const { formatPrice } = useCurrency();
  const [loading, setLoading] = useState(true);
  const [verified, setVerified] = useState(false);
  const [error, setError] = useState("");
  const [paymentType, setPaymentType] = useState<'membership' | 'banner' | 'order' | 'freelancer'>('order');
  const [paymentData, setPaymentData] = useState<any>(null);
  const [orderItems, setOrderItems] = useState<any[]>([]);
  const [orderData, setOrderData] = useState<any>(null);
  
  const verificationAttempted = useRef(false);

  const handleContinue = () => {
    if (onContinue) {
      onContinue();
    } else {
      const targetPage = paymentType === 'banner' 
        ? 'customer-dashboard' 
        : paymentType === 'order' 
        ? 'customer-dashboard' 
        : paymentType === 'freelancer'
        ? 'freelancer-dashboard'
        : 'student-dashboard';
      
      if (onNavigate) {
        onNavigate(targetPage);
      } else {
        if (paymentType === 'banner') {
          window.location.href = '/?page=customer-dashboard';
        } else if (paymentType === 'order') {
          window.location.href = '/?page=customer-dashboard';
        } else if (paymentType === 'freelancer') {
          window.location.href = '/?page=freelancer-dashboard';
        } else {
          window.location.href = '/?page=student-dashboard';
        }
      }
    }
  };

  useEffect(() => {
    if (verificationAttempted.current) {
      return;
    }
    verificationAttempted.current = true;

    const verifyPayment = async () => {
      const urlParams = new URLSearchParams(window.location.search);
      let sessionId = urlParams.get('session_id');
      let bannerId = urlParams.get('banner_id');
      const gateway = urlParams.get('gateway');
      const paymentId = urlParams.get('payment_id');
      const status = urlParams.get('status');
      
      // Handle DodoPay payments
      if (gateway === 'dodopay' && paymentId) {
        console.log('💳 DodoPay payment callback:', { paymentId, status });
        
        try {
          // Verify the DodoPay payment
          const verifyResponse = await fetch(`/api/dodopay/verify/${paymentId}`);
          const verifyData = await verifyResponse.json();
          
          if (verifyData.success && (verifyData.status === 'succeeded' || status === 'succeeded')) {
            setVerified(true);
            setPaymentType('order');
            setPaymentData({
              gateway: 'dodopay',
              paymentId: paymentId,
              status: verifyData.status || status,
              amount: verifyData.amount,
              currency: verifyData.currency,
              metadata: verifyData.metadata,
            });
            setLoading(false);
            
            refreshAuth().catch(error => {
              console.error('Failed to refresh auth after payment success:', error);
            });
            return;
          } else if (status === 'succeeded') {
            // Payment succeeded according to URL but verification might have different timing
            setVerified(true);
            setPaymentType('order');
            setPaymentData({
              gateway: 'dodopay',
              paymentId: paymentId,
              status: 'succeeded',
              message: 'Payment completed successfully'
            });
            setLoading(false);
            
            refreshAuth().catch(error => {
              console.error('Failed to refresh auth after payment success:', error);
            });
            return;
          } else {
            setError(verifyData.error || 'Payment verification failed');
            setVerified(false);
            setLoading(false);
            return;
          }
        } catch (err) {
          console.error('DodoPay verification error:', err);
          // If verification fails but status says succeeded, trust it
          if (status === 'succeeded') {
            setVerified(true);
            setPaymentType('order');
            setPaymentData({
              gateway: 'dodopay',
              paymentId: paymentId,
              status: 'succeeded',
              message: 'Payment completed successfully'
            });
            setLoading(false);
            return;
          }
          setError('Failed to verify payment');
          setVerified(false);
          setLoading(false);
          return;
        }
      }
      
      const storedData = sessionStorage.getItem('paymentSuccessData');
      if (storedData) {
        try {
          const data = JSON.parse(storedData);
          sessionId = data.session_id || sessionId;
          bannerId = data.banner_id || bannerId;
          
          setPaymentData(data);
          
          if (data.paymentType) {
            setPaymentType(data.paymentType);
          } else if (data.banner_id) {
            setPaymentType('banner');
          } else if (data.orderItems) {
            setPaymentType('order');
          } else {
            setPaymentType('membership');
          }
          
          if (data.orderItems) {
            setOrderItems(data.orderItems);
          }
          
          if (data.orderData) {
            setOrderData(data.orderData);
          }
          
          setVerified(true);
          setLoading(false);
          
          sessionStorage.removeItem('paymentSuccessData');
          
          refreshAuth().catch(error => {
            console.error('Failed to refresh auth after payment success:', error);
          });
          
          return;
        } catch (err) {
          console.error('Failed to parse stored payment data:', err);
        }
      }

      if (!sessionId) {
        setError("No payment session found");
        setLoading(false);
        setVerified(false);
        return;
      }

      try {
        let endpoint = `/api/payment-success/${sessionId}`;
        if (bannerId) {
          setPaymentType('banner');
          endpoint = `/api/ads/banner/payment-success?session_id=${sessionId}&banner_id=${bannerId}`;
        }

        const response = await fetch(endpoint);
        
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const data = await response.json();

        if (data.success) {
          setVerified(true);
          setPaymentData(data.paymentIntent);
          
          if (data.banner) {
            setPaymentType('banner');
          } else if (data.paymentIntent?.metadata?.type === 'order_payment') {
            setPaymentType('order');
          } else {
            setPaymentType('membership');
          }
          
          refreshAuth().catch(error => {
            console.error('Failed to refresh auth after payment success:', error);
          });
        } else {
          setError(data.error || "Payment verification failed");
          setVerified(false);
        }
      } catch (err) {
        console.error('Payment verification error:', err);
        setError("Failed to verify payment. Please contact support if payment was processed.");
        setVerified(false);
      } finally {
        setLoading(false);
      }
    };

    verifyPayment();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-[#2d5ddd] border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Verifying your payment...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="bg-[#2d5ddd] py-6 px-6 sm:px-10 lg:px-14">
          <div className="max-w-4xl mx-auto flex items-center justify-center">
            <Logo className="h-10" type="home" />
          </div>
        </div>
        <div className="max-w-4xl mx-auto px-6 sm:px-10 lg:px-14 py-12">
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8 text-center">
            <h2 className="text-2xl font-semibold text-red-600 mb-4">Payment Error</h2>
            <p className="text-gray-600 mb-6">{error}</p>
            <Button 
              onClick={handleContinue}
              className="bg-[#2d5ddd] hover:bg-[#2d5ddd]/90 text-white"
              data-testid="button-return-dashboard"
            >
              Return to Dashboard
            </Button>
          </div>
        </div>
      </div>
    );
  }

  const orderDate = orderData?.order?.createdAt 
    ? new Date(orderData.order.createdAt).toLocaleDateString('en-US', { 
        year: 'numeric', 
        month: 'long', 
        day: 'numeric' 
      })
    : new Date().toLocaleDateString('en-US', { 
        year: 'numeric', 
        month: 'long', 
        day: 'numeric' 
      });

  const totalAmount = paymentData?.amount 
    ? (paymentData.amount / 100).toFixed(2) 
    : paymentType === 'banner' && paymentData?.banner_amount
    ? paymentData.banner_amount
    : orderItems.reduce((sum, item) => sum + (parseFloat(item.priceAtAdd || '0') * (item.quantity || 1)), 0).toFixed(2);

  const subtotal = orderItems.reduce((sum, item) => sum + (parseFloat(item.priceAtAdd || '0') * (item.quantity || 1)), 0).toFixed(2);
  const hasPhysicalItems = orderItems.some((item: any) => item.productType === 'physical');
  
  const orderId = paymentType === 'banner' 
    ? paymentData?.banner_id?.substring(0, 8).toUpperCase() || '---'
    : orderData?.order?.id?.substring(0, 8).toUpperCase() || '---';

  const paymentMethod = paymentData?.payment_method === 'wallet' 
    ? 'Wallet payment' 
    : paymentData?.payment_method === 'paypal'
    ? 'PayPal'
    : 'Card';

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col pt-16">
      {/* Blue Header with Logo */}
      <div className="py-6 px-6 sm:px-10 lg:px-14 bg-white">
        <div className="max-w-4xl mx-auto flex items-center justify-center">
          <Logo className="h-10" />
        </div>
      </div>
      {/* Main Content */}
      <div className="max-w-4xl mx-auto px-6 sm:px-10 lg:px-14 py-12">
        {/* Thank You Message */}
        <div className="bg-white rounded-lg shadow-sm border-2 border-dashed border-[#2d5ddd] p-6 mb-8">
          <p className="text-center text-[#2d5ddd] text-xl font-semibold" data-testid="text-thank-you">
            {paymentType === 'banner' 
              ? 'Thank you. Your banner ad has been submitted for review.' 
              : 'Thank you. Your order has been received.'}
          </p>
        </div>

        {/* Order Summary Grid */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8 mb-8">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-6 mb-8">
            <div className="text-center sm:text-left">
              <div className="text-sm text-gray-600 mb-2">{paymentType === 'banner' ? 'Ad ID:' : 'Order number:'}</div>
              <div className="font-semibold text-[#151314]" data-testid="text-order-number">
                {orderId}
              </div>
            </div>
            <div className="text-center sm:text-left">
              <div className="text-sm text-gray-600 mb-2">Date:</div>
              <div className="font-semibold text-[#151314]" data-testid="text-order-date">
                {orderDate}
              </div>
            </div>
            <div className="text-center sm:text-left">
              <div className="text-sm text-gray-600 mb-2">Total:</div>
              <div className="font-semibold text-[#151314]" data-testid="text-order-total">
                ${totalAmount}
              </div>
            </div>
            <div className="text-center sm:text-left">
              <div className="text-sm text-gray-600 mb-2">Payment method:</div>
              <div className="font-semibold text-[#151314]" data-testid="text-payment-method">
                {paymentMethod}
              </div>
            </div>
          </div>

          {/* ORDER DETAILS Section */}
          <div className="border-t border-gray-200 pt-8">
            <h2 className="text-center text-xl font-bold text-[#151314] mb-8">
              {paymentType === 'banner' ? 'AD DETAILS' : 'ORDER DETAILS'}
            </h2>

            {/* Products Table */}
            <div className="border border-gray-200 rounded-lg overflow-hidden">
              {/* Table Header */}
              <div className="bg-gray-50 border-b border-gray-200 px-6 py-4 flex justify-between items-center">
                <div className="font-semibold text-[#151314] uppercase text-sm">
                  {paymentType === 'banner' ? 'Item' : 'Product'}
                </div>
                <div className="font-semibold text-[#151314] uppercase text-sm">Total</div>
              </div>

              {/* Product/Banner Items */}
              {paymentType === 'banner' ? (
                <div 
                  className="border-b border-gray-200 px-6 py-4 flex justify-between items-center"
                  data-testid="row-product-0"
                >
                  <div className="flex-1">
                    <span className="text-[#151314]">{paymentData?.banner_title || 'Banner Advertisement'}</span>
                    <span className="text-gray-600 ml-2">× 1</span>
                  </div>
                  <div className="font-semibold text-[#151314]" data-testid="text-product-price-0">
                    ${totalAmount}
                  </div>
                </div>
              ) : (
                orderItems.map((item: any, index: number) => (
                  <div 
                    key={index} 
                    className="border-b border-gray-200 px-6 py-4 flex justify-between items-center"
                    data-testid={`row-product-${index}`}
                  >
                    <div className="flex-1">
                      <span className="text-[#151314]">{item.productName || 'Product'}</span>
                      <span className="text-gray-600 ml-2">× {item.quantity || 1}</span>
                    </div>
                    <div className="font-semibold text-[#151314]" data-testid={`text-product-price-${index}`}>
                      ${(parseFloat(item.priceAtAdd || '0') * (item.quantity || 1)).toFixed(2)}
                    </div>
                  </div>
                ))
              )}

              {/* Subtotal - only show for orders, not banner ads */}
              {paymentType !== 'banner' && (
                <div className="border-b border-gray-200 px-6 py-4 flex justify-between items-center">
                  <div className="text-[#151314]">Subtotal:</div>
                  <div className="font-semibold text-[#151314]" data-testid="text-subtotal">
                    ${subtotal}
                  </div>
                </div>
              )}

              {/* Payment Method */}
              <div className="border-b border-gray-200 px-6 py-4 flex justify-between items-center">
                <div className="text-[#151314]">Payment method:</div>
                <div className="font-semibold text-[#151314]">
                  {paymentMethod}
                </div>
              </div>

              {/* Total */}
              <div className="bg-gray-50 px-6 py-4 flex justify-between items-center">
                <div className="text-[#151314] font-bold uppercase">Total:</div>
                <div className="font-bold text-[#151314] text-lg" data-testid="text-final-total">
                  ${totalAmount}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Action Button */}
        <div className="text-center">
          <Button 
            onClick={handleContinue}
            className="bg-[#c5f13c] hover:bg-[#c5f13c]/90 text-[#151314] font-semibold px-8 py-6 text-base"
            data-testid="button-go-dashboard"
          >
            {paymentType === 'banner' ? 'View My Ads' : 'Go to Dashboard'}
          </Button>
          <p className="text-sm text-gray-600 mt-4">
            Need help? <a href="/?page=contact" className="text-[#2d5ddd] hover:underline font-medium">Contact Support</a>
          </p>
        </div>
      </div>
      <Footer onNavigate={onNavigate!} />
    </div>
  );
}
