/**
 * @file Vector Search Engine for XrefHub Policy Analysis
 * Provides semantic search capabilities using vector embeddings
 */

// Vector Search Engine Class
export class VectorSearchEngine {
  constructor() {
    this.embeddings = new Map();
    this.documentIndex = new Map();
    this.cache = new Map();
    this.cacheTTL = 3600000; // 1 hour
  }

  /**
   * Generate embeddings for a document using AI API
   * @param {string} content - Document content
   * @param {string} provider - AI provider (gemini, openai, etc.)
   * @returns {Promise<Array>} Embedding vector
   */
  async generateEmbedding(content, provider = 'gemini') {
    try {
      const apiKey = await this.getApiKey(provider);
      if (!apiKey) {
        throw new Error(`No API key found for provider: ${provider}`);
      }

      // Truncate content if too long for embedding
      const truncatedContent = this.truncateForEmbedding(content);
      
      if (provider === 'gemini') {
        return await this.generateGeminiEmbedding(truncatedContent, apiKey);
      } else if (provider === 'openai') {
        return await this.generateOpenAIEmbedding(truncatedContent, apiKey);
      } else {
        throw new Error(`Unsupported provider: ${provider}`);
      }
    } catch (error) {
      console.error('Error generating embedding:', error);
      return null;
    }
  }

  /**
   * Generate embedding using Gemini API
   */
  async generateGeminiEmbedding(content, apiKey) {
    const model = 'embedding-001';
    const response = await fetch(`https://generativelanguage.googleapis.com/v1/models/${model}:embedContent?key=${apiKey}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        content: {
          parts: [{ text: content }]
        }
      })
    });

    if (!response.ok) {
      throw new Error(`Gemini embedding API error: ${response.status}`);
    }

    const data = await response.json();
    return data.embedding.values;
  }

  /**
   * Generate embedding using OpenAI API
   */
  async generateOpenAIEmbedding(content, apiKey) {
    const response = await fetch('https://api.openai.com/v1/embeddings', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        input: content,
        model: 'text-embedding-ada-002'
      })
    });

    if (!response.ok) {
      throw new Error(`OpenAI embedding API error: ${response.status}`);
    }

    const data = await response.json();
    return data.data[0].embedding;
  }

  /**
   * Compute cosine similarity between two vectors
   */
  computeCosineSimilarity(vecA, vecB) {
    if (vecA.length !== vecB.length) {
      throw new Error('Vector dimensions must match');
    }

    let dotProduct = 0;
    let normA = 0;
    let normB = 0;

    for (let i = 0; i < vecA.length; i++) {
      dotProduct += vecA[i] * vecB[i];
      normA += vecA[i] * vecA[i];
      normB += vecB[i] * vecB[i];
    }

    normA = Math.sqrt(normA);
    normB = Math.sqrt(normB);

    if (normA === 0 || normB === 0) return 0;
    return dotProduct / (normA * normB);
  }

  /**
   * Search for similar documents using semantic similarity
   */
  async searchSimilar(query, topK = 5, category = 'all') {
    try {
      // Check cache first
      const cacheKey = this.generateCacheKey(query, category, topK);
      const cached = this.getFromCache(cacheKey);
      if (cached) {
        console.log('[VectorSearch] Returning cached results');
        return cached;
      }

      // Generate query embedding
      const queryEmbedding = await this.generateEmbedding(query);
      if (!queryEmbedding) {
        throw new Error('Failed to generate query embedding');
      }

      // Compute similarities with all documents
      const similarities = [];
      for (const [docId, docData] of this.documentIndex) {
        if (category !== 'all' && docData.category !== category) {
          continue;
        }

        const similarity = this.computeCosineSimilarity(queryEmbedding, docData.embedding);
        similarities.push({
          id: docId,
          similarity: similarity,
          metadata: docData.metadata
        });
      }

      // Sort by similarity and return top K
      similarities.sort((a, b) => b.similarity - a.similarity);
      const results = similarities.slice(0, topK);

      // Cache results
      this.addToCache(cacheKey, results);

      console.log(`[VectorSearch] Found ${results.length} similar documents`);
      return results;
    } catch (error) {
      console.error('Error in semantic search:', error);
      return [];
    }
  }

  /**
   * Index a document for search
   */
  async indexDocument(document) {
    try {
      const embedding = await this.generateEmbedding(document.content);
      if (!embedding) {
        console.warn(`Failed to generate embedding for document: ${document.id}`);
        return false;
      }

      this.documentIndex.set(document.id, {
        embedding: embedding,
        metadata: document.metadata,
        category: document.category || 'general',
        timestamp: Date.now()
      });

      console.log(`[VectorSearch] Indexed document: ${document.id}`);
      return true;
    } catch (error) {
      console.error('Error indexing document:', error);
      return false;
    }
  }

  /**
   * Batch index multiple documents
   */
  async batchIndexDocuments(documents) {
    const results = [];
    for (const doc of documents) {
      const success = await this.indexDocument(doc);
      results.push({ id: doc.id, success });
    }
    return results;
  }

  /**
   * Remove document from index
   */
  removeFromIndex(documentId) {
    const removed = this.documentIndex.delete(documentId);
    if (removed) {
      console.log(`[VectorSearch] Removed document from index: ${documentId}`);
    }
    return removed;
  }

  /**
   * Get document by ID
   */
  getDocument(documentId) {
    return this.documentIndex.get(documentId);
  }

  /**
   * Get all indexed documents
   */
  getAllDocuments() {
    return Array.from(this.documentIndex.entries()).map(([id, data]) => ({
      id,
      metadata: data.metadata,
      category: data.category,
      timestamp: data.timestamp
    }));
  }

  /**
   * Clear all cached data
   */
  clearCache() {
    this.cache.clear();
    console.log('[VectorSearch] Cache cleared');
  }

  /**
   * Generate cache key
   */
  generateCacheKey(query, category, topK) {
    return `search:${btoa(query)}:${category}:${topK}`;
  }

  /**
   * Get from cache
   */
  getFromCache(key) {
    const cached = this.cache.get(key);
    if (cached && Date.now() - cached.timestamp < this.cacheTTL) {
      return cached.data;
    }
    if (cached) {
      this.cache.delete(key); // Remove expired cache
    }
    return null;
  }

  /**
   * Add to cache
   */
  addToCache(key, data) {
    this.cache.set(key, {
      data: data,
      timestamp: Date.now()
    });
  }

  /**
   * Truncate content for embedding (most APIs have limits)
   */
  truncateForEmbedding(content, maxLength = 8000) {
    if (content.length <= maxLength) return content;
    return content.substring(0, maxLength) + '...';
  }

  /**
   * Get API key for provider
   */
  async getApiKey(provider) {
    return new Promise((resolve) => {
      chrome.storage.local.get(['settings'], (result) => {
        if (provider === 'gemini') {
          resolve(result.settings?.geminiApiKey);
        } else if (provider === 'openai') {
          resolve(result.settings?.chatgptApiKey);
        } else {
          resolve(null);
        }
      });
    });
  }

  /**
   * Get search statistics
   */
  getStats() {
    return {
      indexedDocuments: this.documentIndex.size,
      cachedQueries: this.cache.size,
      totalEmbeddings: this.embeddings.size
    };
  }
}

// Singleton instance
let vectorSearchEngine = null;

/**
 * Get or create the vector search engine instance
 */
export function getVectorSearchEngine() {
  if (!vectorSearchEngine) {
    vectorSearchEngine = new VectorSearchEngine();
  }
  return vectorSearchEngine;
}

/**
 * Enhanced document fetching with semantic search
 */
export async function fetchRelevantDocuments(query, category = 'all', limit = 5) {
  const engine = getVectorSearchEngine();
  
  // Perform semantic search
  const similarDocs = await engine.searchSimilar(query, limit, category);
  
  // Fetch full document content for the most relevant documents
  const documents = [];
  for (const doc of similarDocs) {
    const fullDoc = await fetchDocumentById(doc.id);
    if (fullDoc) {
      documents.push({
        ...fullDoc,
        relevanceScore: doc.similarity
      });
    }
  }
  
  return documents;
}

/**
 * Fetch document by ID from Google Drive
 */
async function fetchDocumentById(documentId) {
  try {
    // This would integrate with your existing google-drive.js
    // For now, return a placeholder
    return {
      id: documentId,
      content: `Document content for ${documentId}`,
      metadata: {
        name: `Document ${documentId}`,
        category: 'policy'
      }
    };
  } catch (error) {
    console.error('Error fetching document:', error);
    return null;
  }
}

/**
 * Initialize vector search with existing documents
 */
export async function initializeVectorSearch() {
  const engine = getVectorSearchEngine();
  
  // Fetch existing documents from Google Drive
  const documents = await fetchAllStructuredDocuments();
  
  // Index all documents
  const results = await engine.batchIndexDocuments(documents);
  
  console.log(`[VectorSearch] Initialized with ${results.length} documents`);
  return results;
} 