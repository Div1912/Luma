# NVIDIA Model Integration Setup Guide for VS Code

## ✅ Installation Complete

The following has been set up:
1. **OpenAI Python package** - Installed
2. **nvidia-config.py** - Configuration and utility functions
3. **.env.nvidia** - Environment variables

---

## 🔧 VS Code Configuration

### Option 1: Configure as Default LM (Language Model)

Add to your VS Code `settings.json`:

```json
{
  "github.copilot.advanced": {
    "debug.overrideEngine": "gpt4",
    "debug.testOverrideProxyUrl": "https://integrate.api.nvidia.com/v1",
    "debug.overrideModelName": "nvidia/nemotron-3-ultra-550b-a55b"
  }
}
```

**To open settings.json:**
- Press `Ctrl+Shift+P` → Type "Preferences: Open Settings (JSON)"
- Or go to File → Preferences → Settings → Search "settings.json"

---

### Option 2: Use with VS Code Extensions

Install and configure the following extensions:

1. **Continue.dev** (VS Code Extension)
   - Install from VS Code Extensions Marketplace
   - Configure in `.continue/config.json`:

```json
{
  "models": [
    {
      "title": "NVIDIA Nemotron-3",
      "provider": "openai",
      "model": "nvidia/nemotron-3-ultra-550b-a55b",
      "apiBase": "https://integrate.api.nvidia.com/v1",
      "apiKey": "${process.env.NVIDIA_API_KEY}",
      "contextLength": 131072,
      "completionOptions": {
        "temperature": 1,
        "top_p": 0.95,
        "max_tokens": 16384
      }
    }
  ]
}
```

---

## 🚀 Usage Examples

### Example 1: Basic Python Script

Create `test_nvidia.py`:

```python
from nvidia_config import get_nvidia_completion, process_streaming_response

messages = [
    {"role": "user", "content": "What is machine learning?"}
]

completion = get_nvidia_completion(messages)
response, reasoning = process_streaming_response(completion)
```

Run in terminal:
```bash
python test_nvidia.py
```

### Example 2: From VS Code Terminal

```bash
# Set environment variable (Windows PowerShell)
$env:NVIDIA_API_KEY = "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"

# Or (Windows Command Prompt)
set NVIDIA_API_KEY=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

# Run the config test
python nvidia-config.py
```

---

## 🔐 Security Best Practices

⚠️ **IMPORTANT**: Your API key is sensitive data!

1. **Never commit `.env.nvidia` to git**
   - Add to `.gitignore`:
   ```
   .env.nvidia
   .env.local
   *.env
   ```

2. **Use VS Code Secrets Storage** (Recommended)
   - Install: `ms-vscode.remote-repositories`
   - Store API key in VS Code's built-in secret storage

3. **Rotate your key**
   - Visit: https://build.nvidia.com/account
   - Generate a new API key regularly
   - Update in environment variables

---

## ✨ Features

- **Extended Thinking**: Enables reasoning_budget for complex problems
- **Streaming Support**: Real-time token streaming
- **Easy Integration**: Compatible with OpenAI SDK
- **High Performance**: Nemotron-3 Ultra (550B parameters)
- **Extended Context**: Up to 131K tokens

---

## 📋 Model Specs

- **Model**: nvidia/nemotron-3-ultra-550b-a55b
- **Max Tokens**: 16,384
- **Context Window**: ~131,000 tokens
- **Temperature Range**: 0.1 - 2.0
- **API Endpoint**: https://integrate.api.nvidia.com/v1
- **SDK**: OpenAI-compatible

---

## 🐛 Troubleshooting

### Issue: "Invalid API Key"
- Verify key in `.env.nvidia`
- Check key hasn't expired at https://build.nvidia.com

### Issue: "Model not found"
- Confirm model name: `nvidia/nemotron-3-ultra-550b-a55b`
- Check NVIDIA API status

### Issue: "Connection timeout"
- Ensure internet connection
- Check firewall settings
- Verify NVIDIA API is accessible

---

## 📚 Additional Resources

- NVIDIA API Docs: https://build.nvidia.com/explore/discover
- OpenAI SDK Docs: https://platform.openai.com/docs/api-reference
- VS Code Settings: https://code.visualstudio.com/docs/getstarted/settings

---

## ✅ Next Steps

1. Test the configuration:
   ```bash
   python nvidia-config.py
   ```

2. Configure your preferred VS Code extension (Continue.dev recommended)

3. Start using NVIDIA Nemotron-3 in VS Code!

Happy coding! 🚀
