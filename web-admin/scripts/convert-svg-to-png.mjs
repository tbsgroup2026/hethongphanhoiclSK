#!/usr/bin/env node

import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const projectRoot = path.join(__dirname, "..");
const svgPath = path.join(projectRoot, "public", "flow-card-incident.svg");
const pngPath = path.join(projectRoot, "public", "flow-card-incident.png");

// Read SVG
const svgContent = fs.readFileSync(svgPath, "utf-8");

// Create HTML wrapper
const htmlContent = `
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <style>
        body { margin: 0; padding: 0; background: white; }
        svg { display: block; }
    </style>
</head>
<body>
${svgContent}
</body>
</html>
`;

console.log("📊 SVG to PNG Converter");
console.log("========================");
console.log(`📄 SVG Source: ${svgPath}`);
console.log(`📍 PNG Output: ${pngPath}`);
console.log("");
console.log("⚠️  To convert SVG to PNG, please use one of these methods:");
console.log("");
console.log("✅ Method 1: Using Browser DevTools (Recommended)");
console.log("   1. Open the SVG in your browser");
console.log('   2. Right-click → "Save as image"');
console.log("");
console.log("✅ Method 2: Using Inkscape (if installed)");
console.log(
  `   inkscape "${svgPath}" --export-filename="${pngPath}" --export-width=3200 --export-height=4800`,
);
console.log("");
console.log("✅ Method 3: Using ImageMagick (if installed)");
console.log(`   magick convert -density 300 "${svgPath}" "${pngPath}"`);
console.log("");
console.log("✅ Method 4: Using Python + cairosvg");
console.log("   pip install cairosvg");
console.log(`   python scripts/svg-to-png.py`);
console.log("");
console.log("✅ Method 5: Open in VS Code and use extension");
console.log('   - Install "SVG to PNG" extension');
console.log('   - Right-click SVG file → "Convert SVG to PNG"');
