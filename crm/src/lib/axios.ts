import axios, { AxiosError, AxiosInstance, InternalAxiosRequestConfig } from 'axios';
import { authActions, authState } from '@/stores/auth.store';
import { uiActions } from '@/stores/ui.store';
import { SingleSuccessResponse, UserProfile } from '@/types';

const getApiBaseUrl = (): string => {
  if (typeof window !== 'undefined') {
    if (window.location.hostname.includes('warranty.com')) {
      return `${window.location.origin}/api`;
    }
  }
  return process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5001/api';
};

const API_BASE_URL = getApiBaseUrl();

/**
 * Clean isolated Axios instance dedicated to silent token refresh
 * to prevent recursive interceptor loops.
 */
const refreshInstance = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000,
  withCredentials: true,
});

/**
 * Root Axios client configured with JWT Bearer insertion,
 * HttpOnly cookie support, and automatic token refresh + logout on expiry.
 */
export const axiosClient: AxiosInstance = axios.create({
  baseURL: API_BASE_URL,
  timeout: 15000,
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json',
  },
});

let isRefreshing = false;
let failedQueue: Array<{
  resolve: (value: string | null) => void;
  reject: (reason: unknown) => void;
}> = [];

const processQueue = (error: unknown, token: string | null = null) => {
  failedQueue.forEach((prom) => {
    if (error) {
      prom.reject(error);
    } else {
      prom.resolve(token);
    }
  });
  failedQueue = [];
};

// 1. Request Interceptor: Injects active Bearer token and handles dynamic domain
axiosClient.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    if (typeof window !== 'undefined' && window.location.hostname.includes('warranty.com')) {
      config.baseURL = `${window.location.origin}/api`;
    }
    const token = authState.accessToken;
    if (token && config.headers) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error: AxiosError) => Promise.reject(error),
);

// 2. Response Interceptor: Checks 401 Unauthorized, triggers silent refresh, or logs out
axiosClient.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const originalRequest = error.config as InternalAxiosRequestConfig & {
      _retry?: boolean;
    };

    if (error.response?.status === 401 && originalRequest && !originalRequest._retry) {
      // Do not attempt refresh on login or refresh endpoint failures
      if (
        originalRequest.url?.includes('/auth/login') ||
        originalRequest.url?.includes('/auth/refresh')
      ) {
        return Promise.reject(error.response?.data || error);
      }

      if (isRefreshing) {
        return new Promise<string | null>((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        })
          .then((token) => {
            if (token && originalRequest.headers) {
              originalRequest.headers.Authorization = `Bearer ${token}`;
            }
            return axiosClient(originalRequest);
          })
          .catch((err) => Promise.reject(err));
      }

      originalRequest._retry = true;
      isRefreshing = true;

      try {
        const refreshResponse = await refreshInstance.post<
          SingleSuccessResponse<{ accessToken: string; user?: UserProfile }>
        >('/auth/refresh');

        const resData = refreshResponse.data;
        const newAccessToken =
          resData && resData.success ? resData.data.accessToken : undefined;
        const newUser =
          resData && resData.success ? resData.data.user : undefined;

        if (!newAccessToken) {
          throw new Error('Refresh token exchange returned no access token');
        }

        // Update Valtio auth state & localStorage
        authActions.updateToken(newAccessToken);
        if (newUser) {
          authActions.updateUser(newUser);
        }

        processQueue(null, newAccessToken);

        if (originalRequest.headers) {
          originalRequest.headers.Authorization = `Bearer ${newAccessToken}`;
        }

        return axiosClient(originalRequest);
      } catch (refreshError: unknown) {
        processQueue(refreshError, null);
        authActions.logout();

        uiActions.addToast({
          type: 'error',
          title: 'Phiên làm việc hết hạn',
          message: 'Vui lòng đăng nhập lại để tiếp tục sử dụng hệ thống.',
        });

        if (
          typeof window !== 'undefined' &&
          !window.location.pathname.startsWith('/login') &&
          !window.location.pathname.startsWith('/tra-cuu')
        ) {
          // eslint-disable-next-line @next/next/no-location-assign-relative-destination
          window.location.href = '/login';
        }

        return Promise.reject(refreshError);
      } finally {
        isRefreshing = false;
      }
    }

    const errorPayload = error.response?.data || {
      message: error.message || 'An unexpected network error occurred',
      statusCode: error.response?.status || 500,
    };

    return Promise.reject(errorPayload);
  },
);

/**
 * Pure helper function to unwrap NestJS API envelopes cleanly.
 * Handles both standard { success: true, data: T } and
 * paginated { success: true, data: T[], meta: PaginationMeta } responses.
 */
function unwrapResponse<T>(resData: unknown): T {
  if (resData && typeof resData === 'object') {
    // Paginated structure where items and meta are separate at root
    if (
      'meta' in resData &&
      'data' in resData &&
      Array.isArray((resData as { data: unknown }).data)
    ) {
      return {
        items: (resData as { data: unknown }).data,
        meta: (resData as { meta: unknown }).meta,
      } as T;
    }

    // Standard envelope containing data property
    if ('data' in resData && 'success' in resData) {
      return (resData as { data: T }).data;
    }
  }
  return resData as T;
}

/**
 * Universal Type-Safe API Client wrapper using Axios.
 * Completely eliminates 'any' by enforcing strict generics for parameters and payloads.
 */
export const api = {
  async get<T>(url: string, params?: Record<string, unknown>): Promise<T> {
    const res = await axiosClient.get(url, { params });
    return unwrapResponse<T>(res.data);
  },

  async post<T, B = unknown>(url: string, data?: B): Promise<T> {
    const res = await axiosClient.post(url, data);
    return unwrapResponse<T>(res.data);
  },

  async patch<T, B = unknown>(url: string, data?: B): Promise<T> {
    const res = await axiosClient.patch(url, data);
    return unwrapResponse<T>(res.data);
  },

  async delete<T>(url: string, params?: Record<string, unknown>): Promise<T> {
    const res = await axiosClient.delete(url, { params });
    return unwrapResponse<T>(res.data);
  },
};

