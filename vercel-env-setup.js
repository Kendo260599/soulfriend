/**
 * Script to configure Vercel environment variables
 */

const { execSync } = require('child_process');

const envVars = {
  'REACT_APP_API_URL': 'https://soulfriend-backend.onrender.com',
  'REACT_APP_GEMINI_API_KEY': 'AIzaSyBaswf5ksxu1g7WvhS2_Hy7PHqWpjZu8LM'
};

console.log('🔧 Setting up Vercel environment variables...');

Object.entries(envVars).forEach(([key, value]) => {
  try {
    console.log(`Setting ${key}...`);
    execSync(`echo "${value}" | vercel env add ${key} production main`, { stdio: 'inherit' });
    console.log(`✅ ${key} set successfully`);
  } catch (error) {
    console.error(`❌ Failed to set ${key}:`, error.message);
  }
});

console.log('🎉 Environment variables setup complete!');
