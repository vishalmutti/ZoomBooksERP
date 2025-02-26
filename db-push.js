
// This script pushes the schema changes to the database
import { exec } from 'child_process';

console.log('Pushing database schema changes...');
exec('npx drizzle-kit push:pg', (error, stdout, stderr) => {
  if (error) {
    console.error(`Error: ${error.message}`);
    process.exit(1);
  }
  if (stderr) {
    console.error(`stderr: ${stderr}`);
    process.exit(1);
  }
  console.log(`stdout: ${stdout}`);
  console.log('Schema changes pushed successfully!');
});
