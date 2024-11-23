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
  shouldUseRedirect: () => {
    const isMobile = /Mobi|Android/i.test(navigator.userAgent);
    const isSafari = /^((?!chrome|android).)*safari/i.test(navigator.userAgent);
    const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent);
    const isSmallScreen = window.innerWidth < 768;
    
    // For debugging
    console.log('Browser Detection:', {
      userAgent: navigator.userAgent,
      isMobile,
      isSafari,
      isIOS,
      isSmallScreen,
      platform: navigator.platform,
      vendor: navigator.vendor,
      screenWidth: window.innerWidth
    });
    
    // Use redirect for:
    // 1. Mobile devices
    // 2. iOS devices
    // 3. Safari (not Chrome)
    // 4. Small screens
    return isMobile || isIOS || isSmallScreen || (isSafari && !navigator.userAgent.includes('Chrome'));
  }
} as const;
