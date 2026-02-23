const { execSync } = require('child_process');
const path = require('path');
const fs = require('fs');

// SELF REPAIR MODULE
// Triggered when gitSync fails critically.
// Attempts to restore a clean state.

const WORKSPACE_ROOT = path.resolve(__dirname, '../../');

function log(msg) {
    console.log(`[SelfRepair] ${msg}`);
}

function run() {
    log('Starting Emergency Git Repair...');
    
    try {
        // 1. Abort any pending rebase
        try {
            execSync('git rebase --abort', { cwd: WORKSPACE_ROOT, stdio: 'ignore' });
            log('Aborted pending rebase.');
        } catch (e) {}

        // 2. Abort any pending merge
        try {
            execSync('git merge --abort', { cwd: WORKSPACE_ROOT, stdio: 'ignore' });
            log('Aborted pending merge.');
        } catch (e) {}

        // 3. Check status
        const status = execSync('git status --porcelain', { cwd: WORKSPACE_ROOT }).toString();
        log(`Current status:\n${status}`);

        // 4. If index.lock exists, remove it (dangerous but necessary for unattended recovery)
        const lockFile = path.join(WORKSPACE_ROOT, '.git/index.lock');
        if (fs.existsSync(lockFile)) {
            // Check file age. If > 10 mins, delete it.
            const stats = fs.statSync(lockFile);
            const ageMinutes = (Date.now() - stats.mtimeMs) / 1000 / 60;
            if (ageMinutes > 10) {
                log(`Removing stale index.lock (${ageMinutes.toFixed(1)}m old)...`);
                fs.unlinkSync(lockFile);
            }
        }

        // 5. Hard Reset (Last Resort)? NO. That loses work.
        // Instead, we just try to fetch and let the next cycle handle it.
        execSync('git fetch origin main', { cwd: WORKSPACE_ROOT });
        log('Fetched origin main.');

    } catch (err) {
        log(`Repair failed: ${err.message}`);
        // Do NOT process.exit here -- this would kill the wrapper daemon.
    }
}

if (require.main === module) {
    run();
}

module.exports = { run };
