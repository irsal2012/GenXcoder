import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  BarChart3,
  Users,
  Settings,
  Shield,
  TrendingUp,
  Activity,
  AlertTriangle,
  CheckCircle,
  Brain,
  Zap,
  Globe,
  Database
} from 'lucide-react';
import AnalyticsDashboard from '../components/analytics/AnalyticsDashboard';
import { analyticsService } from '../services/analytics/AnalyticsService';
import { collaborationService } from '../services/collaboration/CollaborationService';
import { learningSystem } from '../services/ai/advanced/LearningSystem';

export const EnterpriseDashboard: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'overview' | 'analytics' | 'users' | 'collaboration' | 'ai' | 'settings'>('overview');
  const [systemMetrics, setSystemMetrics] = useState<any>(null);
  const [realtimeMetrics, setRealtimeMetrics] = useState<any>(null);
  const [aiInsights, setAiInsights] = useState<any[]>([]);

  useEffect(() => {
    loadSystemData();
    
    // Update real-time metrics every 5 seconds
    const interval = setInterval(() => {
      setRealtimeMetrics(analyticsService.getRealtimeMetrics());
    }, 5000);

    return () => clearInterval(interval);
  }, []);

  const loadSystemData = () => {
    setSystemMetrics(analyticsService.getSystemMetrics());
    setRealtimeMetrics(analyticsService.getRealtimeMetrics());
    setAiInsights(analyticsService.getInsights());
  };

  const getTabIcon = (tab: string) => {
    switch (tab) {
      case 'overview': return <BarChart3 className="w-5 h-5" />;
      case 'analytics': return <TrendingUp className="w-5 h-5" />;
      case 'users': return <Users className="w-5 h-5" />;
      case 'collaboration': return <Globe className="w-5 h-5" />;
      case 'ai': return <Brain className="w-5 h-5" />;
      case 'settings': return <Settings className="w-5 h-5" />;
      default: return <Activity className="w-5 h-5" />;
    }
  };

  const renderOverview = () => (
    <div className="space-y-6">
      {/* Real-time Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white p-6 rounded-2xl shadow-sm border border-gray-200"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Active Users</p>
              <p className="text-2xl font-bold text-gray-900">
                {realtimeMetrics?.activeUsers || 0}
              </p>
            </div>
            <div className="p-3 bg-green-100 rounded-xl">
              <Users className="w-6 h-6 text-green-600" />
            </div>
          </div>
          <div className="mt-2">
            <span className="text-xs text-green-600">Live</span>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-white p-6 rounded-2xl shadow-sm border border-gray-200"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Active Sessions</p>
              <p className="text-2xl font-bold text-gray-900">
                {realtimeMetrics?.currentSessions || 0}
              </p>
            </div>
            <div className="p-3 bg-blue-100 rounded-xl">
              <Activity className="w-6 h-6 text-blue-600" />
            </div>
          </div>
          <div className="mt-2">
            <span className="text-xs text-blue-600">Real-time</span>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-white p-6 rounded-2xl shadow-sm border border-gray-200"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Response Time</p>
              <p className="text-2xl font-bold text-gray-900">
                {realtimeMetrics?.averageResponseTime ? `${Math.round(realtimeMetrics.averageResponseTime)}ms` : '0ms'}
              </p>
            </div>
            <div className="p-3 bg-purple-100 rounded-xl">
              <Zap className="w-6 h-6 text-purple-600" />
            </div>
          </div>
          <div className="mt-2">
            <span className={`text-xs ${realtimeMetrics?.averageResponseTime > 1000 ? 'text-red-600' : 'text-green-600'}`}>
              {realtimeMetrics?.averageResponseTime > 1000 ? 'Slow' : 'Fast'}
            </span>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="bg-white p-6 rounded-2xl shadow-sm border border-gray-200"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Error Rate</p>
              <p className="text-2xl font-bold text-gray-900">
                {realtimeMetrics?.errorRate ? `${(realtimeMetrics.errorRate * 100).toFixed(1)}%` : '0%'}
              </p>
            </div>
            <div className={`p-3 rounded-xl ${realtimeMetrics?.errorRate > 0.05 ? 'bg-red-100' : 'bg-green-100'}`}>
              {realtimeMetrics?.errorRate > 0.05 ? 
                <AlertTriangle className="w-6 h-6 text-red-600" /> :
                <CheckCircle className="w-6 h-6 text-green-600" />
              }
            </div>
          </div>
          <div className="mt-2">
            <span className={`text-xs ${realtimeMetrics?.errorRate > 0.05 ? 'text-red-600' : 'text-green-600'}`}>
              {realtimeMetrics?.errorRate > 0.05 ? 'High' : 'Normal'}
            </span>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="bg-white p-6 rounded-2xl shadow-sm border border-gray-200"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">System Load</p>
              <p className="text-2xl font-bold text-gray-900">
                {realtimeMetrics?.systemLoad ? `${Math.round(realtimeMetrics.systemLoad)}%` : '0%'}
              </p>
            </div>
            <div className={`p-3 rounded-xl ${realtimeMetrics?.systemLoad > 80 ? 'bg-red-100' : realtimeMetrics?.systemLoad > 60 ? 'bg-yellow-100' : 'bg-green-100'}`}>
              <Database className={`w-6 h-6 ${realtimeMetrics?.systemLoad > 80 ? 'text-red-600' : realtimeMetrics?.systemLoad > 60 ? 'text-yellow-600' : 'text-green-600'}`} />
            </div>
          </div>
          <div className="mt-2">
            <span className={`text-xs ${realtimeMetrics?.systemLoad > 80 ? 'text-red-600' : realtimeMetrics?.systemLoad > 60 ? 'text-yellow-600' : 'text-green-600'}`}>
              {realtimeMetrics?.systemLoad > 80 ? 'High' : realtimeMetrics?.systemLoad > 60 ? 'Medium' : 'Low'}
            </span>
          </div>
        </motion.div>
      </div>

      {/* System Health */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          className="bg-white p-6 rounded-2xl shadow-sm border border-gray-200"
        >
          <h3 className="text-lg font-semibold text-gray-900 mb-6">System Health</h3>
          
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-gray-600">Uptime</span>
              <span className="text-sm font-bold text-green-600">99.9%</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div className="bg-green-500 h-2 rounded-full" style={{ width: '99.9%' }} />
            </div>

            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-gray-600">CPU Usage</span>
              <span className="text-sm font-bold text-gray-900">
                {systemMetrics?.resourceUtilization?.cpu ? `${Math.round(systemMetrics.resourceUtilization.cpu)}%` : '0%'}
              </span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div 
                className={`h-2 rounded-full ${systemMetrics?.resourceUtilization?.cpu > 80 ? 'bg-red-500' : systemMetrics?.resourceUtilization?.cpu > 60 ? 'bg-yellow-500' : 'bg-green-500'}`}
                style={{ width: `${systemMetrics?.resourceUtilization?.cpu || 0}%` }}
              />
            </div>

            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-gray-600">Memory Usage</span>
              <span className="text-sm font-bold text-gray-900">
                {systemMetrics?.resourceUtilization?.memory ? `${Math.round(systemMetrics.resourceUtilization.memory)}%` : '0%'}
              </span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div 
                className={`h-2 rounded-full ${systemMetrics?.resourceUtilization?.memory > 80 ? 'bg-red-500' : systemMetrics?.resourceUtilization?.memory > 60 ? 'bg-yellow-500' : 'bg-green-500'}`}
                style={{ width: `${systemMetrics?.resourceUtilization?.memory || 0}%` }}
              />
            </div>

            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-gray-600">Storage Usage</span>
              <span className="text-sm font-bold text-gray-900">
                {systemMetrics?.resourceUtilization?.storage ? `${Math.round(systemMetrics.resourceUtilization.storage)}%` : '0%'}
              </span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div 
                className={`h-2 rounded-full ${systemMetrics?.resourceUtilization?.storage > 80 ? 'bg-red-500' : systemMetrics?.resourceUtilization?.storage > 60 ? 'bg-yellow-500' : 'bg-green-500'}`}
                style={{ width: `${systemMetrics?.resourceUtilization?.storage || 0}%` }}
              />
            </div>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          className="bg-white p-6 rounded-2xl shadow-sm border border-gray-200"
        >
          <h3 className="text-lg font-semibold text-gray-900 mb-6">AI Insights</h3>
          
          <div className="space-y-4">
            {aiInsights.slice(0, 3).map((insight, index) => (
              <div key={insight.id} className="border border-gray-200 rounded-xl p-4">
                <div className="flex items-start space-x-3">
                  <div className={`p-2 rounded-lg ${
                    insight.type === 'opportunity' ? 'bg-green-50 text-green-600' :
                    insight.type === 'risk' ? 'bg-red-50 text-red-600' :
                    insight.type === 'trend' ? 'bg-blue-50 text-blue-600' :
                    'bg-purple-50 text-purple-600'
                  }`}>
                    <Brain className="w-4 h-4" />
                  </div>
                  <div className="flex-1">
                    <h4 className="font-medium text-gray-900 text-sm">{insight.title}</h4>
                    <p className="text-xs text-gray-600 mt-1">{insight.description}</p>
                    <div className="flex items-center justify-between mt-2">
                      <span className={`text-xs px-2 py-1 rounded-full ${
                        insight.impact === 'high' ? 'bg-red-100 text-red-600' :
                        insight.impact === 'medium' ? 'bg-yellow-100 text-yellow-600' :
                        'bg-green-100 text-green-600'
                      }`}>
                        {insight.impact} impact
                      </span>
                      <span className="text-xs text-gray-500">{Math.round(insight.confidence * 100)}% confidence</span>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </motion.div>
      </div>

      {/* Feature Usage */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white p-6 rounded-2xl shadow-sm border border-gray-200"
      >
        <h3 className="text-lg font-semibold text-gray-900 mb-6">Feature Usage</h3>
        
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
          {systemMetrics?.featureUsage && Object.entries(systemMetrics.featureUsage).map(([feature, usage]) => (
            <div key={feature} className="text-center p-4 bg-gray-50 rounded-xl">
              <p className="text-2xl font-bold text-gray-900">{usage as number}</p>
              <p className="text-sm text-gray-600 capitalize">{feature}</p>
            </div>
          ))}
        </div>
      </motion.div>
    </div>
  );

  const renderUserManagement = () => (
    <div className="space-y-6">
      <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-200">
        <h3 className="text-lg font-semibold text-gray-900 mb-6">User Management</h3>
        <div className="text-center py-8">
          <Users className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-600">User management features coming soon</p>
          <p className="text-sm text-gray-500">SSO, role management, and user analytics</p>
        </div>
      </div>
    </div>
  );

  const renderCollaboration = () => (
    <div className="space-y-6">
      <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-200">
        <h3 className="text-lg font-semibold text-gray-900 mb-6">Collaboration Analytics</h3>
        <div className="text-center py-8">
          <Globe className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-600">Collaboration analytics coming soon</p>
          <p className="text-sm text-gray-500">Team productivity metrics and insights</p>
        </div>
      </div>
    </div>
  );

  const renderAI = () => (
    <div className="space-y-6">
      <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-200">
        <h3 className="text-lg font-semibold text-gray-900 mb-6">AI Performance</h3>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="text-center p-6 bg-blue-50 rounded-xl">
            <Brain className="w-8 h-8 text-blue-600 mx-auto mb-4" />
            <p className="text-2xl font-bold text-blue-600">
              {learningSystem.getStatistics().totalConversations}
            </p>
            <p className="text-sm text-blue-600">AI Conversations</p>
          </div>
          
          <div className="text-center p-6 bg-green-50 rounded-xl">
            <CheckCircle className="w-8 h-8 text-green-600 mx-auto mb-4" />
            <p className="text-2xl font-bold text-green-600">
              {(learningSystem.getStatistics().successRate * 100).toFixed(1)}%
            </p>
            <p className="text-sm text-green-600">Success Rate</p>
          </div>
          
          <div className="text-center p-6 bg-purple-50 rounded-xl">
            <TrendingUp className="w-8 h-8 text-purple-600 mx-auto mb-4" />
            <p className="text-2xl font-bold text-purple-600">
              {learningSystem.getStatistics().averageSatisfaction.toFixed(1)}/5
            </p>
            <p className="text-sm text-purple-600">User Satisfaction</p>
          </div>
        </div>
      </div>
    </div>
  );

  const renderSettings = () => (
    <div className="space-y-6">
      <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-200">
        <h3 className="text-lg font-semibold text-gray-900 mb-6">Enterprise Settings</h3>
        <div className="text-center py-8">
          <Settings className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-600">Enterprise settings coming soon</p>
          <p className="text-sm text-gray-500">Security, compliance, and configuration options</p>
        </div>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Enterprise Dashboard</h1>
              <p className="text-gray-600">Advanced analytics and system monitoring</p>
            </div>
            
            <div className="flex items-center space-x-3">
              <div className="flex items-center space-x-2">
                <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
                <span className="text-sm text-gray-600">System Operational</span>
              </div>
              
              <button className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
                <Shield className="h-5 w-5 text-gray-600" />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-6">
          <div className="flex space-x-8">
            {[
              { id: 'overview', label: 'Overview' },
              { id: 'analytics', label: 'Analytics' },
              { id: 'users', label: 'Users' },
              { id: 'collaboration', label: 'Collaboration' },
              { id: 'ai', label: 'AI Performance' },
              { id: 'settings', label: 'Settings' }
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`flex items-center space-x-2 py-4 border-b-2 transition-colors ${
                  activeTab === tab.id
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-600 hover:text-blue-600'
                }`}
              >
                {getTabIcon(tab.id)}
                <span className="font-medium">{tab.label}</span>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto p-6">
        {activeTab === 'overview' && renderOverview()}
        {activeTab === 'analytics' && <AnalyticsDashboard />}
        {activeTab === 'users' && renderUserManagement()}
        {activeTab === 'collaboration' && renderCollaboration()}
        {activeTab === 'ai' && renderAI()}
        {activeTab === 'settings' && renderSettings()}
      </div>
    </div>
  );
};

export default EnterpriseDashboard;
