const common = require('../feishu-common');

/**
 * Feishu Permission Management Skill
 * Manage collaborators and permissions for Drive files/docs/wikis.
 * 
 * Actions:
 * - add: Add a collaborator (user/chat/group) with role.
 * - remove: Remove a collaborator.
 * - list: List collaborators.
 * - update: Update a collaborator's role.
 * - public: Update public link settings (link_share_entity).
 * 
 * Usage:
 * node skills/feishu-perm/index.js --action add --token "file_token" --type "file" --member_id "ou_xxx" --member_type "user" --perm "view"
 */

async function main(opts = {}) {
  // Parse args if running from CLI
  if (!opts.action && process.argv[1] === __filename) {
    const args = require('minimist')(process.argv.slice(2));
    opts = args;
  }

  const {
    action, // add, remove, list, update, public
    token,  // file_token or doc_token or wiki_token
    type,   // doc, sheet, file, wiki, bitable, folder (default: doc)
    member_id, // user_id or open_id or chat_id
    member_type, // user, chat, department, group (default: user)
    perm,   // view, edit, full_access (default: view)
    link_share_entity, // tenant_readable, tenant_editable, anyone_readable, anyone_editable, closed
    notify, // true/false (send notification)
  } = opts;

  if (!action) {
    console.error('Error: --action is required (add, remove, list, update, public)');
    process.exit(1);
  }
  if (!token) {
    console.error('Error: --token is required');
    process.exit(1);
  }

  const client = await common.getClient();
  const fileType = type || 'doc'; // Default to doc

  try {
    let result;
    
    switch (action) {
      case 'add':
        if (!member_id) throw new Error('--member_id is required for add');
        result = await client.im.drive.v1.permission.member.create({
          token,
          type: fileType,
          member_type: member_type || 'user',
          member_id,
          perm: perm || 'view',
          notify: notify === 'true' || notify === true
        });
        break;

      case 'remove':
        if (!member_id) throw new Error('--member_id is required for remove');
        // Need to find member first to get member_id (which is different from user_id in perm API?)
        // Actually, the API takes member_id and member_type in the body for delete?
        // Wait, delete endpoint is DELETE /drive/v1/permissions/:token/members/:member_id?type=...
        // But here member_id is the PERMISSION member_id, not the user_id.
        // So we must LIST first to find the permission member_id for the user.
        
        // 1. List members
        const members = await client.im.drive.v1.permission.member.list({
          token,
          type: fileType
        });
        
        // 2. Find target
        const target = members.data.members.find(m => m.member_id === member_id || m.member_open_id === member_id);
        if (!target) throw new Error(`Member ${member_id} not found in permission list.`);
        
        result = await client.im.drive.v1.permission.member.delete({
          token,
          type: fileType,
          member_id: target.member_id,
          member_type: target.member_type
        });
        break;

      case 'list':
        result = await client.im.drive.v1.permission.member.list({
          token,
          type: fileType
        });
        break;

      case 'update':
        if (!member_id) throw new Error('--member_id is required for update');
        
        // Same logic: find member object first
        const listForUpdate = await client.im.drive.v1.permission.member.list({
          token,
          type: fileType
        });
        const targetUpdate = listForUpdate.data.members.find(m => m.member_id === member_id || m.member_open_id === member_id);
        if (!targetUpdate) throw new Error(`Member ${member_id} not found.`);

        result = await client.im.drive.v1.permission.member.update({
          token,
          type: fileType,
          member_id: targetUpdate.member_id,
          perm: perm || 'view',
          member_type: targetUpdate.member_type
        });
        break;

      case 'public':
        if (!link_share_entity) throw new Error('--link_share_entity is required (tenant_readable, etc)');
        result = await client.im.drive.v1.permission.public.update({
          token,
          type: fileType,
          link_share_entity
        });
        break;

      default:
        throw new Error(`Unknown action: ${action}`);
    }

    console.log(JSON.stringify(result, null, 2));
    return result;

  } catch (err) {
    console.error(`Feishu Perm Error: ${err.message}`);
    // console.error(err);
    process.exit(1);
  }
}

// Export for require
module.exports = { main };

// Run if called directly
if (require.main === module) {
  main();
}
