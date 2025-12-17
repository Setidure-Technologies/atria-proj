# Groq API Setup Instructions

## 1. Get Your Groq API Key

1. Visit [Groq Console](https://console.groq.com/)
2. Sign up for a free account or log in
3. Navigate to [API Keys](https://console.groq.com/keys)
4. Create a new API key
5. Copy your API key

## 2. Update the Application

Replace `'your-groq-api-key-here'` in the following files with your actual API key:

- `App.jsx` (line ~8)
- `QuizScreenFixed.jsx` (line ~4)

Example:
```javascript
const GROQ_API_KEY = 'gsk_...your-actual-key-here...';
```

## 3. Model Options

The app is configured to use `llama-3.3-70b-versatile` by default. You can change to other models:

- `llama-3.1-8b-instant` - Faster, lighter model
- `mixtral-8x7b-32768` - Good balance of speed and capability
- `gemma2-9b-it` - Efficient alternative

## 4. Security Note

⚠️ **Important**: In production applications, never hardcode API keys in your source code. Use environment variables instead:

```javascript
const GROQ_API_KEY = process.env.REACT_APP_GROQ_API_KEY;
```

## 5. Rate Limits

Groq provides generous free tier limits:
- Free tier: 30 requests per minute
- See [Rate Limits](https://console.groq.com/docs/rate-limits) for current limits

## 6. Migration Benefits

✅ **Improvements over local Ollama:**
- No need to install or run local AI models
- Faster response times with cloud infrastructure
- More reliable service availability
- Access to latest models without local downloads
- Better error handling and rate limiting