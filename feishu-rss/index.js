#!/usr/bin/env node
const { program } = require('commander');
const fs = require('fs');
const path = require('path');
const Parser = require('rss-parser');
const { execSync } = require('child_process');

// Configuration
const FEEDS_FILE = path.join(__dirname, 'feeds.json');
const HISTORY_FILE = path.join(__dirname, '../../memory/rss_history.json');
const FEISHU_SEND_Script = path.join(__dirname, '../feishu-card/send.js');

const parser = new Parser({
    timeout: 10000,
    headers: { 'User-Agent': 'OpenClaw-Feishu-RSS/1.0' }
});

// Load/Save functions
function loadFeeds() {
    if (!fs.existsSync(FEEDS_FILE)) return [];
    return JSON.parse(fs.readFileSync(FEEDS_FILE, 'utf8'));
}

function saveFeeds(feeds) {
    fs.writeFileSync(FEEDS_FILE, JSON.stringify(feeds, null, 2));
}

function loadHistory() {
    if (!fs.existsSync(HISTORY_FILE)) return {};
    return JSON.parse(fs.readFileSync(HISTORY_FILE, 'utf8'));
}

function saveHistory(history) {
    fs.writeFileSync(HISTORY_FILE, JSON.stringify(history, null, 2));
}

// Helper: Send Feishu Card
function sendFeishuCard(target, title, text, url, color = 'blue') {
    if (!fs.existsSync(FEISHU_SEND_Script)) {
        console.error('Error: feishu-card skill not found.');
        return;
    }
    
    // Create temp file for text content to avoid shell escaping issues
    const tmpFile = path.join('/tmp', `rss_msg_${Date.now()}.md`);
    fs.writeFileSync(tmpFile, text);

    try {
        let cmd = `node "${FEISHU_SEND_Script}" --title "${title}" --text-file "${tmpFile}" --color "${color}"`;
        if (target) cmd += ` --target "${target}"`;
        // Add button if URL provided
        if (url) cmd += ` --button-text "Read More" --button-url "${url}"`;
        
        execSync(cmd, { stdio: 'inherit' });
    } catch (e) {
        console.error('Failed to send card:', e.message);
    } finally {
        if (fs.existsSync(tmpFile)) fs.unlinkSync(tmpFile);
    }
}

// Commands
program
    .name('feishu-rss')
    .description('Manage RSS feeds and push updates to Feishu')
    .option('--content <text>', 'Dummy content option for compatibility');

program.command('add <url>')
    .description('Add a new RSS feed subscription')
    .option('-n, --name <name>', 'Feed name')
    .option('-t, --target <target>', 'Target Feishu ID (user/group)')
    .action(async (url, options) => {
        try {
            const feed = await parser.parseURL(url);
            const feeds = loadFeeds();
            
            // Generate unique ID
            const id = Math.random().toString(36).substr(2, 6);
            
            const newFeed = {
                id,
                url,
                name: options.name || feed.title || 'Untitled Feed',
                target: options.target || null, // If null, check sends to default or requires manual target
                addedAt: new Date().toISOString()
            };
            
            feeds.push(newFeed);
            saveFeeds(feeds);
            console.log(`✅ Added feed: ${newFeed.name} (${url}) [ID: ${id}]`);
        } catch (e) {
            console.error(`❌ Failed to add feed: ${e.message}`);
        }
    });

program.command('list')
    .description('List all subscribed feeds')
    .action(() => {
        const feeds = loadFeeds();
        if (feeds.length === 0) {
            console.log('No feeds subscribed.');
            return;
        }
        console.log('📋 Subscribed Feeds:');
        feeds.forEach(f => {
            console.log(`- [${f.id}] ${f.name} (${f.url}) -> ${f.target || 'Default'}`);
        });
    });

program.command('remove <id>')
    .description('Remove a feed by ID')
    .action((id) => {
        let feeds = loadFeeds();
        const initialLen = feeds.length;
        feeds = feeds.filter(f => f.id !== id);
        if (feeds.length < initialLen) {
            saveFeeds(feeds);
            console.log(`✅ Removed feed ID: ${id}`);
        } else {
            console.error(`❌ Feed ID not found: ${id}`);
        }
    });

program.command('check')
    .description('Check all feeds for new items')
    .option('--force', 'Force send even if seen')
    .action(async (options) => {
        const feeds = loadFeeds();
        if (feeds.length === 0) return;

        const history = loadHistory();
        let newItemsCount = 0;

        console.log(`🔍 Checking ${feeds.length} feeds...`);

        for (const feed of feeds) {
            try {
                const parsed = await parser.parseURL(feed.url);
                const feedHistory = history[feed.id] || [];
                const seenGuids = new Set(feedHistory);
                
                // Get items from last 24h
                const now = new Date();
                const oneDayAgo = new Date(now - 24 * 60 * 60 * 1000);
                
                const newItems = parsed.items.filter(item => {
                    const pubDate = item.pubDate ? new Date(item.pubDate) : new Date(); // Fallback to now if no date
                    const guid = item.guid || item.link || item.title; // Unique ID
                    return !seenGuids.has(guid) && (options.force || pubDate > oneDayAgo);
                });

                if (newItems.length > 0) {
                    console.log(`Found ${newItems.length} new items in ${feed.name}`);
                    
                    // Send each item (or batch digest?)
                    // For now, send individual cards for immediacy, but maybe batch if >3
                    // Let's send top 3 to avoid spam
                    const toSend = newItems.slice(0, 3);
                    
                    for (const item of toSend) {
                        const title = `📢 ${feed.name}: ${item.title}`;
                        // Cleanup description (remove HTML tags for basic text preview)
                        let desc = (item.contentSnippet || item.content || '').substring(0, 200);
                        if (desc.length === 200) desc += '...';
                        
                        const text = `**${item.title}**\n\n${desc}\n\n[Link](${item.link})`;
                        
                        // Send card
                        sendFeishuCard(feed.target, title, text, item.link, 'blue');
                        
                        // Mark as seen
                        const guid = item.guid || item.link || item.title;
                        feedHistory.push(guid);
                        newItemsCount++;
                    }
                    
                    // Update history for this feed
                    // Keep last 100 items to prevent unlimited growth
                    history[feed.id] = feedHistory.slice(-100);
                }
            } catch (e) {
                console.error(`Failed to check feed ${feed.name}: ${e.message}`);
            }
        }
        
        saveHistory(history);
        console.log(`Done. Sent ${newItemsCount} updates.`);
    });

program.parse(process.argv);
