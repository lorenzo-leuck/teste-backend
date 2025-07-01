const { spawn } = require('child_process');

// Run Jest with the --json flag to get structured output
const jest = spawn('npm', ['test', '--', '--json']);

let jsonOutput = '';

jest.stdout.on('data', (data) => {
  jsonOutput += data.toString();
});

jest.stderr.on('data', (data) => {
  // Direct pass stderr output to console
  process.stderr.write(data);
});

jest.on('close', (code) => {
  try {
    // Parse the JSON output from Jest
    const results = JSON.parse(jsonOutput);
    
    // Check if tests failed
    if (results.numFailedTests > 0) {
      console.log('\n\n======== TEST FAILURE SUMMARY ========');
      console.log(`Failed Tests: ${results.numFailedTests}/${results.numTotalTests}`);
      
      // Group failures by test file
      const failuresByFile = {};
      
      results.testResults.forEach(fileResult => {
        if (fileResult.status === 'failed') {
          const fileName = fileResult.name.split('/').pop();
          const failedTests = fileResult.assertionResults
            .filter(test => test.status === 'failed')
            .map(test => {
              // Extract just the test name without the full describe path
              const testName = test.ancestorTitles.length > 0 
                ? `${test.ancestorTitles[test.ancestorTitles.length-1]} > ${test.title}`
                : test.title;
              
              // Get a simplified error message
              let errorMessage = '';
              if (test.failureMessages && test.failureMessages.length > 0) {
                const msg = test.failureMessages[0];
                // Try to extract the most relevant part of the error
                if (msg.includes('Error:')) {
                  errorMessage = msg.split('Error:')[1].split('\n')[0].trim();
                } else if (msg.includes('expect(')) {
                  // For expect assertions, try to get a cleaner message
                  const lines = msg.split('\n').filter(line => 
                    !line.includes('at ') && 
                    !line.includes('node_modules')
                  );
                  errorMessage = lines.slice(0, 2).join(' ').trim();
                } else {
                  // Just take the first line of the error
                  errorMessage = msg.split('\n')[0].trim();
                }
              }
              
              return { testName, errorMessage };
            });
          
          failuresByFile[fileName] = failedTests;
        }
      });
      
      // Print failures by file
      Object.keys(failuresByFile).forEach(fileName => {
        console.log(`\n📁 ${fileName}:`);
        failuresByFile[fileName].forEach(failure => {
          console.log(`  ❌ ${failure.testName}`);
          if (failure.errorMessage) {
            console.log(`     → ${failure.errorMessage}`);
          }
        });
      });
      
      // Print common errors if they exist
      const typeErrors = results.testResults
        .flatMap(r => r.message || '')
        .filter(msg => msg.includes('TS2345') || msg.includes('Type'))
        .map(msg => msg.split('\n')[0])
        .filter((v, i, a) => a.indexOf(v) === i); // Unique values
      
      if (typeErrors.length > 0) {
        console.log('\n🔍 Common Type Issues:');
        console.log('  - Missing properties in mock objects. Add these fields to your mocks:');
        
        // Try to extract missing properties from error messages
        const missingProps = new Set();
        typeErrors.forEach(err => {
          const match = err.match(/missing the following properties.*?: (.*?)($|\s+from)/);
          if (match && match[1]) {
            match[1].split(',').forEach(prop => missingProps.add(prop.trim()));
          }
        });
        
        if (missingProps.size > 0) {
          console.log(`    ${Array.from(missingProps).join(', ')}`);
        } else {
          console.log('    Check type compatibility in your test mocks');
        }
      }
      
      console.log('\n====================================');
      process.exit(1);
    } else {
      console.log('\n✅ All tests passed!');
      process.exit(0);
    }
  } catch (e) {
    console.error('Error parsing Jest output:', e);
    console.log(jsonOutput); // Print the raw output if parsing failed
    process.exit(1);
  }
});
