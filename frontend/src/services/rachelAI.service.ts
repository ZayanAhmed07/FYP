import { httpClient } from '../api/httpClient';

/**
 * Sarah AI Service - Frontend wrapper for Groq AI chatbot
 */
export class SarahAIService {
  /**
   * Get AI response for user message
   */
  async getResponse(
    message: string,
    conversationHistory: any[],
    currentStep: string
  ): Promise<string> {
    try {
      const response = await httpClient.post('/chatbot/message', {
        message,
        conversationHistory,
        currentStep,
      });
      return response.data?.data?.response || '';
    } catch (error) {
      console.error('AI response error:', error);
      return '';
    }
  }

  /**
   * Detect job category from message
   */
  async detectCategory(message: string): Promise<string | null> {
    try {
      const response = await httpClient.post('/chatbot/detect-category', {
        message,
      });
      return response.data?.data?.category || null;
    } catch (error) {
      console.error('Category detection error:', error);
      return null;
    }
  }

  /**
   * Extract skills from description
   */
  async extractSkills(description: string, category: string): Promise<string[]> {
    try {
      const response = await httpClient.post('/chatbot/extract-skills', {
        description,
        category,
      });
      return response.data?.data?.skills || [];
    } catch (error) {
      console.error('Skills extraction error:', error);
      return [];
    }
  }

  /**
   * Extract all job details from conversation
   */
  async extractJobDetails(conversationHistory: any[]): Promise<any> {
    try {
      const response = await httpClient.post('/chatbot/extract-details', {
        conversationHistory,
      });
      return response.data?.data || {};
    } catch (error) {
      console.error('Job details extraction error:', error);
      return {};
    }
  }

  /**
   * Enhance job description and generate professional title
   */
  async enhanceJobPosting(description: string, category: string, skills: string[]): Promise<{ title: string; enhancedDescription: string }> {
    try {
      const response = await httpClient.post('/chatbot/enhance-job', {
        description,
        category,
        skills,
      });
      return response.data?.data || { title: description.substring(0, 80), enhancedDescription: description };
    } catch (error) {
      console.error('Job enhancement error:', error);
      // Fallback: create basic title and description
      const title = description.substring(0, 80).trim() + (description.length > 80 ? '...' : '');
      return { title, enhancedDescription: description };
    }
  }
}

export const sarahAI = new SarahAIService();
