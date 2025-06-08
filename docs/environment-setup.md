# Environment Setup Guide

This document explains how to set up environment variables for the NGDI Metadata Portal, particularly for map functionality.

## Required Environment Variables

Create a `.env.local` file in the project root with the following variables:

### Database Configuration
```bash
DATABASE_URL="your_database_connection_string"
```

### Authentication (Clerk)
```bash
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY="your_clerk_publishable_key"
CLERK_SECRET_KEY="your_clerk_secret_key"
NEXT_PUBLIC_CLERK_SIGN_IN_URL="/login"
NEXT_PUBLIC_CLERK_SIGN_UP_URL="/signup"
```

### Analytics (PostHog)
```bash
NEXT_PUBLIC_POSTHOG_KEY="your_posthog_key"
NEXT_PUBLIC_POSTHOG_HOST="https://app.posthog.com"
```

### Map Configuration (MapTiler) - **IMPORTANT FOR MAP FUNCTIONALITY**
```bash
# Get your free API key from: https://cloud.maptiler.com/account/keys/
NEXT_PUBLIC_MAPTILER_API_KEY="your_maptiler_api_key_here"
```

## Getting MapTiler API Key (Free)

The map functionality requires a MapTiler API key for optimal performance and access to high-quality map styles.

### Steps to get your free API key:

1. **Visit MapTiler Cloud**: Go to [https://cloud.maptiler.com/signin/](https://cloud.maptiler.com/signin/)

2. **Create Account**: Sign up for a free account (no credit card required)

3. **Access API Keys**: Navigate to [https://cloud.maptiler.com/account/keys/](https://cloud.maptiler.com/account/keys/)

4. **Copy API Key**: Copy your default API key

5. **Add to Environment**: Add it to your `.env.local` file:
   ```bash
   NEXT_PUBLIC_MAPTILER_API_KEY=your_actual_api_key_here
   ```

6. **Restart Development Server**: After adding the key, restart your development server:
   ```bash
   npm run dev
   ```

### Free Tier Limits

MapTiler's free tier includes:
- 100,000 map views per month
- All map styles and features
- No credit card required
- Perfect for development and small-scale applications

## Map Functionality Without API Key

The application will work without a MapTiler API key, but with limitations:
- **Limited Styles**: Only basic OpenStreetMap style available
- **Reduced Performance**: May experience slower loading
- **Missing Features**: Some advanced map features may not work

## Verifying Configuration

### Development Mode
When running in development mode (`npm run dev`), you'll see a debug panel on the map page that shows:
- ✅ MapTiler API Key status
- ✅ MapLibre GL JS loading status
- 📋 Available map styles
- 🔧 Environment information

### Production Mode
In production, the debug panel is automatically hidden for better user experience.

## Troubleshooting

### Map Not Loading
1. **Check API Key**: Ensure `NEXT_PUBLIC_MAPTILER_API_KEY` is set correctly
2. **Restart Server**: After adding environment variables, restart the development server
3. **Check Console**: Look for error messages in browser developer console
4. **Network Issues**: Verify internet connection and that MapTiler services are accessible

### Debug Information
- Open browser developer tools (F12)
- Check the Console tab for MapLibre-related errors
- Check the Network tab to see if map tiles are loading

### Common Issues
- **API Key Invalid**: Double-check the key from MapTiler dashboard
- **Environment File**: Ensure `.env.local` is in the project root directory
- **Browser Cache**: Try hard refresh (Ctrl+F5) or incognito mode

## Security Notes

- Never commit `.env.local` to version control
- The MapTiler API key is safe to expose to the client (prefixed with `NEXT_PUBLIC_`)
- Other API keys (database, auth) should never be exposed to the client

## Need Help?

If you continue experiencing issues:
1. Check the [Map Troubleshooting Guide](./map-troubleshooting.md)
2. Review the browser console for specific error messages
3. Verify all environment variables are properly set 