// Post-build shim: creates dist/index.js for backward compatibility.
// Render's Start Command uses "node dist/index.js" from backend/ directory.
// TypeScript compiles from rootDir=".." so output goes to backend/dist/backend/src/index.js
// but npm start runs from backend/ dir, so we need backend/dist/index.js → backend/dist/backend/src/index.js

const fs = require('fs');
const path = require('path');

// __dirname is backend/scripts/postbuild.js
// dist/ is at backend/dist/
const backendDir = __dirname; // backend/scripts/
const distDir = path.join(backendDir, '..', 'dist'); // backend/dist/
const shimPath = path.join(distDir, 'index.js');
const realEntry = path.join(distDir, 'backend', 'src', 'index.js');

if (fs.existsSync(realEntry)) {
  const shimContent = [
    '// Auto-generated shim — requires real entry point (executes server startup)',
    'require("./backend/src/index");',
    '',
  ].join('\n');
  fs.writeFileSync(shimPath, shimContent);
  console.log('✓ Created dist/index.js shim → dist/backend/src/index.js');
} else {
  console.warn('⚠ dist/backend/src/index.js not found, skipping shim creation');
  console.warn('  (cwd:', process.cwd(), ', distDir:', distDir, ', realEntry:', realEntry, ')');
  // Try alternate path: dist/src/index.js (if rootDir was different)
  const altEntry = path.join(distDir, 'src', 'index.js');
  if (fs.existsSync(altEntry)) {
    const shimContent = [
      '// Auto-generated shim (alternate) — requires real entry point',
      'require("./src/index");',
      '',
    ].join('\n');
    fs.writeFileSync(shimPath, shimContent);
    console.log('✓ Created dist/index.js shim → dist/src/index.js (alternate)');
  }
}
