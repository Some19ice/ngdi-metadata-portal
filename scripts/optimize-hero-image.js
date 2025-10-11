const sharp = require("sharp")
const fs = require("fs")
const path = require("path")

const inputPath = path.join(__dirname, "../public/img/hero-satellite-earth.jpg")
const outputDir = path.join(__dirname, "../public/img")

// Ensure output directory exists
if (!fs.existsSync(outputDir)) {
  fs.mkdirSync(outputDir, { recursive: true })
}

// Define responsive image sizes
const sizes = [
  { width: 768, suffix: "-mobile" },
  { width: 1024, suffix: "-tablet" },
  { width: 1920, suffix: "-desktop" },
  { width: 2560, suffix: "-large" }
]

async function optimizeImage() {
  console.log("Starting image optimization...\n")

  try {
    // Check if input file exists
    if (!fs.existsSync(inputPath)) {
      console.error(`Error: Input file not found at ${inputPath}`)
      process.exit(1)
    }

    // Get original image info
    const metadata = await sharp(inputPath).metadata()
    console.log(
      `Original image: ${metadata.width}x${metadata.height}, ${metadata.format}, ${(metadata.size / 1024).toFixed(2)} KB\n`
    )

    // Generate main WebP version (full size)
    const mainWebpPath = path.join(outputDir, "hero-satellite-earth.webp")
    await sharp(inputPath).webp({ quality: 90, effort: 6 }).toFile(mainWebpPath)

    const mainWebpStats = fs.statSync(mainWebpPath)
    console.log(
      `✓ Created main WebP: hero-satellite-earth.webp (${(mainWebpStats.size / 1024).toFixed(2)} KB)`
    )

    // Generate responsive sizes
    for (const size of sizes) {
      const webpPath = path.join(
        outputDir,
        `hero-satellite-earth${size.suffix}.webp`
      )

      await sharp(inputPath)
        .resize(size.width, null, {
          fit: "inside",
          withoutEnlargement: true
        })
        .webp({ quality: 90, effort: 6 })
        .toFile(webpPath)

      const stats = fs.statSync(webpPath)
      console.log(
        `✓ Created ${size.width}px WebP: hero-satellite-earth${size.suffix}.webp (${(stats.size / 1024).toFixed(2)} KB)`
      )
    }

    console.log("\n✅ Image optimization complete!")
    console.log("\nGenerated files:")
    console.log("  - hero-satellite-earth.webp (main)")
    sizes.forEach(size => {
      console.log(
        `  - hero-satellite-earth${size.suffix}.webp (${size.width}px)`
      )
    })
    console.log("\nOriginal JPEG kept as fallback: hero-satellite-earth.jpg")
  } catch (error) {
    console.error("Error optimizing image:", error)
    process.exit(1)
  }
}

optimizeImage()
