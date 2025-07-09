"""
Backend client for communicating with the project management backend.
"""

import asyncio
import logging
import aiohttp
import json
from typing import Dict, Any, Optional
from datetime import datetime

class BackendClient:
    """Client for communicating with the backend service."""
    
    def __init__(self, backend_url: str = "http://localhost:8000"):
        self.backend_url = backend_url.rstrip('/')
        self.logger = logging.getLogger(__name__)
        self.session: Optional[aiohttp.ClientSession] = None
    
    async def __aenter__(self):
        """Async context manager entry."""
        self.session = aiohttp.ClientSession(
            timeout=aiohttp.ClientTimeout(total=30),
            headers={'Content-Type': 'application/json'}
        )
        return self
    
    async def __aexit__(self, exc_type, exc_val, exc_tb):
        """Async context manager exit."""
        if self.session:
            await self.session.close()
    
    async def _ensure_session(self):
        """Ensure session is available."""
        if not self.session:
            self.session = aiohttp.ClientSession(
                timeout=aiohttp.ClientTimeout(total=30),
                headers={'Content-Type': 'application/json'}
            )
    
    async def save_generated_project(self, project_data: Dict[str, Any]) -> Dict[str, Any]:
        """
        Save a generated project to the backend.
        
        Args:
            project_data: Complete project data from agent execution
            
        Returns:
            Response from backend save operation
        """
        try:
            await self._ensure_session()
            
            url = f"{self.backend_url}/api/v1/projects/save-generated"
            
            self.logger.info(f"Saving project to backend: {url}")
            self.logger.debug(f"Project data keys: {list(project_data.keys())}")
            
            async with self.session.post(url, json=project_data) as response:
                if response.status == 200:
                    result = await response.json()
                    self.logger.info(f"Successfully saved project {project_data.get('execution_id', 'unknown')} to backend")
                    return result
                else:
                    error_text = await response.text()
                    self.logger.error(f"Backend save failed with status {response.status}: {error_text}")
                    return {
                        "success": False,
                        "error": f"HTTP {response.status}: {error_text}"
                    }
                    
        except asyncio.TimeoutError:
            error_msg = "Timeout while saving project to backend"
            self.logger.error(error_msg)
            return {"success": False, "error": error_msg}
            
        except aiohttp.ClientError as e:
            error_msg = f"Network error while saving project to backend: {str(e)}"
            self.logger.error(error_msg)
            return {"success": False, "error": error_msg}
            
        except Exception as e:
            error_msg = f"Unexpected error while saving project to backend: {str(e)}"
            self.logger.error(error_msg)
            return {"success": False, "error": error_msg}
    
    async def check_backend_health(self) -> bool:
        """
        Check if the backend service is healthy and reachable.
        
        Returns:
            True if backend is healthy, False otherwise
        """
        try:
            await self._ensure_session()
            
            url = f"{self.backend_url}/health"
            
            async with self.session.get(url) as response:
                if response.status == 200:
                    health_data = await response.json()
                    is_ready = health_data.get('ready', False)
                    if is_ready:
                        self.logger.debug("Backend health check passed")
                        return True
                    else:
                        self.logger.warning(f"Backend not ready: {health_data}")
                        return False
                else:
                    self.logger.warning(f"Backend health check failed with status {response.status}")
                    return False
                    
        except Exception as e:
            self.logger.warning(f"Backend health check failed: {str(e)}")
            return False
    
    async def close(self):
        """Close the client session."""
        if self.session:
            await self.session.close()
            self.session = None

# Global instance
backend_client = BackendClient()
