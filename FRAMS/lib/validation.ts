/**
 * Validation utilities for forms and user input
 */

/**
 * Validates email format
 * @param email - Email string to validate
 * @returns true if email format is valid, false otherwise
 */
export const isValidEmail = (email: string): boolean => {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
};

/**
 * Password validation requirements
 */
export interface PasswordValidation {
  isValid: boolean;
  errors: string[];
}

/**
 * Validates password meets minimum requirements
 * @param password - Password string to validate
 * @returns Validation result with errors if any
 */
export const validatePassword = (password: string): PasswordValidation => {
  const errors: string[] = [];

  if (!password) {
    errors.push('Password is required');
  } else if (password.length < 8) {
    errors.push('Password must be at least 8 characters long');
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
};

/**
 * Password strength levels
 */
export type PasswordStrength = 'weak' | 'medium' | 'strong';

/**
 * Calculates password strength based on various criteria
 * @param password - Password string to evaluate
 * @returns Strength level (weak, medium, strong)
 */
export const calculatePasswordStrength = (password: string): PasswordStrength => {
  if (!password || password.length < 8) {
    return 'weak';
  }

  let score = 0;

  // Length bonus
  if (password.length >= 12) score += 2;
  else if (password.length >= 10) score += 1;

  // Character variety
  if (/[a-z]/.test(password)) score += 1; // lowercase
  if (/[A-Z]/.test(password)) score += 1; // uppercase
  if (/[0-9]/.test(password)) score += 1; // numbers
  if (/[^a-zA-Z0-9]/.test(password)) score += 1; // special chars

  // Determine strength
  if (score >= 5) return 'strong';
  if (score >= 3) return 'medium';
  return 'weak';
};
