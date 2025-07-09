# Azure OpenAI Migration Guide

This document outlines the migration from OpenAI to Azure OpenAI in the GenXcoder system.

## 🎯 Migration Overview

The system has been successfully migrated from OpenAI to Azure OpenAI. All AI-powered features now use your Azure OpenAI resource instead of the standard OpenAI API.

## 📋 What Was Changed

### 1. Environment Configuration (`.env`)
- **Before**: Used `OPENAI_API_KEY` and `OPENAI_MODEL`
- **After**: Uses Azure OpenAI specific environment variables:
  ```env
  AZURE_OPENAI_API_KEY="your-azure-api-key"
  AZURE_OPENAI_ENDPOINT="https://your-resource.openai.azure.com/"
  AZURE_OPENAI_DEPLOYMENT="your-deployment-name"
  AZURE_OPENAI_API_VERSION="2024-02-15-preview"
  AZURE_OPENAI_MAX_TOKENS="4000"
  AZURE_OPENAI_TEMPERATURE="0.7"
  ```

### 2. Model Configuration (`agent-service/config/model_config.py`)
- Updated `ModelConfig` class to use Azure OpenAI parameters
- Modified `get_llm_config()` method to return Azure OpenAI compatible configuration
- Added proper Azure OpenAI authentication and endpoint configuration

### 3. Dependencies (`agent-service/requirements.txt`)
- Added `openai>=1.0.0` for Azure OpenAI support
- Added `pyautogen>=0.2.0` for multi-agent framework
- Added `azure-identity>=1.15.0` and `azure-core>=1.29.0` for Azure integration

### 4. Frontend Integration (`frontend/src/services/tenant/TenantService.ts`)
- Extended `TenantIntegrations` interface to support Azure OpenAI configuration
- Added `azureOpenai` configuration option for tenant-specific Azure OpenAI settings

## 🔧 Configuration Details

### Required Environment Variables

| Variable | Description | Example |
|----------|-------------|---------|
| `AZURE_OPENAI_API_KEY` | Your Azure OpenAI API key | `7cp6xUpn5kEk0MktZ8X5T5IG...` |
| `AZURE_OPENAI_ENDPOINT` | Your Azure OpenAI endpoint URL | `https://genexus.openai.azure.com/` |
| `AZURE_OPENAI_DEPLOYMENT` | Your model deployment name | `Genexsus` |
| `AZURE_OPENAI_API_VERSION` | Azure OpenAI API version | `2024-02-15-preview` |

### Optional Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `AZURE_OPENAI_MAX_TOKENS` | Maximum tokens per request | `4000` |
| `AZURE_OPENAI_TEMPERATURE` | Default temperature setting | `0.7` |

## 🚀 Getting Started

### 1. Install Dependencies
```bash
cd agent-service
pip install -r requirements.txt
```

### 2. Test Configuration
Run the test script to verify your Azure OpenAI setup:
```bash
cd agent-service
python test_azure_openai.py
```

### 3. Start Services
```bash
# Start all services
python start_all_services.py

# Or start individually
cd agent-service && python main.py
cd frontend && npm run dev
```

## 🧪 Testing Your Setup

The included test script (`agent-service/test_azure_openai.py`) performs the following checks:

1. **Configuration Test**: Verifies all environment variables are properly set
2. **API Connectivity Test**: Makes a test call to Azure OpenAI to ensure connectivity
3. **Configuration Validation**: Tests different temperature settings for various use cases

### Running the Test
```bash
cd agent-service
python test_azure_openai.py
```

Expected output:
```
🧪 Azure OpenAI Configuration Test Suite
============================================================
🔧 Testing Azure OpenAI Configuration...
==================================================
✅ Azure OpenAI API Key: ********************BGACYeBjFX
✅ Azure OpenAI Endpoint: https://genexus.openai.azure.com/
✅ Azure OpenAI Deployment: Genexsus
✅ Azure OpenAI API Version: 2024-02-15-preview
✅ Max Tokens: 4000
✅ Temperature: 0.7
...
🎉 All tests passed! Azure OpenAI is ready to use.
```

## 🔄 AutoGen Integration

The system uses Microsoft's AutoGen framework for multi-agent conversations. The configuration now properly supports Azure OpenAI:

```python
# Example AutoGen configuration (automatically handled)
config = {
    "config_list": [
        {
            "model": "Genexsus",  # Your deployment name
            "api_key": "your-azure-api-key",
            "base_url": "https://genexus.openai.azure.com/",
            "api_type": "azure",
            "api_version": "2024-02-15-preview",
        }
    ],
    "timeout": 120,
    "temperature": 0.7,
    "max_tokens": 4000,
}
```

## 🎛️ Different Configuration Modes

The system provides specialized configurations for different use cases:

### Coding Tasks (Low Temperature)
- Temperature: 0.1
- Use case: Code generation, debugging, technical analysis

### Code Review Tasks (Very Low Temperature)
- Temperature: 0.2
- Use case: Code review, security analysis, best practices

### Creative Tasks (High Temperature)
- Temperature: 0.8
- Use case: Documentation writing, creative content generation

## 🔐 Security Considerations

1. **API Key Security**: Your Azure OpenAI API key is stored in environment variables and never exposed in logs
2. **Endpoint Validation**: The system validates Azure OpenAI endpoints before making requests
3. **Rate Limiting**: Azure OpenAI has built-in rate limiting and quota management
4. **Tenant Isolation**: Each tenant can have their own Azure OpenAI configuration if needed

## 🛠️ Troubleshooting

### Common Issues

1. **"AZURE_OPENAI_API_KEY not found"**
   - Ensure your `.env` file contains the correct API key
   - Verify the `.env` file is in the root directory

2. **"Deployment not found"**
   - Check that your deployment name matches exactly what's in Azure
   - Verify the deployment is active and not paused

3. **"API version not supported"**
   - Use a supported API version (recommended: `2024-02-15-preview`)
   - Check Azure OpenAI documentation for latest supported versions

4. **"Rate limit exceeded"**
   - Check your Azure OpenAI quota and usage
   - Consider upgrading your Azure OpenAI pricing tier

### Getting Help

1. Run the test script: `python agent-service/test_azure_openai.py`
2. Check Azure OpenAI resource status in Azure Portal
3. Verify your deployment is active and has sufficient quota
4. Review the Azure OpenAI service logs in Azure Portal

## 📊 Monitoring and Analytics

The system now tracks Azure OpenAI usage through:

1. **Request Metrics**: Number of API calls, tokens used, response times
2. **Error Tracking**: Failed requests, rate limit hits, quota exceeded events
3. **Cost Monitoring**: Token usage for cost estimation
4. **Performance Metrics**: Average response times, success rates

## 🔄 Rollback Plan

If you need to rollback to OpenAI:

1. Uncomment OpenAI configuration in `.env`:
   ```env
   OPENAI_API_KEY="your-openai-key"
   OPENAI_MODEL="gpt-4o-mini"
   ```

2. Revert `agent-service/config/model_config.py` to use OpenAI configuration
3. Update the `get_llm_config()` method to use OpenAI format
4. Restart services

## 📈 Next Steps

1. **Monitor Usage**: Keep track of your Azure OpenAI usage and costs
2. **Optimize Performance**: Adjust temperature and token limits based on your use cases
3. **Scale Resources**: Consider multiple deployments for high availability
4. **Custom Models**: Explore fine-tuning capabilities in Azure OpenAI

## 📞 Support

For technical support:
- Check the test script output for specific error messages
- Review Azure OpenAI documentation
- Monitor Azure OpenAI service health in Azure Portal
- Check system logs for detailed error information

---

**Migration completed successfully! 🎉**

Your GenXcoder system is now powered by Azure OpenAI and ready for production use.
