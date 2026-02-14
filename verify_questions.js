const fs = require('fs');
const path = require('path');

const files = [
    './questions_medium_he.js',
    './questions_hard_en.js'
];

files.forEach(file => {
    const filePath = path.resolve(__dirname, file);
    try {
        const content = fs.readFileSync(filePath, 'utf8');
        // valid syntax check using Function constructor
        new Function(content);
        console.log(`PASS: ${file} is syntactically valid.`);
    } catch (e) {
        console.error(`FAIL: ${file} has syntax error: ${e.message}`);
        process.exit(1);
    }
});
