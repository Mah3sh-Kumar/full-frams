/**
 * Deep link parsing utilities
 */

export interface DeepLinkResult {
  route: string;
  params: Record<string, string>;
}

/**
 * Parses a deep link URL and extracts route and parameters
 * @param url - Deep link URL to parse (e.g., "myapp://reset-password?token=abc123")
 * @returns Parsed route and parameters, or null if URL is malformed
 */
export const parseDeepLink = (url: string): DeepLinkResult | null => {
  try {
    // Handle empty or invalid URLs
    if (!url || typeof url !== 'string') {
      return null;
    }

    // Remove the scheme (e.g., "myapp://")
    const schemePattern = /^[a-zA-Z][a-zA-Z0-9+.-]*:\/\//;
    const urlWithoutScheme = url.replace(schemePattern, '');

    if (!urlWithoutScheme) {
      return null;
    }

    // Split route and query string
    const [route, queryString] = urlWithoutScheme.split('?');

    // Parse query parameters
    const params: Record<string, string> = {};
    if (queryString) {
      const pairs = queryString.split('&');
      for (const pair of pairs) {
        const [key, value] = pair.split('=');
        if (key) {
          params[decodeURIComponent(key)] = value ? decodeURIComponent(value) : '';
        }
      }
    }

    return {
      route: route || '',
      params,
    };
  } catch (error) {
    console.error('Error parsing deep link:', error);
    return null;
  }
};

/**
 * Extracts the reset token from a password reset deep link
 * @param url - Deep link URL
 * @returns Reset token if found, null otherwise
 */
export const extractResetToken = (url: string): string | null => {
  const parsed = parseDeepLink(url);
  if (!parsed || parsed.route !== 'reset-password') {
    return null;
  }
  return parsed.params.token || null;
};
