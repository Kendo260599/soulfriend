#!/usr/bin/env node

/**
 * 🚀 Automatic Vercel Environment Variables Setup - Auto Mode
 * No confirmation needed - runs automatically
 */

const https = require('https');

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

const ENV_VARS = [
    { key: 'REACT_APP_API_URL', value: 'https://soulfriend-production.up.railway.app', type: 'encrypted' },
    { key: 'REACT_APP_BACKEND_URL', value: 'https://soulfriend-production.up.railway.app', type: 'encrypted' },
    { key: 'NODE_VERSION', value: '20', type: 'plain' },
    { key: 'DISABLE_ESLINT_PLUGIN', value: 'true', type: 'plain' },
    { key: 'GENERATE_SOURCEMAP', value: 'false', type: 'plain' },
    { key: 'SKIP_PREFLIGHT_CHECK', value: 'true', type: 'plain' }
];

const VERCEL_TOKEN = process.env.VERCEL_TOKEN || '';
const PROJECT_NAME = 'soulfriend';
const VERCEL_API_URL = 'api.vercel.com';

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
        if (data) req.write(JSON.stringify(data));
        req.end();
    });
}

async function getProject() {
    log.info('Fetching project information...');
    const projects = await makeRequest('GET', '/v9/projects');
    const project = projects.projects.find(p => p.name === PROJECT_NAME);
    if (!project) throw new Error(`Project "${PROJECT_NAME}" not found`);
    log.success(`Found project: ${project.name} (ID: ${project.id})`);
    return project;
}

async function setEnvVar(projectId, envVar) {
    const data = {
        key: envVar.key,
        value: envVar.value,
        type: envVar.type,
        target: ['production', 'preview', 'development']
    };
    
    try {
        log.info(`Setting ${envVar.key}...`);
        await makeRequest('POST', `/v10/projects/${projectId}/env`, data);
        log.success(`Set ${envVar.key} ✅`);
        return true;
    } catch (error) {
        if (error.message.includes('already exists')) {
            log.warning(`${envVar.key} exists, updating...`);
            try {
                const envVars = await makeRequest('GET', `/v9/projects/${projectId}/env`);
                const existing = envVars.envs.find(e => e.key === envVar.key);
                if (existing) {
                    await makeRequest('DELETE', `/v9/projects/${projectId}/env/${existing.id}`);
                    await makeRequest('POST', `/v10/projects/${projectId}/env`, data);
                    log.success(`Updated ${envVar.key} ✅`);
                    return true;
                }
            } catch (err) {
                log.error(`Failed to update ${envVar.key}: ${err.message}`);
                return false;
            }
        } else {
            log.error(`Failed to set ${envVar.key}: ${error.message}`);
            return false;
        }
    }
}

async function main() {
    console.log('');
    console.log(`${colors.cyan}========================================${colors.reset}`);
    console.log(`${colors.cyan}  AUTO VERCEL ENV SETUP - NO CONFIRM   ${colors.reset}`);
    console.log(`${colors.cyan}========================================${colors.reset}`);
    console.log('');

    if (!VERCEL_TOKEN) {
        log.error('VERCEL_TOKEN not found!');
        log.info('Set it: $env:VERCEL_TOKEN="your_token"');
        process.exit(1);
    }

    log.success('Vercel token found');
    console.log('');

    try {
        const project = await getProject();
        console.log('');

        log.info(`Auto-setting ${ENV_VARS.length} environment variables...`);
        console.log('');

        let successCount = 0;
        let failCount = 0;

        for (const envVar of ENV_VARS) {
            const success = await setEnvVar(project.id, envVar);
            if (success) successCount++;
            else failCount++;
        }

        console.log('');
        console.log(`${colors.cyan}========================================${colors.reset}`);
        console.log('');
        log.info(`Results: ${successCount}/${ENV_VARS.length} succeeded, ${failCount}/${ENV_VARS.length} failed`);
        console.log('');

        if (failCount === 0) {
            log.success('🎉 All environment variables set successfully!');
            console.log('');
            log.info('Next step: Redeploy your project');
            log.gray('  vercel --prod');
            log.gray('  OR via dashboard: https://vercel.com/kendo260599s-projects/soulfriend');
        } else {
            log.warning('Some variables failed. Manual setup may be needed.');
        }

        console.log('');
        log.success('✨ Done!');
        console.log('');

    } catch (error) {
        console.log('');
        log.error(`Error: ${error.message}`);
        console.log('');
        process.exit(1);
    }
}

main().catch(err => {
    log.error(`Unexpected error: ${err.message}`);
    process.exit(1);
});

