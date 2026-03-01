/**
 * Mock AI/Embedding Services
 * Prevents actual API calls to Gemini, Groq, HuggingFace during tests
 */

// Generate a consistent mock embedding vector
const generateMockEmbedding = (text: string, dimension: number = 768): number[] => {
  // Create deterministic embeddings based on text hash
  const hash = text.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
  return Array.from({ length: dimension }, (_, i) => 
    Math.sin(hash + i) * 0.5 + 0.5 // Values between 0 and 1
  );
};

// Mock Gemini Embedding Service
export const mockGeminiEmbeddingService = {
  generateEmbedding: jest.fn().mockImplementation((text: string) => {
    return Promise.resolve(generateMockEmbedding(text, 768));
  }),

  generateBatchEmbeddings: jest.fn().mockImplementation((texts: string[]) => {
    return Promise.resolve(texts.map(text => generateMockEmbedding(text, 768)));
  }),

  reset: () => {
    mockGeminiEmbeddingService.generateEmbedding.mockClear();
    mockGeminiEmbeddingService.generateBatchEmbeddings.mockClear();
  },

  simulateFailure: () => {
    mockGeminiEmbeddingService.generateEmbedding.mockRejectedValueOnce(
      new Error('Gemini API rate limit exceeded')
    );
  },
};

// Mock Groq Embedding Service
export const mockGroqEmbeddingService = {
  generateEmbedding: jest.fn().mockImplementation((text: string) => {
    return Promise.resolve(generateMockEmbedding(text, 1024));
  }),

  generateBatchEmbeddings: jest.fn().mockImplementation((texts: string[]) => {
    return Promise.resolve(texts.map(text => generateMockEmbedding(text, 1024)));
  }),

  reset: () => {
    mockGroqEmbeddingService.generateEmbedding.mockClear();
    mockGroqEmbeddingService.generateBatchEmbeddings.mockClear();
  },

  simulateFailure: () => {
    mockGroqEmbeddingService.generateEmbedding.mockRejectedValueOnce(
      new Error('Groq embedding service failure')
    );
  },
};

// Mock Groq Chat Service (for chatbot)
export const mockGroqChatService = {
  generateResponse: jest.fn().mockImplementation((messages: any[]) => {
    const lastMessage = messages[messages.length - 1]?.content || '';
    return Promise.resolve({
      response: `Mock AI response to: ${lastMessage.substring(0, 50)}...`,
      model: 'llama-3.1-70b-versatile',
      usage: {
        prompt_tokens: 100,
        completion_tokens: 50,
        total_tokens: 150,
      },
    });
  }),

  chat: jest.fn().mockImplementation((prompt: string) => {
    return Promise.resolve({
      choices: [{
        message: {
          content: `Mock response to: ${prompt.substring(0, 50)}...`,
        },
      }],
    });
  }),

  reset: () => {
    mockGroqChatService.generateResponse.mockClear();
    mockGroqChatService.chat.mockClear();
  },

  simulateFailure: () => {
    mockGroqChatService.generateResponse.mockRejectedValueOnce(
      new Error('Groq chat service error')
    );
  },
};

// Mock HuggingFace Service
export const mockHuggingFaceService = {
  generateEmbedding: jest.fn().mockImplementation((text: string) => {
    return Promise.resolve(generateMockEmbedding(text, 384));
  }),

  reset: () => {
    mockHuggingFaceService.generateEmbedding.mockClear();
  },

  simulateFailure: () => {
    mockHuggingFaceService.generateEmbedding.mockRejectedValueOnce(
      new Error('HuggingFace service failure')
    );
  },
};

// Mock Consultant Matching Service
export const mockConsultantMatchingService = {
  findMatchingConsultants: jest.fn().mockImplementation(() => {
    return Promise.resolve([
      { consultantId: '507f1f77bcf86cd799439011', score: 0.95 },
      { consultantId: '507f1f77bcf86cd799439012', score: 0.88 },
      { consultantId: '507f1f77bcf86cd799439013', score: 0.76 },
    ]);
  }),

  calculateMatchScore: jest.fn().mockImplementation(() => {
    return Promise.resolve(0.85);
  }),

  reset: () => {
    mockConsultantMatchingService.findMatchingConsultants.mockClear();
    mockConsultantMatchingService.calculateMatchScore.mockClear();
  },
};

// Reset all AI mocks
export const resetAllAIMocks = () => {
  mockGeminiEmbeddingService.reset();
  mockGroqEmbeddingService.reset();
  mockGroqChatService.reset();
  mockHuggingFaceService.reset();
  mockConsultantMatchingService.reset();
};

export default {
  mockGeminiEmbeddingService,
  mockGroqEmbeddingService,
  mockGroqChatService,
  mockHuggingFaceService,
  mockConsultantMatchingService,
  resetAllAIMocks,
};
