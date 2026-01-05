/**
 * Custom Alert Utility
 * Provides themed alert dialogs that match the application's design
 */

export interface CustomAlertOptions {
  title: string;
  message?: string;
  type?: 'success' | 'error' | 'warning' | 'info';
  buttons?: Array<{
    text: string;
    onPress?: () => void;
    style?: 'default' | 'cancel' | 'destructive';
  }>;
  onDismiss?: () => void;
}

// Simple EventEmitter implementation for React Native
class SimpleEventEmitter {
  private listeners: { [event: string]: Array<(...args: any[]) => void> } = {};

  on(event: string, listener: (...args: any[]) => void) {
    if (!this.listeners[event]) {
      this.listeners[event] = [];
    }
    this.listeners[event].push(listener);
  }

  off(event: string, listener: (...args: any[]) => void) {
    if (!this.listeners[event]) return;
    this.listeners[event] = this.listeners[event].filter(l => l !== listener);
  }

  emit(event: string, ...args: any[]) {
    if (!this.listeners[event]) return;
    this.listeners[event].forEach(listener => listener(...args));
  }

  removeAllListeners(event?: string) {
    if (event) {
      delete this.listeners[event];
    } else {
      this.listeners = {};
    }
  }
}

class CustomAlertManager extends SimpleEventEmitter {
  private currentAlert: CustomAlertOptions | null = null;

  show(options: CustomAlertOptions) {
    this.currentAlert = options;
    this.emit('show', options);
  }

  hide() {
    if (this.currentAlert?.onDismiss) {
      this.currentAlert.onDismiss();
    }
    this.currentAlert = null;
    this.emit('hide');
  }

  getCurrentAlert(): CustomAlertOptions | null {
    return this.currentAlert;
  }
}

const alertManager = new CustomAlertManager();

/**
 * Show a custom alert dialog
 */
export const showAlert = (options: CustomAlertOptions) => {
  alertManager.show(options);
};

/**
 * Show a success alert
 */
export const showSuccessAlert = (
  title: string,
  message?: string,
  onPress?: () => void
) => {
  showAlert({
    title,
    message,
    type: 'success',
    buttons: [
      {
        text: 'OK',
        onPress,
      },
    ],
  });
};

/**
 * Show an error alert
 */
export const showErrorAlert = (
  title: string,
  message?: string,
  onPress?: () => void
) => {
  showAlert({
    title,
    message,
    type: 'error',
    buttons: [
      {
        text: 'OK',
        onPress,
      },
    ],
  });
};

/**
 * Show a warning alert
 */
export const showWarningAlert = (
  title: string,
  message?: string,
  onPress?: () => void
) => {
  showAlert({
    title,
    message,
    type: 'warning',
    buttons: [
      {
        text: 'OK',
        onPress,
      },
    ],
  });
};

/**
 * Show an info alert
 */
export const showInfoAlert = (
  title: string,
  message?: string,
  onPress?: () => void
) => {
  showAlert({
    title,
    message,
    type: 'info',
    buttons: [
      {
        text: 'OK',
        onPress,
      },
    ],
  });
};

/**
 * Show a confirmation alert with two buttons
 */
export const showConfirmAlert = (
  title: string,
  message: string,
  onConfirm: () => void,
  onCancel?: () => void,
  confirmText: string = 'Confirm',
  cancelText: string = 'Cancel'
) => {
  showAlert({
    title,
    message,
    type: 'warning',
    buttons: [
      {
        text: cancelText,
        style: 'cancel',
        onPress: onCancel,
      },
      {
        text: confirmText,
        onPress: onConfirm,
      },
    ],
  });
};

/**
 * Hide the current alert
 */
export const hideAlert = () => {
  alertManager.hide();
};

export { alertManager };
export default {
  show: showAlert,
  success: showSuccessAlert,
  error: showErrorAlert,
  warning: showWarningAlert,
  info: showInfoAlert,
  confirm: showConfirmAlert,
  hide: hideAlert,
};

