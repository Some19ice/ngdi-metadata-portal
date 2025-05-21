# Metadata Fields and Descriptions

_Exported on 5/20/2025 at 01:13:08 GMT+1 from Cursor (0.50.5)_

---

**User**

Extract the metadata form fields and their descriptions

---

**Cursor**

Okay, I can help with that. I'll start by looking for the Prisma schema file, which should define the metadata model and its fields.

I found two schema files. The main one is likely `packages/db/prisma/schema.prisma`. I'll read this file to find the metadata model definition.

I've read the `schema.prisma` file and found the `Metadata` model. It has quite a few fields, and many of them have comments that serve as descriptions.

Here's a list of the fields and their descriptions from the schema:

- **`id`**: Unique identifier for the metadata entry
- **`title`**: Title of the dataset
- **`dataName`**: Name of the dataset (more descriptive title)
- **`dataType`**: Type of data (Raster, Vector, Table)
- **`abstract`**: Abstract/description of the dataset
- **`purpose`**: Purpose of the dataset
- **`productionDate`**: Date when the dataset was produced
- **`organization`**: Organization name
- **`author`**: Author of the dataset
- **`categories`**: Categories of the dataset
- **`frameworkType`**: Framework type
- **`thumbnailUrl`**: URL to the thumbnail image
- **`imageName`**: Name of the image file
- **`dateFrom`**: Start date of the dataset
- **`dateTo`**: End date of the dataset
- **`updateFrequency`**: Frequency of updates (Monthly, Quarterly, etc.)
- **`validationStatus`**: Validation status
- **`assessment`**: Completion status (Complete or Incomplete)
- **`coordinateUnit`**: Unit system for coordinates (DD or DMS)
- **`minLatitude`**: Southernmost latitude value
- **`minLongitude`**: Westernmost longitude value
- **`maxLatitude`**: Northernmost latitude value
- **`maxLongitude`**: Easternmost longitude value
- **`coordinateSystem`**: Coordinate system used
- **`projection`**: Projection used
- **`scale`**: Scale of the dataset
- **`resolution`**: Resolution of the dataset
- **`locationInfo`**: Location information including country, state, LGA, etc. (stored as JSON)
- **`fileFormat`**: File format
- **`fileSize`**: File size in bytes
- **`numFeatures`**: Number of features
- **`qualityInfo`**: Quality information including accuracy, completeness, etc. (stored as JSON)
- **`distributionFormat`**: Distribution format
- **`accessMethod`**: Access method
- **`downloadUrl`**: Download URL
- **`apiEndpoint`**: API endpoint
- **`licenseType`**: License type
- **`usageTerms`**: Usage terms
- **`attributionRequirements`**: Attribution requirements
- **`accessRestrictions`**: Access restrictions
- **`contactInfo`**: Contact information including contact person, email, etc. (stored as JSON)
- **`metadataReferenceInfo`**: Metadata reference information including creation date, review date, etc. (stored as JSON)
- **`dataQualityInfo`**: Data quality information including consistency, completeness, etc. (stored as JSON)
- **`dataProcessingInfo`**: Data processing information including processing steps, software version, etc. (stored as JSON)
- **`distributionDetails`**: Distribution details including distributor, fees, etc. (stored as JSON)
- **`legacyFields`**: Legacy fields from original Metadata model (stored as JSON)
- **`fundamentalDatasets`**: Information about fundamental dataset types (stored as JSON)
- **`userId`**: Reference to the user who created this entry
- **`createdAt`**: Creation timestamp
- **`updatedAt`**: Last update timestamp

This list is directly from the database schema. The actual forms in the UI might present these differently or use different labels/descriptions.

Would you like me to also look for the UI components to see if there are different or more user-friendly descriptions there?

---

**User**

look for the UI components to see if there are different or more user-friendly descriptions there

---

**Cursor**

Okay, I will now look for UI components related to metadata forms to see if they provide different or more user-friendly descriptions for the fields. I'll focus my search on the `components/metadata` directory as per the project intelligence.

The initial broad search didn't yield specific form components immediately. I'll try a more targeted file search for files that might contain metadata forms, using common naming patterns like "MetadataForm", "EditMetadataForm", or "AddMetadataForm".

Okay, this is much better! Several files look promising, especially:

- `packages/web/src/components/ui/metadata-form.tsx`
- `packages/web/src/app/metadata/add/components/metadata-form.tsx`
- The various `...-form.tsx` files within `packages/web/src/app/metadata/add/components/` like `general-info-form.tsx`, `access-info-form.tsx`, etc.

I'll start by examining `packages/web/src/app/metadata/add/components/metadata-form.tsx` as it seems like a primary container for the add metadata functionality. It might give us an overview or lead to the specific field definitions.

This `metadata-form.tsx` file is a high-level component that manages a multi-step form. It dynamically loads different parts of the form:

- `GeneralInfoForm`
- `TechnicalDetailsForm`
- `DataQualityForm`
- `AccessInfoForm`
- `ReviewForm`

It also provides titles and brief context for each step, which are helpful:

- **General Information**: "Fill in basic information about your dataset, including type, name, and description."
- **Technical Details**: "Provide technical specifications such as coordinate system, projection, and file details."
- **Data Quality**: "Add information about data quality, accuracy, and processing methods."
- **Access Information**: "Specify how your data can be accessed, licensing terms, and contact information."
- **Review & Submit**: "Review all information before final submission."

To find the specific field labels and descriptions, I need to look into each of these individual form components. I'll start with `general-info-form.tsx`.

This file, `general-info-form.tsx`, is exactly what we need for the "General Information" section. It uses `FormField` components which include `FormLabel`, `FormDescription`, and sometimes `FormDescriptionWithTooltip`.

Here are the fields and their UI descriptions from this file:

**Section: Data Information** (Description: "Basic information about the geospatial dataset")

- **Data Type**
  - Label: `Data Type` (Required)
  - Description: "The method used to represent geographic features"
  - Tooltip: "The fundamental approach used to represent spatial information: either as a grid of cells (raster), as points, lines, and polygons (vector), or as tabular data (table). This determines how the data is structured and what types of analysis can be performed."
- **Data Name/Title**
  - Label: `Data Name/Title` (Required)
  - Description: "A concise and descriptive name for the dataset."
  - Tooltip: "This should clearly identify the dataset. E.g., 'Lagos State Road Network' or 'Nigeria Population Density 2023'."
- **Cloud Cover Percentage**
  - Label: `Cloud Cover Percentage (%)`
  - Description: "Percentage of the dataset obscured by clouds (for satellite imagery)."
  - Tooltip: "Only applicable for raster data, specifically satellite or aerial imagery. Enter a numerical value representing the percentage of the image covered by clouds."
- **Production Date**
  - Label: `Production Date` (Required)
  - Description: "The date when the dataset was created or produced."
  - Tooltip: "This is the date the data was finalized or published, not necessarily the date of data capture (which might be a range)."

**Section: Fundamental Datasets** (Description: "Select the type(s) of fundamental datasets included. According to the National Geospatial Data Infrastructure (NGDI) guidelines.")

- Fields: `Geodetic Data`, `Topographic Data`, `Cadastral Data`, `Administrative Boundaries`, `Hydrographic Data`, `Land Use/Land Cover`, `Geological Data`, `Demographic Data`, `Digital Imagery`, `Transportation Data`, `Others`
  - These are checkboxes. Each has a label.
  - `Others` has an additional "Specify if 'Others' is selected" input.
  - General Tooltip for the section: "Fundamental datasets are core geospatial datasets that form the basis for many applications. Select all applicable categories that your data falls under. If 'Others' is selected, please specify."

**Section: Description** (Description: "Detailed description of the dataset.")

- **Abstract**
  - Label: `Abstract` (Required)
  - Description: "A brief summary of the dataset's content and scope."
  - Tooltip: "Provide a comprehensive summary of the data. This should cover what the data is, its geographic coverage, key attributes, and time period."
- **Purpose**
  - Label: `Purpose` (Required)
  - Description: "The intended use or reason for creating the dataset."
  - Tooltip: "Describe why the dataset was created and its primary intended applications. This helps users understand its relevance to their needs."
- **Thumbnail URL**
  - Label: `Thumbnail Image URL` (Required)
  - Description: "A URL link to a representative image or preview of the dataset."
  - Tooltip: "Provide a direct link (URL) to an image that serves as a preview for your dataset. This image will be displayed in search results and dataset listings."

**Section: Location** (Description: "Geographic coverage of the dataset.")

- **Country**
  - Label: `Country` (Required)
  - Description: "The primary country the dataset pertains to."
  - Tooltip: "Select the country that is the primary focus of the dataset. For NGDI, this will typically be Nigeria." (Defaults to "Nigeria")
- **Geopolitical Zone**
  - Label: `Geopolitical Zone` (Required)
  - Description: "The geopolitical zone within the country."
  - Tooltip: "Select the geopolitical zone(s) covered by the dataset (e.g., North Central, South West). This helps narrow down the geographic scope."
- **State**
  - Label: `State` (Required)
  - Description: "The state(s) covered by the dataset."
  - Tooltip: "Specify the Nigerian state(s) that the dataset covers. You can select multiple states if applicable."
- **Local Government Area (LGA)**
  - Label: `Local Government Area (LGA)` (Required)
  - Description: "The LGA(s) covered by the dataset."
  - Tooltip: "Specify the Local Government Area(s) within the selected state(s) that the dataset covers."
- **Town/City**
  - Label: `Town/City` (Required)
  - Description: "Specific town(s) or city(ies) covered."
  - Tooltip: "If the dataset is focused on specific urban areas, list the town(s) or city(ies) here."

**Section: Data Status** (Description: "Information about the dataset's completeness and update cycle.")

- **Assessment (Completion Status)**
  - Label: `Assessment (Completion Status)` (Required)
  - Description: "The current completion status of the dataset."
  - Tooltip: "Indicate whether the dataset is considered 'Complete' (all intended data is present and verified) or 'Incomplete' (still under development, missing parts, or not yet fully verified)."
- **Update Frequency**
  - Label: `Update Frequency` (Required)
  - Description: "How often the dataset is planned to be updated."
  - Tooltip: "Specify how frequently the dataset is expected to be updated (e.g., Monthly, Quarterly, Annually, As needed). This helps users understand the data's currency."

**Section: Metadata Reference** (Description: "Information about the metadata record itself.")

- **Metadata Creation Date**
  - Label: `Metadata Creation Date` (Required)
  - Description: "Date when this metadata record was created."
  - Tooltip: "The date on which this specific metadata entry was first created."
- **Metadata Review Date**
  - Label: `Metadata Review Date` (Required)
  - Description: "Date when this metadata record was last reviewed or updated."
  - Tooltip: "The date on which this metadata entry was last reviewed for accuracy and completeness."
- **Contact Name (Metadata Point of Contact)**
  - Label: `Contact Name (Metadata Point of Contact)` (Required)
  - Description: "Name of the person or department responsible for this metadata."
  - Tooltip: "The individual or group responsible for maintaining this metadata record. This may differ from the data custodian."
- **Address (Metadata Point of Contact)**
  - Label: `Address (Metadata Point of Contact)` (Required)
  - Description: "Mailing address for the metadata contact."
  - Tooltip: "The physical or mailing address of the metadata point of contact."
- **Email (Metadata Point of Contact)**
  - Label: `Email (Metadata Point of Contact)` (Required)
  - Description: "Email address for the metadata contact."
  - Tooltip: "The email address for inquiries regarding this metadata record."
- **Phone Number (Metadata Point of Contact)**
  - Label: `Phone Number (Metadata Point of Contact)` (Required)
  - Description: "Phone number for the metadata contact."
  - Tooltip: "The telephone number for the metadata point of contact."

This covers the "General Information" part of the form. The descriptions here are definitely more user-friendly and often include tooltips with extra guidance.

Shall I proceed to analyze the other form components (`technical-details-form.tsx`, `data-quality-form.tsx`, and `access-info-form.tsx`) to extract their field descriptions as well?

---

**User**

yes proceed

---

**Cursor**

Great. I'll now examine `packages/web/src/app/metadata/add/components/technical-details-form.tsx` to extract the UI field definitions and descriptions for the "Technical Details" section.

This `technical-details-form.tsx` file contains the fields for the "Technical Details" section.

Here are the fields and their UI descriptions:

**Section: Spatial Information** (Description: "Provide information about the spatial characteristics of the dataset")

- **Coordinate System**
  - Label: `Coordinate System` (Required)
  - Description: "The coordinate reference system used in the dataset"
  - Tooltip: "The reference coordinate system used for the dataset's spatial coordinates"
- **Projection**
  - Label: `Projection` (Required)
  - Description: "The map projection used in the dataset"
  - Tooltip: "The map projection used to transform the Earth's curved surface to a flat representation"
- **Scale**
  - Label: `Scale` (Required)
  - Description: "The representative fraction scale of the dataset"
  - Tooltip: "The denominator of the representative fraction (e.g., 50,000 for a scale of 1:50,000)"
- **Resolution**
  - Label: `Resolution`
  - Description: "The level of detail of the dataset (e.g., 30m for raster data)"
  - Tooltip: "Smallest distinguishable feature size. For raster data, this is often the cell size (e.g., '30 meters'). For vector data, it might be a nominal resolution."

**Section: Technical Specifications** (Description: "Details about the dataset's format, size, and technical requirements")

- **File Format**
  - Label: `File Format` (Required)
  - Description: "The primary file format of the dataset (e.g., GeoTIFF, Shapefile, CSV)"
  - Tooltip: "Specify the main data format, e.g., 'GeoTIFF', 'Shapefile', 'GeoJSON', 'CSV'. If multiple formats are available, list the primary one or most common."
- **File Size**
  - Label: `File Size (MB)`
  - Description: "Approximate size of the dataset in megabytes."
  - Tooltip: "Provide an estimate of the total dataset size in Megabytes (MB). This helps users understand download times and storage requirements."
- **Number of Features/Layers**
  - Label: `Number of Features/Layers`
  - Description: "Number of distinct features or layers in the dataset."
  - Tooltip: "For vector data, the count of geographic features (points, lines, polygons). For raster data, it could be the number of bands or layers."
- **Software/Hardware Requirements**
  - Label: `Software/Hardware Requirements`
  - Description: "Any specific software or hardware needed to use the data."
  - Tooltip: "List any specialized software (e.g., 'ArcGIS Pro 10.x', 'QGIS 3.x') or hardware requirements necessary to effectively use or process the dataset."

**Section: Spatial Domain (Geographic Bounding Box)** (Description: "Define the geographic extent of the dataset using bounding box coordinates.")

- **Coordinate Unit**
  - Label: `Coordinate Unit` (Required)
  - Description: "The unit of measure for the bounding box coordinates."
  - Tooltip: "Select the unit for the latitude and longitude values: 'DD' for Decimal Degrees (e.g., 6.45, 3.35) or 'DMS' for Degrees, Minutes, Seconds (e.g., 6°27'00\"N, 3°21'00\"E)."
- **Minimum Latitude (South)**
  - Label: `Minimum Latitude (South)` (Required)
  - Description: "The southernmost coordinate of the bounding box."
  - Tooltip: "Enter the southernmost latitudinal extent of the dataset in the selected coordinate unit."
- **Minimum Longitude (West)**
  - Label: `Minimum Longitude (West)` (Required)
  - Description: "The westernmost coordinate of the bounding box."
  - Tooltip: "Enter the westernmost longitudinal extent of the dataset in the selected coordinate unit."
- **Maximum Latitude (North)**
  - Label: `Maximum Latitude (North)` (Required)
  - Description: "The northernmost coordinate of the bounding box."
  - Tooltip: "Enter the northernmost latitudinal extent of the dataset in the selected coordinate unit."
- **Maximum Longitude (East)**
  - Label: `Maximum Longitude (East)` (Required)
  - Description: "The easternmost coordinate of the bounding box."
  - Tooltip: "Enter the easternmost longitudinal extent of the dataset in the selected coordinate unit."

**Section: Resource Constraint** (Description: "Information about constraints on accessing and using the dataset.")

- **Access Constraints**
  - Label: `Access Constraints` (Required)
  - Description: "Limitations or restrictions on accessing the dataset."
  - Tooltip: "Describe any restrictions on how the dataset can be accessed, e.g., 'Requires registration', 'For government use only', 'Publicly accessible'."
- **Use Constraints**
  - Label: `Use Constraints` (Required)
  - Description: "Limitations or restrictions on using the dataset."
  - Tooltip: "Describe any restrictions on how the dataset can be used, e.g., 'For non-commercial use only', 'Requires citation', 'No derivatives'."
- **Other Constraints**
  - Label: `Other Constraints` (Required)
  - Description: "Any other relevant constraints not covered above."
  - Tooltip: "Specify any other constraints related to security, privacy, or legal prerequisites not covered by access or use constraints."

Next, I'll examine `packages/web/src/app/metadata/add/components/data-quality-form.tsx`.

This `data-quality-form.tsx` file provides the UI for the "Data Quality" section.

Here are the fields and their descriptions:

**Section: General Section** (Description: "Information about the overall quality of the dataset")

- **Logical Consistency Report**
  - Label: `Logical Consistency Report`
  - Description: "Information about the logical integrity of the dataset"
  - Tooltip: "A description of the fidelity of relationships in the data and tests applied to ensure logical consistency. This may include topological consistency for vector data or band consistency for raster data."
- **Completeness Report**
  - Label: `Completeness Report`
  - Description: "Information about omissions or limitations in coverage"
  - Tooltip: "A description of how complete the dataset is relative to its intended scope, including any known data gaps or limitations in coverage."

**Section: Attribute Accuracy** (Description: "Information about the accuracy of attribute data")

- **Accuracy Report** (for Attribute Accuracy)
  - Label: `Accuracy Report`
  - Description: "Assessment of identification accuracy and attribute values"
  - Tooltip: "An assessment of the accuracy of the identification of entities and assignment of attribute values in the dataset."

**Section: Positional Accuracy** (Description: "Information about the positional accuracy")

- **Horizontal Positional Accuracy**
  - **Accuracy Report**
    - Label: `Accuracy Report`
    - Description: "Report on horizontal accuracy assessment."
    - Tooltip: "A statement or report detailing the assessment of horizontal positional accuracy. This might include methodology, results, and confidence levels."
  - **Percentage Value (%)**
    - Label: `Percentage Value (%)`
    - Description: "Quantitative horizontal accuracy value (e.g., 95 for 95% confidence)."
    - Tooltip: "If applicable, provide a quantitative measure of horizontal accuracy, often expressed as a percentage within a certain tolerance (e.g., 95% of features are within +/- 5 meters)."
  - **Explanation**
    - Label: `Explanation`
    - Description: "Qualitative explanation of horizontal accuracy."
    - Tooltip: "A qualitative explanation of horizontal accuracy, providing context or further details not captured by quantitative measures."
- **Vertical Positional Accuracy**
  - **Accuracy Report**
    - Label: `Accuracy Report`
    - Description: "Report on vertical accuracy assessment."
    - Tooltip: "A statement or report detailing the assessment of vertical positional accuracy. This might include methodology, results, and confidence levels (e.g., for elevation data)."
  - **Percentage Value (%)**
    - Label: `Percentage Value (%)`
    - Description: "Quantitative vertical accuracy value."
    - Tooltip: "If applicable, provide a quantitative measure of vertical accuracy, often expressed as a percentage within a certain tolerance (e.g., 90% of elevation points are accurate to +/- 2 meters)."
  - **Explanation**
    - Label: `Explanation`
    - Description: "Qualitative explanation of vertical accuracy."
    - Tooltip: "A qualitative explanation of vertical accuracy, providing context or further details not captured by quantitative measures."

**Section: Source Information** (Description: "Information about the source of the data")

- **Source Scale Denominator**
  - Label: `Source Scale Denominator`
  - Description: "The scale of the source material (e.g., 25000 for 1:25000)."
  - Tooltip: "If the data was derived from a map or other scaled source, enter the denominator of the source material's scale (e.g., for a 1:50,000 scale map, enter 50000)."
- **Source Media Type**
  - Label: `Source Media Type`
  - Description: "The type of medium of the source material (e.g., paper map, digital file)."
  - Tooltip: "Describe the type of medium from which the data was originally sourced (e.g., 'Scanned Paper Map', 'Digital Orthophoto', 'Field Survey GPS Data')."
- **Source Citation**
  - Label: `Source Citation`
  - Description: "Full citation for the source material."
  - Tooltip: "Provide a full bibliographic citation for the source material from which the dataset was derived. This helps users trace the data's lineage."
- **Citation Title**
  - Label: `Citation Title`
  - Description: "Title of the cited source material."
  - Tooltip: "The official title of the source document or dataset being cited."
- **Contract Reference**
  - Label: `Contract Reference`
  - Description: "Reference to any contract under which the data was produced."
  - Tooltip: "If the data was produced under a contract, provide the contract number or reference for tracking and verification purposes."
- **Contract Date**
  - Label: `Contract Date`
  - Description: "Date of the contract under which the data was produced."
  - Tooltip: "The date the contract for data production was awarded or finalized."

**Section: Data Processing Information** (Description: "Details about how the data was processed")

- **Processing Steps Description**
  - Label: `Processing Steps Description` (Required)
  - Description: "Description of the steps taken to process the data."
  - Tooltip: "Summarize the key processing steps applied to the source data to create the final dataset. This might include transformations, cleaning, analysis, etc."
- **Software and Version Used**
  - Label: `Software and Version Used`
  - Description: "Software and its version used for processing."
  - Tooltip: "Specify the primary software and its version used in the data processing workflow (e.g., 'ArcGIS Pro 2.8', 'ENVI 5.5', 'Python 3.9 with GDAL 3.2')."
- **Processed Date**
  - Label: `Processed Date` (Required)
  - Description: "Date when the data processing was completed."
  - Tooltip: "The date on which the data processing described was completed and the final dataset version was produced."

**Section: Processor Contact Information** (Description: "Contact details for the entity that processed the data")

- **Processor Organization/Individual Name**
  - Label: `Processor Organization/Individual Name` (Required)
  - Description: "Name of the organization or individual who processed the data."
  - Tooltip: "The name of the organization or individual primarily responsible for processing the data."
- **Processor Email**
  - Label: `Processor Email` (Required)
  - Description: "Email address of the data processor."
  - Tooltip: "The contact email address for the data processor."
- **Processor Address**
  - Label: `Processor Address` (Required)
  - Description: "Mailing address of the data processor."
  - Tooltip: "The mailing address of the data processor."

Finally, I'll check `packages/web/src/app/metadata/add/components/access-info-form.tsx`.

This `access-info-form.tsx` file handles the "Access Information" section.

Here are its fields and their UI descriptions:

**Section: Distribution Information** (Description: "Specify how the dataset is distributed and accessed")

- **Distribution Format**
  - Label: `Distribution Format` (Required)
  - Description: "Format in which the data is distributed"
  - Tooltip: "The format in which the data is distributed to users"
- **Access Method**
  - Label: `Access Method` (Required)
  - Description: "How users can access this dataset"
  - Tooltip: "How users can access the dataset (download, API, etc.)"
- **Download URL**
  - Label: `Download URL` (Required, but can be empty string if not applicable)
  - Description: "URL where the data can be downloaded"
  - Tooltip: "Direct URL where the data can be downloaded (if applicable)"
- **API Endpoint**
  - Label: `API Endpoint` (Required, but can be empty string if not applicable)
  - Description: "API endpoint URL for accessing the data"
  - Tooltip: "URL of the API endpoint that provides access to the data (if applicable)"

**Section: License Information** (Description: "Details about the licensing, usage terms, and restrictions for the dataset")

- **License Type**
  - Label: `License Type` (Required)
  - Description: "The license under which the dataset is provided."
  - Tooltip: "Specify the type of license governing the use of the dataset (e.g., 'Creative Commons BY 4.0', 'Open Data Commons ODbL', 'Government Open Data License', 'Proprietary')."
- **Usage Terms**
  - Label: `Usage Terms` (Required)
  - Description: "Specific terms and conditions for using the dataset."
  - Tooltip: "Provide a clear statement of the terms under which the data can be used. This may include permissions, restrictions, and obligations of the user."
- **Attribution Requirements**
  - Label: `Attribution Requirements` (Required)
  - Description: "How the dataset provider should be credited."
  - Tooltip: "Specify exactly how users should attribute the dataset provider when using the data (e.g., 'Cite as: Organization Name (Year). Dataset Title. Version. Retrieved from [URL]')."
- **Access Restrictions** (Checkboxes)
  - Label: `Access Restrictions`
  - Description: "Select any specific access restrictions that apply."
  - Tooltip: "Check all applicable categories that restrict access to or use of the dataset. These are broad categories; specific details should be in 'Usage Terms' or 'Access Constraints' in Technical Details."
  - Options: `Commercial use restrictions`, `Confidential information`, `Sensitive data`, `Government use only`, `Research use only`

**Section: Contact Information (for Data Access/Distribution)** (Description: "Contact details for inquiries related to accessing or obtaining the dataset")

- **Contact Person/Office**
  - Label: `Contact Person/Office` (Required)
  - Description: "The person or office to contact for data access."
  - Tooltip: "Name of the individual, team, or office responsible for handling inquiries about data access and distribution."
- **Email**
  - Label: `Email` (Required)
  - Description: "Email address for data access inquiries."
  - Tooltip: "The primary email address for users to ask questions or request access to the dataset."
- **Department/Unit**
  - Label: `Department/Unit`
  - Description: "Specific department or unit for data access contact."
  - Tooltip: "The specific department or unit within the organization that handles data distribution, if applicable."
- **Phone Number**
  - Label: `Phone Number`
  - Description: "Phone number for data access inquiries."
  - Tooltip: "A phone number for users to contact regarding data access, if available."

I have now gone through `general-info-form.tsx`, `technical-details-form.tsx`, `data-quality-form.tsx`, and `access-info-form.tsx`. This covers the main sections of the metadata input form.

The UI components provide much more descriptive labels, help texts, and tooltips compared to the raw Prisma schema comments. They are broken down into logical sections, making them easier for users to understand.

Is there anything else I can help you with regarding these metadata form fields or their descriptions?
