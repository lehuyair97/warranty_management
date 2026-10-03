import { proxy } from 'valtio';
import { EmployeeRole, UserProfile } from '@/types';

interface AuthState {
  user: UserProfile | null;
  accessToken: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
}

const STORAGE_KEY_USER = 'uit_wm_user';
const STORAGE_KEY_TOKEN = 'uit_wm_token';

/**
 * Valtio reactive proxy store for authentication state.
 */
export const authState = proxy<AuthState>({
  user: null,
  accessToken: null,
  isAuthenticated: false,
  isLoading: true,
});

/**
 * Auth actions for managing login session, tokens, and role permissions.
 */
export const authActions = {
  /**
   * Initializes session from client storage on browser mount.
   */
  init() {
    if (typeof window === 'undefined') {
      return;
    }

    try {
      const storedToken = localStorage.getItem(STORAGE_KEY_TOKEN);
      const storedUser = localStorage.getItem(STORAGE_KEY_USER);

      if (storedToken && storedUser) {
        authState.accessToken = storedToken;
        authState.user = JSON.parse(storedUser);
        authState.isAuthenticated = true;
      }
    } catch {
      // Ignore corrupted localstorage
      localStorage.removeItem(STORAGE_KEY_TOKEN);
      localStorage.removeItem(STORAGE_KEY_USER);
    } finally {
      authState.isLoading = false;
    }
  },

  /**
   * Saves authenticated user session and access token.
   */
  login(user: UserProfile, token: string) {
    authState.user = user;
    authState.accessToken = token;
    authState.isAuthenticated = true;
    authState.isLoading = false;

    if (typeof window !== 'undefined') {
      localStorage.setItem(STORAGE_KEY_TOKEN, token);
      localStorage.setItem(STORAGE_KEY_USER, JSON.stringify(user));
    }
  },

  /**
   * Updates only the access token following silent rotation.
   */
  updateToken(token: string) {
    authState.accessToken = token;
    if (typeof window !== 'undefined') {
      localStorage.setItem(STORAGE_KEY_TOKEN, token);
    }
  },

  /**
   * Updates authenticated user profile details in state and storage.
   */
  updateUser(user: UserProfile) {
    authState.user = user;
    if (typeof window !== 'undefined') {
      localStorage.setItem(STORAGE_KEY_USER, JSON.stringify(user));
    }
  },

  /**
   * Clears session upon logout.
   */
  logout() {
    authState.user = null;
    authState.accessToken = null;
    authState.isAuthenticated = false;
    authState.isLoading = false;

    if (typeof window !== 'undefined') {
      localStorage.removeItem(STORAGE_KEY_TOKEN);
      localStorage.removeItem(STORAGE_KEY_USER);
    }
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
