import fs from 'fs';
import os from 'os';
import path from 'path';

// Read the token file directly
const homeDir = os.homedir();
const dotokenPath = path.join(homeDir, '.dotoken');

try {
  if (fs.existsSync(dotokenPath)) {
    const token = fs.readFileSync(dotokenPath, 'utf8');
    console.log('Raw token:', JSON.stringify(token));
    console.log('Trimmed token:', JSON.stringify(token.trim()));
    console.log('Token length (raw):', token.length);
    console.log('Token length (trimmed):', token.trim().length);
    
    // Check for any non-printable characters
    const hexEncoded = Buffer.from(token).toString('hex');
    console.log('Hex encoded:', hexEncoded);
  } else {
    console.log('Token file not found');
  }
} catch (error) {
  console.error('Error reading token file:', error);
} 