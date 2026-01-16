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
 * Read and parse the YAML manifest file
 * @returns {Object} Object containing manifest array and extracted test IDs
 */
function loadYamlManifest() {
    console.log('📄 Loading YAML manifest...');
    const file = fs.readFileSync(CONFIG.yamlPath, 'utf8');
    const manifest = YAML.parse(file);
    
    // Validate that the YAML root is an array
    if (!Array.isArray(manifest)) {
        console.error("❌ ERROR: tests.yaml must be a list (starting with dashes '- ').");
        console.log("Current type detected:", typeof manifest);
        process.exit(1);
    }
    
    const yamlIds = manifest.map(item => item.test_id);
    console.log(`   ✓ Loaded ${manifest.length} tests from manifest`);
    
    return { manifest, yamlIds };
}

/**
 * Recursively scan a directory for test files and extract test IDs
 * @param {string} dir - Directory path to scan
 * @param {Set} codeIds - Set to store found test IDs
 */
function scanDirectory(dir, codeIds) {
    const files = fs.readdirSync(dir);
    console.log(`📁 Scanning directory: ${dir}`);
    console.log(`   Found ${files.length} items:`, files);
    
    files.forEach(file => {
        console.log(`   Processing: ${file}`);
        const filePath = path.join(dir, file);
        const stat = fs.statSync(filePath);

        if (stat.isDirectory()) {
            console.log(`      ↳ Directory detected, recursing...`);
            scanDirectory(filePath, codeIds);
        } 
        else if (CONFIG.fileExtensions.some(ext => file.endsWith(ext))) {
            console.log(`      ↳ Test file matched!`);
            const content = fs.readFileSync(filePath, 'utf8');
            const matches = content.match(CONFIG.idRegex);
            console.log(`      ↳ Found ${matches ? matches.length : 0} test IDs:`, matches);
            
            if (matches) {
                matches.forEach(id => codeIds.add(id));
            }
        } else {
            console.log(`      ↳ Skipped (not a test file), extension: ${path.extname(file)}`);
        }
    });
}

/**
 * Scan the codebase for test IDs
 * @returns {Set} Set of test IDs found in code
 */
function scanCodebaseForTestIds() {
    console.log('🔍 Scanning codebase for Test IDs...');
    const codeIds = new Set();
    scanDirectory(CONFIG.testsDir, codeIds);
    console.log(`   ✓ Found ${codeIds.size} unique test IDs in code`);
    return codeIds;
}

/**
 * Update manifest to sync isAutomated flag with actual code presence
 * @param {Array} manifest - Test manifest array
 * @param {Set} codeIds - Set of test IDs found in code
 */
function syncManifestWithCode(manifest, codeIds) {
    console.log('🔄 Syncing manifest with code...');
    let updateCount = 0;
    
    manifest.forEach(test => {
        const existsInCode = codeIds.has(test.test_id);
        
        if (test.isAutomated !== existsInCode) {
            console.log(`   [UPDATE] ${test.test_id}: isAutomated changed to ${existsInCode}`);
            test.isAutomated = existsInCode;
            updateCount++;
        }
    });
    
    console.log(`   ✓ Updated ${updateCount} test(s)`);
}

/**
 * Detect shadow tests (tests in code but not in manifest)
 * @param {Set} codeIds - Set of test IDs found in code
 * @param {Array} yamlIds - Array of test IDs from manifest
 * @returns {Array} Array of shadow test IDs
 */
function detectShadowTests(codeIds, yamlIds) {
    const missingInYaml = Array.from(codeIds).filter(id => !yamlIds.includes(id));
    
    if (missingInYaml.length > 0) {
        console.error('\n❌ ERROR: Shadow Tests Detected!');
        console.error('The following IDs exist in code but are NOT registered in tests.yaml:');
        console.error(missingInYaml.join(', '));
    }
    
    return missingInYaml;
}

/**
 * Save updated manifest back to YAML file
 * @param {Array} manifest - Updated test manifest array
 */
function saveManifestToYaml(manifest) {
    console.log('💾 Saving updated manifest...');
    const updatedYaml = YAML.stringify(manifest);
    fs.writeFileSync(CONFIG.yamlPath, updatedYaml);
    console.log('   ✓ Manifest saved successfully');
}

/**
 * Calculate test automation statistics
 * @param {Array} manifest - Test manifest array
 * @param {Array} yamlIds - Array of test IDs from manifest
 * @param {Array} shadowTests - Array of shadow test IDs
 * @returns {Object} Statistics object
 */
function calculateStatistics(manifest, yamlIds, shadowTests) {
    const totalTests = yamlIds.length;
    const automatedCount = manifest.filter(test => test.isAutomated === true).length;
    const coveragePercent = totalTests > 0 ? ((automatedCount / totalTests) * 100).toFixed(2) : 0;
    
    console.log('Debug - yamlIds:', yamlIds);
    console.log('Debug - yamlIds.length:', totalTests);
    console.log('Debug - manifest.length:', manifest.length);
    console.log('Debug - automatedCount:', automatedCount);
    
    return {
        totalManifested: totalTests,
        automated: automatedCount,
        manual: totalTests - automatedCount,
        testCoverage: `${coveragePercent}%`,
        shadowTestsCount: shadowTests.length,
        shadowTestsList: shadowTests,
        timestamp: new Date().toISOString()
    };
}

/**
 * Save statistics to JSON file
 * @param {Object} stats - Statistics object
 */
function saveStatistics(stats) {
    console.log('📊 Saving statistics...');
    fs.writeFileSync('./summary-stats.json', JSON.stringify(stats, null, 2));
    console.log('   ✓ Statistics saved to summary-stats.json');
}

/**
 * Display final results and exit if needed
 * @param {Object} stats - Statistics object
 * @param {boolean} hasError - Whether shadow tests were detected
 */
function displayResultsAndExit(stats, hasError) {
    console.log('\n✅ Sync Complete!');
    console.table(stats);
    
    if (hasError) {
        console.error('\nAction Required: Please register the shadow tests in tests.yaml.');
        process.exit(1); // Fails the CI Build
    }
}

/**
 * Main execution function
 */
function main() {
    // 1. Load YAML manifest
    const { manifest, yamlIds } = loadYamlManifest();
    
    // 2. Scan codebase for test IDs
    const codeIds = scanCodebaseForTestIds();
    
    // 3. Sync manifest with code
    syncManifestWithCode(manifest, codeIds);
    
    // 4. Detect shadow tests
    const shadowTests = detectShadowTests(codeIds, yamlIds);
    
    // 5. Save updated manifest
    saveManifestToYaml(manifest);
    
    // 6. Calculate and save statistics
    const stats = calculateStatistics(manifest, yamlIds, shadowTests);
    saveStatistics(stats);
    
    // 7. Display results and exit if needed
    displayResultsAndExit(stats, shadowTests.length > 0);
}

// Execute main function
main();