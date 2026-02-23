const { program } = require('commander');
const { fetchWithAuth, getToken } = require('../feishu-common/index.js');

// --- Helper: Bitable API ---

async function listRecords(appToken, tableId, viewId = null, limit = 20) {
    let url = `https://open.feishu.cn/open-apis/bitable/v1/apps/${appToken}/tables/${tableId}/records?page_size=${limit}`;
    if (viewId) url += `&view_id=${viewId}`;
    
    const res = await fetchWithAuth(url);
    const data = await res.json();
    if (data.code !== 0) throw new Error(`List failed: ${data.msg}`);
    return data.data.items || [];
}

async function addRecord(appToken, tableId, fields) {
    const url = `https://open.feishu.cn/open-apis/bitable/v1/apps/${appToken}/tables/${tableId}/records`;
    const res = await fetchWithAuth(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ fields })
    });
    const data = await res.json();
    if (data.code !== 0) throw new Error(`Add failed: ${data.msg}`);
    return data.data.record;
}

// --- Smart Formatter ---

function formatRecords(records) {
    if (!records.length) return "No records found.";
    
    // Auto-detect key fields based on common names
    // Priority: Title > Priority > Status > Assignee
    const fieldMap = {
        title: ['需求', 'Title', 'Name', '任务名称', 'Task'],
        priority: ['优先级', 'Priority', 'P'],
        status: ['状态', 'Status', 'Stage'],
        assignee: ['责任人', 'Assignee', 'Owner', '开发执行人员']
    };

    // Find actual field names
    const sample = records[0].fields;
    const keys = Object.keys(sample);
    
    const map = {};
    for (const [key, candidates] of Object.entries(fieldMap)) {
        map[key] = candidates.find(c => keys.includes(c));
    }

    const headers = ['ID', 'Title', 'Priority', 'Status', 'Assignee'].filter(h => 
        h === 'ID' || map[h.toLowerCase()]
    );

    let md = `| ${headers.join(' | ')} |\n| ${headers.map(() => '---').join(' | ')} |\n`;

    for (const r of records) {
        const row = [r.record_id];
        if (map.title) row.push(String(r.fields[map.title] || '').substring(0, 30));
        if (map.priority) row.push(String(r.fields[map.priority] || ''));
        if (map.status) row.push(String(r.fields[map.status] || ''));
        if (map.assignee) {
             // Handle User object (usually an array of objects)
             const val = r.fields[map.assignee];
             if (Array.isArray(val)) {
                 row.push(val.map(u => u.name || u.id).join(', '));
             } else {
                 row.push(String(val || ''));
             }
        }
        md += `| ${row.join(' | ')} |\n`;
    }
    return md;
}

// --- CLI ---

program
    .command('list')
    .description('List records from a Bitable')
    .requiredOption('--app <token>', 'App Token (bitable token)')
    .requiredOption('--table <id>', 'Table ID')
    .option('--view <id>', 'View ID')
    .option('--limit <n>', 'Limit', 20)
    .option('--json', 'Output raw JSON')
    .action(async (opts) => {
        try {
            const records = await listRecords(opts.app, opts.table, opts.view, opts.limit);
            if (opts.json) {
                console.log(JSON.stringify(records, null, 2));
            } else {
                console.log(formatRecords(records));
            }
        } catch (e) {
            console.error(e.message);
            process.exit(1);
        }
    });

program
    .command('add')
    .description('Add a task/record')
    .requiredOption('--app <token>', 'App Token')
    .requiredOption('--table <id>', 'Table ID')
    .requiredOption('--title <text>', 'Task Title')
    .option('--desc <text>', 'Description')
    .option('--content <text>', 'Content (alias for --desc)')
    .option('--priority <text>', 'Priority (e.g. "Important")')
    .action(async (opts) => {
        try {
            // Alias mapping
            if (opts.content && !opts.desc) opts.desc = opts.content;

            // Hardcoded mapping for "Iter 11" style for now, but extensible
            const fields = {
                '需求': opts.title
            };
            if (opts.desc) fields['需求详述'] = opts.desc;
            if (opts.priority) fields['优先级'] = opts.priority;

            const rec = await addRecord(opts.app, opts.table, fields);
            console.log(`Created Record: ${rec.record_id}`);
        } catch (e) {
            console.error(e.message);
            process.exit(1);
        }
    });

program.parse(process.argv);
