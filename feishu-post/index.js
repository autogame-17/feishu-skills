const { sendPost, sendCard, sendText } = require('../feishu-common/index.js'); // Assuming these are exported or I need to import relevant skills

async function main() {
    const args = require('minimist')(process.argv.slice(2));
    const title = args.title || 'Notification';
    const text = args.text || '';
    const target = args.target;

    if (!target) {
        console.error('Error: --target is required');
        process.exit(1);
    }

    // Attempt 1: Feishu Post (Rich Text)
    try {
        const lines = text.split('\\n');
        const content = [
            lines.map(line => ({
                tag: 'text',
                text: line
            }))
        ];
        const postContent = {
            zh_cn: {
                title: title,
                content: content
            }
        };
        const result = await sendPost(target, postContent);
        console.log(JSON.stringify(result, null, 2));
        return;
    } catch (error) {
        console.warn(`[FeishuPost] Post failed: ${error.message}. Attempting fallback to Card...`);
    }

    // Attempt 2: Feishu Card (Interactive)
    try {
        // Simple card structure
        const cardContent = {
            header: { title: { tag: 'plain_text', content: title } },
            elements: [
                { tag: 'div', text: { tag: 'lark_md', content: text.replace(/\\n/g, '\n') } }
            ]
        };
        // Need to ensure sendCard is available
        const result = await sendCard(target, cardContent);
        console.log(JSON.stringify(result, null, 2));
        return;
    } catch (error) {
        console.warn(`[FeishuPost] Card fallback failed: ${error.message}. Attempting fallback to Plain Text...`);
    }

    // Attempt 3: Plain Text (Last Resort)
    try {
        const plainText = `${title}\n\n${text.replace(/\\n/g, '\n')}`;
        const result = await sendText(target, plainText); // Assuming sendText helper exists
        console.log(JSON.stringify(result, null, 2));
    } catch (error) {
        console.error(`[FeishuPost] All delivery methods failed. Last error: ${error.message}`);
        process.exit(1);
    }
}

if (require.main === module) {
    main();
}
