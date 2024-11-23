export const AUTH_ERROR_CODES = {
  POPUP_BLOCKED: 'auth/popup-blocked',
  POPUP_CLOSED_BY_USER: 'auth/popup-closed-by-user',
  NETWORK_REQUEST_FAILED: 'auth/network-request-failed',
  TOO_MANY_REQUESTS: 'auth/too-many-requests',
  USER_DISABLED: 'auth/user-disabled',
  USER_NOT_FOUND: 'auth/user-not-found',
  WRONG_PASSWORD: 'auth/wrong-password',
  INVALID_EMAIL: 'auth/invalid-email',
  ACCOUNT_EXISTS_WITH_DIFFERENT_CREDENTIAL: 'auth/account-exists-with-different-credential'
} as const;

export const BROWSER_DETECTION = {
  isMobile: () => /Mobi|Android/i.test(navigator.userAgent),
  isSafari: () => /^((?!chrome|android).)*safari/i.test(navigator.userAgent),
  shouldUseRedirect: () => {
    // For debugging
    console.log('UserAgent:', navigator.userAgent);
    console.log('Is Mobile:', /Mobi|Android/i.test(navigator.userAgent));
    console.log('Is Safari:', /^((?!chrome|android).)*safari/i.test(navigator.userAgent));
    // Default to popup for desktop browsers except Safari
    return /Mobi|Android/i.test(navigator.userAgent) || 
           /^((?!chrome|android).)*safari/i.test(navigator.userAgent);
  }
} as const;
