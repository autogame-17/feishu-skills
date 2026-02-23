const { addNodes } = require('./draw');

// Fallback to Coordinate-based Arrows if ID linking fails (Code 2890002 often means invalid connection)
function createNode(id, text, x, y, color) {
    return {
        "id": id,
        "type": "composite_shape",
        "composite_shape": { "type": "round_rect" },
        "x": x,
        "y": y,
        "width": 180,
        "height": 90,
        "style": { "fill_color": color, "fill_opacity": 100 },
        "text": { "text": text, "font_size": 14, "horizontal_align": "center" }
    };
}

function createCoordArrow(x1, y1, x2, y2) {
    return {
        "type": "connector",
        "connector": {
            "start": { "position": { "x": x1, "y": y1 } },
            "end": { "position": { "x": x2, "y": y2 }, "arrow_style": "triangle_arrow" },
            "shape": "elbow"
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
    const nodes = [];
    
    // Colors
    const C_USER = "#ffffff"; 
    const C_APP = "#bae7ff";  
    const C_CLOUD = "#d9f7be"; 
    const C_BADGE = "#efdbff"; 

    // Define positions
    // Node center is (x + width/2, y + height/2)
    // w=180, h=90. Center offset (+90, +45).
    
    const p1 = {x: 0, y: 0};
    const p2 = {x: 300, y: 0};
    const p3 = {x: 600, y: 0};
    const p4 = {x: 900, y: 0};
    
    const p5 = {x: 300, y: 300};
    const p6 = {x: 600, y: 300};
    const p7 = {x: 900, y: 300};
    
    const p8 = {x: 1200, y: 150};
    const p9 = {x: 1500, y: 150};
    const p10 = {x: 1800, y: 150};
    const p11 = {x: 2100, y: 150};

    // Nodes
    nodes.push(createNode("n1", "📦 用户: 撕开激活码\n下载 App", p1.x, p1.y, C_USER));
    nodes.push(createNode("n2", "📱 App: 输入激活码\n认证成功", p2.x, p2.y, C_APP));
    nodes.push(createNode("n3", "🎨 User: 创建角色\n(捏脸/设定)", p3.x, p3.y, C_USER));
    nodes.push(createNode("n4", "☁️ Cloud: 工作流生成\n(图/视/音)", p4.x, p4.y, C_CLOUD));
    
    nodes.push(createNode("n5", "📛 Badge: 开机 & 配网\n(连接WiFi)", p5.x, p5.y, C_BADGE));
    nodes.push(createNode("n6", "📛 Badge: 生成信任码\n(Trust Code)", p6.x, p6.y, C_BADGE));
    nodes.push(createNode("n7", "📱 App: 输入信任码\n(需同WiFi)", p7.x, p7.y, C_APP));
    
    nodes.push(createNode("n8", "📤 App: 上传“灵魂包”\n(Inject Soul)", p8.x, p8.y, C_APP));
    nodes.push(createNode("n9", "🔄 Badge: 转圈圈\n(接收/加载)", p9.x, p9.y, C_BADGE));
    nodes.push(createNode("n10", "✨ Badge: 待机展示\n(周期性动作)", p10.x, p10.y, C_BADGE));
    nodes.push(createNode("n11", "👆 User: 触屏互动\n(激活反馈)", p11.x, p11.y, C_USER));

    // Connectors (Center-to-Center approximation or Edge-to-Edge)
    // Left-Right: (x + 180, y + 45) -> (next_x, next_y + 45)
    
    const h = 45; // half height
    const w = 180; // width
    
    nodes.push(createCoordArrow(p1.x + w, p1.y + h, p2.x, p2.y + h));
    nodes.push(createCoordArrow(p2.x + w, p2.y + h, p3.x, p3.y + h));
    nodes.push(createCoordArrow(p3.x + w, p3.y + h, p4.x, p4.y + h));
    
    nodes.push(createCoordArrow(p5.x + w, p5.y + h, p6.x, p6.y + h));
    nodes.push(createCoordArrow(p6.x + w, p6.y + h, p7.x, p7.y + h));
    
    // Merge: n4 -> n8 (Diagonal down)
    nodes.push(createCoordArrow(p4.x + w, p4.y + h, p8.x, p8.y + h));
    // Merge: n7 -> n8 (Diagonal up)
    nodes.push(createCoordArrow(p7.x + w, p7.y + h, p8.x, p8.y + h));
    
    nodes.push(createCoordArrow(p8.x + w, p8.y + h, p9.x, p9.y + h));
    nodes.push(createCoordArrow(p9.x + w, p9.y + h, p10.x, p10.y + h));
    nodes.push(createCoordArrow(p10.x + w, p10.y + h, p11.x, p11.y + h));

    try {
        console.log("Drawing Full User Story (Safe Mode)...");
        await addNodes(boardId, nodes);
        console.log("Success!");
    } catch (e) {
        console.error("Fail:", e.message);
    }
}

main();
