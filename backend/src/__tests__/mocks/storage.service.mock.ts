/**
 * Mock File Storage Service
 * Prevents actual file uploads to cloud storage during tests
 */

export const mockStorageService = {
  uploadFile: jest.fn().mockImplementation((file: Express.Multer.File) => {
    return Promise.resolve({
      url: `https://mock-storage.com/files/${file.originalname}`,
      key: `uploads/${Date.now()}-${file.originalname}`,
      size: file.size,
      mimetype: file.mimetype,
    });
  }),

  uploadMultipleFiles: jest.fn().mockImplementation((files: Express.Multer.File[]) => {
    return Promise.resolve(
      files.map(file => ({
        url: `https://mock-storage.com/files/${file.originalname}`,
        key: `uploads/${Date.now()}-${file.originalname}`,
        size: file.size,
        mimetype: file.mimetype,
      }))
    );
  }),

  deleteFile: jest.fn().mockResolvedValue(true),

  getFileUrl: jest.fn().mockImplementation((key: string) => {
    return `https://mock-storage.com/files/${key}`;
  }),

  getSignedUrl: jest.fn().mockImplementation((key: string) => {
    return Promise.resolve(
      `https://mock-storage.com/files/${key}?signature=mock-signature-123`
    );
  }),

  reset: () => {
    mockStorageService.uploadFile.mockClear();
    mockStorageService.uploadMultipleFiles.mockClear();
    mockStorageService.deleteFile.mockClear();
    mockStorageService.getFileUrl.mockClear();
    mockStorageService.getSignedUrl.mockClear();
  },

  simulateFailure: () => {
    mockStorageService.uploadFile.mockRejectedValueOnce(
      new Error('Storage service unavailable')
    );
  },
};

export default mockStorageService;
