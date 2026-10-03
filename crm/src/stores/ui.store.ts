import { proxy } from 'valtio';

export interface ToastMessage {
  id: string;
  type: 'success' | 'error' | 'warning' | 'info';
  title: string;
  message?: string;
}

interface UiState {
  sidebarOpen: boolean;
  activeModal: string | null;
  toasts: ToastMessage[];
}

/**
 * Valtio reactive proxy store for global UI, sidebar, modals, and toasts.
 */
export const uiState = proxy<UiState>({
  sidebarOpen: false,
  activeModal: null,
  toasts: [],
});

export const uiActions = {
  toggleSidebar(open?: boolean) {
    uiState.sidebarOpen = open !== undefined ? open : !uiState.sidebarOpen;
  },

  closeSidebar() {
    uiState.sidebarOpen = false;
  },

  openModal(modalId: string) {
    uiState.activeModal = modalId;
  },

  closeModal() {
    uiState.activeModal = null;
  },

  addToast(toast: Omit<ToastMessage, 'id'>) {
    const id = `toast-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`;
    uiState.toasts.push({ id, ...toast });

    // Auto dismiss after 4 seconds
    setTimeout(() => {
      uiActions.removeToast(id);
    }, 4000);
  },

  removeToast(id: string) {
    const index = uiState.toasts.findIndex((t) => t.id === id);
    if (index !== -1) {
      uiState.toasts.splice(index, 1);
    }
  },
};
