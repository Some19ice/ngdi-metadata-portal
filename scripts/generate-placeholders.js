const fs = require("fs")
const path = require("path")

const placeholdersDir = path.join(process.cwd(), "public", "placeholders")

if (!fs.existsSync(placeholdersDir)) {
  fs.mkdirSync(placeholdersDir, { recursive: true })
}

const images = [
  { name: "news-portal-launch.jpg", text: "Portal Launch", color: "#1a365d" },
  { name: "news-standards.jpg", text: "Standards", color: "#2f855a" },
  { name: "news-workshop.jpg", text: "Workshop", color: "#c05621" },
  { name: "news-partnership.jpg", text: "Partnership", color: "#2b6cb0" },
  { name: "news-conference.jpg", text: "Conference", color: "#553c9a" },
  { name: "news-success.jpg", text: "Success", color: "#276749" },
  { name: "avatar-female-1.jpg", text: "Female 1", color: "#e53e3e" },
  { name: "avatar-male-1.jpg", text: "Male 1", color: "#3182ce" },
  { name: "avatar-female-2.jpg", text: "Female 2", color: "#d69e2e" },
  { name: "avatar-male-2.jpg", text: "Male 2", color: "#38a169" },
  { name: "avatar-female-3.jpg", text: "Female 3", color: "#805ad5" }
]

function createSvg(text, color) {
  return `<svg width="800" height="600" xmlns="http://www.w3.org/2000/svg">
  <rect width="100%" height="100%" fill="${color}" />
  <text x="50%" y="50%" font-family="Arial" font-size="40" fill="white" text-anchor="middle" dy=".3em">${text}</text>
</svg>`
}

images.forEach(img => {
  const svgContent = createSvg(img.text, img.color)
  // Saving as .jpg is what the app expects, but writing SVG content.
  // Browsers can often render SVG content even with .jpg extension if served correctly,
  // but strictly speaking this is incorrect.
  // However, for a placeholder in a dev environment, or if using Next.js Image which might be picky,
  // it's better to verify if we can use .svg extension in the code.
  // The code references .jpg.
  // Let's write as .svg and we might need to update the code references or use a library to convert.
  // BUT, since I don't have sharp/canvas guaranteed, I will write them as .svg and try to update code references
  // OR just write them as .svg but name them .jpg (Next.js Image might complain).

  // Alternative: Just generate them as .svg and I will update the code to point to .svg.
  // This is cleaner.

  const filePath = path.join(placeholdersDir, img.name.replace(".jpg", ".svg"))
  fs.writeFileSync(filePath, svgContent)
  console.log(`Created ${filePath}`)
})
