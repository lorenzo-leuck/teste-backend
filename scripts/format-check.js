const { spawn } = require('child_process');

// Run prettier check
const prettier = spawn('npx', ['prettier', '--check', 'src/**/*.ts']);

// Capture output
let stdout = '';
let stderr = '';

prettier.stdout.on('data', (data) => {
  const output = data.toString();
  stdout += output;
  process.stdout.write(output);
});

prettier.stderr.on('data', (data) => {
  const output = data.toString();
  stderr += output;
  process.stderr.write(output);
});

prettier.on('close', (code) => {
  if (code !== 0) {
    console.log('\n\n======== FORMATTING ISSUES ========');
    
    // Extract file paths with formatting issues
    const fileIssues = stdout.match(/[^\s]+\.ts/g);
    if (fileIssues && fileIssues.length > 0) {
      console.log('\n💅 Files with formatting issues:');
      const uniqueFiles = [...new Set(fileIssues.slice(0, 10))]; // Show at most 10 files
      uniqueFiles.forEach(file => console.log(`  • ${file}`));
      if (fileIssues.length > 10) {
        console.log(`  • ...and ${fileIssues.length - 10} more files`);
      }
    }
    
    console.log('\n====================================');
  } else {
    console.log('\n✅ All files are properly formatted!');
  }
  
  process.exit(code);
});
