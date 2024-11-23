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
    const isMobile = /Mobi|Android/i.test(navigator.userAgent);
    const isSafari = /^((?!chrome|android).)*safari/i.test(navigator.userAgent);
    const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent);
    
    // For debugging
    console.log('Browser Detection:', {
      userAgent: navigator.userAgent,
      isMobile,
      isSafari,
      isIOS,
      platform: navigator.platform,
      vendor: navigator.vendor
    });
    
    // Only use redirect for mobile devices and Safari
    return isMobile || isIOS || (isSafari && !navigator.userAgent.includes('Chrome'));
  }
} as const;
