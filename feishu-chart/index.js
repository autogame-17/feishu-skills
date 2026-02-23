#!/usr/bin/env node
const fs = require('fs-extra');
const path = require('path');
const axios = require('axios');
const { program } = require('commander');
const { execSync } = require('child_process');

program
  .version('1.0.0')
  .option('-t, --target <id>', 'Target Feishu ID (User open_id or Group chat_id)')
  .option('-d, --data <json>', 'Chart data JSON (Chart.js format)')
  .option('-f, --file <path>', 'Path to JSON data file')
  .option('--title <text>', 'Chart title', 'Data Visualization')
  .option('--type <type>', 'Chart type (bar, line, pie, radar)', 'bar')
  .option('--width <pixels>', 'Image width', 500)
  .option('--height <pixels>', 'Image height', 300)
  .option('--test', 'Generate test chart without sending')
  .parse(process.argv);

const options = program.opts();

async function generateChart() {
  let chartConfig;

  // 1. Load Data
  if (options.data) {
    try {
      chartConfig = JSON.parse(options.data);
    } catch (e) {
      console.error('Error parsing JSON data:', e.message);
      process.exit(1);
    }
  } else if (options.file) {
    try {
      const content = fs.readFileSync(options.file, 'utf8');
      chartConfig = JSON.parse(content);
    } catch (e) {
      console.error('Error reading data file:', e.message);
      process.exit(1);
    }
  } else {
    // Default test data
    chartConfig = {
      type: options.type,
      data: {
        labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May'],
        datasets: [{
          label: 'Data',
          data: [12, 19, 3, 5, 2]
        }]
      },
      options: {
        title: {
          display: true,
          text: options.title
        }
      }
    };
  }

  // Ensure type is set if not provided in config
  if (!chartConfig.type) chartConfig.type = options.type;

  // 2. Build QuickChart Request Body (POST for larger data)
  const qcBody = {
    chart: chartConfig,
    width: Number(options.width),
    height: Number(options.height),
    backgroundColor: 'white',
    format: 'png'
  };

  try {
    console.log('Generating chart...');
    const response = await axios.post('https://quickchart.io/chart', qcBody, {
      responseType: 'arraybuffer',
      headers: { 'Content-Type': 'application/json' }
    });
    
    const timestamp = Date.now();
    const outputPath = path.resolve(__dirname, `chart_${timestamp}.png`);
    fs.writeFileSync(outputPath, response.data);
    console.log(`Chart saved to: ${outputPath}`);

    // 3. Send via feishu-image
    if (options.test) {
      console.log('Test mode: Image generated but not sent.');
      // Keep file for inspection in test mode
      return;
    }

    if (!options.target) {
      console.error('Error: --target is required to send.');
      fs.unlinkSync(outputPath); // Cleanup if args invalid
      process.exit(1);
    }

    const sendScript = path.resolve(__dirname, '../feishu-image/send.js');
    if (!fs.existsSync(sendScript)) {
      console.error('Error: feishu-image skill not found at:', sendScript);
      fs.unlinkSync(outputPath);
      process.exit(1);
    }

    console.log(`Sending to target: ${options.target}`);
    try {
      execSync(`node "${sendScript}" --target "${options.target}" --file "${outputPath}"`, { stdio: 'inherit' });
      console.log('Chart sent successfully.');
    } catch (e) {
      console.error('Failed to send image via feishu-image.');
      process.exit(1);
    } finally {
      // Cleanup
      if (fs.existsSync(outputPath)) {
        fs.unlinkSync(outputPath);
      }
    }

  } catch (error) {
    console.error('Error generating chart:', error.message);
    if (error.response) {
      console.error('Response status:', error.response.status);
    }
    process.exit(1);
  }
}

generateChart();
