// Help content for metadata form fields
export interface HelpContent {
  title?: string
  content: string
  examples?: string[]
  learnMoreUrl?: string
}

export const helpContent: Record<string, HelpContent> = {
  // General Information
  title: {
    title: "Dataset Title",
    content:
      "A clear, descriptive name for your dataset that helps users understand what it contains.",
    examples: [
      "Land Use Classification for Lagos State 2023",
      "Population Density Map of Nigeria",
      "Road Network Database for Abuja FCT"
    ]
  },

  abstract: {
    title: "Abstract/Description",
    content:
      "A comprehensive summary describing the purpose, content, and key characteristics of your dataset.",
    examples: [
      "This dataset contains satellite-derived land use classifications for Lagos State, Nigeria, created using Landsat 8 imagery from 2023."
    ]
  },

  dataType: {
    title: "Data Type",
    content:
      "The format and structure of your geospatial data, which determines how it can be used and processed.",
    examples: [
      "Vector: Points, lines, polygons (shapefiles, GeoJSON)",
      "Raster: Satellite imagery, elevation models (GeoTIFF)",
      "Point Cloud: LiDAR data, 3D measurements",
      "Service: Web map services, APIs"
    ]
  },

  keywords: {
    title: "Keywords/Tags",
    content:
      "Relevant terms that help users discover your dataset through search. Include both general and specific terms.",
    examples: [
      "land use, classification, satellite imagery, Lagos",
      "population, demographics, census, Nigeria",
      "transportation, roads, infrastructure, Abuja"
    ]
  },

  // Spatial Information
  coordinateSystem: {
    title: "Coordinate Reference System (CRS)",
    content:
      "The mathematical framework used to locate geographic features. Essential for accurate mapping and analysis.",
    examples: [
      "EPSG:4326 (WGS84 Geographic)",
      "EPSG:32633 (UTM Zone 33N)",
      "EPSG:26332 (Nigeria West Belt)"
    ],
    learnMoreUrl: "https://epsg.io/"
  },

  spatialResolution: {
    title: "Spatial Resolution",
    content:
      "The level of detail in your spatial data, measured in ground units per pixel for raster data or scale for vector data.",
    examples: [
      "30m (Landsat imagery)",
      "10m (Sentinel-2 imagery)",
      "1:50,000 (vector map scale)"
    ]
  },

  extentBounds: {
    title: "Geographic Extent",
    content:
      "The geographic boundary that defines the area covered by your dataset, specified as minimum and maximum coordinates.",
    examples: [
      "Lagos State: 6.4°N to 6.7°N, 3.1°E to 3.7°E",
      "Nigeria: 4.3°N to 13.9°N, 2.7°E to 14.7°E"
    ]
  },

  // Temporal Information
  temporalExtent: {
    title: "Temporal Coverage",
    content:
      "The time period that your data represents or was collected over. Important for understanding data currency and relevance.",
    examples: [
      "Single date: 2023-03-15",
      "Time series: 2020-01-01 to 2023-12-31",
      "Seasonal: Dry season 2023"
    ]
  },

  updateFrequency: {
    title: "Update Frequency",
    content:
      "How often the dataset is refreshed or updated with new information.",
    examples: [
      "Annual",
      "Monthly",
      "Weekly",
      "Real-time",
      "As needed",
      "One-time"
    ]
  },

  // Data Quality
  accuracyReport: {
    title: "Accuracy Assessment",
    content:
      "Information about how accurate your data is, including any validation methods used and error measurements.",
    examples: [
      "Overall accuracy: 85% based on 500 ground truth points",
      "Positional accuracy: ±5 meters",
      "Thematic accuracy: 90% for urban areas"
    ]
  },

  qualityMeasures: {
    title: "Quality Measures",
    content:
      "Specific metrics and methods used to assess and validate the quality of your dataset.",
    examples: [
      "Ground truth validation using GPS points",
      "Cross-validation with existing datasets",
      "Visual inspection by experts"
    ]
  },

  // Processing Information
  processingSteps: {
    title: "Processing Steps",
    content:
      "The workflow and methods used to create or process your dataset from raw data sources.",
    examples: [
      "1. Atmospheric correction of satellite imagery",
      "2. Supervised classification using Random Forest",
      "3. Post-processing and smoothing filters"
    ]
  },

  algorithm: {
    title: "Processing Algorithm",
    content:
      "The specific computational methods or algorithms used to generate the dataset.",
    examples: [
      "Random Forest classifier",
      "Maximum Likelihood classification",
      "NDVI calculation",
      "Watershed delineation"
    ]
  },

  // Technical Details
  fileFormat: {
    title: "File Format",
    content:
      "The technical format in which your data is stored and distributed.",
    examples: [
      "GeoTIFF (for raster data)",
      "Shapefile (.shp, .dbf, .shx)",
      "GeoJSON",
      "NetCDF",
      "CSV with coordinates"
    ]
  },

  fileSize: {
    title: "File Size",
    content:
      "The storage space required for your dataset, helping users plan downloads and storage.",
    examples: ["15.2 MB", "1.5 GB", "250 KB per tile"]
  },

  // Access and Use
  accessRights: {
    title: "Access Rights",
    content:
      "Who can access and use this dataset, including any restrictions or requirements.",
    examples: [
      "Public - Open access",
      "Restricted - Academic use only",
      "Private - Organization members only"
    ]
  },

  useConstraints: {
    title: "Use Constraints",
    content:
      "Any limitations on how the dataset can be used, shared, or modified.",
    examples: [
      "Attribution required when using data",
      "Commercial use prohibited",
      "No redistribution without permission"
    ]
  },

  // Contact Information
  contactInfo: {
    title: "Point of Contact",
    content:
      "Information about who to contact for questions, access requests, or more information about the dataset."
  },

  // Location
  country: {
    title: "Country",
    content:
      "The primary country where the dataset's geographic coverage is located."
  },

  administrativeArea: {
    title: "Administrative Area",
    content:
      "The state, province, or administrative division where the data is located.",
    examples: ["Lagos State", "Federal Capital Territory", "Kano State"]
  },

  // Service-specific
  serviceUrl: {
    title: "Service URL",
    content:
      "The web address where users can access your web map service or API.",
    examples: ["https://example.com/wms", "https://api.example.com/data/v1"]
  },

  serviceType: {
    title: "Service Type",
    content: "The type of web service providing access to the geospatial data.",
    examples: [
      "WMS (Web Map Service)",
      "WFS (Web Feature Service)",
      "WMTS (Web Map Tile Service)",
      "REST API"
    ]
  },

  // Additional General Information fields
  purpose: {
    title: "Purpose",
    content:
      "The intended use or objective for which this dataset was created.",
    examples: [
      "Urban planning and development",
      "Environmental monitoring",
      "Infrastructure management",
      "Academic research"
    ]
  },

  topicCategory: {
    title: "Topic Category",
    content:
      "The main theme or subject area that best describes your dataset content.",
    examples: [
      "Environment (natural resources)",
      "Transportation (roads, railways)",
      "Planning/Cadastre (land use)",
      "Society (demographics, culture)"
    ]
  },

  version: {
    title: "Version",
    content:
      "The version number or identifier for this release of the dataset.",
    examples: ["1.0", "2.1.3", "v2023.03", "Release 2.0"]
  },

  language: {
    title: "Language",
    content:
      "The primary language used in the dataset documentation and attribute labels.",
    examples: ["English", "French", "Hausa", "Yoruba"]
  },

  status: {
    title: "Assessment/Status",
    content: "The current development or completion status of the dataset.",
    examples: [
      "Completed",
      "In Progress",
      "Planned",
      "Historical Archive",
      "Under Review"
    ]
  },

  thumbnailUrl: {
    title: "Thumbnail URL",
    content:
      "A web link to a preview image that represents your dataset visually.",
    examples: [
      "https://example.com/preview.png",
      "Data portal preview image URL"
    ]
  },

  cloudCover: {
    title: "Cloud Cover Percentage",
    content:
      "For satellite imagery, the percentage of the scene covered by clouds.",
    examples: ["5% (clear)", "25% (partly cloudy)", "80% (mostly cloudy)"]
  },

  frameworkType: {
    title: "Framework Type",
    content:
      "The type of framework or standard used for organizing the dataset.",
    examples: ["ISO 19115", "FGDC", "Dublin Core", "Custom framework"]
  },

  // Spatial Information fields
  projection: {
    title: "Projection",
    content:
      "The map projection method used to represent the curved Earth surface on a flat map.",
    examples: [
      "Universal Transverse Mercator (UTM)",
      "Geographic (Lat/Lon)",
      "Web Mercator",
      "Lambert Conformal Conic"
    ],
    learnMoreUrl: "https://proj.org/"
  },

  datum: {
    title: "Datum",
    content:
      "The reference surface used as the basis for coordinate measurements.",
    examples: [
      "WGS84 (World Geodetic System 1984)",
      "NAD83 (North American Datum 1983)",
      "Minna Datum (Nigeria)",
      "Clarke 1880"
    ]
  },

  resolutionScale: {
    title: "Resolution Scale",
    content:
      "The level of detail represented as a scale ratio or resolution value.",
    examples: [
      "1:50,000 (map scale)",
      "30 meters (pixel size)",
      "1:10,000 (large scale)",
      "100 meters (coarse resolution)"
    ]
  },

  geometricObjectType: {
    title: "Geometric Object Type",
    content: "The type of geometric features represented in vector datasets.",
    examples: [
      "Point (cities, wells, sample locations)",
      "Line (roads, rivers, boundaries)",
      "Polygon (land parcels, administrative areas)",
      "Complex (mixed geometry types)"
    ]
  },

  featuresCount: {
    title: "Number of Features",
    content:
      "The total count of individual features or objects in the dataset.",
    examples: [
      "1,250 buildings",
      "50 weather stations",
      "25 administrative zones"
    ]
  },

  distributionFormat: {
    title: "Distribution Format",
    content:
      "The file format in which the spatial data is distributed to users.",
    examples: [
      "Shapefile (.shp)",
      "GeoJSON (.json)",
      "KML (.kml)",
      "GeoPackage (.gpkg)"
    ]
  },

  spatialRepresentationType: {
    title: "Spatial Representation Type",
    content: "How the spatial data is represented and structured.",
    examples: [
      "Vector (points, lines, polygons)",
      "Grid (raster, regular cells)",
      "TIN (triangulated irregular network)",
      "Text/Table (coordinate lists)"
    ]
  },

  topologyLevel: {
    title: "Topology Level",
    content:
      "The level of topological relationships maintained in vector data.",
    examples: [
      "Geometry Only (coordinates only)",
      "Topology 1D (linear networks)",
      "Topology 2D (area relationships)",
      "Full Topology (all relationships)"
    ]
  },

  cellGeometry: {
    title: "Cell Geometry",
    content: "For raster data, how the grid cells are shaped and arranged.",
    examples: [
      "Square cells (most common)",
      "Rectangular cells",
      "Hexagonal cells",
      "Triangular cells"
    ]
  },

  transformationAvailability: {
    title: "Transformation Parameters",
    content:
      "Whether coordinate transformation parameters are available for converting between coordinate systems.",
    examples: [
      "Available (can transform coordinates)",
      "Not available (transformation not possible)",
      "Partial (some parameters missing)"
    ]
  },

  compressionGeneration: {
    title: "Compression Generation",
    content:
      "The level or method of data compression applied to reduce file size.",
    examples: [
      "None (uncompressed)",
      "LZW compression",
      "JPEG compression",
      "Lossless compression"
    ]
  },

  // Bounding coordinates
  westBound: {
    title: "West Bounding Coordinate",
    content:
      "The westernmost longitude that defines the geographic extent of your data.",
    examples: ["3.1°E (Lagos western boundary)", "-180° (global west limit)"]
  },

  eastBound: {
    title: "East Bounding Coordinate",
    content:
      "The easternmost longitude that defines the geographic extent of your data.",
    examples: ["14.7°E (Nigeria eastern boundary)", "180° (global east limit)"]
  },

  northBound: {
    title: "North Bounding Coordinate",
    content:
      "The northernmost latitude that defines the geographic extent of your data.",
    examples: ["13.9°N (Nigeria northern boundary)", "90° (North Pole)"]
  },

  southBound: {
    title: "South Bounding Coordinate",
    content:
      "The southernmost latitude that defines the geographic extent of your data.",
    examples: ["4.3°N (Nigeria southern boundary)", "-90° (South Pole)"]
  },

  // Vertical extent
  minimumValue: {
    title: "Minimum Elevation/Depth",
    content: "The lowest elevation or depth value covered by your dataset.",
    examples: [
      "0 meters (sea level)",
      "-200 meters (below sea level)",
      "100 meters elevation"
    ]
  },

  maximumValue: {
    title: "Maximum Elevation/Depth",
    content: "The highest elevation or depth value covered by your dataset.",
    examples: [
      "2,419 meters (Chappal Waddi peak)",
      "1,000 meters elevation",
      "500 meters depth"
    ]
  },

  unitOfMeasure: {
    title: "Unit of Measure",
    content:
      "The unit used to measure elevation, depth, or other vertical dimensions.",
    examples: ["Meters", "Feet", "Kilometers", "Fathoms"]
  },

  // Temporal fields
  dateFrom: {
    title: "Start Date",
    content: "The beginning date of the time period covered by your dataset.",
    examples: ["2023-01-01", "2020-12-15", "1990-01-01 (historical data)"]
  },

  dateTo: {
    title: "End Date",
    content: "The ending date of the time period covered by your dataset.",
    examples: ["2023-12-31", "Present", "2023-06-30 (survey period)"]
  },

  // Quality fields
  lineage: {
    title: "Lineage/Data Source History",
    content:
      "The history and sources of your data, including how it was created or derived.",
    examples: [
      "Derived from Landsat 8 satellite imagery acquired in 2023",
      "Field survey conducted using GPS units in March 2023",
      "Digitized from 1:50,000 topographic maps"
    ]
  },

  completenessReport: {
    title: "Completeness Report",
    content:
      "Information about how complete your dataset is, including any missing data or gaps.",
    examples: [
      "Complete coverage for urban areas, 85% coverage for rural areas",
      "All administrative boundaries included",
      "Some remote areas not surveyed due to accessibility"
    ]
  },

  logicalConsistency: {
    title: "Logical Consistency",
    content:
      "Description of how well the data conforms to expected logical rules and relationships.",
    examples: [
      "All polygons are properly closed",
      "No overlapping administrative boundaries",
      "Topology validated with no errors found"
    ]
  },

  // Processing fields
  softwareVersions: {
    title: "Software and Versions",
    content:
      "The software tools and their versions used to process or create the dataset.",
    examples: [
      "ArcGIS Pro 3.1, ERDAS IMAGINE 2022",
      "QGIS 3.28, GDAL 3.5.2",
      "R 4.3.0 with sf package 1.0-12"
    ]
  },

  processorName: {
    title: "Processor Name",
    content:
      "The name of the person or organization responsible for processing the data.",
    examples: ["Dr. John Smith", "GIS Team", "Remote Sensing Lab"]
  },

  processorEmail: {
    title: "Processor Email",
    content:
      "Contact email for the person or organization that processed the data.",
    examples: ["j.smith@university.edu", "gis-team@agency.gov.ng"]
  },

  processorOrganization: {
    title: "Processor Organization",
    content:
      "The organization or institution where the data processing was conducted.",
    examples: [
      "University of Lagos Geography Department",
      "Nigeria Geological Survey Agency",
      "Federal Ministry of Environment"
    ]
  },

  processingDate: {
    title: "Processing Date",
    content: "The date when the data processing or analysis was completed.",
    examples: ["2023-06-15", "March 2023", "Q2 2023"]
  },

  // Additional fields

  cloudCoverPercentage: {
    title: "Cloud Cover Percentage",
    content:
      "For satellite or aerial imagery, the percentage of the image area obscured by clouds. Important for assessing image quality and usability.",
    examples: [
      "5% (excellent quality)",
      "25% (good quality)",
      "75% (poor quality due to clouds)"
    ]
  },

  geometricObjects: {
    title: "Geometric Objects",
    content:
      "For vector data, the types and counts of geometric features contained in the dataset.",
    examples: [
      "Points: 1,250 locations",
      "Lines: 500 road segments",
      "Polygons: 150 administrative areas"
    ]
  },

  axisDimensions: {
    title: "Axis Dimensions",
    content:
      "For raster or grid data, the size and resolution of each dimension (usually X, Y, and sometimes Z or time).",
    examples: [
      "X: 1024 pixels at 30m resolution",
      "Y: 1024 pixels at 30m resolution",
      "Time: 365 daily observations"
    ]
  },

  // Additional missing help content
  axisName: {
    title: "Axis Name",
    content:
      "The name or identifier for a specific axis dimension in raster data.",
    examples: ["X", "Y", "Longitude", "Latitude", "Time", "Elevation"]
  },

  axisSize: {
    title: "Axis Size",
    content:
      "The number of pixels, cells, or data points along this axis dimension.",
    examples: ["1024 pixels", "500 cells", "365 time steps"]
  },

  axisResolution: {
    title: "Axis Resolution",
    content:
      "The size of each cell or the spacing between data points along this axis.",
    examples: ["30 meters", "0.01 degrees", "1 day", "5 meters"]
  },

  geometricObjectCount: {
    title: "Geometric Object Count",
    content: "The number of features of this geometric type in the dataset.",
    examples: ["1,250 points", "500 lines", "150 polygons"]
  },

  transformationParameterAvailability: {
    title: "Transformation Parameter Availability",
    content:
      "Indicates whether transformation parameters are available for this dataset.",
    examples: ["Enable if parameters are documented", "Disable if unknown"]
  },

  compressionGenerationQuantity: {
    title: "Compression Generation Quantity",
    content: "The number of lossy compression cycles used on the image data.",
    examples: [
      "0 (no compression)",
      "1 (single compression)",
      "2 (multiple compressions)"
    ]
  }
}

// Helper function to get help content safely
export function getHelpContent(fieldName: string): HelpContent | null {
  return helpContent[fieldName] || null
}
