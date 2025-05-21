# Setting Up MapTiler API Key

This document explains how to obtain and configure a MapTiler API key for use with the map components in this application.

## Steps to obtain a MapTiler API key:

1. **Create an account**: Visit [MapTiler Cloud](https://cloud.maptiler.com/signin/) and create a free account
2. **Navigate to API keys**: Once logged in, go to [https://cloud.maptiler.com/account/keys/](https://cloud.maptiler.com/account/keys/)
3. **Copy your API key**: You'll see your default API key or you can create a new one

## Configure the API key in your application:

1. Create a `.env.local` file in the root of the project if it doesn't exist
2. Add the following line to your `.env.local` file:
   ```
   NEXT_PUBLIC_MAPTILER_API_KEY=your_api_key_here
   ```
3. Restart your development server

## Available MapTiler Map Styles

With your API key configured, the following map styles will be available in the layer control:

- **Streets**: Default style provided by MapLibre (no API key required)
- **Satellite**: Satellite imagery with labels (requires API key)
- **Terrain**: Topographic map style (requires API key)

You can customize these styles or add more by modifying the `availableBaseStyles` array in `app/map/page.tsx`.

## Other Map Style Options

MapTiler offers many additional map styles you can use:

- `streets-v2` - Modern street maps
- `basic-v2` - Clean, minimalist style
- `hybrid` - Satellite imagery with labels
- `topo-v2` - Topographic/terrain style
- `winter-v2` - Winter-themed style
- `outdoor-v2` - Outdoor activities focused
- `openstreetmap` - OpenStreetMap style
- And many more

To use these styles, replace the URL in the map configuration with:

```
`https://api.maptiler.com/maps/STYLE_NAME/style.json?key=${apiKey}`
```

Where `STYLE_NAME` is one of the style names listed above.

## Free Tier Limitations

The free MapTiler plan includes:

- 100,000 map views per month
- Access to all base map styles
- Vector and raster maps

This is sufficient for development and small-scale deployments. For production use with higher traffic, you may need to upgrade to a paid plan.
