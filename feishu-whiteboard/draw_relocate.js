const { addNodes } = require('./draw');

// Minimal Node (Proven Working)
function createNode(text, x, y, color) {
    return {
        "type": "composite_shape",
        "composite_shape": { "type": "round_rect" },
        "x": x,
        "y": y,
        "width": 160,
        "height": 80,
        "style": { "fill_color": color, "fill_opacity": 100 },
        "text": { "text": text, "font_size": 14, "horizontal_align": "center" }
    };
}

function createArrow(x1, y1, x2, y2) {
    return {
        "type": "connector",
        "connector": {
            "start": { "position": { "x": x1, "y": y1 } },
            "end": { "position": { "x": x2, "y": y2 }, "arrow_style": "triangle_arrow" }
        }
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
    
    // Target Coordinates (Near the massive object o8:3 at 26720, 83320)
    // We will place it slightly to the right and top
    const startX = 26800; 
    const startY = 83400; 
    const gap = 300;

    const nodes = [
        createNode("📱 App", startX, startY, "#bae7ff"),
        createNode("☁️ Cloud", startX + gap, startY, "#d9f7be"),
        createNode("📛 Badge", startX + gap * 2, startY, "#efdbff"),
        
        createArrow(startX + 160, startY + 40, startX + gap, startY + 40),
        createArrow(startX + gap + 160, startY + 40, startX + gap * 2, startY + 40)
    ];

    try {
        console.log(`Relocating to Giant's Shoulder (${startX}, ${startY})...`);
        await addNodes(boardId, nodes);
        console.log("Success!");
    } catch (e) {
        console.error("Fail:", e.message);
    }
}

main();
