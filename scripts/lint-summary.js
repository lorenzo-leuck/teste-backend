const { spawn } = require('child_process');

// Run lint-staged with output
const lintStaged = spawn('npx', ['lint-staged', '--verbose']);

// Capture output
let stdout = '';
let stderr = '';

lintStaged.stdout.on('data', (data) => {
  const output = data.toString();
  stdout += output;
  process.stdout.write(output);
});

lintStaged.stderr.on('data', (data) => {
  const output = data.toString();
  stderr += output;
  process.stderr.write(output);
});

lintStaged.on('close', (code) => {
  if (code !== 0) {
    console.log('\n\n======== LINT ISSUES SUMMARY ========');
    
    // Extract ESLint errors
    const eslintErrors = stderr.match(/error(.*?)(?:\n|$)/g);
    if (eslintErrors && eslintErrors.length > 0) {
      console.log('\n🔧 ESLint Issues:');
      const uniqueErrors = [...new Set(eslintErrors.slice(0, 5))]; // Show at most 5 unique errors
      uniqueErrors.forEach(err => console.log(`  • ${err.trim()}`));
      if (eslintErrors.length > 5) {
        console.log(`  • ...and ${eslintErrors.length - 5} more issues`);
      }
      console.log('  👉 Fix: Run npm run lint to address these issues');
    }
    
    // Extract Prettier formatting issues
    if (stdout.includes('prettier') || stderr.includes('prettier')) {
      console.log('\n💅 Prettier Formatting Issues:');
      console.log('  • Some files need formatting');
      console.log('  👉 Fix: Run npm run format to format your code');
    }
    
    console.log('\n====================================');
  } else {
    console.log('\n✅ All linting checks passed!');
  }
  
  process.exit(code);
});
