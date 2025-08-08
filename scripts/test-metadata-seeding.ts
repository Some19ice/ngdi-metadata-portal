/*
 * Test Script for Metadata Seeding
 * --------------------------------
 * Tests the metadata data generator and seeding functionality
 * to ensure all components work correctly.
 */

import {
  generateLocationInfo,
  generateSpatialInfo,
  generateTemporalInfo,
  generateTechnicalDetailsInfo,
  generateConstraintsInfo,
  generateDataQualityInfo,
  generateProcessingInfo,
  generateDistributionInfo,
  generateMetadataReferenceInfo,
  generateFundamentalDatasetsInfo,
  generateNigeriaBoundingBox,
  DATASET_TEMPLATES,
  generateMetadataRecord
} from "./metadata-data-generator"

function testDataGenerators() {
  console.log("🧪  Testing data generators...")

  // Test each generator function
  const tests = [
    { name: "Location Info", fn: () => generateLocationInfo() },
    { name: "Spatial Info (Vector)", fn: () => generateSpatialInfo("Vector") },
    { name: "Spatial Info (Raster)", fn: () => generateSpatialInfo("Raster") },
    { name: "Temporal Info", fn: () => generateTemporalInfo() },
    {
      name: "Technical Details (Vector)",
      fn: () => generateTechnicalDetailsInfo("Vector")
    },
    {
      name: "Technical Details (Raster)",
      fn: () => generateTechnicalDetailsInfo("Raster")
    },
    { name: "Constraints Info", fn: () => generateConstraintsInfo() },
    { name: "Data Quality Info", fn: () => generateDataQualityInfo() },
    { name: "Processing Info", fn: () => generateProcessingInfo() },
    { name: "Distribution Info", fn: () => generateDistributionInfo() },
    {
      name: "Metadata Reference Info",
      fn: () => generateMetadataReferenceInfo()
    },
    {
      name: "Fundamental Datasets Info",
      fn: () => generateFundamentalDatasetsInfo()
    },
    { name: "Nigeria Bounding Box", fn: () => generateNigeriaBoundingBox() }
  ]

  let passed = 0
  let failed = 0

  tests.forEach(test => {
    try {
      const result = test.fn()
      if (result && typeof result === "object") {
        console.log(`   ✅  ${test.name}: Generated successfully`)
        passed++
      } else {
        console.log(`   ❌  ${test.name}: Invalid result type`)
        failed++
      }
    } catch (error) {
      console.log(`   ❌  ${test.name}: Error - ${error}`)
      failed++
    }
  })

  console.log(`   Summary: ${passed} passed, ${failed} failed`)
  return failed === 0
}

function testTemplateGeneration() {
  console.log("\n🎯  Testing template-based record generation...")

  const testOrgId = "test-org-123"
  const testUserId = "test-user-456"

  let passed = 0
  let failed = 0

  DATASET_TEMPLATES.forEach((template, index) => {
    try {
      const record = generateMetadataRecord(template, testOrgId, testUserId)

      // Validate required fields
      const requiredFields = [
        "title",
        "abstract",
        "dataType",
        "organizationId",
        "creatorUserId"
      ]
      const missingFields = requiredFields.filter(
        field => !record[field as keyof typeof record]
      )

      if (missingFields.length === 0) {
        console.log(
          `   ✅  Template ${index + 1} (${template.frameworkType}): Generated successfully`
        )
        passed++
      } else {
        console.log(
          `   ❌  Template ${index + 1}: Missing fields - ${missingFields.join(", ")}`
        )
        failed++
      }
    } catch (error) {
      console.log(`   ❌  Template ${index + 1}: Error - ${error}`)
      failed++
    }
  })

  console.log(`   Summary: ${passed} passed, ${failed} failed`)
  return failed === 0
}

function testBoundingBoxValidation() {
  console.log("\n🌍  Testing bounding box generation...")

  const boxes = []
  for (let i = 0; i < 10; i++) {
    boxes.push(generateNigeriaBoundingBox())
  }

  let validBoxes = 0
  boxes.forEach((box, index) => {
    const isValid =
      box.northBoundingCoordinate! > box.southBoundingCoordinate! &&
      box.eastBoundingCoordinate! > box.westBoundingCoordinate! &&
      box.northBoundingCoordinate! >= 4 &&
      box.northBoundingCoordinate! <= 14 &&
      box.southBoundingCoordinate! >= 4 &&
      box.southBoundingCoordinate! <= 14 &&
      box.eastBoundingCoordinate! >= 3 &&
      box.eastBoundingCoordinate! <= 15 &&
      box.westBoundingCoordinate! >= 3 &&
      box.westBoundingCoordinate! <= 15

    if (isValid) {
      validBoxes++
    } else {
      console.log(`   ❌  Box ${index + 1}: Invalid coordinates`, box)
    }
  })

  console.log(`   ✅  ${validBoxes}/10 bounding boxes are valid for Nigeria`)
  return validBoxes === 10
}

function displaySampleRecord() {
  console.log("\n📄  Sample Generated Record:")
  console.log("=".repeat(50))

  const template = DATASET_TEMPLATES[0]
  const sampleRecord = generateMetadataRecord(
    template,
    "sample-org",
    "sample-user"
  )

  console.log(`Title: ${sampleRecord.title}`)
  console.log(`Abstract: ${sampleRecord.abstract}`)
  console.log(`Data Type: ${sampleRecord.dataType}`)
  console.log(`Framework Type: ${sampleRecord.frameworkType}`)
  console.log(`Keywords: ${sampleRecord.keywords?.join(", ")}`)
  console.log(
    `Location: ${sampleRecord.locationInfo?.state}, ${sampleRecord.locationInfo?.geopoliticalZone}`
  )
  console.log(
    `Bounding Box: N:${sampleRecord.spatialInfo?.boundingBox?.northBoundingCoordinate}, S:${sampleRecord.spatialInfo?.boundingBox?.southBoundingCoordinate}, E:${sampleRecord.spatialInfo?.boundingBox?.eastBoundingCoordinate}, W:${sampleRecord.spatialInfo?.boundingBox?.westBoundingCoordinate}`
  )
  console.log(
    `Temporal: ${sampleRecord.temporalInfo?.dateFrom} to ${sampleRecord.temporalInfo?.dateTo}`
  )
  console.log(`File Format: ${sampleRecord.technicalDetailsInfo?.fileFormat}`)
  console.log(
    `License: ${sampleRecord.distributionInfo?.licenseInfo?.licenseType}`
  )
}

async function main() {
  console.log("🧪  Metadata Seeding Test Suite")
  console.log("==============================")

  const tests = [
    { name: "Data Generators", fn: testDataGenerators },
    { name: "Template Generation", fn: testTemplateGeneration },
    { name: "Bounding Box Validation", fn: testBoundingBoxValidation }
  ]

  let allPassed = true

  for (const test of tests) {
    const result = test.fn()
    if (!result) {
      allPassed = false
    }
  }

  displaySampleRecord()

  console.log("\n" + "=".repeat(50))
  if (allPassed) {
    console.log("✅  All tests passed! Metadata seeding system is ready.")
  } else {
    console.log("❌  Some tests failed. Please review the errors above.")
  }

  return allPassed ? 0 : 1
}

if (require.main === module) {
  main()
    .then(exitCode => process.exit(exitCode))
    .catch(error => {
      console.error("❌  Test suite failed:", error)
      process.exit(1)
    })
}
