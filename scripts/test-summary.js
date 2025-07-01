const { spawn } = require('child_process');

// Run Jest with the --silent flag to suppress most output but still capture it
const jest = spawn('npm', ['test', '--', '--json', '--silent']);

let jsonOutput = '';
let stderrOutput = '';

jest.stdout.on('data', (data) => {
  jsonOutput += data.toString();
});

jest.stderr.on('data', (data) => {
  stderrOutput += data.toString();
});

jest.on('close', (code) => {
  try {
    // If the exit code is 0, tests passed
    if (code === 0) {
      console.log('\n✅ All tests passed!');
      process.exit(0);
      return;
    }
    
    // Try to parse the JSON output from Jest
    let results;
    try {
      results = JSON.parse(jsonOutput);
    } catch (parseError) {
      // If parsing fails, exit with error
      console.log('\n⚠️ Test Failures (Summary):');
      console.log('Failed to parse test results. Check your tests manually.');
      process.exit(1);
      return;
    }
    
    // Check if tests failed
    if (results && results.numFailedTests > 0) {
      console.log('\n\n======== TEST FAILURE SUMMARY ========');
      console.log(`Failed Tests: ${results.numFailedTests}/${results.numTotalTests}`);
      
      // Group failures by test file
      const failuresByFile = {};
      
      // Check for NestJS dependency injection errors in stderr
      const nestDependencyErrors = new Map();
      const dependencyErrorRegex = /Nest can't resolve dependencies of the (\w+) \(\?.*\)/g;
      let match;
      
      while ((match = dependencyErrorRegex.exec(stderrOutput)) !== null) {
        const component = match[1];
        const fileMatch = stderrOutput.substring(match.index).match(/\(([^\/]+\/[^\/]+\.spec\.ts):/); 
        if (fileMatch && fileMatch[1]) {
          const fileName = fileMatch[1];
          if (!nestDependencyErrors.has(fileName)) {
            nestDependencyErrors.set(fileName, new Set());
          }
          nestDependencyErrors.get(fileName).add(component);
        }
      }
      
      // Process test failures from Jest results
      results.testResults.forEach(fileResult => {
        if (fileResult.status === 'failed') {
          const fileName = fileResult.name.split('/').pop();
          const failedTests = fileResult.assertionResults
            .filter(test => test.status === 'failed')
            .map(test => {
              const testName = test.ancestorTitles.length > 0 
                ? `${test.ancestorTitles[test.ancestorTitles.length-1]} > ${test.title}`
                : test.title;
              
              // Get a simplified error message
              let errorMessage = '';
              if (test.failureMessages && test.failureMessages.length > 0) {
                const msg = test.failureMessages[0];
                if (msg.includes('Error:')) {
                  errorMessage = msg.split('Error:')[1].split('\n')[0].trim();
                } else if (msg.includes('expect(')) {
                  const lines = msg.split('\n').filter(line => 
                    !line.includes('at ') && !line.includes('node_modules')
                  );
                  errorMessage = lines.slice(0, 2).join(' ').trim();
                } else {
                  errorMessage = msg.split('\n')[0].trim();
                }
              }
              
              return { testName, errorMessage };
            });
          
          failuresByFile[fileName] = failedTests;
        }
      });
      
      // Print NestJS dependency injection errors first (they're usually the root cause)
      if (nestDependencyErrors.size > 0) {
        console.log('\n⚠️ NestJS Dependency Injection Errors:');
        nestDependencyErrors.forEach((components, fileName) => {
          console.log(`  📁 ${fileName}:`);
          components.forEach(component => {
            console.log(`    ❌ Missing provider: ${component} requires dependencies`);
          });
          console.log('    👉 Fix: Make sure to provide all required dependencies in TestingModule');
        });
      }
      
      // Print regular test failures
      if (Object.keys(failuresByFile).length > 0) {
        console.log('\n❌ Test Failures:');
        Object.keys(failuresByFile).forEach(fileName => {
          console.log(`  📁 ${fileName}:`);
          failuresByFile[fileName].forEach(failure => {
            console.log(`    • ${failure.testName}`);
            if (failure.errorMessage) {
              console.log(`      → ${failure.errorMessage}`);
            }
          });
        });
      }
      
      // Print type errors in a concise way
      const typeErrors = results.testResults
        .flatMap(r => r.message || '')
        .filter(msg => msg.includes('TS2345') || msg.includes('Type'))
        .map(msg => msg.split('\n')[0])
        .filter((v, i, a) => a.indexOf(v) === i);
      
      if (typeErrors.length > 0) {
        console.log('\n🔍 Type Issues:');
        
        // Extract missing properties from error messages
        const missingProps = new Set();
        typeErrors.forEach(err => {
          const match = err.match(/missing the following properties.*?: (.*?)($|\s+from)/);
          if (match && match[1]) {
            match[1].split(',').forEach(prop => missingProps.add(prop.trim()));
          }
        });
        
        if (missingProps.size > 0) {
          console.log(`  • Missing properties in mock objects: ${Array.from(missingProps).join(', ')}`);
          console.log('    👉 Fix: Add these properties to your mock objects');
        } else {
          console.log('  • Type compatibility issues in test mocks');
        }
      }
      
      // Add a summary of fixes needed
      console.log('\n📋 Summary of fixes needed:');
      
      if (nestDependencyErrors.size > 0) {
        console.log('  1. Fix dependency injection in test modules');
      }
      
      if (typeErrors.length > 0 && missingProps && missingProps.size > 0) {
        console.log(`  ${nestDependencyErrors.size > 0 ? '2' : '1'}. Add missing properties to mocks: ${Array.from(missingProps).join(', ')}`);
      }
      
      console.log('\n====================================');
      process.exit(1);
    } else if (results) {
      console.log('\n✅ All tests passed!');
      process.exit(0);
    } else {
      console.log('\n✅ No test failures detected!');
      process.exit(0);
    }
  } catch (e) {
    // If JSON parsing fails, try to extract the most common errors from stderr
    if (stderrOutput) {
      console.log('\n⚠️ Test Failures (Summary):');
      
      // Extract NestJS dependency errors
      const depErrors = stderrOutput.match(/Nest can't resolve dependencies of the (\w+)/g);
      if (depErrors && depErrors.length > 0) {
        console.log('\n🔧 Dependency Injection Issues:');
        const uniqueErrors = [...new Set(depErrors)];
        uniqueErrors.forEach(err => console.log(`  • ${err}`));
        console.log('  👉 Fix: Provide missing dependencies in your TestingModule');
      }
      
      // Extract TypeScript errors
      const tsErrors = stderrOutput.match(/TS\d+: .+?(?=\n)/g);
      if (tsErrors && tsErrors.length > 0) {
        console.log('\n🔧 TypeScript Issues:');
        const uniqueErrors = [...new Set(tsErrors)].slice(0, 3); // Show at most 3 unique errors
        uniqueErrors.forEach(err => console.log(`  • ${err}`));
        if (tsErrors.length > 3) console.log(`  • ...and ${tsErrors.length - 3} more errors`); 
      }
    } else {
      console.error('Error parsing Jest output:', e);
    }
    
    process.exit(1);
  }
});
