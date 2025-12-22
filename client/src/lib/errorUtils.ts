export function isUserFriendlyError(message: string): boolean {
  const technicalPatterns = [
    'JSON',
    'DOCTYPE',
    'Unexpected token',
    'Failed to fetch',
    'NetworkError',
    'TypeError:',
    'SyntaxError:',
    'ReferenceError:',
    'AbortError',
    'ECONNREFUSED',
    'ETIMEDOUT',
    'is not valid JSON',
  ];
  
  return !technicalPatterns.some(pattern => message.includes(pattern));
}

export function getUserFriendlyErrorMessage(error: Error | string, defaultMessage = "Something went wrong. Please try again."): string {
  const message = typeof error === 'string' ? error : error.message;
  
  if (isUserFriendlyError(message)) {
    return message;
  }
  
  if (message.includes('Failed to fetch') || message.includes('NetworkError') || message.includes('ECONNREFUSED')) {
    return "Unable to connect to our servers. Please check your internet connection and try again.";
  }
  
  if (message.includes('JSON') || message.includes('DOCTYPE') || message.includes('Unexpected token')) {
    return "Unable to process your request right now. Please try again in a moment.";
  }
  
  return defaultMessage;
}

export function shouldShowErrorToUser(error: Error | string): boolean {
  const message = typeof error === 'string' ? error : error.message;
  
  const adminOnlyPatterns = [
    'Database',
    'SQL',
    'connection pool',
    'Internal Server Error',
    'stack trace',
    'at Function.',
    'at Object.',
    'Cannot read property',
    'is not defined',
    'ENOENT',
    'permission denied',
  ];
  
  return !adminOnlyPatterns.some(pattern => message.includes(pattern));
}
