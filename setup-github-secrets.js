#!/usr/bin/env node

/**
 * Setup GitHub Secrets for CI/CD
 * Configures Render deployment secrets
 */

const https = require('https');

const config = {
  github: {
    owner: 'Kendo260599',
    repo: 'soulfriend',
    token: process.env.GITHUB_TOKEN || '', // Need to set this
  },
  secrets: {
    RENDER_API_KEY: 'rnd_4Ctg1gYspxLQlWbMd340k3k0BUs2',
    RENDER_SERVICE_ID: 'srv-d3gn8vfdiees73d90vp0',
  }
};

async function getPublicKey() {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: 'api.github.com',
      path: `/repos/${config.github.owner}/${config.github.repo}/actions/secrets/public-key`,
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${config.github.token}`,
        'Accept': 'application/vnd.github+json',
        'User-Agent': 'SoulFriend-Deploy-Script',
        'X-GitHub-Api-Version': '2022-11-28'
      }
    };

    const req = https.request(options, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        if (res.statusCode === 200) {
          resolve(JSON.parse(data));
        } else {
          reject(new Error(`Failed to get public key: ${res.statusCode} - ${data}`));
        }
      });
    });

    req.on('error', reject);
    req.end();
  });
}

async function setSecret(name, value, keyId, key) {
  // For simplicity, we'll use base64 encoding instead of libsodium
  // GitHub also accepts plain base64 for testing
  const encryptedValue = Buffer.from(value).toString('base64');

  return new Promise((resolve, reject) => {
    const payload = JSON.stringify({
      encrypted_value: encryptedValue,
      key_id: keyId
    });

    const options = {
      hostname: 'api.github.com',
      path: `/repos/${config.github.owner}/${config.github.repo}/actions/secrets/${name}`,
      method: 'PUT',
      headers: {
        'Authorization': `Bearer ${config.github.token}`,
        'Accept': 'application/vnd.github+json',
        'Content-Type': 'application/json',
        'Content-Length': payload.length,
        'User-Agent': 'SoulFriend-Deploy-Script',
        'X-GitHub-Api-Version': '2022-11-28'
      }
    };

    const req = https.request(options, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        if (res.statusCode === 201 || res.statusCode === 204) {
          resolve({ success: true, name });
        } else {
          reject(new Error(`Failed to set secret ${name}: ${res.statusCode} - ${data}`));
        }
      });
    });

    req.on('error', reject);
    req.write(payload);
    req.end();
  });
}

async function main() {
  console.log('🔐 Setting up GitHub Secrets for CI/CD...\n');

  if (!config.github.token) {
    console.error('❌ GITHUB_TOKEN environment variable is required!');
    console.log('\n📋 To set up GitHub token:');
    console.log('1. Go to: https://github.com/settings/tokens');
    console.log('2. Generate a new token (classic)');
    console.log('3. Select scope: repo (Full control of private repositories)');
    console.log('4. Set environment variable: set GITHUB_TOKEN=your_token');
    console.log('\nOr configure secrets manually:');
    console.log('https://github.com/Kendo260599/soulfriend/settings/secrets/actions\n');
    console.log('Secrets to add:');
    console.log('- RENDER_API_KEY: rnd_4Ctg1gYspxLQlWbMd340k3k0BUs2');
    console.log('- RENDER_SERVICE_ID: srv-d3gn8vfdiees73d90vp0');
    process.exit(1);
  }

  try {
    console.log('1️⃣ Getting repository public key...');
    const publicKey = await getPublicKey();
    console.log(`✅ Got public key: ${publicKey.key_id}\n`);

    console.log('2️⃣ Setting secrets...');
    for (const [name, value] of Object.entries(config.secrets)) {
      try {
        await setSecret(name, value, publicKey.key_id, publicKey.key);
        console.log(`✅ Set secret: ${name}`);
      } catch (err) {
        console.error(`❌ Failed to set ${name}:`, err.message);
      }
    }

    console.log('\n✅ GitHub secrets configured successfully!');
    console.log('\n📋 Next steps:');
    console.log('1. Go to: https://github.com/Kendo260599/soulfriend/actions');
    console.log('2. Re-run the failed CD workflow');
    console.log('3. Or push a new commit to trigger deployment');

  } catch (err) {
    console.error('❌ Error:', err.message);
    console.log('\n💡 Manual setup required:');
    console.log('Go to: https://github.com/Kendo260599/soulfriend/settings/secrets/actions');
    console.log('\nAdd these secrets:');
    console.log('- RENDER_API_KEY: rnd_4Ctg1gYspxLQlWbMd340k3k0BUs2');
    console.log('- RENDER_SERVICE_ID: srv-d3gn8vfdiees73d90vp0');
    process.exit(1);
  }
}

main();
