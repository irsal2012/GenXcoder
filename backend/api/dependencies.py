"""
FastAPI dependencies for dependency injection.
"""

from functools import lru_cache
from services.project_service import ProjectService
from services.file_storage_service import FileStorageService

# Global service instances (singleton pattern)
_project_service = None
_file_storage_service = None

def get_project_service() -> ProjectService:
    """Get project service instance."""
    global _project_service
    if _project_service is None:
        _project_service = ProjectService()
    return _project_service

def get_file_storage_service() -> FileStorageService:
    """Get file storage service instance."""
    global _file_storage_service
    if _file_storage_service is None:
        _file_storage_service = FileStorageService()
    return _file_storage_service
