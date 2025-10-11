/*
 * Metadata Data Generator
 * ----------------------
 * Utility functions to generate realistic metadata records for seeding the database.
 * Includes comprehensive data structures covering all aspects of the NGDI metadata schema.
 */

import {
  datasetTypeEnum,
  frameworkTypeEnum,
  metadataTopicCategoryEnum,
  type LocationInfo,
  type SpatialInfo,
  type TemporalInfo,
  type TechnicalDetailsInfo,
  type ConstraintsInfo,
  type DataQualityInfo,
  type ProcessingInfo,
  type DistributionInfo,
  type MetadataReferenceInfo,
  type FundamentalDatasetsInfo,
  type BoundingBoxInfo,
  type PositionalAccuracyDetail,
  type ProcessorContact,
  type SourceInfo,
  type DistributionContact,
  type LicenseInfo,
  type MetadataPoc,
  metadataStatusEnum
} from "@/db/schema"

// Nigerian states and LGAs for realistic location data
const NIGERIAN_STATES = [
  "Lagos",
  "Kano",
  "Kaduna",
  "Oyo",
  "Rivers",
  "Bayelsa",
  "Akwa Ibom",
  "Imo",
  "Ondo",
  "Edo",
  "Delta",
  "Ogun",
  "Osun",
  "Kwara",
  "Borno",
  "Adamawa",
  "Bauchi",
  "Gombe",
  "Taraba",
  "Yobe",
  "Jigawa",
  "Katsina",
  "Kebbi",
  "Sokoto",
  "Zamfara",
  "Niger",
  "Kogi",
  "Benue",
  "Nassarawa",
  "Plateau",
  "Abuja",
  "Anambra",
  "Abia",
  "Ebonyi",
  "Enugu",
  "Cross River",
  "Akwa Ibom"
]

const NIGERIAN_ZONES = [
  "North Central",
  "North East",
  "North West",
  "South East",
  "South South",
  "South West"
]

const RESEARCH_INSTITUTIONS = [
  "Nigerian Institute for Oceanography and Marine Research",
  "Federal Department of Forestry",
  "Nigerian Geological Survey Agency",
  "Nigerian Meteorological Agency",
  "Centre for Geodesy and Geodynamics",
  "National Centre for Remote Sensing",
  "Federal Surveys Department",
  "National Population Commission",
  "Nigerian Building and Road Research Institute",
  "Institute for Agricultural Research"
]

const UNIVERSITIES = [
  "University of Lagos",
  "Ahmadu Bello University",
  "University of Nigeria, Nsukka",
  "Obafemi Awolowo University",
  "University of Ibadan",
  "Federal University of Technology, Akure",
  "Rivers State University",
  "University of Port Harcourt"
]

// Generate realistic Nigerian bounding boxes
export function generateNigeriaBoundingBox(): BoundingBoxInfo {
  // Nigeria's approximate bounds: 4°N to 14°N, 3°E to 15°E
  const minLat = 4.0,
    maxLat = 14.0
  const minLng = 3.0,
    maxLng = 15.0

  // Generate a reasonable bbox size (0.5 to 4 degrees)
  const bboxHeight = 0.5 + Math.random() * 3.5
  const bboxWidth = 0.5 + Math.random() * 3.5

  // Pick a center point within valid bounds, accounting for bbox size
  const centerLat =
    minLat + bboxHeight / 2 + Math.random() * (maxLat - minLat - bboxHeight)
  const centerLng =
    minLng + bboxWidth / 2 + Math.random() * (maxLng - minLng - bboxWidth)

  // Calculate bounds
  const north = centerLat + bboxHeight / 2
  const south = centerLat - bboxHeight / 2
  const east = centerLng + bboxWidth / 2
  const west = centerLng - bboxWidth / 2

  // Ensure bounds stay within Nigeria
  return {
    northBoundingCoordinate:
      Math.round(Math.min(north, maxLat) * 10000) / 10000,
    southBoundingCoordinate:
      Math.round(Math.max(south, minLat) * 10000) / 10000,
    eastBoundingCoordinate: Math.round(Math.min(east, maxLng) * 10000) / 10000,
    westBoundingCoordinate: Math.round(Math.max(west, minLng) * 10000) / 10000
  }
}

export function generateLocationInfo(): LocationInfo {
  const state =
    NIGERIAN_STATES[Math.floor(Math.random() * NIGERIAN_STATES.length)]
  const zone = NIGERIAN_ZONES[Math.floor(Math.random() * NIGERIAN_ZONES.length)]

  return {
    country: "Nigeria",
    geopoliticalZone: zone,
    state: state,
    lga: `${state} ${Math.random() > 0.5 ? "North" : "South"} LGA`,
    townCity: `${state} Metropolitan Area`
  }
}

export function generateSpatialInfo(dataType: string): SpatialInfo {
  const coordinateSystems = [
    "WGS 84",
    "UTM Zone 31N",
    "UTM Zone 32N",
    "Minna Datum",
    "Nigerian Geographic Grid"
  ]

  const projections = [
    "Geographic",
    "Universal Transverse Mercator",
    "Lambert Conformal Conic"
  ]

  const formats =
    dataType === "Raster"
      ? ["GeoTIFF", "ERDAS IMAGINE", "NetCDF", "HDF5"]
      : ["Shapefile", "GeoJSON", "KML", "PostGIS", "File Geodatabase"]

  return {
    coordinateSystem:
      coordinateSystems[Math.floor(Math.random() * coordinateSystems.length)],
    projection: projections[Math.floor(Math.random() * projections.length)],
    datum: "WGS 84",
    resolutionScale:
      dataType === "Raster"
        ? `${[10, 30, 250, 1000][Math.floor(Math.random() * 4)]}m`
        : "1:50,000",
    geometricObjectType:
      dataType === "Vector"
        ? ["Point", "LineString", "Polygon"][Math.floor(Math.random() * 3)]
        : "Grid",
    numFeaturesOrLayers: Math.floor(Math.random() * 1000) + 1,
    format: formats[Math.floor(Math.random() * formats.length)],
    distributionFormat: formats[Math.floor(Math.random() * formats.length)],
    spatialRepresentationType: dataType === "Raster" ? "Raster" : "Vector",
    vectorSpatialRepresentation:
      dataType === "Vector"
        ? {
            topologyLevel: "geometryOnly",
            geometricObjects: [
              {
                type: ["Point", "LineString", "Polygon"][
                  Math.floor(Math.random() * 3)
                ],
                count: Math.floor(Math.random() * 10000) + 1
              }
            ]
          }
        : null,
    rasterSpatialRepresentation:
      dataType === "Raster"
        ? {
            axisDimensions: [
              {
                name: "x",
                size: 1024 + Math.floor(Math.random() * 4096),
                resolution: "30m"
              },
              {
                name: "y",
                size: 1024 + Math.floor(Math.random() * 4096),
                resolution: "30m"
              }
            ],
            cellGeometry: "area",
            transformationParameterAvailability: true,
            cloudCoverPercentage: Math.floor(Math.random() * 20),
            compressionGenerationQuantity: 1
          }
        : null,
    boundingBox: generateNigeriaBoundingBox(),
    verticalExtent:
      Math.random() > 0.7
        ? {
            minimumValue: 0,
            maximumValue: Math.floor(Math.random() * 2000),
            unitOfMeasure: "meters"
          }
        : null
  }
}

export function generateTemporalInfo(): TemporalInfo {
  const startYear = 2010 + Math.floor(Math.random() * 14) // 2010-2024
  const endYear = startYear + Math.floor(Math.random() * 5) // Up to 5 years later

  return {
    dateFrom: `${startYear}-01-01`,
    dateTo: `${endYear}-12-31`
  }
}

export function generateTechnicalDetailsInfo(
  dataType: string
): TechnicalDetailsInfo {
  const formats = {
    Raster: ["GeoTIFF", "ERDAS IMAGINE", "NetCDF", "HDF5", "JPEG2000"],
    Vector: ["Shapefile", "GeoJSON", "KML", "PostGIS", "File Geodatabase"],
    Table: ["CSV", "Excel", "Access", "PostgreSQL", "SQLite"],
    Service: ["WMS", "WFS", "REST API", "SOAP", "OGC"],
    Document: ["PDF", "Word", "HTML", "XML", "Markdown"]
  }

  return {
    fileFormat: formats[dataType as keyof typeof formats]?.[0] || "Unknown",
    fileSizeMB: Math.round((Math.random() * 1000 + 1) * 100) / 100,
    numFeaturesOrLayers: Math.floor(Math.random() * 50) + 1,
    softwareHardwareRequirements:
      "ArcGIS 10.8+, QGIS 3.0+, or compatible GIS software"
  }
}

export function generateConstraintsInfo(): ConstraintsInfo {
  const accessLevels = [
    "Public",
    "Restricted",
    "Confidential",
    "Internal Use Only"
  ]
  const useLimitations = [
    "Attribution required",
    "Non-commercial use only",
    "Academic research only",
    "Government use only",
    "No redistribution without permission"
  ]

  return {
    accessConstraints:
      accessLevels[Math.floor(Math.random() * accessLevels.length)],
    useConstraints:
      useLimitations[Math.floor(Math.random() * useLimitations.length)],
    otherConstraints:
      Math.random() > 0.7 ? "Contact data provider for commercial use" : null
  }
}

export function generateDataQualityInfo(): DataQualityInfo {
  const positionalAccuracy: PositionalAccuracyDetail = {
    accuracyReport: "Tested against ground control points",
    accuracyPercentage: Math.round((85 + Math.random() * 14) * 100) / 100, // 85-99%
    accuracyExplanation:
      "Accuracy determined through field validation and GPS measurements"
  }

  return {
    logicalConsistencyReport:
      "Data passed topological validation and consistency checks",
    completenessReport: `Dataset is ${Math.round((90 + Math.random() * 9) * 100) / 100}% complete for the study area`,
    attributeAccuracyReport:
      "Attributes verified through field surveys and secondary sources",
    horizontalAccuracy: positionalAccuracy,
    verticalAccuracy: Math.random() > 0.6 ? positionalAccuracy : null
  }
}

export function generateProcessingInfo(): ProcessingInfo {
  const institution =
    Math.random() > 0.5
      ? RESEARCH_INSTITUTIONS[
          Math.floor(Math.random() * RESEARCH_INSTITUTIONS.length)
        ]
      : UNIVERSITIES[Math.floor(Math.random() * UNIVERSITIES.length)]

  const processorContact: ProcessorContact = {
    processorName: `${institution} Research Team`,
    processorEmail: `research@${institution.toLowerCase().replace(/\s+/g, "")}.edu.ng`,
    processorAddress: `${institution}, Nigeria`
  }

  const sourceInfo: SourceInfo = {
    sourceScaleDenominator: [25000, 50000, 100000, 250000][
      Math.floor(Math.random() * 4)
    ],
    sourceMediaType: "Digital",
    sourceCitation: `${institution} Dataset Collection ${2020 + Math.floor(Math.random() * 4)}`,
    citationTitle: "Geospatial Data Collection for Nigeria",
    contractReference: `NG-${Math.floor(Math.random() * 1000000)}`,
    contractDate: `${2020 + Math.floor(Math.random() * 4)}-06-15`
  }

  return {
    processingStepsDescription:
      "Data collected, cleaned, validated, and formatted according to NGDI standards",
    softwareAndVersionUsed: "ArcGIS Pro 3.0, ENVI 5.6, Python 3.8",
    processedDate: `${2022 + Math.floor(Math.random() * 2)}-08-15`,
    processorContact: processorContact,
    sourceInfo: sourceInfo
  }
}

export function generateDistributionInfo(): DistributionInfo {
  const institution =
    RESEARCH_INSTITUTIONS[
      Math.floor(Math.random() * RESEARCH_INSTITUTIONS.length)
    ]

  const distributionContact: DistributionContact = {
    contactPersonOffice: `${institution} Data Services`,
    email: `data@${institution.toLowerCase().replace(/\s+/g, "")}.gov.ng`,
    departmentUnit: "Geospatial Data Division",
    phoneNumber: `+234-1-${Math.floor(Math.random() * 9000000) + 1000000}`
  }

  const licenseInfo: LicenseInfo = {
    licenseType: [
      "Creative Commons Attribution",
      "Open Data License",
      "Government License",
      "Academic Use Only"
    ][Math.floor(Math.random() * 4)],
    usageTerms:
      "Free for academic and research purposes. Contact provider for commercial use.",
    attributionRequirements: `Data provided by ${institution}, Nigeria`,
    accessRestrictions: Math.random() > 0.7 ? ["Registration required"] : null
  }

  return {
    distributionFormat: ["Shapefile", "GeoTIFF", "GeoJSON", "KML"][
      Math.floor(Math.random() * 4)
    ],
    accessMethod: ["Download", "API", "FTP", "Web Service"][
      Math.floor(Math.random() * 4)
    ],
    downloadUrl: `https://data.ngdi.gov.ng/download/dataset-${Math.floor(Math.random() * 100000)}`,
    apiEndpoint: `https://api.ngdi.gov.ng/v1/datasets/${Math.floor(Math.random() * 100000)}`,
    licenseInfo: licenseInfo,
    distributionContact: distributionContact
  }
}

export function generateMetadataReferenceInfo(): MetadataReferenceInfo {
  const metadataPoc: MetadataPoc = {
    contactName_metadataPOC: "Dr. Ibrahim Mohammed",
    address_metadataPOC: "Federal Ministry of Environment, Abuja, Nigeria",
    email_metadataPOC: "metadata@environment.gov.ng",
    phoneNumber_metadataPOC: "+234-9-5234567"
  }

  return {
    metadataCreationDate: `${2022 + Math.floor(Math.random() * 2)}-${String(Math.floor(Math.random() * 12) + 1).padStart(2, "0")}-15`,
    metadataReviewDate: `${2023 + Math.floor(Math.random() * 2)}-${String(Math.floor(Math.random() * 12) + 1).padStart(2, "0")}-15`,
    metadataPoc: metadataPoc
  }
}

export function generateFundamentalDatasetsInfo(): FundamentalDatasetsInfo {
  // Randomly select which fundamental dataset types this record represents
  return {
    geodeticData: Math.random() > 0.8,
    topographicData: Math.random() > 0.7,
    cadastralData: Math.random() > 0.8,
    administrativeBoundaries: Math.random() > 0.6,
    hydrographicData: Math.random() > 0.7,
    landUseLandCover: Math.random() > 0.6,
    geologicalData: Math.random() > 0.8,
    demographicData: Math.random() > 0.7,
    digitalImagery: Math.random() > 0.5,
    transportationData: Math.random() > 0.7,
    others: Math.random() > 0.9,
    othersSpecify:
      Math.random() > 0.9 ? "Climate and weather monitoring data" : null
  }
}

// Dataset templates for different types of Nigerian geospatial data
export const DATASET_TEMPLATES = [
  {
    title: "Nigeria Administrative Boundaries Level {level}",
    abstract:
      "Official administrative boundary dataset for Nigeria showing {type} boundaries with complete attribute information including population, area, and administrative codes.",
    purpose:
      "Support administrative planning, census operations, and governance activities",
    keywords: [
      "Nigeria",
      "Boundaries",
      "Administrative",
      "Governance",
      "Planning"
    ],
    frameworkType: "Administrative" as const,
    dataType: "Vector" as const,
    level: ["State", "LGA", "Ward", "Enumeration Area"],
    type: ["state", "local government area", "ward", "enumeration area"]
  },
  {
    title: "Landsat-{sensor} Imagery - {location} ({year})",
    abstract:
      "Multi-spectral satellite imagery from Landsat-{sensor} covering {location} and surrounding areas. Processed to Level-2 surface reflectance with atmospheric correction applied.",
    purpose:
      "Land use mapping, environmental monitoring, change detection, and resource assessment",
    keywords: ["Landsat", "Satellite", "Imagery", "Remote Sensing", "Nigeria"],
    frameworkType: "Thematic" as const,
    dataType: "Raster" as const,
    sensor: ["8", "9"],
    location: NIGERIAN_STATES,
    year: [2020, 2021, 2022, 2023, 2024]
  },
  {
    title: "Nigeria Road Network - {category} Roads",
    abstract:
      "Comprehensive vector dataset of Nigeria's {category} road network including road classification, surface type, condition, and connectivity information.",
    purpose:
      "Transportation planning, logistics optimization, emergency response, and infrastructure development",
    keywords: [
      "Roads",
      "Transportation",
      "Infrastructure",
      "Nigeria",
      "Network"
    ],
    frameworkType: "Fundamental" as const,
    dataType: "Vector" as const,
    category: ["Federal", "State", "Local", "Rural"]
  },
  {
    title: "Nigeria Digital Elevation Model - {resolution}m Resolution",
    abstract:
      "High-resolution digital elevation model derived from {source} data covering Nigeria. Includes elevation, slope, aspect, and hydrological derivatives.",
    purpose:
      "Topographic analysis, flood modeling, watershed delineation, and terrain visualization",
    keywords: ["DEM", "Elevation", "Topography", "Terrain", "Nigeria"],
    frameworkType: "Fundamental" as const,
    dataType: "Raster" as const,
    resolution: ["10", "30", "90"],
    source: ["SRTM", "ASTER GDEM", "TanDEM-X", "Aerial Survey"]
  },
  {
    title: "Nigeria Population Census Data {year} - {level}",
    abstract:
      "Official population statistics from Nigeria's {year} census including demographic characteristics, household information, and socio-economic indicators at {level} level.",
    purpose:
      "Population planning, resource allocation, development planning, and demographic analysis",
    keywords: ["Census", "Population", "Demographics", "Statistics", "Nigeria"],
    frameworkType: "Thematic" as const,
    dataType: "Table" as const,
    year: [2006, 2016, 2023],
    level: ["State", "LGA", "Ward"]
  },
  {
    title: "Nigeria Land Use/Land Cover - {year} Classification",
    abstract:
      "Detailed land use and land cover classification for Nigeria derived from {sensor} imagery using advanced machine learning techniques. Includes {classes} classes with accuracy assessment.",
    purpose:
      "Environmental monitoring, land use planning, agriculture assessment, and climate studies",
    keywords: [
      "Land Use",
      "Land Cover",
      "Classification",
      "Environment",
      "Nigeria"
    ],
    frameworkType: "Thematic" as const,
    dataType: "Raster" as const,
    year: [2015, 2020, 2023],
    sensor: ["Landsat", "Sentinel-2", "MODIS"],
    classes: ["15", "20", "25"]
  },
  {
    title: "Nigeria Hydrographic Network - {type}",
    abstract:
      "Comprehensive hydrographic dataset showing Nigeria's {type} including flow direction, drainage basins, water bodies, and hydrological characteristics.",
    purpose:
      "Water resource management, flood modeling, irrigation planning, and environmental assessment",
    keywords: ["Hydrology", "Rivers", "Water", "Drainage", "Nigeria"],
    frameworkType: "Fundamental" as const,
    dataType: "Vector" as const,
    type: [
      "Rivers and Streams",
      "Lakes and Reservoirs",
      "Drainage Basins",
      "Wetlands"
    ]
  },
  {
    title: "Nigeria Geological Map - {scale} Scale",
    abstract:
      "Detailed geological map of Nigeria showing rock formations, structural geology, mineral resources, and geological hazards at {scale} scale.",
    purpose:
      "Geological research, mineral exploration, hazard assessment, and engineering planning",
    keywords: ["Geology", "Minerals", "Rocks", "Hazards", "Nigeria"],
    frameworkType: "Thematic" as const,
    dataType: "Vector" as const,
    scale: ["1:100,000", "1:250,000", "1:500,000"]
  }
]

export function generateMetadataRecord(
  template: (typeof DATASET_TEMPLATES)[0],
  organizationId: string,
  creatorUserId: string
) {
  // Fill in template variables
  let title = template.title
  let abstract = template.abstract

  Object.entries(template).forEach(([key, value]) => {
    if (Array.isArray(value) && key !== "keywords") {
      const randomValue = value[Math.floor(Math.random() * value.length)]
      const placeholder = `{${key}}`
      title = title.replace(new RegExp(placeholder, "g"), randomValue)
      abstract = abstract.replace(new RegExp(placeholder, "g"), randomValue)
    }
  })

  const location = generateLocationInfo()
  const temporal = generateTemporalInfo()
  const spatial = generateSpatialInfo(template.dataType)

  return {
    title,
    abstract,
    purpose: template.purpose,
    keywords: template.keywords,
    frameworkType: template.frameworkType,
    dataType: template.dataType,
    language: "en",
    creatorUserId,
    organizationId,
    status: "Published" as (typeof metadataStatusEnum.enumValues)[number],

    // Contact information
    contactName: "Dr. Adebayo Olumide",
    contactEmail: "contact@ngdi.gov.ng",
    contactPhone: "+234-9-7654321",
    contactAddress: "NGDI Secretariat, Abuja, Nigeria",

    // Rich structured data
    locationInfo: location,
    spatialInfo: spatial,
    temporalInfo: temporal,
    technicalDetailsInfo: generateTechnicalDetailsInfo(template.dataType),
    constraintsInfo: generateConstraintsInfo(),
    dataQualityInfo: generateDataQualityInfo(),
    processingInfo: generateProcessingInfo(),
    distributionInfo: generateDistributionInfo(),
    metadataReferenceInfo: generateMetadataReferenceInfo(),
    fundamentalDatasetsInfo: generateFundamentalDatasetsInfo(),

    // Flat fields for form compatibility
    author: "Nigerian Geospatial Data Infrastructure",
    version: "1.0",
    lineage:
      "Data collected and processed according to NGDI standards and specifications",
    doi: `10.5060/NGDI.${Math.floor(Math.random() * 1000000)}`,
    licence: "Creative Commons Attribution 4.0 International",
    accessAndUseLimitations:
      "Free for academic and research use. Contact provider for commercial applications.",
    dataSources: "Field surveys, satellite imagery, government databases",
    methodology:
      "Standard geospatial data collection and processing methods following ISO 19115 standards",
    notes:
      "Part of Nigeria's National Geospatial Data Infrastructure initiative",

    // Dates
    productionDate: temporal.dateFrom,
    publicationDate: new Date().toISOString().split("T")[0],
    metadataReviewDate: new Date().toISOString().split("T")[0],

    // Spatial bounds (flat fields)
    boundingBoxNorth: spatial.boundingBox?.northBoundingCoordinate || null,
    boundingBoxSouth: spatial.boundingBox?.southBoundingCoordinate || null,
    boundingBoxEast: spatial.boundingBox?.eastBoundingCoordinate || null,
    boundingBoxWest: spatial.boundingBox?.westBoundingCoordinate || null,
    temporalExtentFrom: temporal.dateFrom,
    temporalExtentTo: temporal.dateTo,

    // Technical details
    spatialReferenceSystem: spatial.coordinateSystem,
    spatialResolution: spatial.resolutionScale,
    fileFormat: spatial.format,
    fileSize: `${Math.round(Math.random() * 500 + 10)}MB`,

    // Additional metadata
    updateFrequency: ["Annual", "Biannual", "As Needed", "Continuous"][
      Math.floor(Math.random() * 4)
    ],
    hierarchyLevel: "dataset",
    metadataStandard: "NGDI Standard v1.0",
    metadataStandardVersion: "1.0"
  }
}
