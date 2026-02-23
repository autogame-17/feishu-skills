const { program } = require('commander');
const { listFiles, getFileInfo, createFolder, moveFile, deleteFile } = require('./lib/api');

program
  .option('--action <action>', 'Action: list, info, create_folder, move, delete')
  .option('--file_token <token>', 'File or folder token')
  .option('--folder_token <token>', 'Parent folder token')
  .option('--name <name>', 'Name for create_folder')
  .option('--type <type>', 'File type (doc, sheet, folder, etc.)')
  .parse(process.argv);

const options = program.opts();

async function main() {
  try {
    const { action, file_token, folder_token, name, type } = options;

    if (!action) {
      throw new Error("Missing required argument: --action");
    }

    let result;
    switch (action) {
      case 'list':
        result = await listFiles(folder_token, null);
        break;
      case 'info':
        if (!file_token) throw new Error("Missing --file_token for info");
        result = await getFileInfo(file_token);
        break;
      case 'create_folder':
        if (!name) throw new Error("Missing --name for create_folder");
        result = await createFolder(name, folder_token);
        break;
      case 'move':
        if (!file_token || !folder_token) throw new Error("Missing --file_token or --folder_token for move");
        result = await moveFile(file_token, folder_token);
        break;
      case 'delete':
        if (!file_token) throw new Error("Missing --file_token for delete");
        result = await deleteFile(file_token, type);
        break;
      default:
        throw new Error(`Unknown action: ${action}`);
    }

    console.log(JSON.stringify({ status: "success", data: result }, null, 2));

  } catch (error) {
    console.error(JSON.stringify({ status: "error", message: error.message }, null, 2));
    process.exit(1);
  }
}

main();
