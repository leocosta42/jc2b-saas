const fs = require('fs');
const path = require('path');

const sheetPath = path.join(__dirname, 'xlsm_extracted', 'xl', 'worksheets', 'sheet2.xml');
const sharedStringsPath = path.join(__dirname, 'xlsm_extracted', 'xl', 'sharedStrings.xml');

const sheetContent = fs.readFileSync(sheetPath, 'utf8');
const sharedStringsContent = fs.existsSync(sharedStringsPath) ? fs.readFileSync(sharedStringsPath, 'utf8') : '';

const strings = [];
const regexString = /<t(?:.*?)>(.*?)<\/t>/g;
let match;
while ((match = regexString.exec(sharedStringsContent)) !== null) {
    strings.push(match[1]);
}

const rowMatches = sheetContent.match(/<row r="\d+"[\s\S]*?<\/row>/g) || [];
console.log("=== DADOS DA PLANILHA VENDEDORES ===");

for (let i = 0; i < Math.min(10, rowMatches.length); i++) {
    const row = rowMatches[i];
    const rowNumMatch = row.match(/r="(\d+)"/);
    const rowNum = rowNumMatch ? rowNumMatch[1] : '?';
    
    const cells = row.match(/<c.*?<\/c>/g) || [];
    const rowData = [];
    
    cells.forEach(cell => {
        const vMatch = cell.match(/<v>(.*?)<\/v>/);
        const typeMatch = cell.match(/t="s"/); 
        
        if (vMatch) {
            let val = vMatch[1];
            if (typeMatch) {
                val = strings[parseInt(val, 10)] || val;
            }
            rowData.push(val);
        } else {
            rowData.push('');
        }
    });
    
    console.log(`Linha ${rowNum}: ${rowData.join(' | ')}`);
}
