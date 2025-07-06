import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import Layout from '@/components/layout/Layout';
import { CodeGenerator } from '@/pages/CodeGenerator';
import ConversationalGenerator from '@/pages/ConversationalGenerator';
import AgentInfo from '@/pages/AgentInfo';
import ProjectHistory from '@/pages/ProjectHistory';

function App() {
  return (
    <Routes>
      <Route path="/" element={<Navigate to="/generator" replace />} />
      <Route path="/generator" element={<CodeGenerator />} />
      <Route path="/chat" element={<ConversationalGenerator />} />
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
