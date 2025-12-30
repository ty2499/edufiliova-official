/**
 * Maps technical payment error messages to user-friendly messages
 * This ensures customers see helpful messages instead of developer errors
 */

export function getFriendlyErrorMessage(error: any): string {
  if (!error) {
    return 'Something went wrong. Please refresh your browser and try again.';
  }

  const errorMessage = error?.message?.toLowerCase() || error?.toString?.()?.toLowerCase() || '';
  const errorCode = error?.code || error?.response?.status;

  // Connection/Network errors (applies to all gateways)
  if (errorMessage.includes('network') || 
      errorMessage.includes('timeout') || 
      errorMessage.includes('offline') ||
      errorMessage.includes('econnrefused') ||
      errorMessage.includes('enotfound') ||
      errorCode === 0 || // Network error
      errorCode === 'ENOTFOUND' ||
      errorCode === 'ECONNREFUSED') {
    return 'Unable to connect to payment service. Please check your internet connection and refresh your browser, then try again.';
  }

  // DodoPayments errors
  if (errorMessage.includes('dodo') || errorMessage.includes('dodopay')) {
    // Connection/API issues
    if (errorMessage.includes('failed to fetch') ||
        errorMessage.includes('api') ||
        errorMessage.includes('bearer') ||
        errorMessage.includes('initialization')) {
      return 'Cannot connect to card payment service. Please refresh your browser and check your internet connection.';
    }
    if (errorMessage.includes('currency') || errorMessage.includes('product')) {
      return 'Payment system configuration issue. Please contact support.';
    }
    if (errorMessage.includes('response')) {
      return 'Card payment service is temporarily unavailable. Please try again in a moment or use another payment method.';
    }
    return 'Card payment failed. Please refresh your browser and try again, or use another payment method.';
  }

  // Stripe errors
  if (errorMessage.includes('stripe') || errorMessage.includes('card element')) {
    if (errorMessage.includes('declined')) {
      return 'Your card was declined. Please check your card details and try again.';
    }
    if (errorMessage.includes('expired')) {
      return 'Your card has expired. Please use a valid card.';
    }
    if (errorMessage.includes('insufficient')) {
      return 'Your card does not have sufficient funds. Please try another card.';
    }
    return 'Card payment failed. Please check your card details and try again.';
  }

  // PayPal errors
  if (errorMessage.includes('paypal')) {
    if (errorMessage.includes('approval') || errorMessage.includes('not found')) {
      return 'PayPal approval link not available. Please try again.';
    }
    return 'PayPal payment failed. Please try again or use another payment method.';
  }

  // Wallet/Balance errors
  if (errorMessage.includes('wallet') || errorMessage.includes('balance') || errorMessage.includes('insufficient')) {
    if (errorMessage.includes('insufficient') || errorMessage.includes('not enough')) {
      return 'You don\'t have enough balance in your wallet. Please add funds or use another payment method.';
    }
    return 'Wallet payment failed. Please try again.';
  }

  // EcoCash errors
  if (errorMessage.includes('ecocash') || errorMessage.includes('phone')) {
    if (errorMessage.includes('phone') || errorMessage.includes('digits')) {
      return 'Please enter a valid phone number.';
    }
    if (errorMessage.includes('declined') || errorMessage.includes('failed')) {
      return 'Payment was declined. Please check your phone number and try again.';
    }
    if (errorMessage.includes('timeout') || errorMessage.includes('verify')) {
      return 'Unable to verify payment. Please contact support if the payment was completed.';
    }
    return 'EcoCash payment failed. Please try again.';
  }

  // Paystack errors
  if (errorMessage.includes('paystack')) {
    return 'Card payment failed. Please check your card details and try again.';
  }

  // Additional PayPal connection issues
  if (errorMessage.includes('paypal') && (errorMessage.includes('connect') || errorMessage.includes('fetch'))) {
    return 'Cannot reach PayPal service. Please refresh your browser and check your internet, then try again.';
  }

  // Verification/Confirmation errors
  if (errorMessage.includes('verification') || errorMessage.includes('confirm') || errorMessage.includes('enroll')) {
    return 'Payment was processed but enrollment failed. Please contact support.';
  }

  // Generic fallback with actionable advice
  return 'Payment failed. Please refresh your browser, check your internet connection, and try again. If the problem persists, contact support.';
}

/**
 * Sanitizes error messages by removing sensitive information
 */
export function sanitizeErrorMessage(error: any): string {
  const message = error?.message || error?.toString() || 'Unknown error';
  
  // Remove API keys, URLs with credentials, etc.
  let sanitized = message
    .replace(/bearer\s+[a-z0-9_-]+/gi, '[REDACTED]')
    .replace(/api[_-]key[=:]\s*[a-z0-9_-]+/gi, '[REDACTED]')
    .replace(/(https?:\/\/[^\s]+)([a-z0-9]{32,})/gi, '[REDACTED]');

  return sanitized;
}

/**
 * Logs error for debugging while showing friendly message to user
 */
export function handlePaymentError(error: any, context: string = 'Payment'): string {
  console.error(`[${context}] Technical Error:`, {
    message: error?.message,
    code: error?.code,
    response: error?.response?.data,
    fullError: error
  });

  return getFriendlyErrorMessage(error);
}
