import React, { useState, useEffect } from 'react';
import CustomAlert, { CustomAlertOptions } from './CustomAlert';
import { alertManager } from '../utils/customAlert';

/**
 * CustomAlertProvider
 * Wraps the app to provide custom alert functionality
 * Add this to your root component
 */
export const CustomAlertProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [alertVisible, setAlertVisible] = useState(false);
  const [alertOptions, setAlertOptions] = useState<CustomAlertOptions | null>(null);

  useEffect(() => {
    const handleShow = (options: CustomAlertOptions) => {
      setAlertOptions(options);
      setAlertVisible(true);
    };

    const handleHide = () => {
      setAlertVisible(false);
      // Clear options after animation
      setTimeout(() => {
        setAlertOptions(null);
      }, 200);
    };

    alertManager.on('show', handleShow);
    alertManager.on('hide', handleHide);

    return () => {
      alertManager.off('show', handleShow);
      alertManager.off('hide', handleHide);
    };
  }, []);

  const handleClose = () => {
    alertManager.hide();
  };

  return (
    <>
      {children}
      <CustomAlert visible={alertVisible} options={alertOptions} onClose={handleClose} />
    </>
  );
};

export default CustomAlertProvider;

