/**
 * File Helper Utilities
 * Handles file operations like conversion to base64, validation, etc.
 */

/**
 * Convert a File to Base64 string
 * @param file - File to convert
 * @returns Promise<string> - Base64 encoded file
 */
export const fileToBase64 = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = (error) => reject(error);
  });
};

/**
 * Validate file type
 * @param file - File to validate
 * @param allowedTypes - Array of allowed MIME types
 * @returns boolean - True if file type is allowed
 */
export const isValidFileType = (file: File, allowedTypes: string[]): boolean => {
  return allowedTypes.includes(file.type);
};

/**
 * Validate file size
 * @param file - File to validate
 * @param maxSizeInMB - Maximum allowed file size in MB
 * @returns boolean - True if file size is within limit
 */
export const isValidFileSize = (file: File, maxSizeInMB: number = 10): boolean => {
  const maxSizeInBytes = maxSizeInMB * 1024 * 1024;
  return file.size <= maxSizeInBytes;
};

/**
 * Convert file size bytes to human-readable format
 * @param bytes - File size in bytes
 * @returns string - Human-readable file size
 */
export const formatFileSize = (bytes: number): string => {
  if (bytes === 0) return '0 Bytes';
  
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  
  return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + ' ' + sizes[i];
};

/**
 * Get file extension from filename
 * @param filename - Name of the file
 * @returns string - File extension
 */
export const getFileExtension = (filename: string): string => {
  const extension = filename.split('.').pop();
  return extension ? extension.toLowerCase() : '';
};

/**
 * Validate multiple files
 * @param files - Array of files to validate
 * @param allowedTypes - Array of allowed MIME types
 * @param maxSizeInMB - Maximum file size in MB
 * @returns object - Validation result with valid and invalid files
 */
export const validateFiles = (
  files: File[],
  allowedTypes: string[] = ['application/pdf', 'image/jpeg', 'image/png'],
  maxSizeInMB: number = 10
): {
  valid: File[];
  invalid: { file: File; reason: string }[];
} => {
  const valid: File[] = [];
  const invalid: { file: File; reason: string }[] = [];

  files.forEach((file) => {
    if (!isValidFileType(file, allowedTypes)) {
      invalid.push({
        file,
        reason: `Invalid file type: ${file.type}`,
      });
      return;
    }

    if (!isValidFileSize(file, maxSizeInMB)) {
      invalid.push({
        file,
        reason: `File too large. Max size: ${maxSizeInMB}MB`,
      });
      return;
    }

    valid.push(file);
  });

  return { valid, invalid };
};

/**
 * Download base64 file
 * @param base64String - Base64 encoded file
 * @param filename - Name for the downloaded file
 */
export const downloadBase64File = (base64String: string, filename: string): void => {
  const link = document.createElement('a');
  link.href = base64String;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};
