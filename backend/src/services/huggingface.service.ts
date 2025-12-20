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
  private modelEndpoint: string;

  constructor() {
    this.apiKey = env.HUGGINGFACE_API_KEY || '';
    // Using a popular sentence-transformer model for embeddings
    this.modelEndpoint = 'https://api-inference.huggingface.co/models/sentence-transformers/all-MiniLM-L6-v2';
  }

  /**
   * Generate embeddings for text using Hugging Face API
   */
  async generateEmbedding(text: string): Promise<number[]> {
    try {
      const response = await axios.post(
        this.modelEndpoint,
        {
          inputs: text,
          options: { wait_for_model: true }
        },
        {
          headers: {
            'Authorization': `Bearer ${this.apiKey}`,
            'Content-Type': 'application/json',
          },
        }
      );

      // The model returns embeddings directly as array
      return response.data;
    } catch (error: any) {
      console.error('Error generating embedding:', error.response?.data || error.message);
      throw new Error('Failed to generate embedding from Hugging Face');
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
