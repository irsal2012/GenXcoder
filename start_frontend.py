"""
Startup script for the React frontend.
"""

import os
import sys
import subprocess
import logging

def main():
    """Start the React frontend."""
    
    # Set up logging
    logging.basicConfig(level=logging.INFO)
    logger = logging.getLogger(__name__)
    
    # Change to frontend directory
    frontend_dir = os.path.join(os.path.dirname(__file__), 'frontend')
    
    if not os.path.exists(frontend_dir):
        logger.error("Frontend directory not found!")
        sys.exit(1)
    
    # Change to frontend directory
    os.chdir(frontend_dir)
    
    logger.info("Starting React frontend...")
    logger.info("Frontend will be available at: http://localhost:3000")
    logger.info("Make sure the backend is running at: http://localhost:8000")
    
    try:
        # Start the React development server
        subprocess.run([
            "npm", "run", "dev"
        ], check=True)
    except KeyboardInterrupt:
        logger.info("Frontend server stopped by user")
    except subprocess.CalledProcessError as e:
        logger.error(f"Failed to start frontend server: {e}")
        logger.info("Make sure you have installed dependencies with: npm install")
        sys.exit(1)
    except FileNotFoundError:
        logger.error("npm not found. Please install Node.js and npm first.")
        sys.exit(1)

if __name__ == "__main__":
    main()
