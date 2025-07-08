#!/usr/bin/env node

/**
 * Convert GeoJSON globe data to TopoJSON for bundle optimization
 *
 * This script converts large GeoJSON files to smaller TopoJSON format
 * which can be dynamically loaded to reduce initial bundle size.
 *
 * Usage: node scripts/convert-globe-data.js <input-geojson> [output-topojson]
 */

const { execSync } = require("child_process")
const path = require("path")
const fs = require("fs")

function convertGeoJsonToTopoJson(inputFile, outputFile = null) {
  // Validate input file exists
  if (!fs.existsSync(inputFile)) {
    console.error(`Error: Input file "${inputFile}" does not exist`)
    process.exit(1)
  }

  // Default output file if not provided
  if (!outputFile) {
    const baseName = path.basename(inputFile, path.extname(inputFile))
    outputFile = path.join("public", `${baseName}.topo.json`)
  }

  try {
    // Run the conversion using topojson-server
    const command = `npx geo2topo countries=${inputFile} -o ${outputFile}`
    console.log(`Converting ${inputFile} to ${outputFile}...`)
    execSync(command, { stdio: "inherit" })

    // Check file sizes
    const inputStats = fs.statSync(inputFile)
    const outputStats = fs.statSync(outputFile)

    const inputSize = (inputStats.size / 1024).toFixed(1)
    const outputSize = (outputStats.size / 1024).toFixed(1)
    const reduction = (
      ((inputStats.size - outputStats.size) / inputStats.size) *
      100
    ).toFixed(1)

    console.log("\n✅ Conversion completed successfully!")
    console.log(`📦 Original size: ${inputSize} KB`)
    console.log(`🎯 Compressed size: ${outputSize} KB`)
    console.log(`📉 Size reduction: ${reduction}%`)
    console.log(`💾 Output file: ${outputFile}`)
  } catch (error) {
    console.error("Error during conversion:", error.message)
    process.exit(1)
  }
}

// Command line usage
if (require.main === module) {
  const args = process.argv.slice(2)

  if (args.length === 0) {
    console.log(
      "Usage: node scripts/convert-globe-data.js <input-geojson> [output-topojson]"
    )
    console.log("\nExample:")
    console.log("  node scripts/convert-globe-data.js data/countries.json")
    console.log(
      "  node scripts/convert-globe-data.js data/countries.json public/globe.topo.json"
    )
    process.exit(1)
  }

  const [inputFile, outputFile] = args
  convertGeoJsonToTopoJson(inputFile, outputFile)
}

module.exports = { convertGeoJsonToTopoJson }
