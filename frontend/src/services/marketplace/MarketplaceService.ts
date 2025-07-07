import { v4 as uuidv4 } from 'uuid';
import { ethers, BrowserProvider, Contract, parseEther, formatEther } from 'ethers';
import Web3 from 'web3';

export interface MarketplaceModel {
  id: string;
  name: string;
  description: string;
  category: 'text-generation' | 'image-generation' | 'classification' | 'nlp' | 'computer-vision' | 'audio' | 'custom';
  tags: string[];
  author: {
    id: string;
    name: string;
    avatar?: string;
    verified: boolean;
    reputation: number;
  };
  pricing: {
    type: 'free' | 'paid' | 'subscription' | 'pay-per-use';
    price?: number;
    currency: 'USD' | 'ETH' | 'MATIC' | 'GENX';
    subscriptionPeriod?: 'monthly' | 'yearly';
    payPerUseRate?: number;
  };
  performance: {
    accuracy: number;
    latency: number;
    throughput: number;
    modelSize: number;
    parameters: number;
  };
  usage: {
    downloads: number;
    ratings: number;
    averageRating: number;
    reviews: number;
    lastUpdated: Date;
  };
  technical: {
    framework: 'tensorflow' | 'pytorch' | 'onnx' | 'custom';
    version: string;
    inputFormat: string;
    outputFormat: string;
    requirements: string[];
    compatibility: string[];
  };
  blockchain: {
    contractAddress?: string;
    tokenId?: string;
    ipfsHash?: string;
    verified: boolean;
    license: 'MIT' | 'Apache-2.0' | 'GPL-3.0' | 'Commercial' | 'Custom';
  };
  status: 'draft' | 'pending' | 'approved' | 'rejected' | 'deprecated';
  createdAt: Date;
  updatedAt: Date;
}

export interface MarketplaceTransaction {
  id: string;
  type: 'purchase' | 'subscription' | 'usage' | 'royalty';
  modelId: string;
  buyerId: string;
  sellerId: string;
  amount: number;
  currency: string;
  status: 'pending' | 'completed' | 'failed' | 'refunded';
  blockchainTxHash?: string;
  createdAt: Date;
  completedAt?: Date;
}

export interface MarketplaceReview {
  id: string;
  modelId: string;
  userId: string;
  rating: number;
  title: string;
  content: string;
  pros: string[];
  cons: string[];
  verified: boolean;
  helpful: number;
  createdAt: Date;
}

export interface MarketplaceCollection {
  id: string;
  name: string;
  description: string;
  models: string[];
  author: {
    id: string;
    name: string;
    avatar?: string;
  };
  tags: string[];
  public: boolean;
  featured: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface MarketplaceAnalytics {
  totalModels: number;
  totalTransactions: number;
  totalRevenue: number;
  topCategories: Array<{ category: string; count: number }>;
  topAuthors: Array<{ author: string; revenue: number; models: number }>;
  recentActivity: Array<{
    type: 'model_published' | 'model_purchased' | 'review_added';
    timestamp: Date;
    data: any;
  }>;
  trending: MarketplaceModel[];
  featured: MarketplaceModel[];
}

export interface BlockchainConfig {
  network: 'ethereum' | 'polygon' | 'bsc' | 'avalanche' | 'arbitrum';
  rpcUrl: string;
  contractAddress: string;
  ipfsGateway: string;
}

export class MarketplaceService {
  private models: Map<string, MarketplaceModel> = new Map();
  private transactions: Map<string, MarketplaceTransaction> = new Map();
  private reviews: Map<string, MarketplaceReview> = new Map();
  private collections: Map<string, MarketplaceCollection> = new Map();
  private web3: Web3 | null = null;
  private provider: BrowserProvider | null = null;
  private contract: Contract | null = null;
  private readonly STORAGE_KEY = 'genxcoder-marketplace';

  private readonly BLOCKCHAIN_CONFIG: BlockchainConfig = {
    network: 'polygon',
    rpcUrl: 'https://polygon-rpc.com',
    contractAddress: '0x1234567890123456789012345678901234567890',
    ipfsGateway: 'https://ipfs.io/ipfs/'
  };

  // Smart contract ABI for AI model marketplace
  private readonly CONTRACT_ABI = [
    {
      "inputs": [
        {"name": "_modelId", "type": "string"},
        {"name": "_price", "type": "uint256"},
        {"name": "_ipfsHash", "type": "string"}
      ],
      "name": "publishModel",
      "outputs": [{"name": "", "type": "uint256"}],
      "type": "function"
    },
    {
      "inputs": [{"name": "_tokenId", "type": "uint256"}],
      "name": "purchaseModel",
      "outputs": [],
      "payable": true,
      "type": "function"
    },
    {
      "inputs": [{"name": "_tokenId", "type": "uint256"}],
      "name": "getModel",
      "outputs": [
        {"name": "modelId", "type": "string"},
        {"name": "price", "type": "uint256"},
        {"name": "ipfsHash", "type": "string"},
        {"name": "owner", "type": "address"}
      ],
      "type": "function"
    }
  ];

  constructor() {
    this.loadFromStorage();
    this.initializeBlockchain();
    this.generateMockData();
  }

  // Blockchain Integration
  async initializeBlockchain(): Promise<void> {
    try {
      if (typeof window !== 'undefined' && (window as any).ethereum) {
        this.web3 = new Web3((window as any).ethereum);
        this.provider = new BrowserProvider((window as any).ethereum);
        
        const signer = await this.provider.getSigner();
        this.contract = new Contract(
          this.BLOCKCHAIN_CONFIG.contractAddress,
          this.CONTRACT_ABI,
          signer
        );
        
        console.log('Blockchain initialized successfully');
      } else {
        console.warn('No Web3 provider found. Blockchain features disabled.');
      }
    } catch (error) {
      console.error('Failed to initialize blockchain:', error);
    }
  }

  async connectWallet(): Promise<string | null> {
    try {
      if (!this.provider) {
        throw new Error('Web3 provider not available');
      }

      await (window as any).ethereum.request({ method: 'eth_requestAccounts' });
      const signer = await this.provider.getSigner();
      const address = await signer.getAddress();
      
      console.log('Wallet connected:', address);
      return address;
    } catch (error) {
      console.error('Failed to connect wallet:', error);
      return null;
    }
  }

  async publishModelToBlockchain(model: MarketplaceModel): Promise<string | null> {
    try {
      if (!this.contract) {
        throw new Error('Smart contract not initialized');
      }

      const priceInWei = parseEther(model.pricing.price?.toString() || '0');
      
      const tx = await this.contract.publishModel(
        model.id,
        priceInWei,
        model.blockchain.ipfsHash || ''
      );
      
      const receipt = await tx.wait();
      console.log('Model published to blockchain:', receipt.hash);
      
      return receipt.hash;
    } catch (error) {
      console.error('Failed to publish model to blockchain:', error);
      return null;
    }
  }

  async purchaseModelFromBlockchain(tokenId: string, price: number): Promise<string | null> {
    try {
      if (!this.contract) {
        throw new Error('Smart contract not initialized');
      }

      const priceInWei = parseEther(price.toString());
      
      const tx = await this.contract.purchaseModel(tokenId, {
        value: priceInWei
      });
      
      const receipt = await tx.wait();
      console.log('Model purchased from blockchain:', receipt.hash);
      
      return receipt.hash;
    } catch (error) {
      console.error('Failed to purchase model from blockchain:', error);
      return null;
    }
  }

  // Model Management
  async publishModel(model: Omit<MarketplaceModel, 'id' | 'createdAt' | 'updatedAt' | 'usage'>): Promise<MarketplaceModel> {
    const modelId = uuidv4();
    
    const newModel: MarketplaceModel = {
      ...model,
      id: modelId,
      usage: {
        downloads: 0,
        ratings: 0,
        averageRating: 0,
        reviews: 0,
        lastUpdated: new Date()
      },
      status: 'pending',
      createdAt: new Date(),
      updatedAt: new Date()
    };

    // Publish to blockchain if enabled
    if (model.blockchain.verified && this.contract) {
      const txHash = await this.publishModelToBlockchain(newModel);
      if (txHash) {
        newModel.blockchain.contractAddress = this.BLOCKCHAIN_CONFIG.contractAddress;
      }
    }

    this.models.set(modelId, newModel);
    this.saveToStorage();
    return newModel;
  }

  async getModel(modelId: string): Promise<MarketplaceModel | null> {
    return this.models.get(modelId) || null;
  }

  async searchModels(query: {
    search?: string;
    category?: string;
    tags?: string[];
    priceRange?: { min: number; max: number };
    rating?: number;
    sortBy?: 'popularity' | 'rating' | 'price' | 'recent';
    limit?: number;
    offset?: number;
  }): Promise<{ models: MarketplaceModel[]; total: number }> {
    let filteredModels = Array.from(this.models.values()).filter(model => 
      model.status === 'approved'
    );

    // Apply filters
    if (query.search) {
      const searchLower = query.search.toLowerCase();
      filteredModels = filteredModels.filter(model =>
        model.name.toLowerCase().includes(searchLower) ||
        model.description.toLowerCase().includes(searchLower) ||
        model.tags.some(tag => tag.toLowerCase().includes(searchLower))
      );
    }

    if (query.category) {
      filteredModels = filteredModels.filter(model => model.category === query.category);
    }

    if (query.tags && query.tags.length > 0) {
      filteredModels = filteredModels.filter(model =>
        query.tags!.some(tag => model.tags.includes(tag))
      );
    }

    if (query.priceRange) {
      filteredModels = filteredModels.filter(model => {
        const price = model.pricing.price || 0;
        return price >= query.priceRange!.min && price <= query.priceRange!.max;
      });
    }

    if (query.rating) {
      filteredModels = filteredModels.filter(model => 
        model.usage.averageRating >= query.rating!
      );
    }

    // Apply sorting
    switch (query.sortBy) {
      case 'popularity':
        filteredModels.sort((a, b) => b.usage.downloads - a.usage.downloads);
        break;
      case 'rating':
        filteredModels.sort((a, b) => b.usage.averageRating - a.usage.averageRating);
        break;
      case 'price':
        filteredModels.sort((a, b) => (a.pricing.price || 0) - (b.pricing.price || 0));
        break;
      case 'recent':
        filteredModels.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
        break;
      default:
        filteredModels.sort((a, b) => b.usage.downloads - a.usage.downloads);
    }

    const total = filteredModels.length;
    const offset = query.offset || 0;
    const limit = query.limit || 20;
    const models = filteredModels.slice(offset, offset + limit);

    return { models, total };
  }

  async getFeaturedModels(): Promise<MarketplaceModel[]> {
    return Array.from(this.models.values())
      .filter(model => model.status === 'approved')
      .sort((a, b) => b.usage.downloads - a.usage.downloads)
      .slice(0, 10);
  }

  async getTrendingModels(): Promise<MarketplaceModel[]> {
    const oneWeekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    
    return Array.from(this.models.values())
      .filter(model => 
        model.status === 'approved' && 
        model.usage.lastUpdated > oneWeekAgo
      )
      .sort((a, b) => b.usage.downloads - a.usage.downloads)
      .slice(0, 10);
  }

  // Transaction Management
  async purchaseModel(modelId: string, buyerId: string): Promise<MarketplaceTransaction> {
    const model = await this.getModel(modelId);
    if (!model) {
      throw new Error('Model not found');
    }

    const transactionId = uuidv4();
    const transaction: MarketplaceTransaction = {
      id: transactionId,
      type: 'purchase',
      modelId,
      buyerId,
      sellerId: model.author.id,
      amount: model.pricing.price || 0,
      currency: model.pricing.currency,
      status: 'pending',
      createdAt: new Date()
    };

    // Process blockchain transaction if applicable
    if (model.blockchain.verified && model.blockchain.tokenId) {
      const txHash = await this.purchaseModelFromBlockchain(
        model.blockchain.tokenId,
        model.pricing.price || 0
      );
      if (txHash) {
        transaction.blockchainTxHash = txHash;
        transaction.status = 'completed';
        transaction.completedAt = new Date();
        
        // Update model usage
        model.usage.downloads += 1;
        this.models.set(modelId, model);
      }
    } else {
      // Simulate payment processing
      setTimeout(() => {
        transaction.status = 'completed';
        transaction.completedAt = new Date();
        model.usage.downloads += 1;
        this.models.set(modelId, model);
        this.saveToStorage();
      }, 2000);
    }

    this.transactions.set(transactionId, transaction);
    this.saveToStorage();
    return transaction;
  }

  async getTransaction(transactionId: string): Promise<MarketplaceTransaction | null> {
    return this.transactions.get(transactionId) || null;
  }

  async getUserTransactions(userId: string): Promise<MarketplaceTransaction[]> {
    return Array.from(this.transactions.values()).filter(
      tx => tx.buyerId === userId || tx.sellerId === userId
    );
  }

  // Review Management
  async addReview(review: Omit<MarketplaceReview, 'id' | 'createdAt'>): Promise<MarketplaceReview> {
    const reviewId = uuidv4();
    const newReview: MarketplaceReview = {
      ...review,
      id: reviewId,
      helpful: 0,
      createdAt: new Date()
    };

    this.reviews.set(reviewId, newReview);

    // Update model rating
    const model = await this.getModel(review.modelId);
    if (model) {
      const modelReviews = this.getModelReviews(review.modelId);
      const totalRating = modelReviews.reduce((sum, r) => sum + r.rating, 0);
      model.usage.averageRating = totalRating / modelReviews.length;
      model.usage.ratings = modelReviews.length;
      model.usage.reviews = modelReviews.length;
      this.models.set(review.modelId, model);
    }

    this.saveToStorage();
    return newReview;
  }

  getModelReviews(modelId: string): MarketplaceReview[] {
    return Array.from(this.reviews.values()).filter(review => review.modelId === modelId);
  }

  // Collection Management
  async createCollection(collection: Omit<MarketplaceCollection, 'id' | 'createdAt' | 'updatedAt'>): Promise<MarketplaceCollection> {
    const collectionId = uuidv4();
    const newCollection: MarketplaceCollection = {
      ...collection,
      id: collectionId,
      createdAt: new Date(),
      updatedAt: new Date()
    };

    this.collections.set(collectionId, newCollection);
    this.saveToStorage();
    return newCollection;
  }

  async getCollection(collectionId: string): Promise<MarketplaceCollection | null> {
    return this.collections.get(collectionId) || null;
  }

  async getFeaturedCollections(): Promise<MarketplaceCollection[]> {
    return Array.from(this.collections.values())
      .filter(collection => collection.featured && collection.public)
      .slice(0, 6);
  }

  // Analytics
  async getMarketplaceAnalytics(): Promise<MarketplaceAnalytics> {
    const models = Array.from(this.models.values());
    const transactions = Array.from(this.transactions.values());

    const totalRevenue = transactions
      .filter(tx => tx.status === 'completed')
      .reduce((sum, tx) => sum + tx.amount, 0);

    const categoryCount = models.reduce((acc, model) => {
      acc[model.category] = (acc[model.category] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const topCategories = Object.entries(categoryCount)
      .map(([category, count]) => ({ category, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);

    const authorStats = models.reduce((acc, model) => {
      const authorId = model.author.id;
      if (!acc[authorId]) {
        acc[authorId] = {
          author: model.author.name,
          revenue: 0,
          models: 0
        };
      }
      acc[authorId].models += 1;
      
      const authorTransactions = transactions.filter(
        tx => tx.sellerId === authorId && tx.status === 'completed'
      );
      acc[authorId].revenue = authorTransactions.reduce((sum, tx) => sum + tx.amount, 0);
      
      return acc;
    }, {} as Record<string, { author: string; revenue: number; models: number }>);

    const topAuthors = Object.values(authorStats)
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, 5);

    const recentActivity = [
      ...models.slice(-10).map(model => ({
        type: 'model_published' as const,
        timestamp: model.createdAt,
        data: { modelName: model.name, author: model.author.name }
      })),
      ...transactions.slice(-10).map(tx => ({
        type: 'model_purchased' as const,
        timestamp: tx.createdAt,
        data: { transactionId: tx.id, amount: tx.amount }
      }))
    ].sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime()).slice(0, 20);

    return {
      totalModels: models.length,
      totalTransactions: transactions.length,
      totalRevenue,
      topCategories,
      topAuthors,
      recentActivity,
      trending: await this.getTrendingModels(),
      featured: await this.getFeaturedModels()
    };
  }

  // Utility Methods
  private generateMockData(): void {
    if (this.models.size > 0) return; // Don't generate if data already exists

    // Generate mock models
    const mockModels: Partial<MarketplaceModel>[] = [
      {
        name: 'GPT-4 Text Generator',
        description: 'Advanced text generation model based on GPT-4 architecture',
        category: 'text-generation',
        tags: ['nlp', 'text', 'generation', 'gpt'],
        author: {
          id: 'author1',
          name: 'AI Research Lab',
          verified: true,
          reputation: 95
        },
        pricing: {
          type: 'paid',
          price: 99.99,
          currency: 'USD'
        },
        performance: {
          accuracy: 94.5,
          latency: 150,
          throughput: 1000,
          modelSize: 175000,
          parameters: 175000000000
        },
        technical: {
          framework: 'tensorflow',
          version: '2.1.0',
          inputFormat: 'text',
          outputFormat: 'text',
          requirements: ['tensorflow>=2.0', 'transformers>=4.0'],
          compatibility: ['python', 'javascript', 'api']
        },
        blockchain: {
          verified: true,
          license: 'Commercial'
        }
      },
      {
        name: 'Image Classification Pro',
        description: 'High-accuracy image classification model for 1000+ categories',
        category: 'computer-vision',
        tags: ['vision', 'classification', 'images', 'cnn'],
        author: {
          id: 'author2',
          name: 'VisionAI Corp',
          verified: true,
          reputation: 88
        },
        pricing: {
          type: 'subscription',
          price: 29.99,
          currency: 'USD',
          subscriptionPeriod: 'monthly'
        },
        performance: {
          accuracy: 96.2,
          latency: 50,
          throughput: 5000,
          modelSize: 25,
          parameters: 25000000
        },
        technical: {
          framework: 'pytorch',
          version: '1.5.0',
          inputFormat: 'image',
          outputFormat: 'json',
          requirements: ['torch>=1.5', 'torchvision>=0.6'],
          compatibility: ['python', 'api']
        },
        blockchain: {
          verified: false,
          license: 'MIT'
        }
      },
      {
        name: 'Sentiment Analysis Engine',
        description: 'Real-time sentiment analysis for social media and reviews',
        category: 'nlp',
        tags: ['sentiment', 'analysis', 'nlp', 'social'],
        author: {
          id: 'author3',
          name: 'SentimentAI',
          verified: true,
          reputation: 92
        },
        pricing: {
          type: 'pay-per-use',
          payPerUseRate: 0.001,
          currency: 'USD'
        },
        performance: {
          accuracy: 91.8,
          latency: 25,
          throughput: 10000,
          modelSize: 5,
          parameters: 5000000
        },
        technical: {
          framework: 'tensorflow',
          version: '1.2.0',
          inputFormat: 'text',
          outputFormat: 'json',
          requirements: ['tensorflow>=2.0', 'numpy>=1.19'],
          compatibility: ['python', 'javascript', 'api']
        },
        blockchain: {
          verified: true,
          license: 'Apache-2.0'
        }
      }
    ];

    mockModels.forEach(async (mockModel) => {
      await this.publishModel(mockModel as any);
    });
  }

  private saveToStorage(): void {
    try {
      const data = {
        models: Array.from(this.models.entries()),
        transactions: Array.from(this.transactions.entries()),
        reviews: Array.from(this.reviews.entries()),
        collections: Array.from(this.collections.entries()),
        lastUpdated: new Date().toISOString()
      };

      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(data));
    } catch (error) {
      console.warn('Failed to save marketplace data:', error);
    }
  }

  private loadFromStorage(): void {
    try {
      const data = localStorage.getItem(this.STORAGE_KEY);
      if (data) {
        const parsed = JSON.parse(data);
        
        this.models = new Map(parsed.models || []);
        this.transactions = new Map(parsed.transactions || []);
        this.reviews = new Map(parsed.reviews || []);
        this.collections = new Map(parsed.collections || []);

        // Convert date strings back to Date objects
        this.models.forEach(model => {
          model.createdAt = new Date(model.createdAt);
          model.updatedAt = new Date(model.updatedAt);
          model.usage.lastUpdated = new Date(model.usage.lastUpdated);
        });

        this.transactions.forEach(transaction => {
          transaction.createdAt = new Date(transaction.createdAt);
          if (transaction.completedAt) {
            transaction.completedAt = new Date(transaction.completedAt);
          }
        });

        this.reviews.forEach(review => {
          review.createdAt = new Date(review.createdAt);
        });

        this.collections.forEach(collection => {
          collection.createdAt = new Date(collection.createdAt);
          collection.updatedAt = new Date(collection.updatedAt);
        });
      }
    } catch (error) {
      console.warn('Failed to load marketplace data:', error);
    }
  }

  // Public utility methods
  clearAllData(): void {
    this.models.clear();
    this.transactions.clear();
    this.reviews.clear();
    this.collections.clear();
    localStorage.removeItem(this.STORAGE_KEY);
  }

  getModelCount(): number {
    return this.models.size;
  }

  getTotalRevenue(): number {
    return Array.from(this.transactions.values())
      .filter(tx => tx.status === 'completed')
      .reduce((sum, tx) => sum + tx.amount, 0);
  }
}

// Singleton instance
export const marketplaceService = new MarketplaceService();
