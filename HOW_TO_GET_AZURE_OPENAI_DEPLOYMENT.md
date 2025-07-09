# How to Get Your Azure OpenAI Deployment Name

The `AZURE_OPENAI_DEPLOYMENT` is the name of your specific model deployment in Azure OpenAI. Here's how to find it:

## 🔍 Method 1: Azure Portal (Recommended)

### Step 1: Access Azure Portal
1. Go to [https://portal.azure.com](https://portal.azure.com)
2. Sign in with your Azure account

### Step 2: Navigate to Your Azure OpenAI Resource
1. In the search bar at the top, type "OpenAI" or "Azure OpenAI"
2. Click on "Azure OpenAI" from the results
3. Select your Azure OpenAI resource (likely named something like "genexus" based on your endpoint)

### Step 3: Find Your Deployments
1. In the left sidebar of your Azure OpenAI resource, click on **"Model deployments"** or **"Deployments"**
2. You'll see a list of your deployed models
3. Look for the **"Deployment name"** column - this is what you need!

### Example:
```
Deployment name    | Model        | Version | Status
-------------------|--------------|---------|--------
gpt-4o            | gpt-4o       | 2024-05-13 | Succeeded
my-gpt-4          | gpt-4        | 0613    | Succeeded
text-embedding    | text-embedding-ada-002 | 2 | Succeeded
```

In this example, your deployment names would be: `gpt-4o`, `my-gpt-4`, or `text-embedding`

## 🔍 Method 2: Azure OpenAI Studio

### Step 1: Access Azure OpenAI Studio
1. Go to [https://oai.azure.com](https://oai.azure.com)
2. Sign in with your Azure account

### Step 2: Select Your Resource
1. Make sure you're in the correct subscription and resource group
2. Select your Azure OpenAI resource from the dropdown

### Step 3: View Deployments
1. Click on **"Deployments"** in the left navigation
2. You'll see all your model deployments listed
3. The **"Deployment name"** is what you need for your `.env` file

## 🔍 Method 3: Azure CLI (For Advanced Users)

If you have Azure CLI installed:

```bash
# Login to Azure
az login

# List your Azure OpenAI resources
az cognitiveservices account list --query "[?kind=='OpenAI']"

# List deployments for your resource (replace with your resource name and group)
az cognitiveservices account deployment list \
  --name "your-openai-resource-name" \
  --resource-group "your-resource-group"
```

## 🔍 Method 4: Check Your Endpoint URL Pattern

Sometimes the deployment name follows a pattern. Based on your endpoint:
`https://genexus.openai.azure.com/`

Common deployment names might be:
- `gpt-4o`
- `gpt-4`
- `gpt-35-turbo`
- `genexus-gpt4` (custom name)

## 📝 What to Look For

Your deployment name is typically:
- **NOT** the model name (like "gpt-4o")
- **IS** the custom name you gave when creating the deployment
- Usually appears in a format like: `my-gpt-4`, `production-gpt4`, `gpt-4o-deployment`, etc.

## ⚙️ Common Deployment Names

Based on your setup, try these common names:
- `gpt-4o`
- `gpt-4`
- `gpt-35-turbo`
- `genexus`
- `genexus-gpt4`
- `production`

## 🔧 How to Update Your Configuration

Once you find your deployment name:

1. **Update your `.env` file:**
   ```env
   AZURE_OPENAI_DEPLOYMENT="your-actual-deployment-name"
   ```

2. **Test the configuration:**
   ```bash
   cd agent-service
   python test_azure_openai.py
   ```

## 🚨 If You Don't See "Model Deployments" (Your Current Situation)

Based on your screenshot, you don't see "Model deployments" in the sidebar. This means you need to create your first deployment. Here's how:

### Method 1: Use Azure AI Foundry Portal (Recommended)
1. **Click "Go to Azure AI Foundry portal"** button in your Azure OpenAI resource (as shown in your screenshot)
2. This will take you to [https://ai.azure.com](https://ai.azure.com)
3. Once there, look for **"Deployments"** in the left navigation
4. Click **"Create deployment"** or **"+ New deployment"**
5. Choose your model:
   - **Model**: Select `gpt-4o` or `gpt-4` (recommended)
   - **Version**: Use the latest available
   - **Deployment name**: Enter something like `gpt-4o` or `genexus-gpt4`
6. Click **"Deploy"**

### Method 2: Azure OpenAI Studio
1. Go directly to [https://oai.azure.com](https://oai.azure.com)
2. Make sure you select your "Genexsus" resource
3. Click **"Deployments"** in the left navigation
4. Click **"Create new deployment"**
5. Configure:
   - **Model**: `gpt-4o` (recommended)
   - **Deployment name**: `gpt-4o` (this is what you'll use in your .env file)
   - **Version**: Latest available
6. Click **"Create"**

### Method 3: From Your Current Azure Portal Page
1. In your current Azure Portal page, click **"Develop"** tab (next to "Get Started")
2. Look for deployment options there
3. Or click the **"Learn More"** link to get to the AI Foundry portal

## 🔍 Troubleshooting

### Error: "DeploymentNotFound"
- Your deployment name in `.env` doesn't match any existing deployment
- Check spelling and case sensitivity
- Verify the deployment status is "Succeeded"

### Error: "ResourceNotFound"
- Your endpoint URL might be incorrect
- Verify your Azure OpenAI resource name in the endpoint

### Error: "Unauthorized"
- Your API key might be incorrect
- Check if the API key has expired
- Verify you're using the correct resource's API key

## � Need Help?

If you're still having trouble:

1. **Check Azure Portal notifications** for any deployment issues
2. **Verify your Azure OpenAI resource is active** and not suspended
3. **Check quotas** - you might have hit usage limits
4. **Contact Azure support** if the resource appears to have issues

## 🎯 Quick Test Commands

Try these deployment names one by one in your `.env` file:

```bash
# Test with common names
AZURE_OPENAI_DEPLOYMENT="gpt-4o"
AZURE_OPENAI_DEPLOYMENT="gpt-4"
AZURE_OPENAI_DEPLOYMENT="gpt-35-turbo"
AZURE_OPENAI_DEPLOYMENT="genexus"
```

After each change, run:
```bash
cd agent-service && python test_azure_openai.py
```

---

**Once you find the correct deployment name, your Azure OpenAI migration will be complete! 🎉**
