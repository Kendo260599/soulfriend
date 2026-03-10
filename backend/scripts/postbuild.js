// Post-build shim: creates dist/index.js for backward compatibility.
// Render's Start Command uses "node dist/index.js" but with rootDir=".."
// the actual entry point is at dist/backend/src/index.js.
const fs = require('fs');
const path = require('path');

const distDir = path.join(__dirname, '..', 'dist');
const shimPath = path.join(distDir, 'index.js');
const realEntry = path.join(distDir, 'backend', 'src', 'index.js');

if (fs.existsSync(realEntry)) {
  fs.writeFileSync(shimPath, 'require("./backend/src/index");\n');
  console.log('✓ Created dist/index.js shim → dist/backend/src/index.js');
} else {
  console.warn('⚠ dist/backend/src/index.js not found, skipping shim creation');
}
