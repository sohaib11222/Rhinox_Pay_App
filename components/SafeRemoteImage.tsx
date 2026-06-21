import React from 'react';
import { Image, ImageProps, Platform } from 'react-native';

/**
 * Remote images on Android default to hardware bitmaps, which crash when drawn
 * inside software-rendered views (modals, BlurView, etc.).
 * `resizeMethod="resize"` forces a software-compatible bitmap.
 */
export function SafeRemoteImage(props: ImageProps) {
  return (
    <Image
      {...props}
      {...(Platform.OS === 'android' ? { resizeMethod: 'resize' as const } : {})}
    />
  );
}

export default SafeRemoteImage;
