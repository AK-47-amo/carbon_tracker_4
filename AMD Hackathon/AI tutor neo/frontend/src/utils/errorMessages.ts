/**
 * Error message transformation utilities
 * 
 * Converts technical error messages to user-friendly text.
 */

/**
 * Technical terms that should not appear in user-facing error messages
 */
const TECHNICAL_TERMS = [
  'exception',
  'stack trace',
  'null pointer',
  'undefined',
  'TypeError',
  'ReferenceError',
  'SyntaxError',
  'NetworkError',
  'ECONNREFUSED',
  'ETIMEDOUT',
];

/**
 * Convert HTTP status code to user-friendly message
 */
export function getErrorMessageForStatus(status: number): string {
  switch (status) {
    case 400:
      return 'We couldn\'t understand that math expression. Please check your syntax.';
    case 404:
      return 'The requested resource was not found.';
    case 422:
      return 'Please check your input and try again.';
    case 500:
      return 'Something went wrong. Please try again later.';
    case 503:
      return 'The AI service is temporarily unavailable. Please try again in a moment.';
    default:
      return 'An unexpected error occurred. Please try again.';
  }
}

/**
 * Filter technical terms from error messages
 */
export function sanitizeErrorMessage(message: string): string {
  let sanitized = message;
  
  // Replace technical terms with generic phrases
  TECHNICAL_TERMS.forEach(term => {
    const regex = new RegExp(term, 'gi');
    sanitized = sanitized.replace(regex, 'error');
  });
  
  // Remove stack trace patterns
  sanitized = sanitized.replace(/at\s+\S+\s+\([^)]+\)/g, '');
  sanitized = sanitized.replace(/\s+at\s+.*/g, '');
  
  // Clean up multiple spaces
  sanitized = sanitized.replace(/\s+/g, ' ').trim();
  
  return sanitized;
}

/**
 * Check if error message contains technical jargon
 */
export function containsTechnicalTerms(message: string): boolean {
  return TECHNICAL_TERMS.some(term => 
    message.toLowerCase().includes(term.toLowerCase())
  );
}

/**
 * Get user-friendly error message from any error object
 */
export function getUserFriendlyError(error: any): string {
  if (typeof error === 'string') {
    return containsTechnicalTerms(error) 
      ? 'An error occurred. Please try again.'
      : error;
  }
  
  if (error?.message) {
    return containsTechnicalTerms(error.message)
      ? 'An error occurred. Please try again.'
      : error.message;
  }
  
  return 'An unexpected error occurred. Please try again.';
}
