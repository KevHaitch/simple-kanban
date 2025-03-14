// This script can be run with Node.js to deploy the Firestore security rules
// You'll need to have the Firebase CLI installed: npm install -g firebase-tools
// And be logged in: firebase login

import { execSync } from 'child_process';

console.log('Deploying Firestore security rules...');
try {
  execSync('firebase deploy --only firestore:rules', { stdio: 'inherit' });
  console.log('Firestore security rules deployed successfully!');
} catch (error) {
  console.error('Error deploying Firestore security rules:', error);
} 