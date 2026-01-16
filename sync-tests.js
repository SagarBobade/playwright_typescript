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
    idRegex: /TC-\d+/g,             // Regular expression pattern to match test IDs (e.g., TC-001, TC-042)
    testPattern: /test\(['"](.*?)@(TC-\d+)['"]/g  // Pattern to extract test title and ID together
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
 * Extract test metadata (ID, title, location) from a test file
 * @param {string} filePath - Path to the test file
 * @returns {Map} Map of test ID to metadata object {title, filePath, lineNumber}
 */
function extractTestMetadata(filePath) {
    const content = fs.readFileSync(filePath, 'utf8');
    const testDataMap = new Map();
    
    // Reset regex lastIndex to avoid issues with global flag
    const pattern = new RegExp(CONFIG.testPattern.source, CONFIG.testPattern.flags);
    let match;
    
    while ((match = pattern.exec(content)) !== null) {
        const title = match[1].trim();
        const testId = match[2];
        
        // Calculate line number where test was found
        const contentUpToMatch = content.substring(0, match.index);
        const lineNumber = contentUpToMatch.split('\n').length;
        
        testDataMap.set(testId, {
            title: title,
            filePath: filePath,
            lineNumber: lineNumber
        });
        
        console.log(`      ↳ Extracted: ${testId} - "${title}" (line ${lineNumber})`);
    }
    
    return testDataMap;
}

/**
 * Recursively scan a directory for test files and extract test IDs and metadata
 * @param {string} dir - Directory path to scan
 * @param {Set} codeIds - Set to store found test IDs
 * @param {Map} testDataMap - Map to store test metadata
 */
function scanDirectory(dir, codeIds, testDataMap) {
    const files = fs.readdirSync(dir);
    console.log(`📁 Scanning directory: ${dir}`);
    console.log(`   Found ${files.length} items:`, files);
    
    files.forEach(file => {
        console.log(`   Processing: ${file}`);
        const filePath = path.join(dir, file);
        const stat = fs.statSync(filePath);

        if (stat.isDirectory()) {
            console.log(`      ↳ Directory detected, recursing...`);
            scanDirectory(filePath, codeIds, testDataMap);
        } 
        else if (CONFIG.fileExtensions.some(ext => file.endsWith(ext))) {
            console.log(`      ↳ Test file matched!`);
            
            // Extract detailed metadata from test file
            const fileTestData = extractTestMetadata(filePath);
            
            // Merge into main testDataMap and add IDs to codeIds
            fileTestData.forEach((metadata, testId) => {
                codeIds.add(testId);
                testDataMap.set(testId, metadata);
            });
            
            console.log(`      ↳ Found ${fileTestData.size} test(s) with metadata`);
        } else {
            console.log(`      ↳ Skipped (not a test file), extension: ${path.extname(file)}`);
        }
    });
}

/**
 * Scan the codebase for test IDs and extract metadata
 * @returns {Object} Object containing codeIds (Set) and testDataMap (Map)
 */
function scanCodebaseForTestMetadata() {
    console.log('🔍 Scanning codebase for Test IDs and Metadata...');
    const codeIds = new Set();
    const testDataMap = new Map();
    
    scanDirectory(CONFIG.testsDir, codeIds, testDataMap);
    
    console.log(`   ✓ Found ${codeIds.size} unique test IDs in code`);
    console.log(`   ✓ Extracted metadata for ${testDataMap.size} tests`);
    
    return { codeIds, testDataMap };
}

/**
 * Sync test titles from code to YAML manifest
 * @param {Array} manifest - Test manifest array
 * @param {Map} testDataMap - Map of test ID to metadata
 * @returns {number} Count of updated titles
 */
function syncTestTitles(manifest, testDataMap) {
    console.log('📝 Syncing test titles from code...');
    let updateCount = 0;
    
    manifest.forEach(test => {
        const codeMetadata = testDataMap.get(test.test_id);
        
        if (codeMetadata) {
            const codeTitle = codeMetadata.title;
            const yamlTitle = test.title;
            
            // Update if title is missing or different
            if (!yamlTitle || yamlTitle !== codeTitle) {
                console.log(`   [TITLE UPDATE] ${test.test_id}:`);
                console.log(`      YAML: "${yamlTitle || '(empty)'}"`);
                console.log(`      CODE: "${codeTitle}"`);
                console.log(`      FILE: ${codeMetadata.filePath}:${codeMetadata.lineNumber}`);
                
                test.title = codeTitle;
                updateCount++;
            }
        }
    });
    
    console.log(`   ✓ Updated ${updateCount} test title(s)`);
    return updateCount;
}

/**
 * Update manifest to sync isAutomated flag with actual code presence
 * @param {Array} manifest - Test manifest array
 * @param {Set} codeIds - Set of test IDs found in code
 */
function syncManifestWithCode(manifest, codeIds) {
    console.log('🔄 Syncing isAutomated status with code...');
    let updateCount = 0;
    
    manifest.forEach(test => {
        const existsInCode = codeIds.has(test.test_id);
        
        if (test.isAutomated !== existsInCode) {
            console.log(`   [STATUS UPDATE] ${test.test_id}: isAutomated changed to ${existsInCode}`);
            test.isAutomated = existsInCode;
            updateCount++;
        }
    });
    
    console.log(`   ✓ Updated ${updateCount} test automation status(es)`);
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
    console.log('🚀 Starting Test Manifest Sync...\n');
    
    // 1. Load YAML manifest
    const { manifest, yamlIds } = loadYamlManifest();
    
    // 2. Scan codebase for test IDs and extract metadata
    const { codeIds, testDataMap } = scanCodebaseForTestMetadata();
    
    // 3. Sync automation status (isAutomated flag)
    syncManifestWithCode(manifest, codeIds);
    
    // 4. Sync test titles from code to manifest
    syncTestTitles(manifest, testDataMap);
    
    // 5. Detect shadow tests
    const shadowTests = detectShadowTests(codeIds, yamlIds);
    
    // 6. Save updated manifest
    saveManifestToYaml(manifest);
    
    // 7. Calculate and save statistics
    const stats = calculateStatistics(manifest, yamlIds, shadowTests);
    saveStatistics(stats);
    
    // 8. Display results and exit if needed
    displayResultsAndExit(stats, shadowTests.length > 0);
}

// Execute main function
main();