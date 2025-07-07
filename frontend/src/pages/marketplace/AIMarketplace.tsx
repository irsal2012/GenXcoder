import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  Search,
  Filter,
  Star,
  Download,
  Eye,
  ShoppingCart,
  Zap,
  Shield,
  TrendingUp,
  Award,
  Users,
  Clock,
  DollarSign,
  Tag,
  Grid,
  List,
  SortAsc,
  Heart,
  Share2,
  ExternalLink,
  Verified,
  Cpu,
  Database,
  Globe,
  Wallet
} from 'lucide-react';
import { marketplaceService, MarketplaceModel, MarketplaceAnalytics } from '../../services/marketplace/MarketplaceService';

export const AIMarketplace: React.FC = () => {
  const [models, setModels] = useState<MarketplaceModel[]>([]);
  const [featuredModels, setFeaturedModels] = useState<MarketplaceModel[]>([]);
  const [trendingModels, setTrendingModels] = useState<MarketplaceModel[]>([]);
  const [analytics, setAnalytics] = useState<MarketplaceAnalytics | null>(null);
  const [selectedModel, setSelectedModel] = useState<MarketplaceModel | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('');
  const [priceRange, setPriceRange] = useState<{ min: number; max: number }>({ min: 0, max: 1000 });
  const [sortBy, setSortBy] = useState<'popularity' | 'rating' | 'price' | 'recent'>('popularity');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [showFilters, setShowFilters] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [walletConnected, setWalletConnected] = useState(false);
  const [walletAddress, setWalletAddress] = useState<string | null>(null);

  const categories = [
    { id: 'text-generation', name: 'Text Generation', icon: '📝' },
    { id: 'image-generation', name: 'Image Generation', icon: '🎨' },
    { id: 'classification', name: 'Classification', icon: '🏷️' },
    { id: 'nlp', name: 'NLP', icon: '💬' },
    { id: 'computer-vision', name: 'Computer Vision', icon: '👁️' },
    { id: 'audio', name: 'Audio', icon: '🎵' },
    { id: 'custom', name: 'Custom', icon: '⚙️' }
  ];

  useEffect(() => {
    loadData();
  }, [searchQuery, selectedCategory, sortBy]);

  const loadData = async () => {
    setIsLoading(true);
    try {
      const searchResults = await marketplaceService.searchModels({
        search: searchQuery || undefined,
        category: selectedCategory || undefined,
        sortBy,
        limit: 20
      });
      
      setModels(searchResults.models);
      
      const [featured, trending, analyticsData] = await Promise.all([
        marketplaceService.getFeaturedModels(),
        marketplaceService.getTrendingModels(),
        marketplaceService.getMarketplaceAnalytics()
      ]);
      
      setFeaturedModels(featured);
      setTrendingModels(trending);
      setAnalytics(analyticsData);
    } catch (error) {
      console.error('Failed to load marketplace data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleConnectWallet = async () => {
    try {
      const address = await marketplaceService.connectWallet();
      if (address) {
        setWalletConnected(true);
        setWalletAddress(address);
      }
    } catch (error) {
      console.error('Failed to connect wallet:', error);
    }
  };

  const handlePurchaseModel = async (modelId: string) => {
    try {
      if (!walletConnected) {
        await handleConnectWallet();
        return;
      }
      
      const transaction = await marketplaceService.purchaseModel(modelId, 'user123');
      console.log('Purchase initiated:', transaction);
      
      // Refresh data to show updated download count
      loadData();
    } catch (error) {
      console.error('Failed to purchase model:', error);
    }
  };

  const formatPrice = (model: MarketplaceModel) => {
    if (model.pricing.type === 'free') return 'Free';
    if (model.pricing.type === 'pay-per-use') return `$${model.pricing.payPerUseRate}/use`;
    return `$${model.pricing.price} ${model.pricing.currency}`;
  };

  const renderModelCard = (model: MarketplaceModel) => (
    <motion.div
      key={model.id}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white rounded-2xl shadow-sm border border-gray-200 hover:shadow-lg transition-all duration-300 overflow-hidden group"
    >
      {/* Model Header */}
      <div className="p-6 pb-4">
        <div className="flex items-start justify-between mb-3">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-blue-100 rounded-xl">
              <Cpu className="w-6 h-6 text-blue-600" />
            </div>
            <div>
              <h3 className="font-semibold text-gray-900 group-hover:text-blue-600 transition-colors">
                {model.name}
              </h3>
              <div className="flex items-center space-x-2 mt-1">
                <span className="text-sm text-gray-600">{model.author.name}</span>
                {model.author.verified && (
                  <Verified className="w-4 h-4 text-blue-500" />
                )}
                {model.blockchain.verified && (
                  <Shield className="w-4 h-4 text-green-500" />
                )}
              </div>
            </div>
          </div>
          
          <div className="flex items-center space-x-2">
            <button className="p-2 text-gray-400 hover:text-red-500 transition-colors">
              <Heart className="w-4 h-4" />
            </button>
            <button className="p-2 text-gray-400 hover:text-blue-500 transition-colors">
              <Share2 className="w-4 h-4" />
            </button>
          </div>
        </div>

        <p className="text-sm text-gray-600 mb-4 line-clamp-2">{model.description}</p>

        {/* Tags */}
        <div className="flex flex-wrap gap-2 mb-4">
          {model.tags.slice(0, 3).map((tag) => (
            <span
              key={tag}
              className="px-2 py-1 bg-gray-100 text-gray-600 text-xs rounded-lg"
            >
              {tag}
            </span>
          ))}
          {model.tags.length > 3 && (
            <span className="px-2 py-1 bg-gray-100 text-gray-600 text-xs rounded-lg">
              +{model.tags.length - 3}
            </span>
          )}
        </div>

        {/* Performance Metrics */}
        <div className="grid grid-cols-3 gap-3 mb-4">
          <div className="text-center p-2 bg-gray-50 rounded-lg">
            <p className="text-sm font-bold text-gray-900">{model.performance.accuracy.toFixed(1)}%</p>
            <p className="text-xs text-gray-600">Accuracy</p>
          </div>
          <div className="text-center p-2 bg-gray-50 rounded-lg">
            <p className="text-sm font-bold text-gray-900">{model.performance.latency}ms</p>
            <p className="text-xs text-gray-600">Latency</p>
          </div>
          <div className="text-center p-2 bg-gray-50 rounded-lg">
            <p className="text-sm font-bold text-gray-900">{model.usage.downloads}</p>
            <p className="text-xs text-gray-600">Downloads</p>
          </div>
        </div>

        {/* Rating */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-2">
            <div className="flex items-center">
              {[...Array(5)].map((_, i) => (
                <Star
                  key={i}
                  className={`w-4 h-4 ${
                    i < Math.floor(model.usage.averageRating)
                      ? 'text-yellow-400 fill-current'
                      : 'text-gray-300'
                  }`}
                />
              ))}
            </div>
            <span className="text-sm text-gray-600">
              {model.usage.averageRating.toFixed(1)} ({model.usage.reviews})
            </span>
          </div>
          
          <div className="text-right">
            <p className="text-lg font-bold text-gray-900">{formatPrice(model)}</p>
            {model.pricing.type === 'subscription' && (
              <p className="text-xs text-gray-600">/{model.pricing.subscriptionPeriod}</p>
            )}
          </div>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="px-6 pb-6">
        <div className="flex space-x-2">
          <button
            onClick={() => setSelectedModel(model)}
            className="flex-1 flex items-center justify-center space-x-2 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
          >
            <Eye className="w-4 h-4" />
            <span>View</span>
          </button>
          
          <button
            onClick={() => handlePurchaseModel(model.id)}
            className="flex-1 flex items-center justify-center space-x-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
          >
            {model.pricing.type === 'free' ? (
              <>
                <Download className="w-4 h-4" />
                <span>Download</span>
              </>
            ) : (
              <>
                <ShoppingCart className="w-4 h-4" />
                <span>Buy</span>
              </>
            )}
          </button>
        </div>
      </div>
    </motion.div>
  );

  const renderFeaturedSection = () => (
    <div className="mb-12">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Featured Models</h2>
          <p className="text-gray-600">Hand-picked models from top creators</p>
        </div>
        <button className="flex items-center space-x-2 text-blue-600 hover:text-blue-700">
          <span>View All</span>
          <ExternalLink className="w-4 h-4" />
        </button>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {featuredModels.slice(0, 6).map(renderModelCard)}
      </div>
    </div>
  );

  const renderTrendingSection = () => (
    <div className="mb-12">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center space-x-3">
          <TrendingUp className="w-6 h-6 text-orange-500" />
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Trending This Week</h2>
            <p className="text-gray-600">Most popular models right now</p>
          </div>
        </div>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {trendingModels.slice(0, 4).map((model, index) => (
          <motion.div
            key={model.id}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: index * 0.1 }}
            className="bg-gradient-to-r from-orange-50 to-red-50 p-4 rounded-xl border border-orange-200"
          >
            <div className="flex items-center space-x-3 mb-3">
              <div className="w-8 h-8 bg-orange-100 rounded-lg flex items-center justify-center">
                <span className="text-orange-600 font-bold">#{index + 1}</span>
              </div>
              <div>
                <h3 className="font-semibold text-gray-900">{model.name}</h3>
                <p className="text-sm text-gray-600">{model.author.name}</p>
              </div>
            </div>
            
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-1">
                <Download className="w-4 h-4 text-gray-500" />
                <span className="text-sm text-gray-600">{model.usage.downloads}</span>
              </div>
              <div className="flex items-center space-x-1">
                <Star className="w-4 h-4 text-yellow-400 fill-current" />
                <span className="text-sm text-gray-600">{model.usage.averageRating.toFixed(1)}</span>
              </div>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading AI Marketplace...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="p-2 bg-blue-100 rounded-xl">
                <Globe className="w-8 h-8 text-blue-600" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">AI Marketplace</h1>
                <p className="text-gray-600">Discover, buy, and sell AI models</p>
              </div>
            </div>
            
            <div className="flex items-center space-x-4">
              {analytics && (
                <div className="hidden md:flex items-center space-x-6 text-sm text-gray-600">
                  <div className="flex items-center space-x-1">
                    <Database className="w-4 h-4" />
                    <span>{analytics.totalModels} Models</span>
                  </div>
                  <div className="flex items-center space-x-1">
                    <Users className="w-4 h-4" />
                    <span>{analytics.totalTransactions} Sales</span>
                  </div>
                  <div className="flex items-center space-x-1">
                    <DollarSign className="w-4 h-4" />
                    <span>${analytics.totalRevenue.toLocaleString()}</span>
                  </div>
                </div>
              )}
              
              <button
                onClick={handleConnectWallet}
                className={`flex items-center space-x-2 px-4 py-2 rounded-lg transition-colors ${
                  walletConnected
                    ? 'bg-green-100 text-green-700'
                    : 'bg-blue-600 hover:bg-blue-700 text-white'
                }`}
              >
                <Wallet className="w-4 h-4" />
                <span>
                  {walletConnected 
                    ? `${walletAddress?.slice(0, 6)}...${walletAddress?.slice(-4)}`
                    : 'Connect Wallet'
                  }
                </span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Search and Filters */}
      <div className="max-w-7xl mx-auto px-6 py-6">
        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6 mb-8">
          <div className="flex flex-col lg:flex-row lg:items-center space-y-4 lg:space-y-0 lg:space-x-4">
            {/* Search */}
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                type="text"
                placeholder="Search AI models..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            {/* Category Filter */}
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="">All Categories</option>
              {categories.map((category) => (
                <option key={category.id} value={category.id}>
                  {category.icon} {category.name}
                </option>
              ))}
            </select>

            {/* Sort */}
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
              className="px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="popularity">Most Popular</option>
              <option value="rating">Highest Rated</option>
              <option value="price">Price: Low to High</option>
              <option value="recent">Recently Added</option>
            </select>

            {/* View Mode */}
            <div className="flex items-center space-x-2">
              <button
                onClick={() => setViewMode('grid')}
                className={`p-2 rounded-lg transition-colors ${
                  viewMode === 'grid' ? 'bg-blue-100 text-blue-600' : 'text-gray-400 hover:text-gray-600'
                }`}
              >
                <Grid className="w-5 h-5" />
              </button>
              <button
                onClick={() => setViewMode('list')}
                className={`p-2 rounded-lg transition-colors ${
                  viewMode === 'list' ? 'bg-blue-100 text-blue-600' : 'text-gray-400 hover:text-gray-600'
                }`}
              >
                <List className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>

        {/* Featured Models */}
        {!searchQuery && !selectedCategory && renderFeaturedSection()}

        {/* Trending Models */}
        {!searchQuery && !selectedCategory && renderTrendingSection()}

        {/* Search Results */}
        <div>
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-xl font-semibold text-gray-900">
                {searchQuery || selectedCategory ? 'Search Results' : 'All Models'}
              </h2>
              <p className="text-gray-600">{models.length} models found</p>
            </div>
          </div>

          <div className={`grid gap-6 ${
            viewMode === 'grid' 
              ? 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3' 
              : 'grid-cols-1'
          }`}>
            {models.map(renderModelCard)}
          </div>

          {models.length === 0 && (
            <div className="text-center py-12">
              <Search className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No models found</h3>
              <p className="text-gray-600">Try adjusting your search criteria</p>
            </div>
          )}
        </div>
      </div>

      {/* Model Details Modal */}
      {selectedModel && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold text-gray-900">Model Details</h2>
                <button
                  onClick={() => setSelectedModel(null)}
                  className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  ×
                </button>
              </div>
              
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                <div>
                  <h3 className="text-xl font-semibold text-gray-900 mb-2">{selectedModel.name}</h3>
                  <p className="text-gray-600 mb-4">{selectedModel.description}</p>
                  
                  <div className="space-y-4">
                    <div>
                      <h4 className="font-medium text-gray-900 mb-2">Performance</h4>
                      <div className="grid grid-cols-2 gap-4">
                        <div className="p-3 bg-gray-50 rounded-lg">
                          <p className="text-sm text-gray-600">Accuracy</p>
                          <p className="font-bold text-gray-900">{selectedModel.performance.accuracy}%</p>
                        </div>
                        <div className="p-3 bg-gray-50 rounded-lg">
                          <p className="text-sm text-gray-600">Latency</p>
                          <p className="font-bold text-gray-900">{selectedModel.performance.latency}ms</p>
                        </div>
                      </div>
                    </div>
                    
                    <div>
                      <h4 className="font-medium text-gray-900 mb-2">Technical Details</h4>
                      <div className="space-y-2 text-sm">
                        <div className="flex justify-between">
                          <span className="text-gray-600">Framework:</span>
                          <span className="font-medium">{selectedModel.technical.framework}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-600">Version:</span>
                          <span className="font-medium">{selectedModel.technical.version}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-600">License:</span>
                          <span className="font-medium">{selectedModel.blockchain.license}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
                
                <div>
                  <div className="bg-gray-50 p-6 rounded-xl">
                    <div className="text-center mb-4">
                      <p className="text-3xl font-bold text-gray-900">{formatPrice(selectedModel)}</p>
                      {selectedModel.pricing.type === 'subscription' && (
                        <p className="text-gray-600">per {selectedModel.pricing.subscriptionPeriod}</p>
                      )}
                    </div>
                    
                    <button
                      onClick={() => handlePurchaseModel(selectedModel.id)}
                      className="w-full flex items-center justify-center space-x-2 px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
                    >
                      {selectedModel.pricing.type === 'free' ? (
                        <>
                          <Download className="w-5 h-5" />
                          <span>Download Now</span>
                        </>
                      ) : (
                        <>
                          <ShoppingCart className="w-5 h-5" />
                          <span>Purchase Model</span>
                        </>
                      )}
                    </button>
                    
                    <div className="mt-4 space-y-2 text-sm text-gray-600">
                      <div className="flex items-center space-x-2">
                        <Download className="w-4 h-4" />
                        <span>{selectedModel.usage.downloads} downloads</span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Star className="w-4 h-4" />
                        <span>{selectedModel.usage.averageRating.toFixed(1)} rating</span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Clock className="w-4 h-4" />
                        <span>Updated {selectedModel.updatedAt.toLocaleDateString()}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AIMarketplace;
