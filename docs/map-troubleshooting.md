# Map Troubleshooting Guide

This guide helps resolve common issues with the map component not displaying or controls not working.

## Quick Fix Checklist

### 1. Set up MapTiler API Key (Recommended)

Create a `.env.local` file in the project root with:

```bash
# Get your free API key from: https://cloud.maptiler.com/account/keys/
NEXT_PUBLIC_MAPTILER_API_KEY=your_maptiler_api_key_here
```

**Steps to get API key:**
1. Visit [MapTiler Cloud](https://cloud.maptiler.com/signin/)
2. Create a free account
3. Go to [API Keys](https://cloud.maptiler.com/account/keys/)
4. Copy your API key
5. Add it to `.env.local`
6. Restart your development server

### 2. Verify Environment

Check that you have these dependencies installed:
- `maplibre-gl` ✅ (already in package.json)
- `@types/maplibre-gl` ✅ (already in package.json)

### 3. Development Debug Mode

In development mode, you'll see a debug panel that shows:
- ✅ MapTiler API Key status
- ✅ MapLibre GL JS loading status
- ✅ Available map styles
- ✅ Environment information

### 4. Common Issues & Solutions

#### **Issue: Map not showing (blank area)**
**Causes:**
- Missing MapTiler API Key (most common)
- CSS not loaded properly
- Container height not set
- Network connectivity issues

**Solutions:**
1. Add MapTiler API key to `.env.local`
2. Ensure container has explicit height
3. Check browser console for errors
4. Verify network connectivity

#### **Issue: Controls not showing**
**Causes:**
- Props mismatch between components
- CSS z-index conflicts
- Missing import statements

**Solutions:**
1. Verify MapControls component props
2. Check CSS for z-index conflicts
3. Ensure all imports are correct

#### **Issue: Hydration Errors**
**Causes:**
- Server/client mismatch in rendering
- Window object checks in SSR

**Solutions:**
- Use `dynamic` import with `ssr: false` for client-only components
- Use `useState` + `useEffect` for client-side state
- Avoid direct `window` checks in render

#### **Issue: Styles not loading**
**Causes:**
- Invalid MapTiler API key
- Network restrictions
- CORS issues

**Solutions:**
1. Verify API key is valid and has sufficient quota
2. Check network for restrictions
3. Try different style URLs

## Development Commands

```bash
# Start development server
npm run dev

# Build for production
npm run build

# Start production server
npm start
```

## Debug Information

The debug panel shows:

**API Key Status:**
- ✅ Valid: API key is working
- ❌ Missing/Invalid: Need to set up API key

**MapLibre Status:**
- ✅ Loaded: MapLibre GL JS is properly loaded
- ⚠️ Not Loaded: Check network or imports

**Available Styles:**
- Lists all configured map styles
- Shows which ones require API key

## Production Deployment

1. Set `NEXT_PUBLIC_MAPTILER_API_KEY` in your deployment environment
2. Remove or conditionally hide debug information
3. Test map functionality in production environment
4. Monitor for console errors

## Support

If issues persist:
1. Check browser console for specific errors
2. Verify all environment variables
3. Test with a fresh API key
4. Check MapTiler account quota and usage

## API Key Resources

- [MapTiler Cloud Dashboard](https://cloud.maptiler.com/)
- [API Key Management](https://cloud.maptiler.com/account/keys/)
- [Usage Statistics](https://cloud.maptiler.com/usage/)
- [Documentation](https://docs.maptiler.com/)

## Fallback Behavior

The map system automatically falls back to free map styles when:
- MapTiler API key is missing
- API key is invalid
- Premium style fails to load

**Free Styles Available:**
- Streets (OpenStreetMap-based)
- Alternative free styles from OpenMapTiles/CartoDB

## Browser Compatibility

**Supported Browsers:**
- Chrome 51+
- Firefox 53+
- Safari 10+
- Edge 79+

**WebGL Requirement:**
MapLibre GL requires WebGL support. Check browser compatibility at [caniuse.com/webgl](https://caniuse.com/webgl).

## Performance Tips

1. **Preload Styles**: Map styles are preloaded for faster switching
2. **Caching**: Styles and libraries are cached for better performance
3. **Memory Management**: Event listeners are properly cleaned up

## API Limits

**MapTiler Free Tier:**
- 100,000 map views per month
- All map styles included
- No attribution removal

## Contact Support

If issues persist:
1. Check the [MapTiler documentation](https://docs.maptiler.com/)
2. Review the [MapLibre GL JS documentation](https://maplibre.org/maplibre-gl-js-docs/)
3. File an issue with debug information 