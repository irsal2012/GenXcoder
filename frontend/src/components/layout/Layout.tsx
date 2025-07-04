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
    <div className="min-h-screen bg-gradient-primary animated-gradient">
      {/* Floating background elements */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-64 h-64 bg-white/5 rounded-full blur-3xl animate-float"></div>
        <div className="absolute top-3/4 right-1/4 w-96 h-96 bg-purple-400/10 rounded-full blur-3xl animate-float" style={{ animationDelay: '2s' }}></div>
        <div className="absolute bottom-1/4 left-1/3 w-80 h-80 bg-pink-400/10 rounded-full blur-3xl animate-float" style={{ animationDelay: '4s' }}></div>
      </div>

      {/* Mobile sidebar */}
      <div className={`fixed inset-0 z-50 lg:hidden ${sidebarOpen ? 'block' : 'hidden'}`}>
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setSidebarOpen(false)} />
        <div className="fixed inset-y-0 left-0 flex w-80 flex-col sidebar">
          {/* Mobile Header */}
          <div className="flex h-20 items-center justify-between px-6">
            <div className="flex items-center space-x-3">
              <div className="relative">
                <Bot className="h-10 w-10 text-white" />
                <Sparkles className="absolute -top-1 -right-1 h-4 w-4 text-yellow-300 animate-pulse" />
              </div>
              <div>
                <span className="text-xl font-bold text-white gradient-text">
                  GenXcode
                </span>
                <p className="text-xs text-white/70">AI Code Generator</p>
              </div>
            </div>
            <button
              onClick={() => setSidebarOpen(false)}
              className="p-2 text-white/70 hover:text-white hover:bg-white/10 rounded-xl transition-all duration-200"
            >
              <X className="h-6 w-6" />
            </button>
          </div>

          {/* Mobile Navigation */}
          <nav className="flex-1 space-y-2 px-4 py-6">
            {navigation.map((item) => {
              const Icon = item.icon;
              return (
                <Link
                  key={item.name}
                  to={item.href}
                  onClick={() => setSidebarOpen(false)}
                  className={`nav-item group flex items-center px-4 py-4 text-sm font-medium rounded-2xl transition-all duration-300 ${
                    item.current
                      ? 'active text-white shadow-glow'
                      : 'text-white/80 hover:text-white hover:bg-white/10'
                  }`}
                >
                  <Icon className="mr-4 h-6 w-6 flex-shrink-0" />
                  <div className="flex-1">
                    <div className="font-semibold">{item.name}</div>
                    <div className="text-xs opacity-70">{item.description}</div>
                  </div>
                  {item.current && (
                    <Zap className="h-4 w-4 text-yellow-300 animate-pulse" />
                  )}
                </Link>
              );
            })}
          </nav>
          
          {/* Mobile Backend Status */}
          <div className="border-t border-white/20 p-6">
            <div className="flex items-center justify-between mb-4">
              <span className="text-sm font-semibold text-white">
                System Status
              </span>
              <button
                onClick={() => refetchHealth()}
                className="p-2 text-white/70 hover:text-white hover:bg-white/10 rounded-xl transition-all duration-200"
              >
                <RefreshCw className="h-4 w-4" />
              </button>
            </div>
            <div className="flex items-center space-x-3 p-3 bg-white/10 rounded-xl backdrop-blur-sm">
              <div className={`w-3 h-3 rounded-full ${isHealthy ? 'status-online' : 'status-offline'} animate-pulse`} />
              <div className="flex-1">
                <div className="text-sm font-medium text-white">
                  {isHealthy ? 'All Systems Online' : 'Connection Lost'}
                </div>
                <div className="text-xs text-white/70">
                  {isHealthy ? 'Ready to generate code' : 'Attempting to reconnect...'}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Desktop sidebar */}
      <div className="hidden lg:fixed lg:inset-y-0 lg:flex lg:w-80 lg:flex-col">
        <div className="flex flex-col flex-grow sidebar">
          {/* Desktop Header */}
          <div className="flex h-20 items-center px-6">
            <div className="flex items-center space-x-3">
              <div className="relative">
                <Bot className="h-10 w-10 text-white" />
                <Sparkles className="absolute -top-1 -right-1 h-4 w-4 text-yellow-300 animate-pulse" />
              </div>
              <div>
                <span className="text-xl font-bold text-white gradient-text">
                  GenXcode
                </span>
                <p className="text-xs text-white/70">AI Code Generator</p>
              </div>
            </div>
          </div>

          {/* Desktop Navigation */}
          <nav className="flex-1 space-y-2 px-4 py-6">
            {navigation.map((item) => {
              const Icon = item.icon;
              return (
                <Link
                  key={item.name}
                  to={item.href}
                  className={`nav-item group flex items-center px-4 py-4 text-sm font-medium rounded-2xl transition-all duration-300 ${
                    item.current
                      ? 'active text-white shadow-glow'
                      : 'text-white/80 hover:text-white hover:bg-white/10'
                  }`}
                >
                  <Icon className="mr-4 h-6 w-6 flex-shrink-0" />
                  <div className="flex-1">
                    <div className="font-semibold">{item.name}</div>
                    <div className="text-xs opacity-70">{item.description}</div>
                  </div>
                  {item.current && (
                    <Zap className="h-4 w-4 text-yellow-300 animate-pulse" />
                  )}
                </Link>
              );
            })}
          </nav>
          
          {/* Desktop Backend Status */}
          <div className="border-t border-white/20 p-6">
            <div className="flex items-center justify-between mb-4">
              <span className="text-sm font-semibold text-white">
                System Status
              </span>
              <button
                onClick={() => refetchHealth()}
                className="p-2 text-white/70 hover:text-white hover:bg-white/10 rounded-xl transition-all duration-200"
              >
                <RefreshCw className="h-4 w-4" />
              </button>
            </div>
            <div className="flex items-center space-x-3 p-3 bg-white/10 rounded-xl backdrop-blur-sm">
              <div className={`w-3 h-3 rounded-full ${isHealthy ? 'status-online' : 'status-offline'} animate-pulse`} />
              <div className="flex-1">
                <div className="text-sm font-medium text-white">
                  {isHealthy ? 'All Systems Online' : 'Connection Lost'}
                </div>
                <div className="text-xs text-white/70">
                  {isHealthy ? 'Ready to generate code' : 'Attempting to reconnect...'}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main content */}
      <div className="lg:pl-80">
        {/* Top bar */}
        <div className="sticky top-0 z-40 flex h-20 shrink-0 items-center gap-x-4 px-4 sm:gap-x-6 sm:px-6 lg:px-8 backdrop-blur-xl bg-white/10 border-b border-white/20">
          <button
            type="button"
            className="p-3 text-white/80 hover:text-white hover:bg-white/10 rounded-xl transition-all duration-200 lg:hidden"
            onClick={() => setSidebarOpen(true)}
          >
            <Menu className="h-6 w-6" />
          </button>

          <div className="flex flex-1 gap-x-4 self-stretch lg:gap-x-6">
            <div className="flex flex-1 items-center">
              <div className="flex items-center space-x-3">
                <div className="flex items-center space-x-2">
                  <Sparkles className="h-6 w-6 text-yellow-300 animate-pulse" />
                  <h1 className="text-xl font-bold text-white">
                    Multi-Agent Code Generator
                  </h1>
                </div>
              </div>
            </div>
            
            {/* Top bar actions */}
            <div className="flex items-center space-x-3">
              <button className="p-3 text-white/80 hover:text-white hover:bg-white/10 rounded-xl transition-all duration-200">
                <Settings className="h-5 w-5" />
              </button>
            </div>
          </div>
        </div>

        {/* Page content */}
        <main className="py-8">
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
