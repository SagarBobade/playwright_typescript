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
    testPattern: /test\(['"](.*?)@(TC-\d+)['"]/g,  // Pattern to extract test title and ID together
    jiraPattern: /@jira\s+([A-Za-z]+-\d+)/gi,  // Pattern to extract Jira IDs (e.g., @jira SHOW-1234)
    priorityPattern: /@priority\s+(P\d+)/gi,  // Pattern to extract priority (e.g., @priority P0)
    featurePattern: /@feature\s+(\w+)/gi,  // Pattern to extract feature (e.g., @feature login)
    tagsPattern: /@tags?\s+([\w,\s-]+?)(?=\n|$|\/\/|\*\/)/gi  // Pattern to extract tags on same line only
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
 * Extract test metadata (ID, title, location, Jira ID, priority, feature, tags) from a test file
 * @param {string} filePath - Path to the test file
 * @returns {Map} Map of test ID to metadata object {title, filePath, lineNumber, bugId, priority, feature, tags}
 */
function extractTestMetadata(filePath) {
    const content = fs.readFileSync(filePath, 'utf8');
    const testDataMap = new Map();
    
    // Helper function to find associated test ID
    function findAssociatedTestId(position, content) {
        const searchWindow = content.substring(position, position + 500);
        const testInWindow = searchWindow.match(/test\(['"](.*?)@(TC-\d+)['"]/i);
        return testInWindow ? testInWindow[2] : null;
    }
    
    // Extract all annotations with their positions
    const jiraMap = new Map();
    const priorityMap = new Map();
    const featureMap = new Map();
    const tagsMap = new Map();
    
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
    
    // Extract Tags
    const tagsPattern = new RegExp(CONFIG.tagsPattern.source, CONFIG.tagsPattern.flags);
    let tagsMatch;
    while ((tagsMatch = tagsPattern.exec(content)) !== null) {
        const tagsStr = tagsMatch[1];
        const tagsArray = tagsStr.split(',').map(tag => tag.trim());
        const testId = findAssociatedTestId(tagsMatch.index, content);
        if (testId) tagsMap.set(testId, tagsArray);
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
        
        // Get all associated metadata
        const bugId = jiraMap.get(testId) || null;
        const priority = priorityMap.get(testId) || null;
        const feature = featureMap.get(testId) || null;
        const tags = tagsMap.get(testId) || null;
        
        testDataMap.set(testId, {
            title: title,
            filePath: filePath,
            lineNumber: lineNumber,
            bugId: bugId,
            priority: priority,
            feature: feature,
            tags: tags
        });
        
        const metaInfo = [];
        if (bugId) metaInfo.push(`Jira: ${bugId}`);
        if (priority) metaInfo.push(`Priority: ${priority}`);
        if (feature) metaInfo.push(`Feature: ${feature}`);
        if (tags) metaInfo.push(`Tags: ${tags.join(', ')}`);
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
 * Sync Jira IDs (bugId) from code to YAML manifest
 * @param {Array} manifest - Test manifest array
 * @param {Map} testDataMap - Map of test ID to metadata
 * @returns {number} Count of updated bug IDs
 */
function syncBugIds(manifest, testDataMap) {
    console.log('🐛 Syncing Jira IDs (bugId) from code...');
    let updateCount = 0;
    
    manifest.forEach(test => {
        const codeMetadata = testDataMap.get(test.test_id);
        
        if (codeMetadata) {
            const codeBugId = codeMetadata.bugId;
            const yamlBugId = test.bugId;
            
            // Update if bugId is different (including null)
            if (yamlBugId !== codeBugId) {
                console.log(`   [BUG ID UPDATE] ${test.test_id}:`);
                console.log(`      YAML: ${yamlBugId || 'null'}`);
                console.log(`      CODE: ${codeBugId || 'null'}`);
                console.log(`      FILE: ${codeMetadata.filePath}:${codeMetadata.lineNumber}`);
                
                test.bugId = codeBugId;
                updateCount++;
            }
        }
    });
    
    console.log(`   ✓ Updated ${updateCount} Jira ID(s)`);
    return updateCount;
}

/**
 * Sync Priorities from code to YAML manifest
 * @param {Array} manifest - Test manifest array
 * @param {Map} testDataMap - Map of test ID to metadata
 * @returns {number} Count of updated priorities
 */
function syncPriorities(manifest, testDataMap) {
    console.log('🎯 Syncing Priorities from code...');
    let updateCount = 0;
    
    manifest.forEach(test => {
        const codeMetadata = testDataMap.get(test.test_id);
        
        if (codeMetadata) {
            const codePriority = codeMetadata.priority;
            const yamlPriority = test.priority;
            
            // Update if priority is different (including null)
            if (yamlPriority !== codePriority) {
                console.log(`   [PRIORITY UPDATE] ${test.test_id}:`);
                console.log(`      YAML: ${yamlPriority || 'null'}`);
                console.log(`      CODE: ${codePriority || 'null'}`);
                console.log(`      FILE: ${codeMetadata.filePath}:${codeMetadata.lineNumber}`);
                
                test.priority = codePriority;
                updateCount++;
            }
        }
    });
    
    console.log(`   ✓ Updated ${updateCount} priority/priorities`);
    return updateCount;
}

/**
 * Sync Features from code to YAML manifest  
 * @param {Array} manifest - Test manifest array
 * @param {Map} testDataMap - Map of test ID to metadata
 * @returns {number} Count of updated features
 */
function syncFeatures(manifest, testDataMap) {
    console.log('🎭 Syncing Features from code...');
    let updateCount = 0;
    
    manifest.forEach(test => {
        const codeMetadata = testDataMap.get(test.test_id);
        
        if (codeMetadata) {
            const codeFeature = codeMetadata.feature;
            const yamlFeature = test.type; // Using 'type' field for feature
            
            // Update if feature is different (including null)
            if (yamlFeature !== codeFeature) {
                console.log(`   [FEATURE UPDATE] ${test.test_id}:`);
                console.log(`      YAML: ${yamlFeature || 'null'}`);
                console.log(`      CODE: ${codeFeature || 'null'}`);
                console.log(`      FILE: ${codeMetadata.filePath}:${codeMetadata.lineNumber}`);
                
                test.type = codeFeature;
                updateCount++;
            }
        }
    });
    
    console.log(`   ✓ Updated ${updateCount} feature(s)`);
    return updateCount;
}

/**
 * Sync Tags from code to YAML manifest
 * @param {Array} manifest - Test manifest array
 * @param {Map} testDataMap - Map of test ID to metadata
 * @returns {number} Count of updated tags
 */
function syncTags(manifest, testDataMap) {
    console.log('🏷️  Syncing Tags from code...');
    let updateCount = 0;
    
    manifest.forEach(test => {
        const codeMetadata = testDataMap.get(test.test_id);
        
        if (codeMetadata) {
            const codeTags = codeMetadata.tags;
            const yamlTags = test.tags;
            
            // Compare arrays (order-independent)
            const tagsChanged = !areArraysEqual(yamlTags, codeTags);
            
            if (tagsChanged) {
                console.log(`   [TAGS UPDATE] ${test.test_id}:`);
                console.log(`      YAML: ${yamlTags ? JSON.stringify(yamlTags) : 'null'}`);
                console.log(`      CODE: ${codeTags ? JSON.stringify(codeTags) : 'null'}`);
                console.log(`      FILE: ${codeMetadata.filePath}:${codeMetadata.lineNumber}`);
                
                test.tags = codeTags;
                updateCount++;
            }
        }
    });
    
    console.log(`   ✓ Updated ${updateCount} tag(s)`);
    return updateCount;
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
    
    // 5. Sync Jira IDs (bugId) from code to manifest
    syncBugIds(manifest, testDataMap);
    
    // 6. Sync Priorities from code to manifest
    syncPriorities(manifest, testDataMap);
    
    // 7. Sync Features from code to manifest
    syncFeatures(manifest, testDataMap);
    
    // 8. Sync Tags from code to manifest
    syncTags(manifest, testDataMap);
    
    // 9. Detect shadow tests
    const shadowTests = detectShadowTests(codeIds, yamlIds);
    
    // 10. Save updated manifest
    saveManifestToYaml(manifest);
    
    // 11. Calculate and save statistics
    const stats = calculateStatistics(manifest, yamlIds, shadowTests);
    saveStatistics(stats);
    
    // 12. Display results and exit if needed
    displayResultsAndExit(stats, shadowTests.length > 0);
}

// Execute main function
main();