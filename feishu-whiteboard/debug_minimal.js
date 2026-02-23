const { addNodes } = require('./draw');

// Minimalist Node (Stripped down to absolute basics)
function createMinimalNode(text, x, y) {
    return {
        "type": "composite_shape",
        "composite_shape": { "type": "rect" },
        "x": x,
        "y": y,
        "width": 100,
        "height": 50,
        // Omit style and text details if possible, or use defaults
        "text": { "text": text }
    };
}

function getBoardId() {
    const fromEnv = process.env.FEISHU_WHITEBOARD_ID;
    const fromArg = process.argv.find(a => a.startsWith('--board-id='))?.split('=')[1]
        || (process.argv.includes('--board-id') && process.argv[process.argv.indexOf('--board-id') + 1]);
    const id = fromEnv || fromArg;
    if (!id) {
        console.error('Error: FEISHU_WHITEBOARD_ID env var or --board-id argument required');
        process.exit(1);
    }
    return id;
}

async function main() {
    const boardId = getBoardId();
    const nodes = [ createMinimalNode("Minimal Test", 2500, 8500) ];
    try {
        await addNodes(boardId, nodes);
        console.log("Minimal Success");
    } catch (e) {
        console.error("Minimal Fail:", e.message);
    }
}
main();
