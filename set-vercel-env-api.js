#!/usr/bin/env node

/**
 * 🚀 Automatic Vercel Environment Variables Setup
 * Using Vercel API for full automation
 * 
 * Prerequisites:
 * - Vercel Access Token (get from: https://vercel.com/account/tokens)
 * - Project ID and Team ID (optional)
 */

const https = require('https');
const readline = require('readline');

// Colors for console output
const colors = {
    reset: '\x1b[0m',
    cyan: '\x1b[36m',
    green: '\x1b[32m',
    yellow: '\x1b[33m',
    red: '\x1b[31m',
    gray: '\x1b[90m'
};

const log = {
    info: (msg) => console.log(`${colors.cyan}ℹ${colors.reset} ${msg}`),
    success: (msg) => console.log(`${colors.green}✅${colors.reset} ${msg}`),
    warning: (msg) => console.log(`${colors.yellow}⚠️${colors.reset} ${msg}`),
    error: (msg) => console.log(`${colors.red}❌${colors.reset} ${msg}`),
    gray: (msg) => console.log(`${colors.gray}${msg}${colors.reset}`)
};

// Environment variables to set
const ENV_VARS = [
    {
        key: 'REACT_APP_API_URL',
        value: 'https://soulfriend-production.up.railway.app',
        type: 'encrypted'
    },
    {
        key: 'REACT_APP_BACKEND_URL',
        value: 'https://soulfriend-production.up.railway.app',
        type: 'encrypted'
    },
    {
        key: 'NODE_VERSION',
        value: '20',
        type: 'plain'
    },
    {
        key: 'DISABLE_ESLINT_PLUGIN',
        value: 'true',
        type: 'plain'
    },
    {
        key: 'GENERATE_SOURCEMAP',
        value: 'false',
        type: 'plain'
    },
    {
        key: 'SKIP_PREFLIGHT_CHECK',
        value: 'true',
        type: 'plain'
    }
];

// Vercel API configuration
let VERCEL_TOKEN = process.env.VERCEL_TOKEN || '';
const PROJECT_NAME = 'soulfriend';
const VERCEL_API_URL = 'api.vercel.com';

/**
 * Make HTTPS request to Vercel API
 */
function makeRequest(method, path, data = null) {
    return new Promise((resolve, reject) => {
        const options = {
            hostname: VERCEL_API_URL,
            path: path,
            method: method,
            headers: {
                'Authorization': `Bearer ${VERCEL_TOKEN}`,
                'Content-Type': 'application/json'
            }
        };

        const req = https.request(options, (res) => {
            let body = '';
            res.on('data', (chunk) => body += chunk);
            res.on('end', () => {
                try {
                    const response = JSON.parse(body);
                    if (res.statusCode >= 200 && res.statusCode < 300) {
                        resolve(response);
                    } else {
                        reject(new Error(response.error?.message || `Status ${res.statusCode}: ${body}`));
                    }
                } catch (err) {
                    reject(new Error(`Failed to parse response: ${body}`));
                }
            });
        });

        req.on('error', reject);

        if (data) {
            req.write(JSON.stringify(data));
        }

        req.end();
    });
}

/**
 * Get user input
 */
function promptUser(question) {
    const rl = readline.createInterface({
        input: process.stdin,
        output: process.stdout
    });

    return new Promise((resolve) => {
        rl.question(question, (answer) => {
            rl.close();
            resolve(answer.trim());
        });
    });
}

/**
 * Get project info
 */
async function getProject() {
    try {
        log.info('Fetching project information...');
        const projects = await makeRequest('GET', '/v9/projects');
        
        const project = projects.projects.find(p => p.name === PROJECT_NAME);
        
        if (!project) {
            throw new Error(`Project "${PROJECT_NAME}" not found. Available projects: ${projects.projects.map(p => p.name).join(', ')}`);
        }
        
        log.success(`Found project: ${project.name} (ID: ${project.id})`);
        return project;
    } catch (error) {
        throw new Error(`Failed to get project: ${error.message}`);
    }
}

/**
 * Set environment variable for a project
 */
async function setEnvVar(projectId, envVar) {
    try {
        log.info(`Setting ${envVar.key}...`);
        
        const data = {
            key: envVar.key,
            value: envVar.value,
            type: envVar.type,
            target: ['production', 'preview', 'development']
        };

        await makeRequest('POST', `/v10/projects/${projectId}/env`, data);
        log.success(`Set ${envVar.key} for production, preview, and development`);
        return true;
    } catch (error) {
        if (error.message.includes('already exists')) {
            log.warning(`${envVar.key} already exists. Updating...`);
            try {
                // Get existing env var ID
                const envVars = await makeRequest('GET', `/v9/projects/${projectId}/env`);
                const existing = envVars.envs.find(e => e.key === envVar.key);
                
                if (existing) {
                    // Delete old
                    await makeRequest('DELETE', `/v9/projects/${projectId}/env/${existing.id}`);
                    log.info(`Deleted old ${envVar.key}`);
                    
                    // Create new
                    await makeRequest('POST', `/v10/projects/${projectId}/env`, data);
                    log.success(`Updated ${envVar.key}`);
                    return true;
                }
            } catch (updateError) {
                log.error(`Failed to update ${envVar.key}: ${updateError.message}`);
                return false;
            }
        } else {
            log.error(`Failed to set ${envVar.key}: ${error.message}`);
            return false;
        }
    }
}

/**
 * Trigger deployment
 */
async function triggerDeployment(projectId) {
    try {
        log.info('Triggering new deployment...');
        
        const deployment = await makeRequest('POST', '/v13/deployments', {
            name: PROJECT_NAME,
            project: projectId,
            target: 'production',
            gitSource: {
                type: 'github',
                ref: 'main',
                repoId: 'Kendo260599/soulfriend'
            }
        });
        
        log.success(`Deployment triggered: ${deployment.url}`);
        log.info(`View deployment: https://vercel.com/kendo260599s-projects/${PROJECT_NAME}`);
        return true;
    } catch (error) {
        log.warning(`Could not trigger automatic deployment: ${error.message}`);
        log.info('You can trigger deployment manually from Vercel Dashboard');
        return false;
    }
}

/**
 * Main execution
 */
async function main() {
    console.log('');
    console.log(`${colors.cyan}========================================${colors.reset}`);
    console.log(`${colors.cyan}  VERCEL ENV VARS AUTO-SETUP (API)     ${colors.reset}`);
    console.log(`${colors.cyan}========================================${colors.reset}`);
    console.log('');

    // Step 1: Get Vercel token
    if (!VERCEL_TOKEN) {
        log.warning('VERCEL_TOKEN not found in environment');
        log.info('You need a Vercel Access Token to continue');
        log.gray('Get one at: https://vercel.com/account/tokens');
        console.log('');
        
        VERCEL_TOKEN = await promptUser('Enter your Vercel Access Token: ');
        
        if (!VERCEL_TOKEN) {
            log.error('Token is required. Exiting.');
            process.exit(1);
        }
    }

    log.success('Vercel token found');
    console.log('');

    try {
        // Step 2: Get project
        const project = await getProject();
        console.log('');

        // Step 3: Display env vars to set
        log.info('Will set the following environment variables:');
        console.log('');
        ENV_VARS.forEach((envVar, index) => {
            console.log(`  ${index + 1}. ${colors.cyan}${envVar.key}${colors.reset}`);
            log.gray(`     → ${envVar.value}`);
        });
        console.log('');

        const confirm = await promptUser('Continue? (Y/N): ');
        if (confirm.toLowerCase() !== 'y') {
            log.warning('Cancelled by user');
            process.exit(0);
        }

        console.log('');

        // Step 4: Set each environment variable
        let successCount = 0;
        let failCount = 0;

        for (const envVar of ENV_VARS) {
            const success = await setEnvVar(project.id, envVar);
            if (success) {
                successCount++;
            } else {
                failCount++;
            }
            console.log('');
        }

        // Step 5: Summary
        console.log(`${colors.cyan}========================================${colors.reset}`);
        console.log('');
        log.info(`Summary: ${successCount}/${ENV_VARS.length} succeeded, ${failCount}/${ENV_VARS.length} failed`);
        console.log('');

        if (failCount === 0) {
            log.success('All environment variables set successfully!');
            console.log('');

            const redeploy = await promptUser('Trigger redeploy now? (Y/N): ');
            if (redeploy.toLowerCase() === 'y') {
                console.log('');
                await triggerDeployment(project.id);
            } else {
                log.info('Remember to redeploy manually from Vercel Dashboard');
            }
        } else {
            log.warning('Some variables failed to set. Check errors above.');
            log.info('You can set them manually at:');
            log.gray(`https://vercel.com/kendo260599s-projects/${PROJECT_NAME}/settings/environment-variables`);
        }

        console.log('');
        log.success('Done!');
        console.log('');

    } catch (error) {
        console.log('');
        log.error(`Error: ${error.message}`);
        console.log('');
        log.info('Troubleshooting:');
        log.gray('1. Check your Vercel token is valid');
        log.gray('2. Verify you have access to the project');
        log.gray('3. Try setting variables manually via Dashboard');
        console.log('');
        process.exit(1);
    }
}

// Run if executed directly
if (require.main === module) {
    main().catch((error) => {
        log.error(`Unexpected error: ${error.message}`);
        process.exit(1);
    });
}

module.exports = { main, setEnvVar, getProject };

