import * as FileSystem from 'expo-file-system/legacy';
import { Platform } from 'react-native';

const IMAGE_MIME_BY_EXT: Record<string, string> = {
  png: 'image/png',
  webp: 'image/webp',
  gif: 'image/gif',
  jpg: 'image/jpeg',
  jpeg: 'image/jpeg',
  heic: 'image/heic',
};

const getMimeType = (filename: string) => {
  const ext = filename.split('.').pop()?.toLowerCase() || 'jpg';
  return IMAGE_MIME_BY_EXT[ext] || 'image/jpeg';
};

const ensureFileUri = (path: string) => (path.startsWith('file://') ? path : `file://${path}`);

/**
 * Normalize a local image URI for multipart uploads.
 * Copies to cache so Android content:// and picker URIs are readable by native upload.
 */
export const prepareImageForUpload = async (
  imageUri: string
): Promise<{ uri: string; filename: string; mimeType: string }> => {
  const ext = imageUri.split('.').pop()?.split('?')[0]?.toLowerCase() || 'jpg';
  const filename = `upload-${Date.now()}.${ext}`;
  const destination = `${FileSystem.cacheDirectory}${filename}`;

  const shouldCopy =
    Platform.OS === 'android' ||
    imageUri.startsWith('content://') ||
    imageUri.startsWith('ph://');

  if (shouldCopy) {
    await FileSystem.copyAsync({ from: imageUri, to: destination });
    const uploadUri = ensureFileUri(destination);
    return { uri: uploadUri, filename, mimeType: getMimeType(filename) };
  }

  const uploadUri = ensureFileUri(imageUri);
  const resolvedFilename = uploadUri.split('/').pop()?.split('?')[0] || filename;

  return {
    uri: uploadUri,
    filename: resolvedFilename,
    mimeType: getMimeType(resolvedFilename),
  };
};
