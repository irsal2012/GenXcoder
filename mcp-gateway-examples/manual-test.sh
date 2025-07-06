#!/bin/bash

echo "🔧 Manual MCP Gateway Test"
echo "=========================="
echo ""

echo "1. Testing MCP Gateway startup..."
echo "The MCP Gateway should be running in another terminal."
echo ""

echo "2. Testing direct communication with MCP Gateway..."
echo "We'll send a tools/list request to see available tools."
echo ""

# Create a temporary test script
cat > temp_mcp_test.js << 'EOF'
import { spawn } from 'child_process';

const mcpProcess = spawn('node', ['../mcp-gateway/build/index.js'], {
  stdio: ['pipe', 'pipe', 'pipe']
});

// Handle stderr (server logs)
mcpProcess.stderr.on('data', (data) => {
  console.log('🔧 MCP Server:', data.toString().trim());
});

// Send a simple tools/list request
setTimeout(() => {
  const request = {
    jsonrpc: '2.0',
    id: 1,
    method: 'tools/list',
    params: {}
  };
  
  console.log('📤 Sending request:', JSON.stringify(request));
  mcpProcess.stdin.write(JSON.stringify(request) + '\n');
}, 2000);

// Listen for responses
mcpProcess.stdout.on('data', (data) => {
  const lines = data.toString().split('\n').filter(line => line.trim());
  lines.forEach(line => {
    try {
      const response = JSON.parse(line);
      console.log('📥 Response:', JSON.stringify(response, null, 2));
    } catch (e) {
      console.log('📋 Raw output:', line);
    }
  });
});

// Clean up after 10 seconds
setTimeout(() => {
  mcpProcess.kill();
  process.exit(0);
}, 10000);
EOF

echo "Running MCP test..."
node temp_mcp_test.js

# Clean up
rm temp_mcp_test.js

echo ""
echo "✅ Test complete!"
