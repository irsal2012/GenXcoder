"""
Model configuration for the Multi-Agent Framework.
Handles Azure OpenAI and other LLM configurations.
"""

import os
from dotenv import load_dotenv
from typing import Dict, Any

# Load environment variables with override
load_dotenv(override=True)

class ModelConfig:
    """Configuration class for LLM models."""
    
    def __init__(self):
        # Azure OpenAI configuration
        self.azure_openai_api_key = os.getenv("AZURE_OPENAI_API_KEY")
        self.azure_openai_endpoint = os.getenv("AZURE_OPENAI_ENDPOINT")
        self.azure_openai_deployment = os.getenv("AZURE_OPENAI_DEPLOYMENT", "gpt-4o")
        self.azure_openai_api_version = os.getenv("AZURE_OPENAI_API_VERSION", "2024-10-21")
        
        # General configuration
        self.max_tokens = int(os.getenv("AZURE_OPENAI_MAX_TOKENS", "4000"))
        self.temperature = float(os.getenv("AZURE_OPENAI_TEMPERATURE", "0.7"))
        
        if not self.azure_openai_api_key:
            raise ValueError("AZURE_OPENAI_API_KEY not found in environment variables")
        if not self.azure_openai_endpoint:
            raise ValueError("AZURE_OPENAI_ENDPOINT not found in environment variables")
        if not self.azure_openai_deployment:
            raise ValueError("AZURE_OPENAI_DEPLOYMENT not found in environment variables")
    
    def get_llm_config(self) -> Dict[str, Any]:
        """Get the LLM configuration for AutoGen agents with Azure OpenAI."""
        config = {
            "config_list": [
                {
                    "model": self.azure_openai_deployment,
                    "api_key": self.azure_openai_api_key,
                    "base_url": self.azure_openai_endpoint,
                    "api_type": "azure",
                    "api_version": self.azure_openai_api_version,
                }
            ],
            "timeout": 120,
            "temperature": self.temperature,
            "max_tokens": self.max_tokens,
        }
            
        return config
    
    def get_coding_config(self) -> Dict[str, Any]:
        """Get specialized config for coding tasks."""
        config = self.get_llm_config()
        config["temperature"] = 0.1  # Lower temperature for code
        return config
    
    def get_review_config(self) -> Dict[str, Any]:
        """Get specialized config for code review tasks."""
        config = self.get_llm_config()
        config["temperature"] = 0.2  # Low temperature for analysis
        return config
    
    def get_creative_config(self) -> Dict[str, Any]:
        """Get specialized config for creative tasks like documentation."""
        config = self.get_llm_config()
        config["temperature"] = 0.8  # Higher temperature for creativity
        return config

# Global model configuration instance
model_config = ModelConfig()
