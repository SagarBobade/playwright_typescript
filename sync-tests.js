// Import Node.js file system module for reading/writing files
const fs = require('fs');
// Import Node.js path module for handling file paths across different OS
const path = require('path');
// Import YAML parser library to convert YAML to JavaScript objects and vice versa
const YAML = require('yaml');

// --- CONFIGURATION ---
// Central configuration object to store all paths and patterns
const CONFIG = {
    yamlPath: './tests.yml',        // Path to YAML manifest file containing test metadata
    testsDir: './tests',             // Directory where test spec files are located
    fileExtensions: ['.spec.ts', '.test.js', '.spec.js'], // File types to scan for test IDs
    idRegex: /TC-\d+/g               // Regular expression pattern to match test IDs (e.g., TC-001, TC-042)
};

/**
 * 1. Read and Parse the YAML Manifest
 */
// Read the YAML file synchronously and store content as UTF-8 string
const file = fs.readFileSync(CONFIG.yamlPath, 'utf8');
// Parse YAML string into JavaScript object/array structure
const manifest = YAML.parse(file);
// Validate that the YAML root is an array (tests should be a list)
if (!Array.isArray(manifest)) {
    console.error("❌ ERROR: tests.yaml must be a list (starting with dashes '- ').");
    console.log("Current type detected:", typeof manifest);
    process.exit(1); // Exit with error code 1 (failure)
}
// Extract all test_id values from the manifest into an array for quick lookup
const yamlIds = manifest.map(item => item.test_id);

/**
 * 2. Recursively find all IDs in the code
 */
// Create a Set data structure to store unique test IDs found in code (prevents duplicates)
const codeIds = new Set();

// Recursive function to scan directories and subdirectories for test files
function scanDirectory(dir) {
    // Read all files and folders in the current directory
    const files = fs.readdirSync(dir);
    console.log(`📁 Scanning directory: ${dir}`);
    console.log(`   Found ${files.length} items:`, files);
    
    // Loop through each file/folder in the directory
    files.forEach(file => {
        console.log(`   Processing: ${file}`);
        // Create full path by joining directory and filename
        const filePath = path.join(dir, file);
        // Get file/folder metadata (size, type, etc.)
        const stat = fs.statSync(filePath);

        // Check if current item is a directory (folder)
        if (stat.isDirectory()) {
            console.log(`      ↳ Directory detected, recursing...`);
            // If it's a folder, recursively scan it
            scanDirectory(filePath);
        } 
        // Check if current file matches any of the test file patterns (.spec.ts, .test.js, etc.)
        else if (CONFIG.fileExtensions.some(ext => file.endsWith(ext))) {
            console.log(`      ↳ Test file matched!`);
            // Read the test file content as UTF-8 string
            const content = fs.readFileSync(filePath, 'utf8');
            // Find all matches of the test ID pattern (TC-XXX) in the file
            const matches = content.match(CONFIG.idRegex);
            console.log(`      ↳ Found ${matches ? matches.length : 0} test IDs:`, matches);
            // If matches were found in this file
            if (matches) {
                // Add each found test ID to the Set (duplicates automatically ignored)
                matches.forEach(id => codeIds.add(id));
            }
        } else {
            console.log(`      ↳ Skipped (not a test file), extension: ${path.extname(file)}`);
        }
    });
}

// Log message indicating scan is starting
console.log('🔍 Scanning codebase for Test IDs...');
// Start the recursive directory scan from the tests folder
scanDirectory(CONFIG.testsDir);

/**
 * 3. Bi-directional Comparison Logic
 */
// Flag to track if any errors were found during validation
let hasError = false;

// Check Direction A: In YAML but missing from Code
// Loop through each test defined in the YAML manifest
manifest.forEach(test => {
    // Check if this test ID exists in the codebase
    const existsInCode = codeIds.has(test.test_id);
    
    // If the isAutomated flag doesn't match actual code presence
    if (test.isAutomated !== existsInCode) {
        // Log that we're updating the isAutomated flag to match reality
        console.log(`[UPDATE] ${test.test_id}: isAutomated changed to ${existsInCode}`);
        // Update the isAutomated property in the manifest object
        test.isAutomated = existsInCode;
    }
});

// Check Direction B: In Code but missing from YAML (Shadow Automation)
// Find test IDs that exist in code but are NOT registered in YAML manifest
const missingInYaml = Array.from(codeIds).filter(id => !yamlIds.includes(id));

// If there are unregistered tests (shadow tests)
if (missingInYaml.length > 0) {
    // Log error message indicating shadow tests were found
    console.error('\n❌ ERROR: Shadow Tests Detected!');
    console.error('The following IDs exist in code but are NOT registered in tests.yaml:');
    // Display the list of unregistered test IDs
    console.error(missingInYaml.join(', '));
    // Set error flag to true (will cause process to exit with error later)
    hasError = true;
}

/**
 * 4. Update the YAML and Save Stats
 */
// Convert the updated manifest object back to YAML format string
const updatedYaml = YAML.stringify(manifest);
// Write the updated YAML back to the file (overwrites existing content)
fs.writeFileSync(CONFIG.yamlPath, updatedYaml);

// Create statistics object with current sync results
const stats = {
    totalManifested: yamlIds.length,  // Total number of tests defined in YAML
    automated: Array.from(codeIds).filter(id => yamlIds.includes(id)).length,  // Count of tests both in YAML and code
    timestamp: new Date().toISOString()  // ISO format timestamp of when sync ran
};

// Write statistics to a JSON file for tracking/reporting purposes
fs.writeFileSync('./summary-stats.json', JSON.stringify(stats, null, 2));

// Log success message
console.log('\n✅ Sync Complete!');
// Display statistics in a formatted table in the console
console.table(stats);

// If any shadow tests were detected
if (hasError) {
    // Display action required message
    console.error('\nAction Required: Please register the shadow tests in tests.yaml.');
    // Exit process with error code 1 (this will fail CI/CD pipeline)
    process.exit(1); // Fails the CI Build
}