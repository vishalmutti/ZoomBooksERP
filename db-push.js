// This script pushes the schema changes to the database
import { exec } from 'child_process';

console.log('Pushing database schema changes...');
exec('npx drizzle-kit push', (error, stdout, stderr) => {
  if (error) {
    console.error(`Error: ${error.message}`);
    return;
  }
  if (stderr) {
    console.error(`stderr: ${stderr}`);
    return;
  }
  console.log(`stdout: ${stdout}`);
});