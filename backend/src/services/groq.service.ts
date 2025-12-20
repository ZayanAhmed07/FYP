import Groq from 'groq-sdk';
import env from '../config/env';

/**
 * Groq AI Service for Sarah Chatbot
 * Using Llama 3 for natural conversation and job detail extraction
 */
class GroqService {
  private groq: Groq;
  private model = 'llama-3.3-70b-versatile'; // Fast and capable model

  constructor() {
    this.groq = new Groq({
      apiKey: env.GROQ_API_KEY || '',
    });
  }

  /**
   * Process chatbot conversation with context awareness
   */
  async chat(
    messages: Array<{ role: 'system' | 'user' | 'assistant'; content: string }>,
    functions?: any[]
  ): Promise<string> {
    try {
      const completion = await this.groq.chat.completions.create({
        messages,
        model: this.model,
        temperature: 0.7,
        max_tokens: 1024,
        top_p: 1,
        stream: false,
      });

      return completion.choices[0]?.message?.content || '';
    } catch (error: any) {
      console.error('Groq API error:', error.message);
      throw new Error('Failed to process chat message');
    }
  }

  /**
   * Extract job details from conversation using AI
   */
  async extractJobDetails(conversationHistory: string): Promise<{
    category?: string;
    description?: string;
    skills?: string[];
    budgetMin?: number;
    budgetMax?: number;
    timeline?: string;
    location?: string;
  }> {
    try {
      const prompt = `You are a job detail extraction AI for a Pakistani freelance platform. 
Analyze this conversation and extract job posting details.

Categories available: Education, Business, Legal

Pakistani cities: Rawalpindi, Islamabad, Lahore, Karachi

Conversation:
${conversationHistory}

Extract and return ONLY a JSON object with these fields (omit if not mentioned):
{
  "category": "Education|Business|Legal",
  "description": "detailed job description",
  "skills": ["skill1", "skill2"],
  "budgetMin": number in PKR,
  "budgetMax": number in PKR,
  "timeline": "timeline string",
  "location": "city, Pakistan or Remote"
}`;

      const completion = await this.groq.chat.completions.create({
        messages: [
          {
            role: 'system',
            content: 'You are a job detail extraction AI. Return only valid JSON.',
          },
          {
            role: 'user',
            content: prompt,
          },
        ],
        model: this.model,
        temperature: 0.3, // Lower temperature for more consistent extraction
        max_tokens: 512,
      });

      const content = completion.choices[0]?.message?.content || '{}';
      
      // Extract JSON from markdown code blocks if present
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      const jsonStr = jsonMatch ? jsonMatch[0] : content;
      
      return JSON.parse(jsonStr);
    } catch (error: any) {
      console.error('Job extraction error:', error.message);
      return {};
    }
  }

  /**
   * Generate Rachel's conversational response
   */
  async generateResponse(
    userMessage: string,
    conversationContext: string,
    currentStep: string
  ): Promise<string> {
    try {
      const systemPrompt = `You are Sarah, a friendly Pakistani job posting assistant for Raah platform.

Your role:
- Help users post jobs to find Pakistani consultants in Education, Business, or Legal fields
- Extract job details through natural conversation
- Be conversational, friendly, and professional
- Use emojis sparingly
- Keep responses concise (2-3 sentences max)
- Mention Pakistani cities: Rawalpindi, Islamabad, Lahore, Karachi

Current conversation step: ${currentStep}

Available categories: Education, Business, Legal

Conversation so far:
${conversationContext}

User's message: ${userMessage}

Respond naturally and guide them to the next step. If they've provided information, acknowledge it and ask for the next detail needed.`;

      const completion = await this.groq.chat.completions.create({
        messages: [
          {
            role: 'system',
            content: systemPrompt,
          },
          {
            role: 'user',
            content: userMessage,
          },
        ],
        model: this.model,
        temperature: 0.8,
        max_tokens: 256,
      });

      return completion.choices[0]?.message?.content || 'I understand. Could you tell me more?';
    } catch (error: any) {
      console.error('Response generation error:', error.message);
      return 'I understand. Could you tell me more about your requirements?';
    }
  }

  /**
   * Detect category from user's initial message
   */
  async detectCategory(message: string): Promise<string | null> {
    try {
      const prompt = `Given this message, determine if it's about Education, Business, or Legal services.
Return ONLY one word: "Education", "Business", "Legal", or "Unknown"

Message: "${message}"

Category:`;

      const completion = await this.groq.chat.completions.create({
        messages: [
          {
            role: 'system',
            content: 'You categorize job requests. Return only one word.',
          },
          {
            role: 'user',
            content: prompt,
          },
        ],
        model: this.model,
        temperature: 0.2,
        max_tokens: 10,
      });

      const category = completion.choices[0]?.message?.content?.trim() || 'Unknown';
      
      if (['Education', 'Business', 'Legal'].includes(category)) {
        return category;
      }
      
      return null;
    } catch (error: any) {
      console.error('Category detection error:', error.message);
      return null;
    }
  }

  /**
   * Extract skills from job description
   */
  async extractSkills(description: string, category: string): Promise<string[]> {
    try {
      const prompt = `Extract relevant professional skills from this ${category} job description.
Return ONLY a JSON array of 3-6 specific skills.

Description: "${description}"

Skills:`;

      const completion = await this.groq.chat.completions.create({
        messages: [
          {
            role: 'system',
            content: 'You extract skills. Return only a JSON array like ["skill1", "skill2"]',
          },
          {
            role: 'user',
            content: prompt,
          },
        ],
        model: this.model,
        temperature: 0.3,
        max_tokens: 128,
      });

      const content = completion.choices[0]?.message?.content || '[]';
      const jsonMatch = content.match(/\[[\s\S]*\]/);
      const jsonStr = jsonMatch ? jsonMatch[0] : content;
      
      const skills = JSON.parse(jsonStr);
      return Array.isArray(skills) ? skills.slice(0, 6) : [];
    } catch (error: any) {
      console.error('Skill extraction error:', error.message);
      return [];
    }
  }

  /**
   * Enhance job posting with AI-generated professional title and description
   */
  async enhanceJobPosting(
    rawDescription: string,
    category: string,
    skills: string[]
  ): Promise<{ title: string; enhancedDescription: string }> {
    try {
      const prompt = `You are a professional job posting writer for a Pakistani freelance platform.

Transform this conversational job request into a professional job posting.

Category: ${category}
Required Skills: ${skills.join(', ')}
Raw Input: "${rawDescription}"

Create:
1. A clear, professional title (max 80 characters)
2. An enhanced description that is:
   - Professional and consultant-friendly
   - Clear about requirements and deliverables
   - Well-structured with proper grammar
   - Maintains all original information
   - Easy for consultants to understand

Return ONLY a JSON object:
{
  "title": "Professional Job Title Here",
  "enhancedDescription": "Well-written professional description here"
}`;

      const completion = await this.groq.chat.completions.create({
        messages: [
          {
            role: 'system',
            content: 'You are a professional job posting writer. Return only valid JSON.',
          },
          {
            role: 'user',
            content: prompt,
          },
        ],
        model: this.model,
        temperature: 0.6,
        max_tokens: 512,
      });

      const content = completion.choices[0]?.message?.content || '{}';
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      const jsonStr = jsonMatch ? jsonMatch[0] : content;
      
      const result = JSON.parse(jsonStr);
      
      return {
        title: result.title || rawDescription.substring(0, 80).trim() + '...',
        enhancedDescription: result.enhancedDescription || rawDescription,
      };
    } catch (error: any) {
      console.error('Job enhancement error:', error.message);
      // Fallback to basic title generation
      const title = rawDescription.substring(0, 80).trim() + 
        (rawDescription.length > 80 ? '...' : '');
      return {
        title,
        enhancedDescription: rawDescription,
      };
    }
  }
}

export default new GroqService();
