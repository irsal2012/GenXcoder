#!/usr/bin/env python3
"""
GenXcode Multi-Service Startup Tool
Starts frontend, backend, agent service, and MCP gateway simultaneously
"""

import subprocess
import sys
import os
import time
import signal
import threading
import json
from pathlib import Path
from typing import Dict, List, Optional
import requests

class Colors:
    """ANSI color codes for terminal output"""
    HEADER = '\033[95m'
    OKBLUE = '\033[94m'
    OKCYAN = '\033[96m'
    OKGREEN = '\033[92m'
    WARNING = '\033[93m'
    FAIL = '\033[91m'
    ENDC = '\033[0m'
    BOLD = '\033[1m'

class ServiceManager:
    def __init__(self):
        self.processes = []
        self.services = {
            'backend': {
                'name': 'Backend API',
                'command': [sys.executable, '-m', 'uvicorn', 'main:app', '--reload', '--host', '0.0.0.0', '--port', '8000'],
                'cwd': 'backend',
                'port': 8000,
                'health_check': 'http://localhost:8000/docs',
                'startup_time': 10
            },
            'agent-service': {
                'name': 'Agent Service',
                'command': [sys.executable, '-m', 'uvicorn', 'main:app', '--reload', '--host', '0.0.0.0', '--port', '8001'],
                'cwd': 'agent-service',
                'port': 8001,
                'health_check': 'http://localhost:8001/docs',
                'startup_time': 15
            },
            'frontend': {
                'name': 'Frontend (Vite)',
                'command': ['npm', 'run', 'dev'],
                'cwd': 'frontend',
                'port': 5173,
                'health_check': 'http://localhost:5173',
                'startup_time': 20
            },
            'mcp-gateway': {
                'name': 'MCP Gateway',
                'command': ['npm', 'run', 'dev'],
                'cwd': 'mcp-gateway',
                'port': None,  # MCP Gateway doesn't expose HTTP port
                'health_check': None,
                'startup_time': 10
            }
        }
        self.setup_signal_handlers()

    def setup_signal_handlers(self):
        """Setup signal handlers for graceful shutdown"""
        signal.signal(signal.SIGINT, self.signal_handler)
        signal.signal(signal.SIGTERM, self.signal_handler)

    def signal_handler(self, signum, frame):
        """Handle shutdown signals"""
        print(f"\n{Colors.WARNING}🛑 Received shutdown signal. Stopping all services...{Colors.ENDC}")
        self.stop_all_services()
        sys.exit(0)

    def print_header(self):
        """Print startup header"""
        print(f"{Colors.HEADER}{Colors.BOLD}")
        print("=" * 60)
        print("🚀 GenXcode Multi-Service Startup Tool")
        print("=" * 60)
        print(f"{Colors.ENDC}")

    def check_dependencies(self):
        """Check if all required dependencies are installed"""
        print(f"{Colors.OKCYAN}🔍 Checking dependencies...{Colors.ENDC}")
        
        # Check Python
        try:
            python_version = subprocess.check_output([sys.executable, '--version'], text=True).strip()
            print(f"  ✓ {python_version}")
        except Exception as e:
            print(f"  {Colors.FAIL}❌ Python check failed: {e}{Colors.ENDC}")
            return False

        # Check Node.js
        try:
            node_version = subprocess.check_output(['node', '--version'], text=True).strip()
            npm_version = subprocess.check_output(['npm', '--version'], text=True).strip()
            print(f"  ✓ Node.js {node_version}")
            print(f"  ✓ npm {npm_version}")
        except Exception as e:
            print(f"  {Colors.FAIL}❌ Node.js/npm check failed: {e}{Colors.ENDC}")
            return False

        # Check directories
        for service_id, config in self.services.items():
            service_dir = Path(config['cwd'])
            if not service_dir.exists():
                print(f"  {Colors.FAIL}❌ Directory not found: {service_dir}{Colors.ENDC}")
                return False
            print(f"  ✓ Found {service_dir}/")

        return True

    def install_dependencies(self):
        """Install dependencies for all services"""
        print(f"{Colors.OKCYAN}📦 Installing dependencies...{Colors.ENDC}")
        
        # Install Python dependencies
        python_services = ['backend', 'agent-service']
        for service in python_services:
            req_file = Path(service) / 'requirements.txt'
            if req_file.exists():
                print(f"  📦 Installing Python dependencies for {service}...")
                try:
                    subprocess.run([
                        sys.executable, '-m', 'pip', 'install', '-r', str(req_file)
                    ], check=True, capture_output=True)
                    print(f"  ✓ {service} dependencies installed")
                except subprocess.CalledProcessError as e:
                    print(f"  {Colors.WARNING}⚠️  Failed to install {service} dependencies: {e}{Colors.ENDC}")

        # Install Node.js dependencies
        node_services = ['frontend', 'mcp-gateway']
        for service in node_services:
            service_dir = Path(service)
            package_json = service_dir / 'package.json'
            node_modules = service_dir / 'node_modules'
            
            if package_json.exists() and not node_modules.exists():
                print(f"  📦 Installing Node.js dependencies for {service}...")
                try:
                    subprocess.run([
                        'npm', 'install'
                    ], cwd=service_dir, check=True, capture_output=True)
                    print(f"  ✓ {service} dependencies installed")
                except subprocess.CalledProcessError as e:
                    print(f"  {Colors.WARNING}⚠️  Failed to install {service} dependencies: {e}{Colors.ENDC}")

        # Build MCP Gateway
        mcp_build_dir = Path('mcp-gateway/build')
        if not mcp_build_dir.exists():
            print(f"  🔨 Building MCP Gateway...")
            try:
                subprocess.run([
                    'npm', 'run', 'build'
                ], cwd='mcp-gateway', check=True, capture_output=True)
                print(f"  ✓ MCP Gateway built successfully")
            except subprocess.CalledProcessError as e:
                print(f"  {Colors.WARNING}⚠️  Failed to build MCP Gateway: {e}{Colors.ENDC}")

    def start_service(self, service_id: str, config: Dict) -> Optional[subprocess.Popen]:
        """Start a single service"""
        print(f"  🚀 Starting {config['name']}...")
        
        try:
            # Change to service directory and start process
            process = subprocess.Popen(
                config['command'],
                cwd=config['cwd'],
                stdout=subprocess.PIPE,
                stderr=subprocess.PIPE,
                text=True,
                bufsize=1,
                universal_newlines=True
            )
            
            # Store process info
            process.service_id = service_id
            process.service_name = config['name']
            
            return process
            
        except Exception as e:
            print(f"  {Colors.FAIL}❌ Failed to start {config['name']}: {e}{Colors.ENDC}")
            return None

    def check_service_health(self, service_id: str, config: Dict, timeout: int = 30) -> bool:
        """Check if a service is healthy"""
        if not config.get('health_check'):
            return True  # No health check available
            
        print(f"  ⏳ Waiting for {config['name']} to be ready...")
        
        for i in range(timeout):
            try:
                response = requests.get(config['health_check'], timeout=2)
                if response.status_code == 200:
                    print(f"  ✅ {config['name']} is ready!")
                    return True
            except requests.exceptions.RequestException:
                pass
            
            time.sleep(1)
            
        print(f"  {Colors.WARNING}⚠️  {config['name']} health check timeout{Colors.ENDC}")
        return False

    def start_all_services(self):
        """Start all services"""
        print(f"{Colors.OKGREEN}🚀 Starting all services...{Colors.ENDC}")
        
        # Start services in order (backend services first, then frontend)
        service_order = ['backend', 'agent-service', 'mcp-gateway', 'frontend']
        
        for service_id in service_order:
            if service_id not in self.services:
                continue
                
            config = self.services[service_id]
            process = self.start_service(service_id, config)
            
            if process:
                self.processes.append(process)
                
                # Wait a bit for service to start
                time.sleep(config.get('startup_time', 5))
                
                # Check health if available
                if config.get('health_check'):
                    self.check_service_health(service_id, config)
            else:
                print(f"  {Colors.FAIL}❌ Failed to start {config['name']}{Colors.ENDC}")

    def stop_all_services(self):
        """Stop all running services"""
        print(f"{Colors.WARNING}🛑 Stopping all services...{Colors.ENDC}")
        
        for process in self.processes:
            try:
                if process.poll() is None:  # Process is still running
                    print(f"  🛑 Stopping {getattr(process, 'service_name', 'Unknown Service')}...")
                    process.terminate()
                    
                    # Wait for graceful shutdown
                    try:
                        process.wait(timeout=5)
                    except subprocess.TimeoutExpired:
                        print(f"  💀 Force killing {getattr(process, 'service_name', 'Unknown Service')}...")
                        process.kill()
                        process.wait()
                        
            except Exception as e:
                print(f"  {Colors.WARNING}⚠️  Error stopping process: {e}{Colors.ENDC}")

    def print_service_info(self):
        """Print information about running services"""
        print(f"\n{Colors.OKGREEN}{Colors.BOLD}🎉 All services are running!{Colors.ENDC}")
        print(f"\n{Colors.OKCYAN}📊 Service Information:{Colors.ENDC}")
        
        services_info = [
            ("🔧 Backend API", "http://localhost:8000", "API Documentation: http://localhost:8000/docs"),
            ("🤖 Agent Service", "http://localhost:8001", "API Documentation: http://localhost:8001/docs"),
            ("🌐 Frontend", "http://localhost:5173", "React application with Vite"),
            ("🌉 MCP Gateway", "Ready for MCP connections", "Use with MCP-compatible tools")
        ]
        
        for name, url, description in services_info:
            print(f"  {name}: {Colors.OKBLUE}{url}{Colors.ENDC}")
            print(f"    {description}")
            print()

        print(f"{Colors.WARNING}💡 Tips:{Colors.ENDC}")
        print("  • Press Ctrl+C to stop all services")
        print("  • Check the logs above for any startup errors")
        print("  • Make sure all required dependencies are installed")
        print(f"  • Use {Colors.OKBLUE}docker-compose up{Colors.ENDC} for containerized deployment")

    def monitor_services(self):
        """Monitor running services and handle output"""
        print(f"\n{Colors.OKCYAN}📊 Monitoring services... (Press Ctrl+C to stop){Colors.ENDC}")
        
        try:
            while True:
                # Check if any process has died
                for process in self.processes[:]:  # Create a copy to iterate
                    if process.poll() is not None:  # Process has terminated
                        print(f"\n{Colors.FAIL}💀 {getattr(process, 'service_name', 'Unknown Service')} has stopped unexpectedly{Colors.ENDC}")
                        self.processes.remove(process)
                
                # If all processes are dead, exit
                if not self.processes:
                    print(f"{Colors.FAIL}❌ All services have stopped{Colors.ENDC}")
                    break
                    
                time.sleep(5)
                
        except KeyboardInterrupt:
            pass

    def run(self):
        """Main execution method"""
        self.print_header()
        
        # Check dependencies
        if not self.check_dependencies():
            print(f"{Colors.FAIL}❌ Dependency check failed. Please install missing dependencies.{Colors.ENDC}")
            return False
        
        # Install dependencies
        self.install_dependencies()
        
        # Start all services
        self.start_all_services()
        
        # Check if any services started
        if not self.processes:
            print(f"{Colors.FAIL}❌ No services were started successfully{Colors.ENDC}")
            return False
        
        # Print service information
        self.print_service_info()
        
        # Monitor services
        self.monitor_services()
        
        # Cleanup
        self.stop_all_services()
        return True

def main():
    """Main entry point"""
    try:
        manager = ServiceManager()
        success = manager.run()
        sys.exit(0 if success else 1)
    except Exception as e:
        print(f"{Colors.FAIL}❌ Unexpected error: {e}{Colors.ENDC}")
        sys.exit(1)

if __name__ == "__main__":
    main()
