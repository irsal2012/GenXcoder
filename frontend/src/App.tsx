import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import Layout from '@/components/layout/Layout';
import { CodeGenerator } from '@/pages/CodeGenerator';
import ConversationalGenerator from '@/pages/ConversationalGenerator';
import CollaborativeWorkspace from '@/pages/CollaborativeWorkspace';
import EnterpriseDashboard from '@/pages/EnterpriseDashboard';
import GlobalAIModels from '@/pages/GlobalAIModels';
import AIMarketplace from '@/pages/marketplace/AIMarketplace';
import { QuantumAILab } from '@/pages/quantum/QuantumAILab';
import { BlockchainSecurityDashboard } from '@/pages/blockchain/BlockchainSecurityDashboard';
import { AIOrchestrationDashboard } from '@/pages/orchestration/AIOrchestrationDashboard';
import { MetaverseStudio } from '@/pages/metaverse/MetaverseStudio';
import AgentInfo from '@/pages/AgentInfo';
import ProjectHistory from '@/pages/ProjectHistory';

function App() {
  return (
    <Routes>
      <Route path="/" element={<Navigate to="/generator" replace />} />
      <Route path="/generator" element={<CodeGenerator />} />
      <Route path="/chat" element={<ConversationalGenerator />} />
      <Route path="/collaborate" element={<CollaborativeWorkspace />} />
      <Route path="/enterprise" element={<EnterpriseDashboard />} />
      <Route path="/ai-models" element={<GlobalAIModels />} />
      <Route path="/marketplace" element={<AIMarketplace />} />
      <Route path="/quantum" element={<QuantumAILab />} />
      <Route path="/blockchain" element={<BlockchainSecurityDashboard />} />
      <Route path="/orchestration" element={<AIOrchestrationDashboard />} />
      <Route path="/metaverse" element={<MetaverseStudio />} />
      <Route path="/agents" element={
        <Layout>
          <AgentInfo />
        </Layout>
      } />
      <Route path="/history" element={
        <Layout>
          <ProjectHistory />
        </Layout>
      } />
    </Routes>
  );
}

export default App;
