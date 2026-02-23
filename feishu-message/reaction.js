const lark = require('@larksuiteoapi/node-sdk');
const { program } = require('commander');

// Initialize client
const client = new lark.Client({
    appId: process.env.FEISHU_APP_ID,
    appSecret: process.env.FEISHU_APP_SECRET,
    disableTokenCache: false
});

program
    .description('Add a reaction to a Feishu message')
    .requiredOption('-m, --message-id <id>', 'Message ID to react to')
    .option('-t, --type <type>', 'Reaction type (e.g., THUMBSUP, HEART, LAUGH)', 'THUMBSUP')
    .option('-d, --delete', 'Delete reaction instead of adding', false)
    .parse(process.argv);

const options = program.opts();

async function main() {
    try {
        const emojiType = options.type.toUpperCase();
        
        if (options.delete) {
            // Get reaction ID first (requires listing reactions) - simpler to just implement add for now as delete needs reaction_id
             console.error('Delete not implemented in this simple script yet.');
             process.exit(1);
        } else {
            console.log(`Adding reaction ${emojiType} to message ${options.messageId}...`);
            
            const res = await client.im.messageReaction.create({
                path: {
                    message_id: options.messageId,
                },
                data: {
                    reaction_type: {
                        emoji_type: emojiType,
                    },
                },
            });

            if (res.code === 0) {
                console.log(`Successfully added reaction: ${emojiType}`);
            } else {
                console.error('Failed to add reaction:', res);
                process.exit(1);
            }
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
