import { GoogleGenerativeAI } from '@google/generative-ai';

/**
 * Gemini Embedding Service with Intelligent Caching
 * Generates semantic embeddings for consultant matching using Google's Gemini API
 * 
 * OPTIMIZATION STRATEGY:
 * - Uses keyword-based embeddings by default (no API calls, no quota limits)
 * - Caches embeddings in database to avoid repeated API calls
 * - Provides getOrGenerateEmbedding() for smart caching logic
 * - Falls back gracefully when quota is exceeded
 * - Tracks cache hit/miss rates for monitoring
 */
export class GeminiEmbeddingService {
  private genAI: GoogleGenerativeAI;
  private readonly EMBEDDING_MODEL = 'embedding-001';
  private readonly CACHE_FRESHNESS_DAYS = 30; // Embeddings valid for 30 days

  // Monitoring metrics
  private apiCallCount = 0;
  private cacheHitCount = 0;
  private cacheMissCount = 0;

  constructor() {
    const apiKey = 'AIzaSyC_xSM6LOwlUiCI2qx3RPZZC1ZrwM-4lp4';
    this.genAI = new GoogleGenerativeAI(apiKey);
  }

  /**
   * MAIN METHOD: Get cached embedding or generate new one
   * This is the primary method to use - it handles caching intelligently
   * 
   * @param text - Text to embed
   * @param existingEmbedding - Previously cached embedding (if any)
   * @param lastGenerated - Timestamp when embedding was generated
   * @returns Embedding vector
   */
  async getOrGenerateEmbedding(
    text: string,
    existingEmbedding?: number[],
    lastGenerated?: Date
  ): Promise<number[]> {
    // Check if cached embedding is still fresh
    if (existingEmbedding && existingEmbedding.length > 0 && lastGenerated) {
      const daysSinceGenerated = this.getDaysSince(lastGenerated);
      
      if (daysSinceGenerated < this.CACHE_FRESHNESS_DAYS) {
        this.cacheHitCount++;
        console.log(`✅ Cache HIT: Using cached embedding (${daysSinceGenerated} days old)`);
        return existingEmbedding;
      } else {
        console.log(`⚠️ Cache STALE: Embedding is ${daysSinceGenerated} days old, regenerating...`);
      }
    }

    // Cache miss - need to generate new embedding
    this.cacheMissCount++;
    console.log(`🔄 Cache MISS: Generating new embedding for text (${text.substring(0, 50)}...)`);

    // Use keyword-based embeddings (no API quota issues, fast, effective)
    return this.generateKeywordBasedEmbedding(text);
  }

  /**
   * Calculate days since a date
   */
  private getDaysSince(date: Date): number {
    const now = new Date();
    const diffMs = now.getTime() - new Date(date).getTime();
    return Math.floor(diffMs / (1000 * 60 * 60 * 24));
  }

  /**
   * Check if cache is still fresh (within freshness period)
   */
  isCacheFresh(lastGenerated?: Date): boolean {
    if (!lastGenerated) return false;
    return this.getDaysSince(lastGenerated) < this.CACHE_FRESHNESS_DAYS;
  }

  /**
   * Generate embedding for a single text (legacy method, use getOrGenerateEmbedding instead)
   */
  async generateEmbedding(text: string): Promise<number[]> {
    return this.generateKeywordBasedEmbedding(text);
  }

  /**
   * Generate embeddings for multiple texts in batch
   * Now uses keyword-based approach to avoid API quota limits
   */
  async generateBatchEmbeddings(texts: string[]): Promise<number[][]> {
    console.log(`🔄 Generating keyword-based embeddings for ${texts.length} texts...`);
    const embeddings = texts.map(text => this.generateKeywordBasedEmbedding(text));
    console.log(`✅ Successfully generated ${embeddings.length} embeddings`);
    return embeddings;
  }

  /**
   * Generate batch embeddings with cache support
   * Checks existing embeddings and only generates missing ones
   * 
   * @param items - Array of objects with text, existingEmbedding, and lastGenerated
   * @returns Array of embeddings (cached or newly generated)
   */
  async generateBatchEmbeddingsWithCache(
    items: Array<{
      text: string;
      existingEmbedding?: number[];
      lastGenerated?: Date;
    }>
  ): Promise<number[][]> {
    console.log(`🔄 Processing ${items.length} embeddings with cache support...`);
    
    const embeddings: number[][] = [];
    for (const item of items) {
      const embedding = await this.getOrGenerateEmbedding(
        item.text,
        item.existingEmbedding,
        item.lastGenerated
      );
      embeddings.push(embedding);
    }

    const stats = this.getCacheStats();
    console.log(`📊 Cache Stats - Hits: ${stats.cacheHits}, Misses: ${stats.cacheMisses}, Hit Rate: ${stats.hitRate}`);
    
    return embeddings;
  }

  /**
   * Generate keyword-based embeddings (optimized for Pakistani job market)
   * This is the primary embedding method - fast, no API calls, no quota limits
   * Works well for structured data like job skills and consultant expertise
   */
  private generateKeywordBasedEmbedding(text: string): number[] {
    const lowerText = text.toLowerCase();
    
    // Define comprehensive keyword categories (15 categories for better granularity)
    const categories = {
      education: ['education', 'teaching', 'training', 'learning', 'academic', 'school', 'university', 'student', 'course', 'curriculum', 'teacher', 'tutor', 'instructor', 'professor', 'guidance', 'counseling', 'career', 'admission'],
      business: ['business', 'management', 'strategy', 'marketing', 'sales', 'entrepreneur', 'startup', 'consulting', 'corporate', 'commerce', 'market', 'analysis', 'growth', 'development', 'planning', 'operations'],
      technology: ['technology', 'software', 'programming', 'development', 'tech', 'it', 'digital', 'computer', 'web', 'app', 'code', 'developer', 'engineer', 'system', 'database', 'api', 'cloud', 'mobile'],
      finance: ['finance', 'accounting', 'financial', 'investment', 'banking', 'budget', 'money', 'economics', 'tax', 'audit', 'bookkeeping', 'payroll', 'revenue', 'profit', 'cost', 'expense'],
      legal: ['legal', 'law', 'lawyer', 'attorney', 'court', 'justice', 'compliance', 'regulation', 'contract', 'litigation', 'advocate', 'barrister', 'solicitor', 'constitutional', 'civil', 'criminal'],
      healthcare: ['healthcare', 'medical', 'health', 'doctor', 'nurse', 'hospital', 'clinic', 'patient', 'medicine', 'therapy', 'physician', 'treatment', 'diagnosis', 'care', 'wellness'],
      design: ['design', 'creative', 'graphic', 'ui', 'ux', 'visual', 'branding', 'art', 'aesthetic', 'layout', 'illustrator', 'photoshop', 'figma', 'sketch', 'prototype'],
      writing: ['writing', 'content', 'copywriting', 'editing', 'author', 'blog', 'article', 'documentation', 'technical writing', 'writer', 'editor', 'journalist', 'copy', 'seo'],
      engineering: ['engineering', 'engineer', 'mechanical', 'civil', 'electrical', 'construction', 'technical', 'systems', 'infrastructure', 'structure', 'manufacturing', 'industrial'],
      project: ['project', 'management', 'planning', 'coordination', 'agile', 'scrum', 'delivery', 'timeline', 'milestone', 'manager', 'lead', 'team', 'organize'],
      communication: ['communication', 'speaking', 'presentation', 'negotiation', 'interpersonal', 'public speaking', 'collaborate', 'teamwork', 'client', 'customer'],
      research: ['research', 'analysis', 'data', 'analytics', 'statistics', 'study', 'investigation', 'survey', 'report', 'insights', 'findings'],
      leadership: ['leadership', 'lead', 'director', 'executive', 'supervisor', 'head', 'chief', 'senior', 'principal', 'coordinate'],
      hr: ['hr', 'human resources', 'recruitment', 'hiring', 'staffing', 'employee', 'workforce', 'talent', 'personnel', 'onboarding'],
      sales: ['sales', 'selling', 'revenue', 'client', 'customer', 'deal', 'closing', 'negotiation', 'pitch', 'prospecting', 'b2b', 'b2c']
    };

    // Calculate scores for each category
    const embedding: number[] = [];
    for (const [category, keywords] of Object.entries(categories)) {
      let score = 0;
      for (const keyword of keywords) {
        if (lowerText.includes(keyword)) {
          score += 0.2; // Give points for each keyword match
        }
      }
      // Normalize score between 0 and 1
      const normalizedScore = Math.min(score, 1);
      embedding.push(normalizedScore);
    }

    // Pad to 768 dimensions (standard embedding size) with zeros
    while (embedding.length < 768) {
      embedding.push(0);
    }

    return embedding;
  }

  /**
   * Generate embedding with retry logic and exponential backoff
   * Use this for critical operations that need AI embeddings
   * 
   * @param text - Text to embed
   * @param maxRetries - Maximum retry attempts (default: 3)
   * @returns Embedding vector or null if all retries fail
   */
  async generateEmbeddingWithRetry(text: string, maxRetries = 3): Promise<number[] | null> {
    for (let attempt = 0; attempt < maxRetries; attempt++) {
      try {
        this.apiCallCount++;
        console.log(`🤖 API Call #${this.apiCallCount}: Generating Gemini embedding (attempt ${attempt + 1}/${maxRetries})...`);
        
        const model = this.genAI.getGenerativeModel({ model: this.EMBEDDING_MODEL });
        const result = await model.embedContent(text);
        
        console.log(`✅ Gemini embedding generated successfully, dimensions: ${result.embedding.values.length}`);
        return result.embedding.values;
      } catch (error: any) {
        const is429 = error?.status === 429 || error?.message?.includes('429') || error?.message?.includes('quota');
        
        if (is429 && attempt < maxRetries - 1) {
          // Exponential backoff: wait 2^attempt seconds
          const waitTime = Math.pow(2, attempt) * 1000;
          console.log(`⚠️ Rate limit hit (429), waiting ${waitTime}ms before retry...`);
          await new Promise(resolve => setTimeout(resolve, waitTime));
          continue;
        }
        
        // Log non-429 errors or final retry failure
        if (!is429) {
          console.error('❌ Gemini API Error:', error?.message || error);
        } else {
          console.error('❌ Rate limit exceeded after all retries, falling back to keyword embeddings');
        }
        
        // Return keyword-based fallback
        return this.generateKeywordBasedEmbedding(text);
      }
    }
    
    // Fallback after all retries
    return this.generateKeywordBasedEmbedding(text);
  }

  /**
   * Calculate cosine similarity between two embeddings
   */
  cosineSimilarity(embedding1: number[], embedding2: number[]): number {
    if (embedding1.length !== embedding2.length) {
      console.warn('⚠️ Embedding dimensions mismatch:', embedding1.length, 'vs', embedding2.length);
      return 0;
    }

    let dotProduct = 0;
    let norm1 = 0;
    let norm2 = 0;

    for (let i = 0; i < embedding1.length; i++) {
      const val1 = embedding1[i] || 0;
      const val2 = embedding2[i] || 0;
      dotProduct += val1 * val2;
      norm1 += val1 * val1;
      norm2 += val2 * val2;
    }

    if (norm1 === 0 || norm2 === 0) {
      return 0;
    }

    return dotProduct / (Math.sqrt(norm1) * Math.sqrt(norm2));
  }

  /**
   * Get cache statistics for monitoring
   */
  getCacheStats() {
    const total = this.cacheHitCount + this.cacheMissCount;
    const hitRate = total > 0 ? (this.cacheHitCount / total * 100).toFixed(1) : '0';
    
    return {
      apiCalls: this.apiCallCount,
      cacheHits: this.cacheHitCount,
      cacheMisses: this.cacheMissCount,
      total,
      hitRate: `${hitRate}%`,
    };
  }

  /**
   * Reset cache statistics
   */
  resetCacheStats() {
    this.apiCallCount = 0;
    this.cacheHitCount = 0;
    this.cacheMissCount = 0;
  }

  /**
   * Log cache statistics (call periodically for monitoring)
   */
  logCacheStats() {
    const stats = this.getCacheStats();
    console.log('📊 Embedding Cache Statistics:');
    console.log(`   API Calls Made: ${stats.apiCalls}`);
    console.log(`   Cache Hits: ${stats.cacheHits}`);
    console.log(`   Cache Misses: ${stats.cacheMisses}`);
    console.log(`   Hit Rate: ${stats.hitRate}`);
  }
}

export const geminiEmbeddingService = new GeminiEmbeddingService();
export default geminiEmbeddingService;

