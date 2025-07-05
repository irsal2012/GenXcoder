# GenXcode Startup Guide

Quick reference for starting and managing all GenXcode services.

## 🚀 Quick Start Commands

### Fastest Way to Start
```bash
# One command to rule them all
./start_all_services.py
```

### Alternative Methods
```bash
# Shell script version
./start_all_services.sh

# Using Make
make start        # Python version
make start-sh     # Shell version
make help         # See all options

# Docker Compose
docker-compose up -d
make docker-up
```

## 📊 What Gets Started

When you run the startup tools, these services will be launched:

| Service | Port | URL | Description |
|---------|------|-----|-------------|
| **Backend API** | 8000 | http://localhost:8000 | FastAPI backend service |
| **Agent Service** | 8001 | http://localhost:8001 | Multi-agent execution service |
| **Frontend** | 5173 | http://localhost:5173 | React frontend (Vite) |
| **MCP Gateway** | - | - | MCP protocol gateway |

### Service Documentation
- Backend API Docs: http://localhost:8000/docs
- Agent Service Docs: http://localhost:8001/docs

## 🛠️ Management Commands

### Starting Services
```bash
./start_all_services.py    # Recommended
make start                 # Alternative
docker-compose up -d       # Docker version
```

### Stopping Services
```bash
# Graceful shutdown (when using startup scripts)
Ctrl+C

# Force stop all services
make stop

# Stop Docker services
make docker-down
```

### Health Checks
```bash
make test                  # Check all services
curl http://localhost:8001/health  # Agent service
curl http://localhost:8000/health  # Backend
```

### Dependency Management
```bash
make install              # Install all dependencies
make clean               # Clean build artifacts
```

## 🔧 Startup Tool Features

### Python Script (`start_all_services.py`)
✅ **Automatic dependency checking**
- Verifies Python 3.11+, Node.js 18+, npm
- Checks for required directories

✅ **Smart dependency installation**
- Auto-installs Python packages from requirements.txt
- Auto-installs Node.js packages if node_modules missing
- Builds MCP Gateway automatically

✅ **Sequential startup with health checks**
- Starts services in correct order
- Waits for each service to be ready
- Validates HTTP endpoints

✅ **Real-time monitoring**
- Monitors all processes
- Detects crashed services
- Colored terminal output

✅ **Graceful shutdown**
- Handles Ctrl+C properly
- Terminates all child processes
- Clean exit

### Shell Script (`start_all_services.sh`)
⚡ **Lightweight and fast**
- Minimal dependencies (bash, curl)
- Quick startup time
- Process tracking with PIDs

📝 **Log file generation**
- Saves logs to `/tmp/*.log`
- Easy debugging
- Background execution

🎯 **Health check validation**
- Tests HTTP endpoints
- Timeout handling
- Status reporting

## 🚨 Troubleshooting

### Common Issues

**"Permission denied" when running scripts**
```bash
chmod +x start_all_services.py
chmod +x start_all_services.sh
```

**"Python not found"**
```bash
# Make sure Python 3.11+ is installed
python3 --version
# Or install Python from python.org
```

**"Node.js not found"**
```bash
# Install Node.js 18+ from nodejs.org
node --version
npm --version
```

**"Port already in use"**
```bash
# Check what's using the ports
lsof -i :8000
lsof -i :8001
lsof -i :5173

# Kill processes if needed
make stop
```

**Services won't start**
```bash
# Check dependencies
make install

# Try Docker instead
make docker-up

# Check logs
tail -f /tmp/*.log  # For shell script
# Or check terminal output for Python script
```

### Debug Mode

For detailed debugging, you can run services individually:

```bash
# Start Agent Service manually
cd agent-service
python main.py

# Start Frontend manually  
cd frontend
npm run dev

# Start MCP Gateway manually
cd mcp-gateway
npm run dev

# Start Backend manually
cd backend
python main.py
```

## 💡 Tips & Best Practices

### Development Workflow
1. Use `./start_all_services.py` for development
2. Use `make docker-up` for production-like testing
3. Use `make test` to verify everything is working
4. Use `make stop` to clean up when switching methods

### Performance Tips
- The Python script is more feature-rich but slower to start
- The shell script is faster but has fewer features
- Docker Compose is best for consistent environments
- Use `make install` once to avoid repeated dependency checks

### Monitoring
- Watch the colored output for status updates
- Check service URLs in your browser
- Use `make test` for quick health checks
- Monitor logs in `/tmp/` when using shell script

## 🔗 Next Steps

After starting services:

1. **Test the APIs**
   - Visit http://localhost:8001/docs
   - Try the `/v1/agents` endpoint
   - Test agent execution

2. **Set up MCP Integration**
   - Follow the MCP setup guide in README.md
   - Configure your MCP client (Claude, Cline)
   - Test MCP tools

3. **Explore the Frontend**
   - Visit http://localhost:5173
   - Test the UI components
   - Try creating a project

4. **Development**
   - Make changes to your code
   - Services will auto-reload (when using --reload)
   - Test your changes

## 📚 Additional Resources

- **Main README**: Complete project documentation
- **API Docs**: http://localhost:8001/docs (when running)
- **MCP Config**: `mcp-config-example.json`
- **Docker Compose**: `docker-compose.yml`
- **Makefile**: All available commands

---

**Need help?** Check the main README.md or open an issue on GitHub.
