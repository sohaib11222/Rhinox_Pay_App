import * as FileSystem from 'expo-file-system/legacy';
import { AxiosError } from 'axios';
import { API_BASE_URL } from './apiConfig';
import { ApiResponse, getAccessToken } from './apiClient';
import { prepareImageForUpload } from './prepareImageUpload';

export interface MultipartUploadParams {
  route: string;
  fileField: string;
  imageUri: string;
  fields?: Record<string, string>;
}

const toAxiosLikeError = (status: number, data: any): AxiosError => {
  const error = new Error(data?.message || 'Upload failed') as AxiosError;
  error.response = {
    status,
    data,
    statusText: '',
    headers: {},
    config: {} as any,
  };
  return error;
};

/**
 * Upload an image using Expo's native multipart uploader.
 * Avoids axios FormData issues that cause "Network Error" on React Native Android.
 */
export const uploadMultipartImage = async (
  params: MultipartUploadParams
): Promise<ApiResponse> => {
  const token = await getAccessToken();
  const { uri, mimeType } = await prepareImageForUpload(params.imageUri);
  const url = `${API_BASE_URL}${params.route}`;

  let result: FileSystem.FileSystemUploadResult;
  try {
    result = await FileSystem.uploadAsync(url, uri, {
      httpMethod: 'POST',
      uploadType: FileSystem.FileSystemUploadType.MULTIPART,
      fieldName: params.fileField,
      mimeType,
      parameters: params.fields,
      headers: token ? { Authorization: `Bearer ${token.trim()}` } : {},
    });
  } catch (error: any) {
    const networkError = new Error(error?.message || 'Network error during image upload') as AxiosError;
    networkError.request = {};
    throw networkError;
  }

  let data: ApiResponse;
  try {
    data = JSON.parse(result.body);
  } catch {
    throw toAxiosLikeError(result.status, {
      message: 'Invalid server response during image upload',
    });
  }

  if (result.status < 200 || result.status >= 300) {
    throw toAxiosLikeError(result.status, data);
  }

  return data;
};
