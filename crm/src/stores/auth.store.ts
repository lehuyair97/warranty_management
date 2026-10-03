import { proxy } from 'valtio';
import { authService } from '@/services/auth.service';
import { EmployeeRole, UserProfile } from '@/types';

interface AuthState {
  user: UserProfile | null;
  accessToken: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  isInitialized: boolean;
}

let initPromise: Promise<void> | null = null;

/**
 * Valtio reactive proxy store for authentication state.
 * In-memory only state management; session persistence is handled via HttpOnly Cookies.
 */
export const authState = proxy<AuthState>({
  user: null,
  accessToken: null,
  isAuthenticated: false,
  isLoading: true,
  isInitialized: false,
});

/**
 * Auth actions for managing login session, tokens, and role permissions.
 */
export const authActions = {
  /**
   * Initializes session on browser mount.
   * Performs silent token exchange with backend using HttpOnly cookie sent via HTTP headers.
   */
  async init(): Promise<void> {
    if (typeof window === 'undefined') {
      return;
    }

    if (authState.isInitialized && !authState.isLoading) {
      return;
    }

    if (initPromise) {
      return initPromise;
    }

    initPromise = (async () => {
      authState.isLoading = true;

      try {
        const refreshResult = await authService.refresh();
        if (refreshResult && refreshResult.accessToken && refreshResult.user) {
          authState.accessToken = refreshResult.accessToken;
          authState.user = refreshResult.user;
          authState.isAuthenticated = true;
        } else {
          authState.isAuthenticated = false;
          authState.user = null;
          authState.accessToken = null;
        }
      } catch {
        // No active or valid HttpOnly refresh cookie present
        authState.isAuthenticated = false;
        authState.user = null;
        authState.accessToken = null;
      } finally {
        authState.isLoading = false;
        authState.isInitialized = true;
      }
    })();

    try {
      await initPromise;
    } finally {
      initPromise = null;
    }
  },

  /**
   * Saves authenticated user session and in-memory access token.
   */
  login(user: UserProfile, token: string) {
    authState.user = user;
    authState.accessToken = token;
    authState.isAuthenticated = true;
    authState.isLoading = false;
    authState.isInitialized = true;
  },

  /**
   * Updates only the access token in memory following silent rotation.
   */
  updateToken(token: string) {
    authState.accessToken = token;
  },

  /**
   * Updates authenticated user profile details in memory.
   */
  updateUser(user: UserProfile) {
    authState.user = user;
  },

  /**
   * Clears session upon logout and invalidates backend HttpOnly refresh cookie.
   */
  logout() {
    // Notify backend to clear HttpOnly cookie and database refresh token hash
    authService.logout().catch(() => {
      // Ignore network errors on logout
    });

    authState.user = null;
    authState.accessToken = null;
    authState.isAuthenticated = false;
    authState.isLoading = false;
    authState.isInitialized = true;
  },

  /**
   * Pure role-check helper.
   */
  hasRole(...roles: EmployeeRole[]): boolean {
    if (!authState.user) {
      return false;
    }
    return roles.includes(authState.user.role);
  },
};


