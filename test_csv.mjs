import { readFileSync } from 'fs';

function parseCsv(filePath) { 
  let content = readFileSync(filePath, 'latin1'); 
  content = content.replace(/^\uFEFF/, ''); 
  
  let inQuotes = false; 
  let normalized = ''; 
  for(let c of content) { 
    if(c==='"') inQuotes = !inQuotes; 
    if((c==='\n'||c==='\r') && inQuotes) normalized += ' '; 
    else normalized += c; 
  } 
  
  const lines = normalized.split(/\r?\n/).filter(l=>l.trim()!==''); 
  
  // Custom CSV parser instead of split(';')
  function parseCsvLine(line) {
    const result = [];
    let current = '';
    let inQ = false;
    for (let i = 0; i < line.length; i++) {
      const char = line[i];
      if (char === '"') {
        inQ = !inQ;
      } else if (char === ';' && !inQ) {
        result.push(current);
        current = '';
      } else {
        current += char;
      }
    }
    result.push(current);
    return result;
  }
  
  const headers = parseCsvLine(lines[0]); 
  const values = parseCsvLine(lines[1]); 
  
  const r = {}; 
  headers.forEach((h,i) => {
    r[h.trim()] = (values[i] || '').trim();
  }); 
  return r; 
} 

console.log(parseCsv('imports/produtos.csv'));
