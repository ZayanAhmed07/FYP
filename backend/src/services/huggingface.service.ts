import axios from 'axios';
import env from '../config/env';

interface EmbeddingResponse {
  embeddings: number[][];
}

/**
 * Generate embeddings using Hugging Face Inference API
 * Using sentence-transformers/all-MiniLM-L6-v2 model for semantic similarity
 */
export class HuggingFaceService {
  private apiKey: string;
  private apiUrl: string;

  constructor() {
    this.apiKey = env.HUGGINGFACE_API_KEY || '';
    // Using NEW HuggingFace Router API (as of late 2024)
    this.apiUrl = 'https://router.huggingface.co/v1/embeddings';
  }

  /**
   * Generate embeddings for text using Hugging Face Router API
   */
  async generateEmbedding(text: string): Promise<number[]> {
    try {
      const response = await axios.post(
        this.apiUrl,
        {
          model: 'sentence-transformers/all-MiniLM-L6-v2',
          input: text,
        },
        {
          headers: {
            'Authorization': `Bearer ${this.apiKey}`,
            'Content-Type': 'application/json',
          },
          timeout: 30000,
        }
      );

      // New API format: { data: [{ embedding: [...] }] }
      if (response.data?.data?.[0]?.embedding) {
        return response.data.data[0].embedding;
      }
      
      throw new Error('Unexpected response format from HuggingFace');
    } catch (error: any) {
      console.error('❌ HuggingFace Error:', error.response?.data || error.message);
      
      if (error.response?.status === 503) {
        throw new Error('HuggingFace model is loading. Please try again in a moment.');
      }
      
      throw new Error(`Failed to generate embedding: ${error.response?.data?.error || error.message}`);
    }
  }

  /**
   * Generate embeddings for multiple texts
   */
  async generateBatchEmbeddings(texts: string[]): Promise<number[][]> {
    try {
      const embeddings = await Promise.all(
        texts.map(text => this.generateEmbedding(text))
      );
      return embeddings;
    } catch (error) {
      console.error('Error generating batch embeddings:', error);
      throw new Error('Failed to generate batch embeddings');
    }
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

  /**
   * Find most similar items based on embeddings
   */
  findMostSimilar(
    queryEmbedding: number[],
    candidateEmbeddings: { embedding: number[]; data: any }[],
    topK: number = 10
  ): { similarity: number; data: any }[] {
    const similarities = candidateEmbeddings.map(candidate => ({
      similarity: this.cosineSimilarity(queryEmbedding, candidate.embedding),
      data: candidate.data,
    }));

    // Sort by similarity (descending) and return top K
    return similarities
      .sort((a, b) => b.similarity - a.similarity)
      .slice(0, topK);
  }
}

export default new HuggingFaceService();
