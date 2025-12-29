import Groq from 'groq-sdk';
import env from '../config/env';

/**
 * AI-Powered Embedding Service using Groq
 * Generates semantic embeddings for consultant matching
 */
export class GroqEmbeddingService {
  private client: Groq;

  constructor() {
    this.client = new Groq({
      apiKey: env.GROQ_API_KEY,
    });
  }

  /**
   * Generate semantic embedding using Groq's LLM
   * Since Groq doesn't have dedicated embedding models yet,
   * we'll use their LLM to generate a semantic representation
   */
  async generateEmbedding(text: string): Promise<number[]> {
    try {
      // Use Groq to analyze and create a semantic hash
      const completion = await this.client.chat.completions.create({
        model: 'llama-3.3-70b-versatile',
        messages: [
          {
            role: 'system',
            content: `You are a semantic analyzer. Extract key concepts and return them as a JSON array of numbers representing semantic weights for these categories in order:
[education, business, legal, technical, communication, leadership, analysis, creativity, management, consulting]
Each number should be between 0-1 indicating relevance. Return ONLY the JSON array, no explanation.`
          },
          {
            role: 'user',
            content: text
          }
        ],
        temperature: 0.1,
        max_tokens: 100,
      });

      const response = completion.choices[0]?.message?.content || '[]';
      const embedding = JSON.parse(response.trim());
      
      // Ensure we have a valid array of numbers
      if (!Array.isArray(embedding) || embedding.length === 0) {
        // Fallback: create simple embedding based on keywords
        return this.createSimpleEmbedding(text);
      }

      // Pad to 384 dimensions (similar to sentence-transformers)
      while (embedding.length < 384) {
        embedding.push(0);
      }

      return embedding.slice(0, 384);
    } catch (error: any) {
      // Silently fall back for rate limits, log other errors
      if (error?.status !== 429) {
        console.error('❌ Groq Embedding Error:', error?.message || error);
      }
      // Fallback to simple keyword-based embedding
      return this.createSimpleEmbedding(text);
    }
  }

  /**
   * Fallback: Create simple keyword-based embedding
   */
  private createSimpleEmbedding(text: string): number[] {
    const keywords = {
      education: ['education', 'teaching', 'learning', 'student', 'school', 'university', 'academic', 'career', 'counseling', 'guidance'],
      business: ['business', 'marketing', 'sales', 'strategy', 'management', 'finance', 'consulting', 'entrepreneur', 'startup', 'market'],
      legal: ['legal', 'law', 'contract', 'compliance', 'regulatory', 'litigation', 'attorney', 'lawyer', 'court', 'rights'],
      technical: ['technical', 'technology', 'software', 'programming', 'development', 'engineering', 'system', 'digital', 'IT', 'computer'],
      communication: ['communication', 'presentation', 'speaking', 'writing', 'negotiation', 'interpersonal', 'collaboration', 'team', 'meeting'],
      leadership: ['leadership', 'management', 'director', 'executive', 'supervisor', 'lead', 'coordinate', 'organize', 'delegate'],
      analysis: ['analysis', 'research', 'data', 'analytics', 'statistics', 'evaluate', 'assess', 'measure', 'investigate'],
      creativity: ['creative', 'design', 'innovative', 'artistic', 'visual', 'brand', 'content', 'media', 'aesthetic'],
      consulting: ['consultant', 'consulting', 'advisor', 'expert', 'specialist', 'professional', 'experienced', 'qualified'],
      project: ['project', 'planning', 'timeline', 'milestone', 'delivery', 'implementation', 'execution', 'coordination'],
    };

    const lowerText = text.toLowerCase();
    const embedding: number[] = [];

    // Calculate scores for each category
    Object.values(keywords).forEach(categoryWords => {
      let score = 0;
      categoryWords.forEach(word => {
        if (lowerText.includes(word)) {
          score += 0.1;
        }
      });
      embedding.push(Math.min(score, 1.0));
    });

    // Pad to 384 dimensions
    while (embedding.length < 384) {
      embedding.push(0);
    }

    return embedding;
  }

  /**
   * Generate embeddings for multiple texts
   * Uses sequential processing with delays to avoid rate limits
   */
  async generateBatchEmbeddings(texts: string[]): Promise<number[][]> {
    const embeddings: number[][] = [];
    let rateLimitHit = false;

    // Process in batches to avoid rate limits
    for (let i = 0; i < texts.length; i++) {
      try {
        const text = texts[i];
        if (!text) {
          embeddings.push(this.createSimpleEmbedding(''));
          continue;
        }

        // If we hit rate limit, use fallback for remaining items
        if (rateLimitHit) {
          embeddings.push(this.createSimpleEmbedding(text));
          continue;
        }

        const embedding = await this.generateEmbedding(text);
        embeddings.push(embedding);
        
        // Small delay between requests to avoid hitting rate limits
        if (i < texts.length - 1 && !rateLimitHit) {
          await new Promise(resolve => setTimeout(resolve, 100));
        }
      } catch (error: any) {
        // Mark that we hit rate limit
        if (error?.status === 429) {
          rateLimitHit = true;
          console.log('⚠️ Rate limit reached, using fallback embeddings for remaining consultants');
        }
        // Use fallback for this item
        const text = texts[i];
        embeddings.push(this.createSimpleEmbedding(text || ''));
      }
    }

    return embeddings;
  }

  /**
   * Calculate cosine similarity between two vectors
   */
  cosineSimilarity(vecA: number[], vecB: number[]): number {
    if (vecA.length !== vecB.length) {
      throw new Error('Vectors must have the same length');
    }

    let dotProduct = 0;
    let normA = 0;
    let normB = 0;

    for (let i = 0; i < vecA.length; i++) {
      const a = vecA[i] ?? 0;
      const b = vecB[i] ?? 0;
      dotProduct += a * b;
      normA += a * a;
      normB += b * b;
    }

    const magnitude = Math.sqrt(normA) * Math.sqrt(normB);
    if (magnitude === 0) return 0;

    return dotProduct / magnitude;
  }
}

export default new GroqEmbeddingService();
