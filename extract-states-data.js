const fs = require("fs")

// Read the TypeScript file
const content = fs.readFileSync("lib/data/nigeria-states-lga.ts", "utf8")

// Extract the nigerianStates array content
const startMatch = content.match(/export const nigerianStates: State\[\] = \[/)
if (!startMatch) {
  console.error("Could not find nigerianStates array start")
  process.exit(1)
}

const startIndex = startMatch.index + startMatch[0].length
let bracketCount = 1
let endIndex = startIndex

// Find the matching closing bracket
for (let i = startIndex; i < content.length && bracketCount > 0; i++) {
  if (content[i] === "[") bracketCount++
  else if (content[i] === "]") bracketCount--
  endIndex = i
}

// Extract the array content
const arrayContent = "[" + content.substring(startIndex, endIndex) + "]"

// Parse and format as JSON
try {
  const statesData = eval("(" + arrayContent + ")")

  // Create the JSON file
  fs.writeFileSync(
    "lib/data/nigeria-states-lga.json",
    JSON.stringify(statesData, null, 2)
  )
  console.log("Successfully created nigeria-states-lga.json")
  console.log(`Extracted ${statesData.length} states`)
} catch (error) {
  console.error("Error parsing states data:", error.message)
}
