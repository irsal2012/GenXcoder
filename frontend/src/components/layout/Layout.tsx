import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { 
  Bot, 
  Code, 
  History, 
  Info, 
  Menu, 
  X, 
  CheckCircle, 
  XCircle,
  RefreshCw,
  Sparkles,
  Zap,
  Settings
} from 'lucide-react';
import apiClient from '@/services/api';

interface LayoutProps {
  children: React.ReactNode;
}

const Layout: React.FC<LayoutProps> = ({ children }) => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const location = useLocation();

  // Health check query
  const { data: isHealthy, refetch: refetchHealth } = useQuery({
    queryKey: ['health'],
    queryFn: () => apiClient.healthCheck(),
    refetchInterval: 30000, // Check every 30 seconds
    retry: 1,
  });

  const navigation = [
    {
      name: 'Code Generator',
      href: '/generator',
      icon: Code,
      current: location.pathname === '/generator',
      description: 'Create amazing applications',
    },
    {
      name: 'Agent Information',
      href: '/agents',
      icon: Bot,
      current: location.pathname === '/agents',
      description: 'Meet your AI team',
    },
    {
      name: 'Project History',
      href: '/history',
      icon: History,
      current: location.pathname === '/history',
      description: 'View past creations',
    },
  ];

  return (
    <div className="min-h-screen bg-gray-50">

      {/* Mobile sidebar */}
      <div className={`fixed inset-0 z-50 lg:hidden ${sidebarOpen ? 'block' : 'hidden'}`}>
        <div className="fixed inset-0 bg-black/50" onClick={() => setSidebarOpen(false)} />
        <div className="fixed inset-y-0 left-0 flex w-72 flex-col sidebar">
          {/* Mobile Header */}
          <div className="flex h-16 items-center justify-between px-6 border-b border-gray-200">
            <div className="flex items-center space-x-3">
              <Bot className="h-8 w-8 text-blue-600" />
              <div>
                <span className="text-lg font-bold text-gray-900">
                  GenXcode
                </span>
                <p className="text-xs text-gray-500">AI Code Generator</p>
              </div>
            </div>
            <button
              onClick={() => setSidebarOpen(false)}
              className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          {/* Mobile Navigation */}
          <nav className="flex-1 space-y-1 px-4 py-4">
            {navigation.map((item) => {
              const Icon = item.icon;
              return (
                <Link
                  key={item.name}
                  to={item.href}
                  onClick={() => setSidebarOpen(false)}
                  className={`nav-item group flex items-center px-3 py-3 text-sm font-medium transition-colors ${
                    item.current
                      ? 'active text-white'
                      : 'text-gray-700 hover:text-gray-900 hover:bg-gray-100'
                  }`}
                >
                  <Icon className="mr-3 h-5 w-5 flex-shrink-0" />
                  <div className="flex-1">
                    <div className="font-medium">{item.name}</div>
                    <div className="text-xs text-gray-500">{item.description}</div>
                  </div>
                </Link>
              );
            })}
          </nav>
          
          {/* Mobile Backend Status */}
          <div className="border-t border-gray-200 p-4">
            <div className="flex items-center justify-between mb-3">
              <span className="text-sm font-medium text-gray-900">
                System Status
              </span>
              <button
                onClick={() => refetchHealth()}
                className="p-1 text-gray-400 hover:text-gray-600 rounded transition-colors"
              >
                <RefreshCw className="h-4 w-4" />
              </button>
            </div>
            <div className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg">
              <div className={`w-2 h-2 rounded-full ${isHealthy ? 'status-online' : 'status-offline'}`} />
              <div className="flex-1">
                <div className="text-sm font-medium text-gray-900">
                  {isHealthy ? 'All Systems Online' : 'Connection Lost'}
                </div>
                <div className="text-xs text-gray-500">
                  {isHealthy ? 'Ready to generate code' : 'Attempting to reconnect...'}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Desktop sidebar */}
      <div className="hidden lg:fixed lg:inset-y-0 lg:flex lg:w-72 lg:flex-col">
        <div className="flex flex-col flex-grow sidebar">
          {/* Desktop Header */}
          <div className="flex h-16 items-center px-6 border-b border-gray-200">
            <div className="flex items-center space-x-3">
              <Bot className="h-8 w-8 text-blue-600" />
              <div>
                <span className="text-lg font-bold text-gray-900">
                  GenXcode
                </span>
                <p className="text-xs text-gray-500">AI Code Generator</p>
              </div>
            </div>
          </div>

          {/* Desktop Navigation */}
          <nav className="flex-1 space-y-1 px-4 py-4">
            {navigation.map((item) => {
              const Icon = item.icon;
              return (
                <Link
                  key={item.name}
                  to={item.href}
                  className={`nav-item group flex items-center px-3 py-3 text-sm font-medium transition-colors ${
                    item.current
                      ? 'active text-white'
                      : 'text-gray-700 hover:text-gray-900 hover:bg-gray-100'
                  }`}
                >
                  <Icon className="mr-3 h-5 w-5 flex-shrink-0" />
                  <div className="flex-1">
                    <div className="font-medium">{item.name}</div>
                    <div className="text-xs text-gray-500">{item.description}</div>
                  </div>
                </Link>
              );
            })}
          </nav>
          
          {/* Desktop Backend Status */}
          <div className="border-t border-gray-200 p-4">
            <div className="flex items-center justify-between mb-3">
              <span className="text-sm font-medium text-gray-900">
                System Status
              </span>
              <button
                onClick={() => refetchHealth()}
                className="p-1 text-gray-400 hover:text-gray-600 rounded transition-colors"
              >
                <RefreshCw className="h-4 w-4" />
              </button>
            </div>
            <div className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg">
              <div className={`w-2 h-2 rounded-full ${isHealthy ? 'status-online' : 'status-offline'}`} />
              <div className="flex-1">
                <div className="text-sm font-medium text-gray-900">
                  {isHealthy ? 'All Systems Online' : 'Connection Lost'}
                </div>
                <div className="text-xs text-gray-500">
                  {isHealthy ? 'Ready to generate code' : 'Attempting to reconnect...'}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main content */}
      <div className="lg:pl-72">
        {/* Top bar */}
        <div className="sticky top-0 z-40 flex h-16 shrink-0 items-center gap-x-4 px-4 sm:gap-x-6 sm:px-6 lg:px-8 bg-white border-b border-gray-200">
          <button
            type="button"
            className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors lg:hidden"
            onClick={() => setSidebarOpen(true)}
          >
            <Menu className="h-5 w-5" />
          </button>

          <div className="flex flex-1 gap-x-4 self-stretch lg:gap-x-6">
            <div className="flex flex-1 items-center">
              <h1 className="text-xl font-semibold text-gray-900">
                Multi-Agent Code Generator
              </h1>
            </div>
            
            {/* Top bar actions */}
            <div className="flex items-center space-x-3">
              <button className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors">
                <Settings className="h-5 w-5" />
              </button>
            </div>
          </div>
        </div>

        {/* Page content */}
        <main className="py-6">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="animate-fade-in">
              {children}
            </div>
          </div>
        </main>
      </div>
    </div>
  );
};

export default Layout;
