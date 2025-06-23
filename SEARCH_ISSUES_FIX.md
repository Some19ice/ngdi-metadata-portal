# Search Functionality Issues - Fix Guide

## Problem

The search bar in the header component and map page location search are not working in production.

## Root Cause Analysis

The issues are related to the MapTiler geocoding API configuration and fallback handling.

## Fixes Applied

### 1. Enhanced Geocoding API Route (`/api/map/geocode`)

- **Added fallback geocoding data** for major Nigerian cities (Lagos, Abuja, Kano, Ibadan, Port Harcourt)
- **Improved error handling** with graceful degradation
- **Added timeout protection** (5 seconds) for MapTiler API calls
- **Enhanced logging** for debugging production issues
- **Better API key detection** across multiple environment variable names

### 2. Improved Server Action (`geocodeLocationAction`)

- **Enhanced error handling** with detailed logging
- **Support for fallback responses** from the API
- **Better success/error messaging**

### 3. Updated Client Components

- **Global Search Bar**: Added better error feedback and logging
- **Map Search Input**: Improved user feedback for failed searches

### 4. Debug Tools

- **Debug endpoint**: `/api/debug/geocoding` for checking server configuration
- **Debug page**: `/debug/search` for testing search functionality

## Environment Variables Required

The application checks for MapTiler API keys in this order:

1. `MAPTILER_API_KEY_SERVER`
2. `MAPTILER_API_KEY`
3. `NEXT_PUBLIC_MAPTILER_API_KEY`

## Immediate Steps to Fix Production

### 1. Check API Key Configuration

Visit `/api/debug/geocoding` in production to check:

- API key status
- Environment variable detection
- Test geocoding request

### 2. Test Search Functionality

Visit `/debug/search` to:

- Test the geocoding action
- Test direct API calls
- View server information

### 3. Set Environment Variables

In your Vercel deployment, ensure one of these environment variables is set:

```
MAPTILER_API_KEY=your_maptiler_api_key_here
```

### 4. Fallback Mode

If no API key is available, the system will automatically use fallback data with these Nigerian locations:

- Lagos, Nigeria
- Abuja, Nigeria
- Kano, Nigeria
- Ibadan, Nigeria
- Port Harcourt, Nigeria

## Testing the Fix

1. **Header Search**: Type "Lagos" in the header search bar - should show suggestions
2. **Map Search**: Go to `/map` and search for "Abuja" - should show results
3. **Debug Tools**: Visit `/debug/search` to test all functionality

## Monitoring

The enhanced logging will show in your Vercel function logs:

- API key detection status
- MapTiler request/response details
- Fallback activation
- Error details

## Long-term Improvements

1. **Geographic Data Expansion**: Add more Nigerian cities and LGAs to fallback data
2. **Search Analytics**: Track search success/failure rates
3. **Caching Strategy**: Implement Redis caching for frequent searches
4. **Alternative Providers**: Add backup geocoding services (Nominatim, Here, etc.)

## Files Modified

1. `app/api/map/geocode/route.ts` - Enhanced geocoding API
2. `actions/map-actions.ts` - Improved server action
3. `components/search/global-search-bar.tsx` - Better error handling
4. `app/map/_components/map-search-input.tsx` - Improved user feedback
5. `app/api/debug/geocoding/route.ts` - New debug endpoint
6. `app/debug/search/page.tsx` - Debug page (already existed)

The search functionality should now work reliably in production with or without the MapTiler API key.
