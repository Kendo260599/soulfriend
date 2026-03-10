// Post-build shim: creates dist/index.js for backward compatibility.
// Render's Start Command uses "node dist/index.js" but with rootDir=".."
// the actual entry point is at dist/backend/src/index.js.
//
// IMPORTANT: The original index.ts has `if (require.main === module) startServer()`.
// When loaded via shim, require.main points to the shim, not the actual module.
// So the shim must explicitly call startServer() after requiring the module.
const fs = require('fs');
const path = require('path');

const distDir = path.join(__dirname, '..', 'dist');
const shimPath = path.join(distDir, 'index.js');
const realEntry = path.join(distDir, 'backend', 'src', 'index.js');

if (fs.existsSync(realEntry)) {
  const shimContent = [
    '// Auto-generated shim — forwards to the real entry point',
    'const app = require("./backend/src/index");',
    '// require.main !== module in this shim, so startServer() won\'t auto-run.',
    '// We must NOT call startServer() here because the real index.js',
    '// now starts unconditionally. See the guard removal in index.ts.',
    '',
  ].join('\n');
  fs.writeFileSync(shimPath, shimContent);
  console.log('✓ Created dist/index.js shim → dist/backend/src/index.js');
} else {
  console.warn('⚠ dist/backend/src/index.js not found, skipping shim creation');
}
