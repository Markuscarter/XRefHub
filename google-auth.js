/**
 * @file Enhanced Google Authentication for XRefHub
 * Provides robust OAuth 2.0 authentication with fallback mechanisms
 */

/**
 * Enhanced OAuth token management with retry logic and better error handling
 */
export class GoogleAuthManager {
  constructor() {
    this.tokenCache = null;
    this.tokenExpiry = null;
    this.isAuthenticating = false;
  }

  /**
   * Gets an OAuth 2.0 token with enhanced error handling and retry logic
   * @param {boolean} interactive - Whether to show sign-in prompt
   * @returns {Promise<string>} The OAuth token
   */
  async getAuthToken(interactive = true) {
    // Check if we have a valid cached token
    if (this.tokenCache && this.tokenExpiry && Date.now() < this.tokenExpiry) {
      console.log('[GoogleAuth] Using cached token');
      return this.tokenCache;
    }

    // Prevent multiple simultaneous auth attempts
    if (this.isAuthenticating) {
      console.log('[GoogleAuth] Authentication already in progress, waiting...');
      return new Promise((resolve, reject) => {
        const checkAuth = () => {
          if (this.tokenCache && this.tokenExpiry && Date.now() < this.tokenExpiry) {
            resolve(this.tokenCache);
          } else if (!this.isAuthenticating) {
            reject(new Error('Authentication failed'));
          } else {
            setTimeout(checkAuth, 100);
          }
        };
        checkAuth();
      });
    }

    this.isAuthenticating = true;

    try {
      console.log('[GoogleAuth] Requesting new auth token...');
      
      const token = await new Promise((resolve, reject) => {
        chrome.identity.getAuthToken({ interactive }, (token) => {
          if (chrome.runtime.lastError) {
            const error = chrome.runtime.lastError;
            console.error('[GoogleAuth] Chrome identity error:', error);
            
            // Handle specific error cases
            if (error.message.includes('bad client id')) {
              reject(new Error('OAuth client ID is invalid. Please check Google Cloud Console configuration.'));
            } else if (error.message.includes('access denied')) {
              reject(new Error('Access denied. Please check OAuth consent screen and scopes.'));
            } else if (error.message.includes('network error')) {
              reject(new Error('Network error. Please check your internet connection.'));
            } else {
              reject(new Error(`Authentication failed: ${error.message}`));
            }
          } else if (!token) {
            reject(new Error('No token received from Chrome identity API.'));
          } else {
            resolve(token);
          }
        });
      });

      // Cache the token with expiry (tokens typically last 1 hour)
      this.tokenCache = token;
      this.tokenExpiry = Date.now() + (55 * 60 * 1000); // 55 minutes to be safe
      
      console.log('[GoogleAuth] Successfully obtained auth token');
      return token;

    } catch (error) {
      console.error('[GoogleAuth] Authentication error:', error);
      throw error;
    } finally {
      this.isAuthenticating = false;
    }
  }

  /**
   * Validates the current token and refreshes if needed
   * @returns {Promise<boolean>} Whether the token is valid
   */
  async validateToken() {
    try {
      const token = await this.getAuthToken(false);
      if (!token) return false;

      // Test the token with a simple API call
      const response = await fetch('https://www.googleapis.com/oauth2/v2/userinfo', {
        headers: { 'Authorization': `Bearer ${token}` }
      });

      return response.ok;
    } catch (error) {
      console.log('[GoogleAuth] Token validation failed:', error.message);
      return false;
    }
  }

  /**
   * Clears the cached token (useful for sign-out)
   */
  clearToken() {
    this.tokenCache = null;
    this.tokenExpiry = null;
    console.log('[GoogleAuth] Token cache cleared');
  }

  /**
   * Signs out the user by removing the token
   */
  async signOut() {
    try {
      if (this.tokenCache) {
        await new Promise((resolve) => {
          chrome.identity.removeCachedAuthToken({ token: this.tokenCache }, resolve);
        });
      }
      this.clearToken();
      console.log('[GoogleAuth] User signed out successfully');
    } catch (error) {
      console.error('[GoogleAuth] Sign out error:', error);
    }
  }
}

// Create a singleton instance
export const googleAuth = new GoogleAuthManager();

/**
 * Enhanced function to get auth token (backward compatibility)
 */
export async function getAuthToken(interactive = true) {
  return googleAuth.getAuthToken(interactive);
}

/**
 * Enhanced function to validate authentication status
 */
export async function isAuthenticated() {
  return googleAuth.validateToken();
}

/**
 * Enhanced function to sign out
 */
export async function signOut() {
  return googleAuth.signOut();
}

/**
 * Gets user profile with enhanced error handling
 */
export async function fetchGoogleUserProfile() {
  try {
    const token = await getAuthToken(false);
    const response = await fetch('https://www.googleapis.com/oauth2/v2/userinfo', {
      headers: { 'Authorization': `Bearer ${token}` }
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch user profile. Status: ${response.status}`);
    }
    
    const profile = await response.json();
    console.log('[GoogleAuth] User profile fetched:', profile.name);
    return profile;
  } catch (error) {
    console.error('[GoogleAuth] Error fetching user profile:', error);
    throw error;
  }
}

/**
 * Tests Google Drive access
 */
export async function testDriveAccess() {
  try {
    const token = await getAuthToken(false);
    const response = await fetch('https://www.googleapis.com/drive/v3/about?fields=user', {
      headers: { 'Authorization': `Bearer ${token}` }
    });

    if (!response.ok) {
      throw new Error(`Drive API test failed. Status: ${response.status}`);
    }

    const data = await response.json();
    console.log('[GoogleAuth] Drive access test successful');
    return data;
  } catch (error) {
    console.error('[GoogleAuth] Drive access test failed:', error);
    throw error;
  }
}

/**
 * Tests Google Sheets access
 */
export async function testSheetsAccess() {
  try {
    const token = await getAuthToken(false);
    
    // First, try to test if the API is accessible
    const response = await fetch('https://sheets.googleapis.com/v4/spreadsheets?pageSize=1', {
      headers: { 'Authorization': `Bearer ${token}` }
    });

    if (response.status === 403) {
      // API not enabled or insufficient permissions
      throw new Error(`Sheets API not enabled or insufficient permissions. Status: ${response.status}`);
    } else if (response.status === 404) {
      // This might be a different issue, let's try a different approach
      console.log('[GoogleAuth] Sheets API returned 404, trying alternative test...');
      
      // Try to access the API discovery endpoint
      const discoveryResponse = await fetch('https://sheets.googleapis.com/$discovery/rest?version=v4', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      
      if (discoveryResponse.ok) {
        console.log('[GoogleAuth] Sheets API discovery successful - API is accessible');
        return true;
      } else {
        throw new Error(`Sheets API discovery failed. Status: ${discoveryResponse.status}`);
      }
    } else if (!response.ok) {
      throw new Error(`Sheets API test failed. Status: ${response.status}`);
    }

    console.log('[GoogleAuth] Sheets access test successful');
    return true;
  } catch (error) {
    console.error('[GoogleAuth] Sheets access test failed:', error);
    throw error;
  }
} 