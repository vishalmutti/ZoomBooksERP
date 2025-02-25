const { spawn } = require('child_process');
const fs = require('fs');

// Create a log file
const logStream = fs.createWriteStream('server-log.txt', { flags: 'a' });

// Set environment variables
const env = {
  ...process.env,
  DATABASE_URL: 'postgresql://neondb_owner:npg_AiDHzTW6Ftr5@ep-solitary-boat-a48bij2d.us-east-1.aws.neon.tech/neondb?sslmode=require',
  PORT: '3001'
};

// Run the server
const server = spawn('npm', ['run', 'dev'], { 
  env,
  stdio: ['ignore', 'pipe', 'pipe']
});

// Log stdout
server.stdout.on('data', (data) => {
  const message = data.toString();
  logStream.write(`[STDOUT] ${message}`);
  console.log(message);
});

// Log stderr
server.stderr.on('data', (data) => {
  const message = data.toString();
  logStream.write(`[STDERR] ${message}`);
  console.error(message);
});

// Handle server exit
server.on('close', (code) => {
  const message = `Server process exited with code ${code}\n`;
  logStream.write(message);
  console.log(message);
  logStream.end();
});

console.log('Server process started. Logs will be written to server-log.txt');
