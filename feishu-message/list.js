const lark = require('@larksuiteoapi/node-sdk');
const { program } = require('commander');

// Initialize client
const client = new lark.Client({
    appId: process.env.FEISHU_APP_ID,
    appSecret: process.env.FEISHU_APP_SECRET,
    disableTokenCache: false
});

program
    .description('List messages in a chat')
    .requiredOption('-c, --chat-id <id>', 'Chat ID (oc_...)')
    .option('-l, --limit <number>', 'Number of messages to fetch', '20')
    .parse(process.argv);

const options = program.opts();

async function main() {
    try {
        console.log(`Listing messages in chat ${options.chatId}...`);
        
        const res = await client.im.message.list({
            params: {
                container_id_type: 'chat',
                container_id: options.chatId,
                page_size: parseInt(options.limit),
                // sort_type removed
            },
        });

        if (res.code === 0) {
            const items = res.data.items || [];
            console.log(`Found ${items.length} messages.`);
            items.reverse().forEach(msg => { // Show oldest to newest
                const senderName = msg.sender && msg.sender.sender_id ? msg.sender.sender_id.user_id : 'Unknown'; // Simplified
                let contentText = 'Content parsing failed';
                try {
                    const content = JSON.parse(msg.body.content);
                    contentText = content.text || '[Rich/Media Content]';
                } catch (e) {
                    contentText = msg.body.content; 
                }
                console.log(`[${msg.message_id}] [${msg.create_time}] ${contentText}`);
            });
        } else {
            console.error('Failed to list messages:', res);
            process.exit(1);
        }
    } catch (err) {
        console.error('Error:', err.message);
        if (err.response) {
            console.error('Response:', err.response.data);
        }
        process.exit(1);
    }
}

main();
