const CalendarManager = require('./lib/CalendarManager');

/**
 * Feishu Calendar Skill
 * 
 * Main entry point for programmatic usage and CLI dispatch.
 */

// Export the CalendarManager class for use by other skills
exports.CalendarManager = CalendarManager;

// Export a default instance for convenience
exports.defaultManager = new CalendarManager();

// CLI Dispatcher
if (require.main === module) {
  const args = process.argv.slice(2);
  const command = args[0];

  if (!command || command === '--help' || command === '-h') {
    console.log(`
Feishu Calendar Skill

Usage:
  node skills/feishu-calendar [command] [options]

Commands:
  list        List calendars
  check       Check upcoming events (default: 24h)
  sync        Sync events to memory/HEARTBEAT.md
  search      Search for a calendar by name
  help        Show this help message

Examples:
  node skills/feishu-calendar check --hours 48
  node skills/feishu-calendar sync
    `);
    process.exit(0);
  }

  // Dispatch to existing scripts based on command
  const scriptMap = {
    'list': './list_test.js',
    'check': './check.js',
    'sync': './sync.js', // or sync_routine.js
    'search': './search_cal.js'
  };

  if (scriptMap[command]) {
    // Forward arguments to the script
    // We can require the script if it exports a main function, 
    // but these scripts seem designed to run on import or top-level await.
    // Given they are legacy scripts, using child_process.spawn might be safer to preserve their env,
    // OR we can try to require them if we know they are safe.
    // 'check.js' runs on load. 'sync.js' runs on load.
    // So requiring them is the way to go.
    
    // Adjust process.argv so the script sees the right args
    // Remove the command name from args
    process.argv.splice(2, 1); 
    
    try {
      require(scriptMap[command]);
    } catch (e) {
      console.error(`Failed to execute command '${command}':`, e);
      process.exit(1);
    }
  } else {
    console.error(`Unknown command: ${command}`);
    console.error(`Run with --help for usage.`);
    process.exit(1);
  }
}
