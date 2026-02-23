const path = require('path');
const CalendarManager = require('../feishu-calendar/lib/CalendarManager');
const { readDoc } = require('../feishu-doc/index.js');
const { getTimestampCST } = require('../time-helper');
const { fetchWithAuth } = require('../feishu-common/index.js'); // Use common directly

// Config
const LOOKAHEAD_HOURS = 24;
const TARGET_CALENDAR_KEYWORD = 'Master';

async function checkAndSummarize() {
    const manager = new CalendarManager();
    const calendar = await manager.getCalendar(TARGET_CALENDAR_KEYWORD);

    if (!calendar) {
        console.error('Calendar not found.');
        return;
    }

    console.log(`Scanning calendar: ${calendar.summary}`);
    const now = Date.now();
    const endTime = now + LOOKAHEAD_HOURS * 3600 * 1000;
    
    const events = await manager.listEvents(calendar.calendar_id, now, endTime, 50);
    console.log(`Found ${events.length} upcoming events.`);

    for (const event of events) {
        const desc = event.description || '';
        const docLinks = extractDocLinks(desc);

        if (docLinks.length > 0) {
            console.log(`Event [${event.summary}] has ${docLinks.length} docs.`);
            
            let summaries = [];
            for (const link of docLinks) {
                try {
                    console.log(`  Fetching doc: ${link.token}`);
                    const docData = await readDoc(link.token);
                    const preview = extractPreview(docData.content);
                    summaries.push(`📄 **${docData.title || 'Untitled'}**\n${preview}`);
                } catch (e) {
                    console.error(`  Failed to read doc ${link.token}: ${e.message}`);
                    summaries.push(`❌ Failed to load doc: ${link.token}`);
                }
            }

            // Send Briefing Card
            if (summaries.length > 0) {
                await sendBriefingCard(event, summaries);
            }
        }
    }
}

function extractDocLinks(text) {
    const regex = /(?:https:\/\/[\w-]+\.feishu\.cn)?\/(docx|doc|sheet|bitable|wiki)\/([a-zA-Z0-9]+)/g;
    const links = [];
    let match;
    while ((match = regex.exec(text)) !== null) {
        links.push({ type: match[1], token: match[2], url: match[0] });
    }
    return links;
}

function extractPreview(content) {
    if (!content) return '(Empty content)';
    // Simple preview: first 300 chars, preserving some structure
    let preview = content.substring(0, 300).replace(/\n/g, ' ');
    if (content.length > 300) preview += '...';
    return preview;
}

async function sendBriefingCard(event, docSummaries) {
    const timeStr = getTimestampCST(event.start_time.timestamp * 1000);
    
    // Construct Card JSON
    const cardContent = {
        config: { wide_screen_mode: true },
        header: {
            title: { tag: 'plain_text', content: '📅 Meeting Briefing' },
            template: 'blue'
        },
        elements: [
            {
                tag: 'div',
                text: {
                    tag: 'lark_md',
                    content: `**${event.summary}**\n🕒 ${timeStr}\n\n${docSummaries.join('\n\n')}`
                }
            },
            {
                tag: 'action',
                actions: [
                    {
                        tag: 'button',
                        text: { tag: 'plain_text', content: 'Open Calendar' },
                        url: `https://feishu.cn/calendar/event/${event.event_id}`,
                        type: 'primary'
                    }
                ]
            }
        ]
    };

    // Target Resolution
    const target = process.env.FEISHU_MASTER_ID;
    if (!target) { console.error('Error: FEISHU_MASTER_ID not set'); process.exit(1); }
    let receiveIdType = 'open_id';
    if (target.startsWith('oc_')) receiveIdType = 'chat_id';

    console.log(`Sending briefing to ${target}...`);

    try {
        const res = await fetchWithAuth(
            `https://open.feishu.cn/open-apis/im/v1/messages?receive_id_type=${receiveIdType}`,
            {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    receive_id: target,
                    msg_type: 'interactive',
                    content: JSON.stringify(cardContent)
                })
            }
        );
        const data = await res.json();
        if (data.code !== 0) throw new Error(data.msg);
        console.log('Briefing sent.');
    } catch (e) {
        console.error('Failed to send card:', e.message);
    }
}

// Run
if (require.main === module) {
    checkAndSummarize().catch(console.error);
}

module.exports = { checkAndSummarize };
