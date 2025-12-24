/**
 * Converts backend/API errors to friendly user-facing messages
 * Hides technical details and shows helpful, conversational messages
 */

export function getFriendlyErrorMessage(error: any): string {
  // If it's already a friendly message, return it
  if (typeof error === 'string' && !error.includes('Error') && !error.includes('failed') && error.length < 100) {
    return error;
  }

  // Extract error details
  const message = error?.message || error?.error || String(error) || '';
  const status = error?.status || error?.statusCode || 0;

  // Network/connection errors
  if (message.toLowerCase().includes('network') || message.toLowerCase().includes('fetch')) {
    return 'Connection error. Please check your internet and try again.';
  }

  // Authentication errors
  if (status === 401 || message.toLowerCase().includes('unauthorized') || message.toLowerCase().includes('unauthenticated')) {
    return 'Your session has expired. Please log in again.';
  }

  // Permission errors
  if (status === 403 || message.toLowerCase().includes('forbidden')) {
    return "You don't have permission to do this.";
  }

  // Not found errors
  if (status === 404 || message.toLowerCase().includes('not found')) {
    return 'The item you\'re looking for could not be found.';
  }

  // Validation/bad request errors
  if (status === 400 || message.toLowerCase().includes('invalid') || message.toLowerCase().includes('validation')) {
    return 'Please check your information and try again.';
  }

  // File/upload errors
  if (message.toLowerCase().includes('file') || message.toLowerCase().includes('upload') || message.toLowerCase().includes('size')) {
    return 'There was a problem with your file. Please try a different file.';
  }

  // Conflict/duplicate errors
  if (status === 409 || message.toLowerCase().includes('already exists') || message.toLowerCase().includes('duplicate')) {
    return 'This item already exists. Please choose a different name or value.';
  }

  // Payment/transaction errors
  if (message.toLowerCase().includes('payment') || message.toLowerCase().includes('transaction') || message.toLowerCase().includes('stripe') || message.toLowerCase().includes('paypal')) {
    // Check for specific payment error codes/messages
    if (message.toLowerCase().includes('timeout') || message.toLowerCase().includes('processing timeout')) {
      return 'Payment is taking longer than expected. Please check your account to see if it was processed, then try again.';
    }
    if (message.toLowerCase().includes('already processed') || message.toLowerCase().includes('unexpected state')) {
      return 'This payment has already been processed. Please check your account dashboard.';
    }
    if (message.toLowerCase().includes('declined') || message.toLowerCase().includes('card')) {
      return 'Sorry, we couldn\'t process your payment. Please try a different payment method or contact your bank.';
    }
    if (message.toLowerCase().includes('insufficient') || message.toLowerCase().includes('limit')) {
      return 'Sorry, there isn\'t enough balance for this transaction. Please check your account.';
    }
    // Generic payment error
    return 'Sorry, we had a problem processing your payment. Please try again.';
  }

  // Server errors
  if (status >= 500 || message.toLowerCase().includes('server error')) {
    return 'Something went wrong on our end. Please try again in a moment.';
  }

  // Too many requests
  if (status === 429 || message.toLowerCase().includes('too many')) {
    return 'You\'re doing that too often. Please wait a moment and try again.';
  }

  // Generic fallback for any remaining error
  return 'Something went wrong. Please try again.';
}

/**
 * Log error for debugging while showing friendly message to user
 */
export function logError(error: any, context: string = '') {
  // In development, log the full error
  if (process.env.NODE_ENV === 'development') {
    console.error(`[${context}]`, error);
  }
  // In production, just log a simple message
  else {
    console.error(`Error in ${context}`);
  }
}

/**
 * Handle API response errors
 */
export function getApiErrorMessage(response: any): string {
  if (response?.error) {
    return getFriendlyErrorMessage(response.error);
  }
  if (response?.message) {
    return getFriendlyErrorMessage(response.message);
  }
  return getFriendlyErrorMessage('Something went wrong. Please try again.');
}
