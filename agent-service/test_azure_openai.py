#!/usr/bin/env python3
"""
Test script to verify Azure OpenAI configuration and connectivity.
"""

import os
import sys
import asyncio
from dotenv import load_dotenv

# Add the agent-service directory to the Python path
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from config.model_config import ModelConfig

async def test_azure_openai_config():
    """Test Azure OpenAI configuration."""
    print("🔧 Testing Azure OpenAI Configuration...")
    print("=" * 50)
    
    try:
        # Load environment variables with override
        load_dotenv(override=True)
        
        # Initialize model configuration
        config = ModelConfig()
        
        # Display configuration details
        print(f"✅ Azure OpenAI API Key: {'*' * 20}{config.azure_openai_api_key[-10:] if config.azure_openai_api_key else 'NOT SET'}")
        print(f"✅ Azure OpenAI Endpoint: {config.azure_openai_endpoint}")
        print(f"✅ Azure OpenAI Deployment: {config.azure_openai_deployment}")
        print(f"✅ Azure OpenAI API Version: {config.azure_openai_api_version}")
        print(f"✅ Max Tokens: {config.max_tokens}")
        print(f"✅ Temperature: {config.temperature}")
        
        print("\n🔧 LLM Configuration:")
        print("-" * 30)
        llm_config = config.get_llm_config()
        
        for key, value in llm_config.items():
            if key == "config_list":
                print(f"  {key}:")
                for i, cfg in enumerate(value):
                    print(f"    [{i}]:")
                    for cfg_key, cfg_value in cfg.items():
                        if cfg_key == "api_key":
                            print(f"      {cfg_key}: {'*' * 20}{cfg_value[-10:] if cfg_value else 'NOT SET'}")
                        else:
                            print(f"      {cfg_key}: {cfg_value}")
            else:
                print(f"  {key}: {value}")
        
        print("\n🧪 Testing Different Configurations:")
        print("-" * 40)
        
        # Test coding config
        coding_config = config.get_coding_config()
        print(f"  Coding Config Temperature: {coding_config['temperature']}")
        
        # Test review config
        review_config = config.get_review_config()
        print(f"  Review Config Temperature: {review_config['temperature']}")
        
        # Test creative config
        creative_config = config.get_creative_config()
        print(f"  Creative Config Temperature: {creative_config['temperature']}")
        
        print("\n✅ Configuration test completed successfully!")
        print("🚀 Azure OpenAI is properly configured and ready to use.")
        
        return True
        
    except Exception as e:
        print(f"\n❌ Configuration test failed: {str(e)}")
        print("\n🔍 Troubleshooting tips:")
        print("  1. Check that all Azure OpenAI environment variables are set in .env")
        print("  2. Verify your Azure OpenAI resource is deployed and active")
        print("  3. Ensure the deployment name matches your Azure OpenAI model deployment")
        print("  4. Check that the API version is supported by your Azure OpenAI resource")
        return False

async def test_simple_api_call():
    """Test a simple API call to Azure OpenAI (requires openai library)."""
    print("\n🌐 Testing Azure OpenAI API Connectivity...")
    print("=" * 50)
    
    try:
        import openai
        from config.model_config import ModelConfig
        
        config = ModelConfig()
        
        # Configure OpenAI client for Azure
        client = openai.AzureOpenAI(
            api_key=config.azure_openai_api_key,
            api_version=config.azure_openai_api_version,
            azure_endpoint=config.azure_openai_endpoint
        )
        
        # Test with a simple completion
        print("📤 Sending test request to Azure OpenAI...")
        
        response = client.chat.completions.create(
            model=config.azure_openai_deployment,
            messages=[
                {"role": "system", "content": "You are a helpful assistant."},
                {"role": "user", "content": "Say 'Hello from Azure OpenAI!' and confirm the connection is working."}
            ],
            max_tokens=100,
            temperature=0.7
        )
        
        print("📥 Response received:")
        print(f"  Model: {response.model}")
        print(f"  Content: {response.choices[0].message.content}")
        print(f"  Usage: {response.usage}")
        
        print("\n✅ API connectivity test passed!")
        print("🎉 Azure OpenAI is responding correctly!")
        
        return True
        
    except ImportError:
        print("⚠️  OpenAI library not installed. Run: pip install openai")
        print("   Skipping API connectivity test.")
        return True
        
    except Exception as e:
        print(f"❌ API connectivity test failed: {str(e)}")
        print("\n🔍 Troubleshooting tips:")
        print("  1. Verify your Azure OpenAI API key is valid")
        print("  2. Check that your Azure OpenAI endpoint URL is correct")
        print("  3. Ensure your deployment name exists in your Azure OpenAI resource")
        print("  4. Verify the API version is supported")
        print("  5. Check your Azure OpenAI resource quotas and limits")
        return False

async def main():
    """Main test function."""
    print("🧪 Azure OpenAI Configuration Test Suite")
    print("=" * 60)
    
    # Test 1: Configuration
    config_success = await test_azure_openai_config()
    
    if config_success:
        # Test 2: API Connectivity (optional)
        api_success = await test_simple_api_call()
        
        if config_success and api_success:
            print("\n🎉 All tests passed! Azure OpenAI is ready to use.")
            return 0
        else:
            print("\n⚠️  Some tests failed. Please check the configuration.")
            return 1
    else:
        print("\n❌ Configuration test failed. Please fix the issues before proceeding.")
        return 1

if __name__ == "__main__":
    exit_code = asyncio.run(main())
    sys.exit(exit_code)
