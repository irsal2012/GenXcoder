import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  Shield,
  Lock,
  Key,
  AlertTriangle,
  CheckCircle,
  XCircle,
  Eye,
  Activity,
  TrendingUp,
  TrendingDown,
  Zap,
  Globe,
  Server,
  Database,
  Cpu,
  Network,
  FileText,
  Settings,
  Users,
  Clock,
  BarChart3,
  PieChart,
  LineChart
} from 'lucide-react';
import { blockchainService } from '../../services/blockchain/BlockchainService';
import { securityService } from '../../services/security/SecurityService';

export const BlockchainSecurityDashboard: React.FC = () => {
  const [selectedTab, setSelectedTab] = useState<'overview' | 'blockchain' | 'security' | 'threats' | 'compliance'>('overview');
  const [blockchainMetrics, setBlockchainMetrics] = useState<any>(null);
  const [securityMetrics, setSecurityMetrics] = useState<any>(null);
  const [threats, setThreats] = useState<any[]>([]);
  const [networks, setNetworks] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setIsLoading(true);
    try {
      const [blockchainData, securityData, threatsData, networksData] = await Promise.all([
        blockchainService.getBlockchainMetrics(),
        securityService.getSecurityMetrics(),
        securityService.getThreats(),
        blockchainService.getNetworks()
      ]);
      
      setBlockchainMetrics(blockchainData);
      setSecurityMetrics(securityData);
      setThreats(threatsData);
      setNetworks(networksData);
    } catch (error) {
      console.error('Failed to load dashboard data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const getRiskColor = (level: string) => {
    switch (level) {
      case 'low': return 'text-green-600 bg-green-100';
      case 'medium': return 'text-yellow-600 bg-yellow-100';
      case 'high': return 'text-orange-600 bg-orange-100';
      case 'critical': return 'text-red-600 bg-red-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'connected':
      case 'online':
      case 'resolved':
        return <CheckCircle className="w-4 h-4" />;
      case 'detected':
      case 'investigating':
        return <AlertTriangle className="w-4 h-4" />;
      case 'error':
      case 'failed':
        return <XCircle className="w-4 h-4" />;
      default:
        return <Activity className="w-4 h-4" />;
    }
  };

  const renderOverview = () => (
    <div className="space-y-8">
      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-gradient-to-r from-blue-500 to-cyan-600 p-6 rounded-2xl text-white"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-blue-100">Connected Networks</p>
              <p className="text-3xl font-bold">{blockchainMetrics?.connectedNetworks || 0}</p>
            </div>
            <Network className="w-8 h-8 text-blue-200" />
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-gradient-to-r from-green-500 to-emerald-600 p-6 rounded-2xl text-white"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-green-100">Security Score</p>
              <p className="text-3xl font-bold">{securityMetrics?.securityScore || 0}%</p>
            </div>
            <Shield className="w-8 h-8 text-green-200" />
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-gradient-to-r from-purple-500 to-indigo-600 p-6 rounded-2xl text-white"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-purple-100">Total TVL</p>
              <p className="text-3xl font-bold">${blockchainMetrics?.totalTVL || '0'}M</p>
            </div>
            <Database className="w-8 h-8 text-purple-200" />
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className={`bg-gradient-to-r p-6 rounded-2xl text-white ${
            securityMetrics?.riskLevel === 'critical' ? 'from-red-500 to-red-600' :
            securityMetrics?.riskLevel === 'high' ? 'from-orange-500 to-orange-600' :
            securityMetrics?.riskLevel === 'medium' ? 'from-yellow-500 to-yellow-600' :
            'from-green-500 to-green-600'
          }`}
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-white opacity-80">Risk Level</p>
              <p className="text-3xl font-bold capitalize">{securityMetrics?.riskLevel || 'Low'}</p>
            </div>
            <AlertTriangle className="w-8 h-8 text-white opacity-80" />
          </div>
        </motion.div>
      </div>

      {/* Security Status */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Security Overview</h3>
          <div className="space-y-4">
            <div className="flex items-center justify-between p-4 bg-gray-50 rounded-xl">
              <div className="flex items-center space-x-3">
                <div className="p-2 bg-green-100 rounded-lg">
                  <Shield className="w-5 h-5 text-green-600" />
                </div>
                <div>
                  <p className="font-medium text-gray-900">Threats Blocked</p>
                  <p className="text-sm text-gray-600">{securityMetrics?.threatsBlocked || 0} this month</p>
                </div>
              </div>
              <div className="text-right">
                <p className="text-2xl font-bold text-green-600">{securityMetrics?.threatsBlocked || 0}</p>
              </div>
            </div>

            <div className="flex items-center justify-between p-4 bg-gray-50 rounded-xl">
              <div className="flex items-center space-x-3">
                <div className="p-2 bg-blue-100 rounded-lg">
                  <Key className="w-5 h-5 text-blue-600" />
                </div>
                <div>
                  <p className="font-medium text-gray-900">Encryption Keys</p>
                  <p className="text-sm text-gray-600">Active encryption keys</p>
                </div>
              </div>
              <div className="text-right">
                <p className="text-2xl font-bold text-blue-600">12</p>
              </div>
            </div>

            <div className="flex items-center justify-between p-4 bg-gray-50 rounded-xl">
              <div className="flex items-center space-x-3">
                <div className="p-2 bg-purple-100 rounded-lg">
                  <FileText className="w-5 h-5 text-purple-600" />
                </div>
                <div>
                  <p className="font-medium text-gray-900">Compliance Score</p>
                  <p className="text-sm text-gray-600">Overall compliance rating</p>
                </div>
              </div>
              <div className="text-right">
                <p className="text-2xl font-bold text-purple-600">{securityMetrics?.complianceScore || 0}%</p>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Blockchain Networks</h3>
          <div className="space-y-3">
            {networks.slice(0, 4).map((network) => (
              <div key={network.id} className="flex items-center justify-between p-3 border border-gray-200 rounded-xl">
                <div className="flex items-center space-x-3">
                  <div className={`flex items-center space-x-1 px-2 py-1 rounded-lg text-xs font-medium ${getRiskColor(network.status === 'connected' ? 'low' : 'high')}`}>
                    {getStatusIcon(network.status)}
                    <span>{network.status}</span>
                  </div>
                  <div>
                    <p className="font-medium text-gray-900">{network.name}</p>
                    <p className="text-sm text-gray-600">{network.type}</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-sm font-medium text-gray-900">Block #{network.blockHeight}</p>
                  <p className="text-xs text-gray-600">{network.nativeCurrency.symbol}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Recent Activity */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Recent Security Events</h3>
        <div className="space-y-3">
          {threats.slice(0, 5).map((threat) => (
            <div key={threat.id} className="flex items-center justify-between p-4 border border-gray-200 rounded-xl">
              <div className="flex items-center space-x-3">
                <div className={`p-2 rounded-lg ${getRiskColor(threat.severity)}`}>
                  {getStatusIcon(threat.status)}
                </div>
                <div>
                  <p className="font-medium text-gray-900">{threat.type.replace('_', ' ').toUpperCase()}</p>
                  <p className="text-sm text-gray-600">{threat.description}</p>
                </div>
              </div>
              <div className="text-right">
                <div className={`px-2 py-1 rounded-lg text-xs font-medium ${getRiskColor(threat.severity)}`}>
                  {threat.severity}
                </div>
                <p className="text-xs text-gray-600 mt-1">
                  {new Date(threat.detectedAt).toLocaleDateString()}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );

  const renderBlockchain = () => (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-gray-900">Blockchain Networks</h3>
        <button className="flex items-center space-x-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors">
          <Network className="w-4 h-4" />
          <span>Add Network</span>
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {networks.map((network) => (
          <motion.div
            key={network.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6 hover:shadow-lg transition-all duration-300"
          >
            <div className="flex items-start justify-between mb-4">
              <div>
                <h4 className="font-semibold text-gray-900">{network.name}</h4>
                <p className="text-sm text-gray-600 mt-1">{network.type.toUpperCase()}</p>
              </div>
              <div className={`flex items-center space-x-1 px-2 py-1 rounded-lg text-xs font-medium ${getRiskColor(network.status === 'connected' ? 'low' : 'high')}`}>
                {getStatusIcon(network.status)}
                <span>{network.status}</span>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4 mb-4">
              <div className="text-center p-3 bg-gray-50 rounded-lg">
                <p className="text-sm text-gray-600">Chain ID</p>
                <p className="font-bold text-gray-900">{network.chainId}</p>
              </div>
              <div className="text-center p-3 bg-gray-50 rounded-lg">
                <p className="text-sm text-gray-600">Block Height</p>
                <p className="font-bold text-gray-900">{network.blockHeight.toLocaleString()}</p>
              </div>
              <div className="text-center p-3 bg-gray-50 rounded-lg">
                <p className="text-sm text-gray-600">Currency</p>
                <p className="font-bold text-gray-900">{network.nativeCurrency.symbol}</p>
              </div>
              <div className="text-center p-3 bg-gray-50 rounded-lg">
                <p className="text-sm text-gray-600">Gas Price</p>
                <p className="font-bold text-gray-900">{network.gasPrice ? `${(parseInt(network.gasPrice) / 1e9).toFixed(2)} Gwei` : 'N/A'}</p>
              </div>
            </div>

            <div className="flex space-x-2">
              <button className="flex-1 flex items-center justify-center space-x-2 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors">
                <Eye className="w-4 h-4" />
                <span>View Details</span>
              </button>
              
              <button className="flex-1 flex items-center justify-center space-x-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors">
                <Settings className="w-4 h-4" />
                <span>Configure</span>
              </button>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );

  const renderSecurity = () => (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center space-x-3 mb-4">
            <div className="p-2 bg-green-100 rounded-lg">
              <Shield className="w-6 h-6 text-green-600" />
            </div>
            <div>
              <h3 className="font-semibold text-gray-900">Security Policies</h3>
              <p className="text-sm text-gray-600">Active security rules</p>
            </div>
          </div>
          <div className="text-center">
            <p className="text-3xl font-bold text-green-600">8</p>
            <p className="text-sm text-gray-600">Policies Active</p>
          </div>
        </div>

        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center space-x-3 mb-4">
            <div className="p-2 bg-blue-100 rounded-lg">
              <Key className="w-6 h-6 text-blue-600" />
            </div>
            <div>
              <h3 className="font-semibold text-gray-900">Encryption Keys</h3>
              <p className="text-sm text-gray-600">Active encryption keys</p>
            </div>
          </div>
          <div className="text-center">
            <p className="text-3xl font-bold text-blue-600">12</p>
            <p className="text-sm text-gray-600">Keys Active</p>
          </div>
        </div>

        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center space-x-3 mb-4">
            <div className="p-2 bg-purple-100 rounded-lg">
              <Activity className="w-6 h-6 text-purple-600" />
            </div>
            <div>
              <h3 className="font-semibold text-gray-900">Audit Logs</h3>
              <p className="text-sm text-gray-600">Security events logged</p>
            </div>
          </div>
          <div className="text-center">
            <p className="text-3xl font-bold text-purple-600">1,247</p>
            <p className="text-sm text-gray-600">Events Today</p>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Security Metrics</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="text-center p-4 bg-gray-50 rounded-xl">
            <p className="text-sm text-gray-600">Response Time</p>
            <p className="text-2xl font-bold text-gray-900">{securityMetrics?.incidentResponseTime || 0}m</p>
            <div className="flex items-center justify-center mt-2">
              <TrendingDown className="w-4 h-4 text-green-600 mr-1" />
              <span className="text-sm text-green-600">-15%</span>
            </div>
          </div>

          <div className="text-center p-4 bg-gray-50 rounded-xl">
            <p className="text-sm text-gray-600">False Positives</p>
            <p className="text-2xl font-bold text-gray-900">{securityMetrics?.falsePositiveRate || 0}%</p>
            <div className="flex items-center justify-center mt-2">
              <TrendingDown className="w-4 h-4 text-green-600 mr-1" />
              <span className="text-sm text-green-600">-8%</span>
            </div>
          </div>

          <div className="text-center p-4 bg-gray-50 rounded-xl">
            <p className="text-sm text-gray-600">Vulnerabilities</p>
            <p className="text-2xl font-bold text-gray-900">{securityMetrics?.vulnerabilitiesFound || 0}</p>
            <div className="flex items-center justify-center mt-2">
              <TrendingUp className="w-4 h-4 text-orange-600 mr-1" />
              <span className="text-sm text-orange-600">+3</span>
            </div>
          </div>

          <div className="text-center p-4 bg-gray-50 rounded-xl">
            <p className="text-sm text-gray-600">Fixes Applied</p>
            <p className="text-2xl font-bold text-gray-900">{securityMetrics?.vulnerabilitiesFixed || 0}</p>
            <div className="flex items-center justify-center mt-2">
              <TrendingUp className="w-4 h-4 text-green-600 mr-1" />
              <span className="text-sm text-green-600">+12</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading Security Dashboard...</p>
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
                <Shield className="w-8 h-8 text-blue-600" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Blockchain Security Dashboard</h1>
                <p className="text-gray-600">Advanced security monitoring and blockchain management</p>
              </div>
            </div>
            
            <div className="flex items-center space-x-4">
              <div className="hidden md:flex items-center space-x-6 text-sm text-gray-600">
                <div className="flex items-center space-x-1">
                  <Activity className="w-4 h-4" />
                  <span>{securityMetrics?.threatsDetected || 0} Threats</span>
                </div>
                <div className="flex items-center space-x-1">
                  <Network className="w-4 h-4" />
                  <span>{blockchainMetrics?.connectedNetworks || 0} Networks</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="max-w-7xl mx-auto px-6 py-4">
        <div className="flex space-x-1 bg-gray-100 p-1 rounded-lg">
          {[
            { id: 'overview', label: 'Overview', icon: Globe },
            { id: 'blockchain', label: 'Blockchain', icon: Network },
            { id: 'security', label: 'Security', icon: Shield },
            { id: 'threats', label: 'Threats', icon: AlertTriangle },
            { id: 'compliance', label: 'Compliance', icon: FileText }
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setSelectedTab(tab.id as any)}
              className={`flex items-center space-x-2 px-4 py-2 rounded-lg transition-colors ${
                selectedTab === tab.id
                  ? 'bg-white text-blue-600 shadow-sm'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              <tab.icon className="w-4 h-4" />
              <span>{tab.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-6 pb-12">
        {selectedTab === 'overview' && renderOverview()}
        {selectedTab === 'blockchain' && renderBlockchain()}
        {selectedTab === 'security' && renderSecurity()}
        {selectedTab === 'threats' && (
          <div className="text-center py-12">
            <AlertTriangle className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">Threat Analysis</h3>
            <p className="text-gray-600">Advanced threat detection and analysis coming soon</p>
          </div>
        )}
        {selectedTab === 'compliance' && (
          <div className="text-center py-12">
            <FileText className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">Compliance Management</h3>
            <p className="text-gray-600">Compliance framework management coming soon</p>
          </div>
        )}
      </div>
    </div>
  );
};
