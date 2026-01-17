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
    idRegex: /TC[:-]?\d+/g,             // Regular expression pattern to match test IDs (e.g., TC-001, TC:1, TC-042)
    testPattern: /test(?:\.(?:skip|fixme))?\(['"]((?:TC[:-]?\d+[:\s-].+?)|(?:.+?@TC[:-]?\d+))['"],/g,  // Pattern to extract test title and ID together (supports TC-XXX:, TC:XXX, and @TC-XXX formats, including test.skip and test.fixme, handles quotes in title)
    jiraPattern: /@jira\s+([A-Za-z]+-\d+)/gi,  // Pattern to extract Jira IDs (e.g., @jira SHOW-1234)
    priorityPattern: /@priority\s+(P\d+)/gi,  // Pattern to extract priority (e.g., @priority P0)
    featurePattern: /@feature\s+([\w-]+)/gi,  // Pattern to extract feature (e.g., @feature login, @feature associated-people)
    testTitleTagPattern: /@([\w-]+)/g,  // Pattern to extract tags from test title (e.g., @smoke @regression)
    skipPattern: /test\.(?:skip|fixme)\(['"]((?:TC[:-]?\d+[:\s-].+?)|(?:.+?@TC[:-]?\d+))['"],/g,  // Pattern to detect skipped/fixme tests (supports both formats, handles quotes in title)
    descriptionPattern: /@description\s+(.+?)(?=\n\s*\*|$)/gis,  // Pattern to extract description
    expectedResultPattern: /@expectedResult\s+(.+?)(?=\n\s*\*|$)/gis  // Pattern to extract expected result
};

/**
 * Read and parse the YAML manifest file
 * @returns {Object} Object containing manifest array and extracted test IDs with composite keys
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
    
    // Create composite keys: testFile::test_id for file-scoped uniqueness
    const yamlCompositeKeys = manifest.map(item => `${item.testFile}::${item.test_id}`);
    console.log(`   ✓ Loaded ${manifest.length} tests from manifest`);
    
    return { manifest, yamlCompositeKeys };
}

/**
 * Extract test metadata (ID, title, location, Jira ID, priority, feature, tags, description, expectedResult) from a test file
 * @param {string} filePath - Path to the test file
 * @returns {Map} Map of test ID to metadata object
 */
function extractTestMetadata(filePath) {
    const content = fs.readFileSync(filePath, 'utf8');
    const testDataMap = new Map();
    
    const testSuites = [];
    const suitePattern = /test\.(?:describe\.)?skip\s*\(\s*['"](.*?)['"],\s*\{[^}]*\},\s*\(\)\s*=>\s*\{/g;
    let suiteMatch;
    
    while ((suiteMatch = suitePattern.exec(content)) !== null) {
        const suiteName = suiteMatch[1];
        const suiteStartIndex = suiteMatch.index;
        
        // Find the end of this suite by counting braces
        let braceCount = 1; // Start at 1 since we're starting from the opening brace
        let inString = false;
        let stringChar = null;
        let parenDepth = 0; // Track parentheses to ignore braces in function parameters
        let suiteEndIndex = suiteStartIndex;
        
        // Start from the opening brace
        const startPos = content.indexOf('{', suiteStartIndex + suiteMatch[0].length - 1);
        
        for (let i = startPos + 1; i < content.length; i++) {
            const char = content[i];
            const prevChar = i > 0 ? content[i - 1] : '';
            
            // Handle string literals
            if ((char === '"' || char === "'" || char === '`') && prevChar !== '\\') {
                if (!inString) {
                    inString = true;
                    stringChar = char;
                } else if (char === stringChar) {
                    inString = false;
                    stringChar = null;
                }
            }
            
            // Track parentheses and count braces only outside strings and parentheses
            if (!inString) {
                if (char === '(') parenDepth++;
                if (char === ')') parenDepth--;
                
                // Only count braces when not inside parentheses (to ignore parameter destructuring)
                if (parenDepth === 0) {
                    if (char === '{') braceCount++;
                    if (char === '}') braceCount--;
                    
                    if (braceCount === 0) {
                        suiteEndIndex = i;
                        break;
                    }
                }
            }
        }
        
        testSuites.push({
            name: suiteName,
            startIndex: suiteStartIndex,
            endIndex: suiteEndIndex,
            isSkipped: true
        });
    }
    
    // Helper function to check if a position is inside a skipped test suite
    function isInsideSkippedSuite(position) {
        return testSuites.some(suite => 
            position >= suite.startIndex && position <= suite.endIndex && suite.isSkipped
        );
    }
    
    // Helper function to find associated test ID
    function findAssociatedTestId(position, content) {
        const searchWindow = content.substring(position, position + 500);
        // Support both formats: "TC-XXX: title", "TC:XXX title" and "title @TC-XXX"
        const testInWindow = searchWindow.match(/test(?:\.(?:skip|fixme))?\(['"](?:(?:TC[:-]?\d+)|(?:.*?@(TC[:-]?\d+)))/i);
        if (!testInWindow) return null;
        // Return the test ID from either format
        if (testInWindow[2]) return testInWindow[2]; // @TC-XXX format
        const fullMatch = testInWindow[1] || testInWindow[0];
        const idMatch = fullMatch.match(/TC[:-]?\d+/);
        return idMatch ? idMatch[0] : null;
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
        const fullMatch = skipMatch[1];  // The entire test title
        const idMatch = fullMatch.match(/TC[:-]?\d+/);
        if (idMatch) {
            const testId = idMatch[0];
            skippedMap.set(testId, true);
        }
    }
    
    // Extract Tags from Playwright's tag property in test options
    // Pattern to match: test('title @TC-XXX', { tag: ['@smoke', '@auth'] }, async...
    // Also matches test.skip(), test.fixme() with { tag: [...] } and TC-XXX: format
    const tagPropertyPattern = /test(?:\.(?:skip|fixme))?\(['"](?:TC[:-]?\d+[:\s-].+?|.+?@TC[:-]?\d+)['"],\s*\{[^}]*tag:\s*\[([^\]]+)\]/gs;
    let tagPropertyMatch;
    while ((tagPropertyMatch = tagPropertyPattern.exec(content)) !== null) {
        // Extract test ID from the matched test string
        const testString = tagPropertyMatch[0];
        const idMatch = testString.match(/TC[:-]?\d+/);
        if (!idMatch) continue;
        const testId = idMatch[0];
        const tagsString = tagPropertyMatch[1];
        
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
        const fullMatch = match[1];  // The entire test title (either "TC-XXX: title", "TC:XXX title" or "title @TC-XXX")
        
        // Extract test ID
        const idMatch = fullMatch.match(/TC[:-]?\d+/);
        if (!idMatch) continue;
        const testId = idMatch[0];
        
        // Extract title (remove TC-XXX: or TC:XXX prefix or @TC-XXX suffix)
        let title;
        if (fullMatch.startsWith('TC')) {
            // Format: "TC-XXX: title" or "TC:XXX - title"
            title = fullMatch.replace(/^TC[:-]?\d+[:\s-]+/, '').trim();
        } else {
            // Format: "title @TC-XXX"
            title = fullMatch.replace(/\s*@TC[:-]?\d+.*$/, '').trim();
        }
        
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
        
        // Extract description from JSDoc or single-line comments
        let description = null;
        
        // First, try JSDoc comment
        const jsDoc = extractJSDocForTest(match.index, content);
        if (jsDoc) {
            // Extract description from JSDoc with @description tag
            const descMatch = jsDoc.match(/@description\s+(.+?)(?=\n\s*\*\s*@|\n\s*\*\/)/s);
            if (descMatch) {
                description = descMatch[1].replace(/\n\s*\*\s*/g, ' ').trim();
            }
        }
        
        // If no JSDoc description found, try single-line comment before test
        if (!description) {
            const beforeTest = content.substring(Math.max(0, match.index - 300), match.index);
            // Match single-line comments: // @description text, // description text, //description text
            const singleLineDescMatch = beforeTest.match(/\/\/\s*@?description\s+(.+?)(?=\n|$)/i);
            if (singleLineDescMatch) {
                // Check if it's immediately before the test (with only whitespace/newlines between)
                const afterComment = beforeTest.substring(beforeTest.lastIndexOf(singleLineDescMatch[0]) + singleLineDescMatch[0].length);
                if (/^\s*$/.test(afterComment)) {
                    description = singleLineDescMatch[1].trim();
                }
            }
        }
        
        // Get all associated metadata
        const bugId = jiraMap.get(testId) || null;
        const priority = priorityMap.get(testId) || null;
        const feature = featureMap.get(testId) || null;
        const tags = tagsMap.get(testId) || null;
        // Check if test is explicitly skipped OR inside a skipped test suite
        const isSkipped = skippedMap.get(testId) || isInsideSkippedSuite(match.index);
        
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
 * @param {Set} codeCompositeKeys - Set to store found composite keys (filePath::testId)
 * @param {Map} testDataMap - Map to store test metadata with composite keys
 */
function scanDirectory(dir, codeCompositeKeys, testDataMap) {
    const files = fs.readdirSync(dir);
    console.log(`📁 Scanning directory: ${dir}`);
    console.log(`   Found ${files.length} items:`, files);
    
    files.forEach(file => {
        console.log(`   Processing: ${file}`);
        const filePath = path.join(dir, file);
        const stat = fs.statSync(filePath);

        if (stat.isDirectory()) {
            console.log(`      ↳ Directory detected, recursing...`);
            scanDirectory(filePath, codeCompositeKeys, testDataMap);
        } 
        else if (CONFIG.fileExtensions.some(ext => file.endsWith(ext))) {
            console.log(`      ↳ Test file matched!`);
            
            // Extract detailed metadata from test file
            const fileTestData = extractTestMetadata(filePath);
            
            // Merge into main testDataMap and add composite keys to codeCompositeKeys
            fileTestData.forEach((metadata, testId) => {
                const compositeKey = `${filePath}::${testId}`;
                codeCompositeKeys.add(compositeKey);
                testDataMap.set(compositeKey, metadata);
            });
            
            console.log(`      ↳ Found ${fileTestData.size} test(s) with metadata`);
        } else {
            console.log(`      ↳ Skipped (not a test file), extension: ${path.extname(file)}`);
        }
    });
}

/**
 * Scan the codebase for test IDs and extract metadata
 * @returns {Object} Object containing codeCompositeKeys (Set) and testDataMap (Map)
 */
function scanCodebaseForTestMetadata() {
    console.log('🔍 Scanning codebase for Test IDs and Metadata...');
    const codeCompositeKeys = new Set();
    const testDataMap = new Map();
    
    scanDirectory(CONFIG.testsDir, codeCompositeKeys, testDataMap);
    
    console.log(`   ✓ Found ${codeCompositeKeys.size} unique tests in code (file-scoped)`);
    console.log(`   ✓ Extracted metadata for ${testDataMap.size} tests`);
    
    return { codeCompositeKeys, testDataMap };
}

/**
 * Sync all test metadata from code to YAML manifest (force override)
 * @param {Array} manifest - Test manifest array
 * @param {Map} testDataMap - Map of composite key to metadata
 * @returns {number} Count of tests synced
 */
function syncAllTestMetadata(manifest, testDataMap) {
    console.log('🔄 Syncing ALL test metadata from code (force override)...');
    let syncCount = 0;
    
    manifest.forEach(test => {
        const compositeKey = `${test.testFile}::${test.test_id}`;
        const codeMetadata = testDataMap.get(compositeKey);
        
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
    console.log(`   ✓ Total tests processed: ${manifest.filter(t => testDataMap.has(`${t.testFile}::${t.test_id}`)).length}`);
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
 * @param {Set} codeCompositeKeys - Set of composite keys found in code
 */
function syncManifestWithCode(manifest, codeCompositeKeys) {
    console.log('🔄 Syncing isAutomated status with code...');
    let updateCount = 0;
    
    manifest.forEach(test => {
        const compositeKey = `${test.testFile}::${test.test_id}`;
        const existsInCode = codeCompositeKeys.has(compositeKey);
        
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
 * @param {Set} codeCompositeKeys - Set of composite keys found in code
 * @param {Array} yamlCompositeKeys - Array of composite keys from manifest
 * @returns {Array} Array of shadow test composite keys
 */
function detectShadowTests(codeCompositeKeys, yamlCompositeKeys) {
    const missingInYaml = Array.from(codeCompositeKeys).filter(key => !yamlCompositeKeys.includes(key));
    
    if (missingInYaml.length > 0) {
        console.error('\n❌ ERROR: Shadow Tests Detected!');
        console.error('The following tests exist in code but are NOT registered in tests.yaml:');
        missingInYaml.forEach(key => {
            const [file, id] = key.split('::');
            console.error(`  - ${id} in ${file}`);
        });
    }
    
    return missingInYaml;
}

/**
 * Detect orphaned tests (tests in manifest but not in code)
 * @param {Array} yamlCompositeKeys - Array of composite keys from manifest
 * @param {Set} codeCompositeKeys - Set of composite keys found in code
 * @returns {Array} Array of orphaned test composite keys
 */
function detectOrphanedTests(yamlCompositeKeys, codeCompositeKeys) {
    const missingInCode = yamlCompositeKeys.filter(key => !codeCompositeKeys.has(key));
    
    if (missingInCode.length > 0) {
        console.warn('\n⚠️  WARNING: Orphaned Tests Detected!');
        console.warn('The following tests are registered in tests.yaml but do NOT exist in code:');
        console.warn('\x1b[33m%s\x1b[0m', '(These tests may have been deleted or renamed)');
        missingInCode.forEach(key => {
            const [file, id] = key.split('::');
            console.warn(`\x1b[33m  - ${id} in ${file}\x1b[0m`);
        });
    }
    
    return missingInCode;
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
 * @param {Array} orphanedTests - Array of orphaned test IDs
 * @returns {Object} Statistics object
 */
function calculateStatistics(manifest, yamlIds, shadowTests, orphanedTests) {
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
        orphanedTestsCount: orphanedTests.length,
        orphanedTestsList: orphanedTests,
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
 * @param {boolean} hasShadowTests - Whether shadow tests were detected
 * @param {boolean} hasOrphanedTests - Whether orphaned tests were detected
 */
function displayResultsAndExit(stats, hasShadowTests, hasOrphanedTests) {
    console.log('\n✅ Sync Complete!');
    console.table(stats);
    
    if (hasOrphanedTests) {
        console.warn('\n⚠️  Note: Orphaned tests found. Consider removing them from tests.yaml or updating the test files.');
    }
    
    if (hasShadowTests) {
        console.error('\n❌ Action Required: Please register the shadow tests in tests.yaml.');
        process.exit(1); // Fails the CI Build
    }
}

/**
 * Main execution function
 */
function main() {
    console.log('🚀 Starting Test Manifest Sync...\n');
    
    // 1. Load YAML manifest
    const { manifest, yamlCompositeKeys } = loadYamlManifest();
    
    // 2. Scan codebase for test IDs and extract metadata
    const { codeCompositeKeys, testDataMap } = scanCodebaseForTestMetadata();
    
    // 3. Sync automation status (isAutomated flag)
    syncManifestWithCode(manifest, codeCompositeKeys);
    
    // 4. Sync ALL test metadata from code to YAML (force override)
    syncAllTestMetadata(manifest, testDataMap);
    
    // 5. Detect shadow tests (in code but not in manifest)
    const shadowTests = detectShadowTests(codeCompositeKeys, yamlCompositeKeys);
    
    // 6. Detect orphaned tests (in manifest but not in code)
    const orphanedTests = detectOrphanedTests(yamlCompositeKeys, codeCompositeKeys);
    
    // 7. Save updated manifest
    saveManifestToYaml(manifest);
    
    // 8. Calculate and save statistics
    const yamlIds = manifest.map(item => item.test_id);
    const stats = calculateStatistics(manifest, yamlIds, shadowTests, orphanedTests);
    saveStatistics(stats);
    
    // 9. Display results and exit if needed
    displayResultsAndExit(stats, shadowTests.length > 0, orphanedTests.length > 0);
}

// Execute main function
main();