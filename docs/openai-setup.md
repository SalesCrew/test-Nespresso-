# OpenAI GPT-5 Nano Setup Guide

## Prerequisites

1. Install the OpenAI package:
```bash
npm install openai --legacy-peer-deps
```

## Environment Configuration

Create a `.env.local` file in your project root and add:

```env
# OpenAI API Configuration
OPENAI_API_KEY=your_actual_openai_api_key_here
```

## Getting Your API Key

1. Go to [OpenAI Platform](https://platform.openai.com/api-keys)
2. Sign in to your account
3. Click "Create new secret key"
4. Copy the key and replace `your_actual_openai_api_key_here` in your `.env.local` file

## API Configuration

The AI recommendation system is now configured to use GPT-5 nano with the following settings:

- **Model**: `gpt-5-nano`
- **Max Tokens**: 2000
- **Temperature**: 0.3 (for more deterministic results)
- **Response Format**: JSON object

## Fallback System

If the OpenAI API is unavailable or fails, the system automatically falls back to mock data to ensure the application continues working.

## Testing

1. Set up your API key in `.env.local`
2. Restart your development server
3. Navigate to the Einsatzplan page
4. Click the brain icon to enable AI mode
5. Select an assignment to get AI-powered promotor recommendations

## Pricing

GPT-5 Nano pricing (as of 2024):
- Input tokens: $0.05 per million tokens
- Output tokens: $0.40 per million tokens

Estimated cost per recommendation request: ~$0.001-0.005
