#!/usr/bin/env python3
"""
Script to start the Agent Service
"""

import os
import sys
import subprocess
import signal
import time
import requests
from pathlib import Path

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

def signal_handler(sig, frame):
    print(f'\n{Colors.WARNING}🛑 Shutting down Agent Service...{Colors.ENDC}')
    sys.exit(0)

def print_header():
    """Print startup header"""
    print(f"{Colors.HEADER}{Colors.BOLD}")
    print("=" * 50)
    print("🤖 GenXcode Agent Service Startup")
    print("=" * 50)
    print(f"{Colors.ENDC}")

def check_requirements():
    """Check if requirements are installed"""
    agent_service_dir = Path(__file__).parent / "agent-service"
    requirements_file = agent_service_dir / "requirements.txt"
    
    if not requirements_file.exists():
        print(f"{Colors.FAIL}❌ Requirements file not found!{Colors.ENDC}")
        return False
    
    print(f"{Colors.OKGREEN}✅ Requirements file found{Colors.ENDC}")
    return True

def install_requirements():
    """Install requirements for agent-service"""
    agent_service_dir = Path(__file__).parent / "agent-service"
    requirements_file = agent_service_dir / "requirements.txt"
    
    print(f"{Colors.OKCYAN}📦 Installing agent-service requirements...{Colors.ENDC}")
    try:
        subprocess.run([
            sys.executable, "-m", "pip", "install", "-r", str(requirements_file)
        ], check=True, cwd=agent_service_dir)
        print(f"{Colors.OKGREEN}✅ Requirements installed successfully{Colors.ENDC}")
        return True
    except subprocess.CalledProcessError as e:
        print(f"{Colors.FAIL}❌ Failed to install requirements: {e}{Colors.ENDC}")
        return False

def check_env_file():
    """Check if .env file exists"""
    env_file = Path(__file__).parent / ".env"
    if not env_file.exists():
        print(f"{Colors.WARNING}⚠️  .env file not found. Make sure to configure your environment variables.{Colors.ENDC}")
        return False
    print(f"{Colors.OKGREEN}✅ .env file found{Colors.ENDC}")
    return True

def check_health(timeout=30):
    """Check if agent service is healthy"""
    health_url = "http://localhost:8001/health"
    print(f"{Colors.OKCYAN}⏳ Waiting for Agent Service to be ready...{Colors.ENDC}")
    
    for i in range(timeout):
        try:
            response = requests.get(health_url, timeout=2)
            if response.status_code == 200:
                print(f"{Colors.OKGREEN}✅ Agent Service is ready!{Colors.ENDC}")
                return True
        except requests.exceptions.RequestException:
            pass
        
        time.sleep(1)
        if i % 5 == 0 and i > 0:
            print(f"  Still waiting... ({i}/{timeout}s)")
    
    print(f"{Colors.WARNING}⚠️  Agent Service health check timeout{Colors.ENDC}")
    return False

def start_agent_service():
    """Start the agent service"""
    agent_service_dir = Path(__file__).parent / "agent-service"
    main_file = agent_service_dir / "main.py"
    
    if not main_file.exists():
        print(f"{Colors.FAIL}❌ Agent service main.py not found!{Colors.ENDC}")
        return False
    
    print(f"{Colors.OKGREEN}🚀 Starting Agent Service...{Colors.ENDC}")
    
    try:
        # Start the agent service using uvicorn
        process = subprocess.Popen([
            sys.executable, "-m", "uvicorn", "main:app", 
            "--reload", "--host", "0.0.0.0", "--port", "8001"
        ], cwd=agent_service_dir)
        
        # Wait a bit for service to start
        time.sleep(5)
        
        # Check health
        if check_health():
            print_service_info()
            
            # Keep the service running
            print(f"{Colors.OKCYAN}📊 Agent Service is running... (Press Ctrl+C to stop){Colors.ENDC}")
            try:
                process.wait()
            except KeyboardInterrupt:
                print(f"\n{Colors.WARNING}🛑 Stopping Agent Service...{Colors.ENDC}")
                process.terminate()
                try:
                    process.wait(timeout=5)
                except subprocess.TimeoutExpired:
                    print(f"{Colors.WARNING}💀 Force killing Agent Service...{Colors.ENDC}")
                    process.kill()
                    process.wait()
        else:
            print(f"{Colors.FAIL}❌ Agent Service failed to start properly{Colors.ENDC}")
            process.terminate()
            return False
            
    except Exception as e:
        print(f"{Colors.FAIL}❌ Failed to start Agent Service: {e}{Colors.ENDC}")
        return False
    
    return True

def print_service_info():
    """Print information about the running agent service"""
    print(f"\n{Colors.OKGREEN}{Colors.BOLD}🎉 Agent Service is running!{Colors.ENDC}")
    print(f"\n{Colors.OKCYAN}📊 Service Information:{Colors.ENDC}")
    print(f"  🤖 Agent Service: {Colors.OKBLUE}http://localhost:8001{Colors.ENDC}")
    print(f"    API Documentation: http://localhost:8001/docs")
    print(f"    Health Check: http://localhost:8001/health")
    print(f"    Available Endpoints:")
    print(f"      • /v1/agents - Agent management")
    print(f"      • /v1/pipelines - Pipeline execution")
    print(f"      • /v1/capabilities - Service capabilities")
    print()
    print(f"{Colors.WARNING}💡 Tips:{Colors.ENDC}")
    print("  • Press Ctrl+C to stop the service")
    print("  • Check the logs above for any startup errors")
    print("  • Use the /docs endpoint to explore the API")
    print(f"  • Service runs on port 8001 (different from main backend on 8000)")

def main():
    """Main entry point"""
    # Setup signal handler
    signal.signal(signal.SIGINT, signal_handler)
    signal.signal(signal.SIGTERM, signal_handler)
    
    print_header()
    
    # Check if we're in the right directory
    if not Path("agent-service").exists():
        print(f"{Colors.FAIL}❌ agent-service directory not found. Please run this script from the project root.{Colors.ENDC}")
        sys.exit(1)
    
    # Check requirements
    if not check_requirements():
        sys.exit(1)
    
    # Check environment
    check_env_file()
    
    # Install requirements
    if not install_requirements():
        print(f"{Colors.FAIL}❌ Failed to install requirements. Please install them manually.{Colors.ENDC}")
        sys.exit(1)
    
    # Start the service
    if start_agent_service():
        print(f"{Colors.OKGREEN}✅ Agent Service stopped gracefully{Colors.ENDC}")
    else:
        print(f"{Colors.FAIL}❌ Agent Service failed to start{Colors.ENDC}")
        sys.exit(1)

if __name__ == "__main__":
    main()
