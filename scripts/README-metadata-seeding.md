# Enhanced Metadata Seeding System

This document describes the enhanced metadata seeding system for the NGDI Metadata Portal, which creates comprehensive, realistic metadata records for testing and development.

## Overview

The enhanced seeding system consists of three main components:

1. **`metadata-data-generator.ts`** - Data generation utilities for creating realistic metadata
2. **`enhanced-seed-metadata-records.ts`** - Main seeding script with comprehensive options
3. **`test-metadata-seeding.ts`** - Test suite to verify the seeding system works correctly

## Features

### Comprehensive Metadata Coverage

- **Spatial Information**: Realistic Nigerian bounding boxes, coordinate systems, projections
- **Temporal Information**: Date ranges, update frequencies, production dates
- **Technical Details**: File formats, sizes, software requirements
- **Data Quality**: Accuracy reports, completeness assessments
- **Distribution**: Licensing, access methods, contact information
- **Processing**: Lineage, methodology, source information
- **Contact Information**: Realistic Nigerian institutions and contacts

### Dataset Types

The system generates records for various dataset types common in Nigeria:

- Administrative boundaries (states, LGAs, wards)
- Satellite imagery (Landsat, Sentinel)
- Road networks (federal, state, local)
- Digital elevation models
- Population census data
- Land use/land cover classifications
- Hydrographic networks
- Geological maps

## Quick Start

### Prerequisites

1. Ensure you have organizations and users in your database:

   ```bash
   npx tsx scripts/seed-users-and-roles.ts
   ```

2. Set the creator user ID environment variable:
   ```bash
   export SEED_CREATOR_USER_ID="user_your_clerk_user_id"
   ```

### Basic Usage

Generate 25 comprehensive metadata records:

```bash
npx tsx scripts/enhanced-seed-metadata-records.ts
```

### Advanced Usage

#### Specify number of records:

```bash
npx tsx scripts/enhanced-seed-metadata-records.ts --count=50
```

#### Clear existing records before seeding:

```bash
npx tsx scripts/enhanced-seed-metadata-records.ts --clear --count=30
```

#### Generate records with specific status:

```bash
npx tsx scripts/enhanced-seed-metadata-records.ts --status=Published --count=20
```

#### Quiet mode (less verbose output):

```bash
npx tsx scripts/enhanced-seed-metadata-records.ts --quiet --count=100
```

## Command Options

| Option       | Description                                    | Default        |
| ------------ | ---------------------------------------------- | -------------- |
| `--count=N`  | Number of records to generate                  | 25             |
| `--clear`    | Clear existing metadata records before seeding | false          |
| `--status=X` | Set specific status for all records            | Mixed statuses |
| `--quiet`    | Reduce verbose output                          | false          |

### Available Status Values

- `Published` (recommended for public testing)
- `Approved`
- `Pending Validation`
- `Draft`
- `Needs Revision`
- `Archived`

## Testing

Run the test suite to verify the seeding system:

```bash
npx tsx scripts/test-metadata-seeding.ts
```

The test suite validates:

- Data generation functions
- Template-based record creation
- Nigerian bounding box coordinates
- Required field presence

## Generated Data Structure

Each generated metadata record includes:

### Basic Information

- Title (based on realistic Nigerian datasets)
- Abstract and purpose
- Keywords relevant to Nigerian geospatial data
- Data type (Vector, Raster, Table, Service, etc.)
- Framework type (Fundamental, Thematic, Administrative)

### Location Information (JSONB)

```json
{
  "country": "Nigeria",
  "geopoliticalZone": "North Central",
  "state": "Niger",
  "lga": "Niger North LGA",
  "townCity": "Niger Metropolitan Area"
}
```

### Spatial Information (JSONB)

```json
{
  "coordinateSystem": "WGS 84",
  "projection": "Universal Transverse Mercator",
  "datum": "WGS 84",
  "resolutionScale": "1:50,000",
  "boundingBox": {
    "northBoundingCoordinate": 12.4567,
    "southBoundingCoordinate": 10.1234,
    "eastBoundingCoordinate": 8.9876,
    "westBoundingCoordinate": 6.5432
  }
}
```

### Temporal Information (JSONB)

```json
{
  "dateFrom": "2020-01-01",
  "dateTo": "2023-12-31"
}
```

### Technical Details (JSONB)

```json
{
  "fileFormat": "Shapefile",
  "fileSizeMB": 234.56,
  "numFeaturesOrLayers": 12,
  "softwareHardwareRequirements": "ArcGIS 10.8+, QGIS 3.0+, or compatible GIS software"
}
```

### Data Quality Information (JSONB)

```json
{
  "logicalConsistencyReport": "Data passed topological validation and consistency checks",
  "completenessReport": "Dataset is 94.5% complete for the study area",
  "horizontalAccuracy": {
    "accuracyReport": "Tested against ground control points",
    "accuracyPercentage": 92.3,
    "accuracyExplanation": "Accuracy determined through field validation and GPS measurements"
  }
}
```

## Organizations

If no organizations exist, the script will automatically create default Nigerian geospatial organizations:

- Nigerian Geological Survey Agency
- Nigerian Meteorological Agency
- Centre for Geodesy and Geodynamics
- National Centre for Remote Sensing
- Federal Department of Forestry

## Benefits for Development

### Testing Search Functionality

- Realistic keywords for text search testing
- Geographic bounds for spatial search testing
- Multiple data types and framework types for faceted search
- Various status values for workflow testing

### UI Development

- Rich metadata for display components
- Complex JSONB structures for form testing
- Realistic Nigerian place names and organizations
- Proper contact information formatting

### Performance Testing

- Configurable record counts for load testing
- Realistic data sizes and complexity
- Mixed status distribution for workflow testing

## Troubleshooting

### Common Issues

1. **Missing creator user ID**:

   ```
   Error: SEED_CREATOR_USER_ID environment variable is required
   ```

   Solution: Export a valid Clerk user ID from your database

2. **Database connection errors**:
   Ensure your `.env.local` file has correct database credentials

3. **Organization not found errors**:
   Run the organizations seeding script first, or use `--clear` to let the script create default organizations

### Database Reset

To completely reset and reseed metadata:

```bash
# Clear all metadata records
npx tsx scripts/enhanced-seed-metadata-records.ts --clear --count=0

# Generate fresh records
npx tsx scripts/enhanced-seed-metadata-records.ts --count=50
```

## Extending the System

### Adding New Dataset Templates

Edit `DATASET_TEMPLATES` in `metadata-data-generator.ts`:

```typescript
{
  title: "Your Dataset Template - {variable}",
  abstract: "Description with {variable} placeholder",
  purpose: "Purpose of the dataset",
  keywords: ["keyword1", "keyword2"],
  frameworkType: "Thematic" as const,
  dataType: "Vector" as const,
  variable: ["option1", "option2", "option3"]
}
```

### Customizing Data Generators

Modify the generator functions in `metadata-data-generator.ts` to:

- Add new Nigerian institutions
- Include additional coordinate systems
- Expand place name lists
- Add new data quality metrics

## Performance Notes

- Records are inserted in batches of 10 for better error handling
- Failed records are retried individually to identify issues
- Statistics are generated after insertion to verify results
- Memory usage scales linearly with record count

## Best Practices

1. **Start Small**: Test with `--count=5` first
2. **Use Clear Flag**: Use `--clear` when developing to avoid duplicates
3. **Check Statistics**: Review the generated statistics to ensure proper distribution
4. **Test Search**: After seeding, test the search functionality with the new data
5. **Monitor Performance**: Large datasets (>100 records) may take several minutes

## Security Considerations

- The seeding scripts use the provided creator user ID for all records
- Generated contact information is fictional but realistic
- No sensitive or real personal data is included
- All URLs and email addresses are examples only

## Integration with CI/CD

For automated testing environments:

```bash
# Seed minimal test data
export SEED_CREATOR_USER_ID="test_user_id"
npx tsx scripts/enhanced-seed-metadata-records.ts --count=10 --status=Published --quiet
```

This enhanced seeding system provides a robust foundation for testing and demonstrating the NGDI Metadata Portal with realistic, comprehensive Nigerian geospatial metadata.
