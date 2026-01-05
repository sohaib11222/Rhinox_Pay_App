# Custom Alert System

This application uses a custom alert system that matches the application's theme colors instead of the default React Native Alert.

## Usage

### Basic Usage

```typescript
import { showSuccessAlert, showErrorAlert, showWarningAlert, showInfoAlert } from '../utils/customAlert';

// Success alert
showSuccessAlert('Success', 'Operation completed successfully');

// Error alert
showErrorAlert('Error', 'Something went wrong');

// Warning alert
showWarningAlert('Warning', 'Please check your input');

// Info alert
showInfoAlert('Information', 'This is an informational message');
```

### With Callback

```typescript
showSuccessAlert(
  'Password Changed',
  'Your password has been changed successfully',
  () => {
    // Callback function
    navigation.goBack();
  }
);
```

### Confirmation Alert

```typescript
import { showConfirmAlert } from '../utils/customAlert';

showConfirmAlert(
  'Delete Account',
  'Are you sure you want to delete your account? This action cannot be undone.',
  () => {
    // On confirm
    deleteAccount();
  },
  () => {
    // On cancel (optional)
    console.log('Cancelled');
  },
  'Delete', // Confirm button text
  'Cancel'  // Cancel button text
);
```

### Advanced Usage

```typescript
import { showAlert } from '../utils/customAlert';

showAlert({
  title: 'Custom Alert',
  message: 'This is a custom alert with multiple buttons',
  type: 'info', // 'success' | 'error' | 'warning' | 'info'
  buttons: [
    {
      text: 'Cancel',
      style: 'cancel',
      onPress: () => console.log('Cancelled'),
    },
    {
      text: 'Delete',
      style: 'destructive',
      onPress: () => console.log('Deleted'),
    },
  ],
});
```

## Alert Types

- **success**: Green checkmark icon, green accent color
- **error**: Red alert icon, red accent color
- **warning**: Orange alert icon, orange accent color
- **info**: Information icon, green accent color

## Button Styles

- **default**: Primary green button (#A9EF45) with black text
- **cancel**: Transparent button with white border and white text
- **destructive**: Red-tinted button with red border and red text

## Theme Colors

The custom alerts use the application's theme colors:
- **Primary Green**: `#A9EF45`
- **Dark Background**: `#020c19`
- **White Text**: `#FFFFFF`
- **Error Red**: `#ff0000`
- **Warning Orange**: `#FFA500`

## Setup

The `CustomAlertProvider` is already added to the root navigator. No additional setup is required.

## Migration from Alert.alert()

Replace all `Alert.alert()` calls with the appropriate custom alert function:

```typescript
// Before
Alert.alert('Error', 'Something went wrong');

// After
showErrorAlert('Error', 'Something went wrong');
```

## Files

- `components/CustomAlert.tsx` - The alert component
- `components/CustomAlertProvider.tsx` - Provider component
- `utils/customAlert.ts` - Utility functions

