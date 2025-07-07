import { v4 as uuidv4 } from 'uuid';

export interface CDNNode {
  id: string;
  name: string;
  location: {
    city: string;
    country: string;
    continent: string;
    coordinates: {
      lat: number;
      lng: number;
    };
  };
  status: 'online' | 'offline' | 'maintenance' | 'overloaded';
  capacity: {
    total: number; // GB
    used: number; // GB
    available: number; // GB
  };
  performance: {
    latency: number; // ms
    throughput: number; // Mbps
    uptime: number; // percentage
    requests: number; // requests per second
  };
  features: {
    aiInference: boolean;
    modelCaching: boolean;
    edgeComputing: boolean;
    realTimeSync: boolean;
  };
  createdAt: Date;
  lastUpdated: Date;
}

export interface CDNAsset {
  id: string;
  name: string;
  type: 'model' | 'dataset' | 'code' | 'media' | 'document';
  size: number; // bytes
  checksum: string;
  mimeType: string;
  url: string;
  nodes: string[]; // CDN node IDs where asset is cached
  metadata: {
    version: string;
    tags: string[];
    description: string;
    author: string;
    license: string;
  };
  analytics: {
    downloads: number;
    bandwidth: number; // bytes transferred
    hitRate: number; // cache hit percentage
    popularRegions: string[];
  };
  createdAt: Date;
  updatedAt: Date;
}

export interface EdgeFunction {
  id: string;
  name: string;
  description: string;
  code: string;
  runtime: 'javascript' | 'python' | 'wasm' | 'docker';
  triggers: {
    type: 'http' | 'cron' | 'event';
    config: Record<string, any>;
  }[];
  deployedNodes: string[];
  resources: {
    memory: number; // MB
    cpu: number; // CPU units
    timeout: number; // seconds
  };
  environment: Record<string, string>;
  status: 'active' | 'inactive' | 'deploying' | 'error';
  metrics: {
    invocations: number;
    errors: number;
    averageLatency: number;
    coldStarts: number;
  };
  createdAt: Date;
  updatedAt: Date;
}

export interface CDNAnalytics {
  totalNodes: number;
  totalAssets: number;
  totalBandwidth: number;
  globalLatency: number;
  cacheHitRate: number;
  nodesByRegion: Record<string, number>;
  topAssets: Array<{
    assetId: string;
    name: string;
    downloads: number;
    bandwidth: number;
  }>;
  performanceByRegion: Array<{
    region: string;
    latency: number;
    throughput: number;
    uptime: number;
  }>;
  realtimeMetrics: {
    requestsPerSecond: number;
    bandwidthUsage: number;
    activeConnections: number;
    errorRate: number;
  };
}

export interface CDNConfiguration {
  caching: {
    defaultTTL: number; // seconds
    maxAge: number; // seconds
    staleWhileRevalidate: boolean;
    compressionEnabled: boolean;
  };
  security: {
    httpsOnly: boolean;
    corsEnabled: boolean;
    allowedOrigins: string[];
    rateLimiting: {
      enabled: boolean;
      requestsPerMinute: number;
    };
  };
  optimization: {
    imageOptimization: boolean;
    minification: boolean;
    brotliCompression: boolean;
    http2Push: boolean;
  };
  monitoring: {
    realTimeMetrics: boolean;
    alerting: boolean;
    logRetention: number; // days
  };
}

export class GlobalCDNService {
  private nodes: Map<string, CDNNode> = new Map();
  private assets: Map<string, CDNAsset> = new Map();
  private edgeFunctions: Map<string, EdgeFunction> = new Map();
  private configuration: CDNConfiguration;
  private readonly STORAGE_KEY = 'genxcoder-cdn';

  constructor() {
    this.configuration = this.getDefaultConfiguration();
    this.loadFromStorage();
    this.initializeGlobalNodes();
    this.startRealTimeMonitoring();
  }

  // CDN Node Management
  async createNode(nodeData: Omit<CDNNode, 'id' | 'createdAt' | 'lastUpdated'>): Promise<CDNNode> {
    const nodeId = uuidv4();
    const node: CDNNode = {
      ...nodeData,
      id: nodeId,
      createdAt: new Date(),
      lastUpdated: new Date()
    };

    this.nodes.set(nodeId, node);
    this.saveToStorage();
    return node;
  }

  async getNode(nodeId: string): Promise<CDNNode | null> {
    return this.nodes.get(nodeId) || null;
  }

  async getAllNodes(): Promise<CDNNode[]> {
    return Array.from(this.nodes.values());
  }

  async getNodesByRegion(continent: string): Promise<CDNNode[]> {
    return Array.from(this.nodes.values()).filter(
      node => node.location.continent === continent
    );
  }

  async updateNodeStatus(nodeId: string, status: CDNNode['status']): Promise<void> {
    const node = this.nodes.get(nodeId);
    if (node) {
      node.status = status;
      node.lastUpdated = new Date();
      this.nodes.set(nodeId, node);
      this.saveToStorage();
    }
  }

  async getOptimalNode(userLocation?: { lat: number; lng: number }): Promise<CDNNode | null> {
    const onlineNodes = Array.from(this.nodes.values()).filter(
      node => node.status === 'online' && node.capacity.available > 0
    );

    if (onlineNodes.length === 0) return null;

    if (!userLocation) {
      // Return node with best performance
      return onlineNodes.reduce((best, current) => 
        current.performance.latency < best.performance.latency ? current : best
      );
    }

    // Calculate distance and return closest node
    const calculateDistance = (lat1: number, lng1: number, lat2: number, lng2: number): number => {
      const R = 6371; // Earth's radius in km
      const dLat = (lat2 - lat1) * Math.PI / 180;
      const dLng = (lng2 - lng1) * Math.PI / 180;
      const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
                Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
                Math.sin(dLng/2) * Math.sin(dLng/2);
      const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
      return R * c;
    };

    return onlineNodes.reduce((closest, current) => {
      const currentDistance = calculateDistance(
        userLocation.lat, userLocation.lng,
        current.location.coordinates.lat, current.location.coordinates.lng
      );
      const closestDistance = calculateDistance(
        userLocation.lat, userLocation.lng,
        closest.location.coordinates.lat, closest.location.coordinates.lng
      );
      return currentDistance < closestDistance ? current : closest;
    });
  }

  // Asset Management
  async uploadAsset(assetData: Omit<CDNAsset, 'id' | 'createdAt' | 'updatedAt' | 'analytics'>): Promise<CDNAsset> {
    const assetId = uuidv4();
    const asset: CDNAsset = {
      ...assetData,
      id: assetId,
      analytics: {
        downloads: 0,
        bandwidth: 0,
        hitRate: 0,
        popularRegions: []
      },
      createdAt: new Date(),
      updatedAt: new Date()
    };

    // Distribute to optimal nodes
    const optimalNodes = await this.selectOptimalNodes(asset.size);
    asset.nodes = optimalNodes.map(node => node.id);

    this.assets.set(assetId, asset);
    
    // Update node capacity
    optimalNodes.forEach(node => {
      node.capacity.used += asset.size / (1024 * 1024 * 1024); // Convert to GB
      node.capacity.available = node.capacity.total - node.capacity.used;
      this.nodes.set(node.id, node);
    });

    this.saveToStorage();
    return asset;
  }

  async getAsset(assetId: string): Promise<CDNAsset | null> {
    return this.assets.get(assetId) || null;
  }

  async getAssetUrl(assetId: string, userLocation?: { lat: number; lng: number }): Promise<string | null> {
    const asset = this.assets.get(assetId);
    if (!asset) return null;

    const optimalNode = await this.getOptimalNode(userLocation);
    if (!optimalNode || !asset.nodes.includes(optimalNode.id)) {
      // Fallback to any available node
      const availableNode = asset.nodes
        .map(nodeId => this.nodes.get(nodeId))
        .find(node => node && node.status === 'online');
      
      if (!availableNode) return null;
      return `https://${availableNode.id}.cdn.genxcoder.com/${asset.id}`;
    }

    // Update analytics
    asset.analytics.downloads += 1;
    this.assets.set(assetId, asset);

    return `https://${optimalNode.id}.cdn.genxcoder.com/${asset.id}`;
  }

  async deleteAsset(assetId: string): Promise<boolean> {
    const asset = this.assets.get(assetId);
    if (!asset) return false;

    // Free up capacity on nodes
    asset.nodes.forEach(nodeId => {
      const node = this.nodes.get(nodeId);
      if (node) {
        node.capacity.used -= asset.size / (1024 * 1024 * 1024);
        node.capacity.available = node.capacity.total - node.capacity.used;
        this.nodes.set(nodeId, node);
      }
    });

    this.assets.delete(assetId);
    this.saveToStorage();
    return true;
  }

  private async selectOptimalNodes(assetSize: number): Promise<CDNNode[]> {
    const availableNodes = Array.from(this.nodes.values()).filter(
      node => node.status === 'online' && 
               node.capacity.available > (assetSize / (1024 * 1024 * 1024))
    );

    // Select nodes from different regions for redundancy
    const nodesByRegion = availableNodes.reduce((acc, node) => {
      const region = node.location.continent;
      if (!acc[region]) acc[region] = [];
      acc[region].push(node);
      return acc;
    }, {} as Record<string, CDNNode[]>);

    const selectedNodes: CDNNode[] = [];
    const maxNodesPerRegion = 2;
    const targetNodes = Math.min(6, availableNodes.length); // Replicate to max 6 nodes

    // Select best nodes from each region
    Object.values(nodesByRegion).forEach(regionNodes => {
      const sortedNodes = regionNodes.sort((a, b) => a.performance.latency - b.performance.latency);
      selectedNodes.push(...sortedNodes.slice(0, maxNodesPerRegion));
    });

    return selectedNodes.slice(0, targetNodes);
  }

  // Edge Functions
  async deployEdgeFunction(functionData: Omit<EdgeFunction, 'id' | 'createdAt' | 'updatedAt' | 'metrics'>): Promise<EdgeFunction> {
    const functionId = uuidv4();
    const edgeFunction: EdgeFunction = {
      ...functionData,
      id: functionId,
      metrics: {
        invocations: 0,
        errors: 0,
        averageLatency: 0,
        coldStarts: 0
      },
      createdAt: new Date(),
      updatedAt: new Date()
    };

    // Deploy to specified nodes or auto-select
    if (edgeFunction.deployedNodes.length === 0) {
      const optimalNodes = await this.selectOptimalNodes(0); // Size doesn't matter for functions
      edgeFunction.deployedNodes = optimalNodes.slice(0, 3).map(node => node.id);
    }

    this.edgeFunctions.set(functionId, edgeFunction);
    this.saveToStorage();
    return edgeFunction;
  }

  async invokeEdgeFunction(functionId: string, payload: any, userLocation?: { lat: number; lng: number }): Promise<any> {
    const edgeFunction = this.edgeFunctions.get(functionId);
    if (!edgeFunction || edgeFunction.status !== 'active') {
      throw new Error('Edge function not found or inactive');
    }

    const startTime = Date.now();
    
    try {
      // Find optimal node for execution
      const optimalNode = await this.getOptimalNode(userLocation);
      if (!optimalNode || !edgeFunction.deployedNodes.includes(optimalNode.id)) {
        throw new Error('No available node for function execution');
      }

      // Simulate function execution
      const result = await this.executeFunction(edgeFunction, payload);
      
      // Update metrics
      const latency = Date.now() - startTime;
      edgeFunction.metrics.invocations += 1;
      edgeFunction.metrics.averageLatency = 
        (edgeFunction.metrics.averageLatency * (edgeFunction.metrics.invocations - 1) + latency) / 
        edgeFunction.metrics.invocations;

      this.edgeFunctions.set(functionId, edgeFunction);
      this.saveToStorage();

      return result;
    } catch (error) {
      edgeFunction.metrics.errors += 1;
      this.edgeFunctions.set(functionId, edgeFunction);
      throw error;
    }
  }

  private async executeFunction(edgeFunction: EdgeFunction, payload: any): Promise<any> {
    // Simulate function execution based on runtime
    switch (edgeFunction.runtime) {
      case 'javascript':
        // Simulate JS execution
        return { result: 'Function executed successfully', payload, timestamp: new Date() };
      case 'python':
        // Simulate Python execution
        return { result: 'Python function executed', payload, timestamp: new Date() };
      case 'wasm':
        // Simulate WebAssembly execution
        return { result: 'WASM function executed', payload, timestamp: new Date() };
      default:
        throw new Error(`Unsupported runtime: ${edgeFunction.runtime}`);
    }
  }

  // Analytics and Monitoring
  async getCDNAnalytics(): Promise<CDNAnalytics> {
    const nodes = Array.from(this.nodes.values());
    const assets = Array.from(this.assets.values());

    const totalBandwidth = assets.reduce((sum, asset) => sum + asset.analytics.bandwidth, 0);
    const globalLatency = nodes.reduce((sum, node) => sum + node.performance.latency, 0) / nodes.length;
    const cacheHitRate = assets.reduce((sum, asset) => sum + asset.analytics.hitRate, 0) / assets.length;

    const nodesByRegion = nodes.reduce((acc, node) => {
      const region = node.location.continent;
      acc[region] = (acc[region] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const topAssets = assets
      .sort((a, b) => b.analytics.downloads - a.analytics.downloads)
      .slice(0, 10)
      .map(asset => ({
        assetId: asset.id,
        name: asset.name,
        downloads: asset.analytics.downloads,
        bandwidth: asset.analytics.bandwidth
      }));

    const performanceByRegion = Object.keys(nodesByRegion).map(region => {
      const regionNodes = nodes.filter(node => node.location.continent === region);
      return {
        region,
        latency: regionNodes.reduce((sum, node) => sum + node.performance.latency, 0) / regionNodes.length,
        throughput: regionNodes.reduce((sum, node) => sum + node.performance.throughput, 0) / regionNodes.length,
        uptime: regionNodes.reduce((sum, node) => sum + node.performance.uptime, 0) / regionNodes.length
      };
    });

    return {
      totalNodes: nodes.length,
      totalAssets: assets.length,
      totalBandwidth,
      globalLatency,
      cacheHitRate,
      nodesByRegion,
      topAssets,
      performanceByRegion,
      realtimeMetrics: {
        requestsPerSecond: nodes.reduce((sum, node) => sum + node.performance.requests, 0),
        bandwidthUsage: totalBandwidth,
        activeConnections: nodes.length * 1000, // Mock value
        errorRate: 0.01 // Mock value
      }
    };
  }

  async getNodeMetrics(nodeId: string): Promise<CDNNode['performance'] | null> {
    const node = this.nodes.get(nodeId);
    return node ? node.performance : null;
  }

  // Configuration Management
  updateConfiguration(config: Partial<CDNConfiguration>): void {
    this.configuration = { ...this.configuration, ...config };
    this.saveToStorage();
  }

  getConfiguration(): CDNConfiguration {
    return this.configuration;
  }

  // Utility Methods
  private initializeGlobalNodes(): void {
    if (this.nodes.size > 0) return; // Don't initialize if nodes already exist

    const globalNodes = [
      {
        name: 'US East (Virginia)',
        location: {
          city: 'Ashburn',
          country: 'United States',
          continent: 'North America',
          coordinates: { lat: 39.0458, lng: -77.4874 }
        },
        status: 'online' as const,
        capacity: { total: 1000, used: 250, available: 750 },
        performance: { latency: 15, throughput: 10000, uptime: 99.9, requests: 5000 },
        features: { aiInference: true, modelCaching: true, edgeComputing: true, realTimeSync: true }
      },
      {
        name: 'US West (California)',
        location: {
          city: 'San Francisco',
          country: 'United States',
          continent: 'North America',
          coordinates: { lat: 37.7749, lng: -122.4194 }
        },
        status: 'online' as const,
        capacity: { total: 1000, used: 300, available: 700 },
        performance: { latency: 12, throughput: 12000, uptime: 99.8, requests: 5500 },
        features: { aiInference: true, modelCaching: true, edgeComputing: true, realTimeSync: true }
      },
      {
        name: 'Europe (Frankfurt)',
        location: {
          city: 'Frankfurt',
          country: 'Germany',
          continent: 'Europe',
          coordinates: { lat: 50.1109, lng: 8.6821 }
        },
        status: 'online' as const,
        capacity: { total: 800, used: 200, available: 600 },
        performance: { latency: 18, throughput: 8000, uptime: 99.7, requests: 4000 },
        features: { aiInference: true, modelCaching: true, edgeComputing: true, realTimeSync: true }
      },
      {
        name: 'Asia Pacific (Singapore)',
        location: {
          city: 'Singapore',
          country: 'Singapore',
          continent: 'Asia',
          coordinates: { lat: 1.3521, lng: 103.8198 }
        },
        status: 'online' as const,
        capacity: { total: 600, used: 150, available: 450 },
        performance: { latency: 25, throughput: 6000, uptime: 99.6, requests: 3500 },
        features: { aiInference: true, modelCaching: true, edgeComputing: true, realTimeSync: true }
      },
      {
        name: 'Asia Pacific (Tokyo)',
        location: {
          city: 'Tokyo',
          country: 'Japan',
          continent: 'Asia',
          coordinates: { lat: 35.6762, lng: 139.6503 }
        },
        status: 'online' as const,
        capacity: { total: 700, used: 180, available: 520 },
        performance: { latency: 20, throughput: 7000, uptime: 99.8, requests: 4200 },
        features: { aiInference: true, modelCaching: true, edgeComputing: true, realTimeSync: true }
      },
      {
        name: 'South America (São Paulo)',
        location: {
          city: 'São Paulo',
          country: 'Brazil',
          continent: 'South America',
          coordinates: { lat: -23.5505, lng: -46.6333 }
        },
        status: 'online' as const,
        capacity: { total: 400, used: 100, available: 300 },
        performance: { latency: 35, throughput: 4000, uptime: 99.5, requests: 2000 },
        features: { aiInference: false, modelCaching: true, edgeComputing: false, realTimeSync: true }
      }
    ];

    globalNodes.forEach(async (nodeData) => {
      await this.createNode(nodeData);
    });
  }

  private startRealTimeMonitoring(): void {
    // Simulate real-time metrics updates
    setInterval(() => {
      this.nodes.forEach((node, nodeId) => {
        // Simulate performance fluctuations
        node.performance.latency += (Math.random() - 0.5) * 5;
        node.performance.latency = Math.max(5, Math.min(100, node.performance.latency));
        
        node.performance.requests += Math.floor((Math.random() - 0.5) * 1000);
        node.performance.requests = Math.max(0, node.performance.requests);
        
        node.lastUpdated = new Date();
        this.nodes.set(nodeId, node);
      });
    }, 30000); // Update every 30 seconds
  }

  private getDefaultConfiguration(): CDNConfiguration {
    return {
      caching: {
        defaultTTL: 3600,
        maxAge: 86400,
        staleWhileRevalidate: true,
        compressionEnabled: true
      },
      security: {
        httpsOnly: true,
        corsEnabled: true,
        allowedOrigins: ['*'],
        rateLimiting: {
          enabled: true,
          requestsPerMinute: 1000
        }
      },
      optimization: {
        imageOptimization: true,
        minification: true,
        brotliCompression: true,
        http2Push: true
      },
      monitoring: {
        realTimeMetrics: true,
        alerting: true,
        logRetention: 30
      }
    };
  }

  private saveToStorage(): void {
    try {
      const data = {
        nodes: Array.from(this.nodes.entries()),
        assets: Array.from(this.assets.entries()),
        edgeFunctions: Array.from(this.edgeFunctions.entries()),
        configuration: this.configuration,
        lastUpdated: new Date().toISOString()
      };

      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(data));
    } catch (error) {
      console.warn('Failed to save CDN data:', error);
    }
  }

  private loadFromStorage(): void {
    try {
      const data = localStorage.getItem(this.STORAGE_KEY);
      if (data) {
        const parsed = JSON.parse(data);
        
        this.nodes = new Map(parsed.nodes || []);
        this.assets = new Map(parsed.assets || []);
        this.edgeFunctions = new Map(parsed.edgeFunctions || []);
        this.configuration = parsed.configuration || this.getDefaultConfiguration();

        // Convert date strings back to Date objects
        this.nodes.forEach(node => {
          node.createdAt = new Date(node.createdAt);
          node.lastUpdated = new Date(node.lastUpdated);
        });

        this.assets.forEach(asset => {
          asset.createdAt = new Date(asset.createdAt);
          asset.updatedAt = new Date(asset.updatedAt);
        });

        this.edgeFunctions.forEach(func => {
          func.createdAt = new Date(func.createdAt);
          func.updatedAt = new Date(func.updatedAt);
        });
      }
    } catch (error) {
      console.warn('Failed to load CDN data:', error);
    }
  }

  // Public utility methods
  clearAllData(): void {
    this.nodes.clear();
    this.assets.clear();
    this.edgeFunctions.clear();
    localStorage.removeItem(this.STORAGE_KEY);
    this.initializeGlobalNodes();
  }

  getNodeCount(): number {
    return this.nodes.size;
  }

  getAssetCount(): number {
    return this.assets.size;
  }

  getTotalBandwidth(): number {
    return Array.from(this.assets.values()).reduce(
      (sum, asset) => sum + asset.analytics.bandwidth, 0
    );
  }
}

// Singleton instance
export const globalCDNService = new GlobalCDNService();
