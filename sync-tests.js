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
    testPattern: /test(?:\.skip)?\(['"](.*?)@(TC-\d+)['"]/g,  // Pattern to extract test title and ID together (including test.skip)
    jiraPattern: /@jira\s+([A-Za-z]+-\d+)/gi,  // Pattern to extract Jira IDs (e.g., @jira SHOW-1234)
    priorityPattern: /@priority\s+(P\d+)/gi,  // Pattern to extract priority (e.g., @priority P0)
    featurePattern: /@feature\s+(\w+)/gi,  // Pattern to extract feature (e.g., @feature login)
    testTitleTagPattern: /@([\w-]+)/g,  // Pattern to extract tags from test title (e.g., @smoke @regression)
    skipPattern: /test\.skip\(['"](.*?)@(TC-\d+)['"]/g,  // Pattern to detect skipped tests (e.g., test.skip('title @TC-001'))
    descriptionPattern: /@description\s+(.+?)(?=\n\s*\*|$)/gis,  // Pattern to extract description
    expectedResultPattern: /@expectedResult\s+(.+?)(?=\n\s*\*|$)/gis  // Pattern to extract expected result
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
 * Extract test metadata (ID, title, location, Jira ID, priority, feature, tags, description, expectedResult) from a test file
 * @param {string} filePath - Path to the test file
 * @returns {Map} Map of test ID to metadata object
 */
function extractTestMetadata(filePath) {
    const content = fs.readFileSync(filePath, 'utf8');
    const testDataMap = new Map();
    
    // Helper function to find associated test ID
    function findAssociatedTestId(position, content) {
        const searchWindow = content.substring(position, position + 500);
        const testInWindow = searchWindow.match(/test(?:\.skip)?\(['"](.*?)@(TC-\d+)['"]/i);
        return testInWindow ? testInWindow[2] : null;
    }
    
    // Helper function to extract JSDoc comment before test
    function extractJSDocForTest(testPosition, content) {
        // Look backwards from test position to find JSDoc comment
        // Only accept JSDoc if it's immediately before the test (with only whitespace/newlines between)
        const beforeTest = content.substring(Math.max(0, testPosition - 500), testPosition);
        
        // Find the last JSDoc comment
        const jsDocMatch = beforeTest.match(/\/\*\*[\s\S]*?\*\//g);
        if (jsDocMatch && jsDocMatch.length > 0) {
            const lastJSDoc = jsDocMatch[jsDocMatch.length - 1];
            const jsDocEndIndex = beforeTest.lastIndexOf(lastJSDoc) + lastJSDoc.length;
            
            // Check if there's anything other than whitespace between JSDoc end and test start
            const betweenJSDocAndTest = beforeTest.substring(jsDocEndIndex);
            
            // Only return JSDoc if there's nothing but whitespace between it and the test
            // This prevents picking up JSDoc from previous tests
            if (/^\s*$/.test(betweenJSDocAndTest)) {
                return lastJSDoc;
            }
        }
        return null;
    }
    
    // Extract all annotations with their positions
    const jiraMap = new Map();
    const priorityMap = new Map();
    const featureMap = new Map();
    const skippedMap = new Map();
    const tagsMap = new Map();
    const descriptionMap = new Map();
    const expectedResultMap = new Map();
    
    // Extract Jira IDs
    const jiraPattern = new RegExp(CONFIG.jiraPattern.source, CONFIG.jiraPattern.flags);
    let jiraMatch;
    while ((jiraMatch = jiraPattern.exec(content)) !== null) {
        const jiraId = jiraMatch[1].toUpperCase();
        const testId = findAssociatedTestId(jiraMatch.index, content);
        if (testId) jiraMap.set(testId, jiraId);
    }
    
    // Extract Priorities
    const priorityPattern = new RegExp(CONFIG.priorityPattern.source, CONFIG.priorityPattern.flags);
    let priorityMatch;
    while ((priorityMatch = priorityPattern.exec(content)) !== null) {
        const priority = priorityMatch[1].toUpperCase();
        const testId = findAssociatedTestId(priorityMatch.index, content);
        if (testId) priorityMap.set(testId, priority);
    }
    
    // Extract Features
    const featurePattern = new RegExp(CONFIG.featurePattern.source, CONFIG.featurePattern.flags);
    let featureMatch;
    while ((featureMatch = featurePattern.exec(content)) !== null) {
        const feature = featureMatch[1].toLowerCase();
        const testId = findAssociatedTestId(featureMatch.index, content);
        if (testId) featureMap.set(testId, feature);
    }
    
    // Extract Skipped tests
    const skipPattern = new RegExp(CONFIG.skipPattern.source, CONFIG.skipPattern.flags);
    let skipMatch;
    while ((skipMatch = skipPattern.exec(content)) !== null) {
        const testId = skipMatch[2];
        skippedMap.set(testId, true);
    }
    
    // Extract Tags from Playwright's tag property in test options
    // Pattern to match: test('title @TC-XXX', { tag: ['@smoke', '@auth'] }, async...
    // Also matches test.skip('title @TC-XXX', { tag: [...] }, async...
    const tagPropertyPattern = /test(?:\.skip)?\(['"](.*?)@(TC-\d+)['"]\s*,\s*\{[^}]*tag:\s*\[([^\]]+)\]/g;
    let tagPropertyMatch;
    while ((tagPropertyMatch = tagPropertyPattern.exec(content)) !== null) {
        const testId = tagPropertyMatch[2];
        const tagsString = tagPropertyMatch[3];
        
        // Extract individual tags from the array
        const tagMatches = tagsString.match(/['"]([^'"]+)['"]/g);
        if (tagMatches) {
            const tags = tagMatches.map(t => t.replace(/['"@]/g, '').trim());
            tagsMap.set(testId, tags);
        }
    }
    
    // Extract test metadata
    const pattern = new RegExp(CONFIG.testPattern.source, CONFIG.testPattern.flags);
    let match;
    
    while ((match = pattern.exec(content)) !== null) {
        const title = match[1].trim();
        const testId = match[2];
        
        // Calculate line number where test was found
        const contentUpToMatch = content.substring(0, match.index);
        const lineNumber = contentUpToMatch.split('\n').length;
        
        // Extract test function body to find expect statements
        const testStartIndex = match.index;
        const afterTest = content.substring(testStartIndex);
        
        // Find the test function body (between async () => { and the closing })
        const functionBodyMatch = afterTest.match(/async\s*\([^)]*\)\s*=>\s*\{([\s\S]*?)^\s*\}\);/m);
        let expectedResult = null;
        
        if (functionBodyMatch) {
            const functionBody = functionBodyMatch[1];
            
            // Extract all expect statements
            const expectPattern = /(?:await\s+)?expect\([^)]+\)\.([^\n;]+)/g;
            const expectations = [];
            let expectMatch;
            
            while ((expectMatch = expectPattern.exec(functionBody)) !== null) {
                const assertion = expectMatch[0].trim();
                // Clean up the assertion for readability
                const cleanAssertion = assertion
                    .replace(/await\s+/g, '')
                    .replace(/\s+/g, ' ')
                    .trim();
                expectations.push(cleanAssertion);
            }
            
            if (expectations.length > 0) {
                expectedResult = expectations.join('; ');
            }
        }
        
        // Extract JSDoc comment for this test (for description only)
        const jsDoc = extractJSDocForTest(match.index, content);
        let description = null;
        
        if (jsDoc) {
            // Extract description
            const descMatch = jsDoc.match(/@description\s+(.+?)(?=\n\s*\*\s*@|\n\s*\*\/)/s);
            if (descMatch) {
                description = descMatch[1].replace(/\n\s*\*\s*/g, ' ').trim();
            }
        }
        
        // Get all associated metadata
        const bugId = jiraMap.get(testId) || null;
        const priority = priorityMap.get(testId) || null;
        const feature = featureMap.get(testId) || null;
        const tags = tagsMap.get(testId) || null;
        const isSkipped = skippedMap.get(testId) || false;
        
        // Determine automation type
        const automation = isSkipped ? 'manual' : 'ui';
        
        testDataMap.set(testId, {
            title: title,
            testName: title,  // testName is same as title
            filePath: filePath,
            testFile: filePath,  // testFile is the file path
            lineNumber: lineNumber,
            bugId: bugId,
            priority: priority,
            feature: feature,
            tags: tags,
            isSkipped: isSkipped,
            automation: automation,
            description: description,
            expectedResult: expectedResult
        });
        
        const metaInfo = [];
        if (bugId) metaInfo.push(`Jira: ${bugId}`);
        if (priority) metaInfo.push(`Priority: ${priority}`);
        if (feature) metaInfo.push(`Feature: ${feature}`);
        if (tags) metaInfo.push(`Tags: ${tags.join(', ')}`);
        if (isSkipped) metaInfo.push(`⚠️ SKIPPED`);
        if (description) metaInfo.push(`Desc: ${description.substring(0, 30)}...`);
        const metaStr = metaInfo.length > 0 ? ` [${metaInfo.join(' | ')}]` : '';
        console.log(`      ↳ Extracted: ${testId} - "${title}" (line ${lineNumber})${metaStr}`);
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
 * Sync all test metadata from code to YAML manifest (force override)
 * @param {Array} manifest - Test manifest array
 * @param {Map} testDataMap - Map of test ID to metadata
 * @returns {number} Count of tests synced
 */
function syncAllTestMetadata(manifest, testDataMap) {
    console.log('🔄 Syncing ALL test metadata from code (force override)...');
    let syncCount = 0;
    
    manifest.forEach(test => {
        const codeMetadata = testDataMap.get(test.test_id);
        
        if (codeMetadata) {
            const updates = [];
            
            // Always override all fields from code
            if (test.title !== codeMetadata.title) updates.push(`title: "${test.title}" → "${codeMetadata.title}"`);
            test.title = codeMetadata.title;
            
            if (test.testName !== codeMetadata.testName) updates.push(`testName: "${test.testName}" → "${codeMetadata.testName}"`);
            test.testName = codeMetadata.testName;
            
            if (test.testFile !== codeMetadata.testFile) updates.push(`testFile: "${test.testFile}" → "${codeMetadata.testFile}"`);
            test.testFile = codeMetadata.testFile;
            
            if (test.bugId !== codeMetadata.bugId) updates.push(`bugId: ${test.bugId} → ${codeMetadata.bugId}`);
            test.bugId = codeMetadata.bugId;
            
            if (test.priority !== codeMetadata.priority) updates.push(`priority: ${test.priority} → ${codeMetadata.priority}`);
            test.priority = codeMetadata.priority;
            
            if (test.type !== codeMetadata.feature) updates.push(`type: ${test.type} → ${codeMetadata.feature}`);
            test.type = codeMetadata.feature;
            
            const tagsChanged = !areArraysEqual(test.tags, codeMetadata.tags);
            if (tagsChanged) updates.push(`tags: ${JSON.stringify(test.tags)} → ${JSON.stringify(codeMetadata.tags)}`);
            test.tags = codeMetadata.tags;
            
            if (test.isSkipped !== codeMetadata.isSkipped) updates.push(`isSkipped: ${test.isSkipped} → ${codeMetadata.isSkipped}`);
            test.isSkipped = codeMetadata.isSkipped;
            
            if (test.automation !== codeMetadata.automation) updates.push(`automation: ${test.automation} → ${codeMetadata.automation}`);
            test.automation = codeMetadata.automation;
            
            if (test.description !== codeMetadata.description) updates.push(`description: updated`);
            test.description = codeMetadata.description;
            
            if (test.expectedResult !== codeMetadata.expectedResult) updates.push(`expectedResult: updated`);
            test.expectedResult = codeMetadata.expectedResult;
            
            if (updates.length > 0) {
                console.log(`   [SYNC] ${test.test_id}:`)
                updates.forEach(update => console.log(`      • ${update}`));
                syncCount++;
            }
        }
    });
    
    console.log(`   ✓ Synced ${syncCount} test(s) with updates`);
    console.log(`   ✓ Total tests processed: ${manifest.filter(t => testDataMap.has(t.test_id)).length}`);
    return syncCount;
}

/**
 * Compare two arrays for equality (order-independent)
 * @param {Array} arr1 - First array
 * @param {Array} arr2 - Second array
 * @returns {boolean} True if arrays contain same elements
 */
function areArraysEqual(arr1, arr2) {
    if (arr1 === arr2) return true; // Both null or same reference
    if (!arr1 || !arr2) return false; // One is null
    if (arr1.length !== arr2.length) return false;
    
    const sorted1 = [...arr1].sort();
    const sorted2 = [...arr2].sort();
    return JSON.stringify(sorted1) === JSON.stringify(sorted2);
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
    // Count tests that are automated and not skipped
    const automatedCount = manifest.filter(test => test.isAutomated === true && !test.isSkipped).length;
    // Manual tests are those marked as skipped (shown as MANUAL in UI)
    const manualCount = manifest.filter(test => test.isSkipped === true).length;
    const coveragePercent = totalTests > 0 ? ((automatedCount / totalTests) * 100).toFixed(2) : 0;
    
    return {
        totalManifested: totalTests,
        automated: automatedCount,
        manual: manualCount,
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

/**Sync Skipped status from code to manifest
    syncSkippedStatus(manifest, testDataMap);
    
    // 10. Detect shadow tests
    const shadowTests = detectShadowTests(codeIds, yamlIds);
    
    // 11. Save updated manifest
    saveManifestToYaml(manifest);
    
    // 12. Calculate and save statistics
    const stats = calculateStatistics(manifest, yamlIds, shadowTests);
    saveStatistics(stats);
    
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
    
    // 4. Sync ALL test metadata from code to YAML (force override)
    syncAllTestMetadata(manifest, testDataMap);
    
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