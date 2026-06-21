const fs = require('fs');
const path = require('path');

function walk(dir) {
  let results = [];
  const list = fs.readdirSync(dir);
  list.forEach(file => {
    file = path.join(dir, file);
    const stat = fs.statSync(file);
    if (stat && stat.isDirectory()) {
      results = results.concat(walk(file));
    } else {
      if (file.endsWith('.d.ts')) {
        results.push(file);
      }
    }
  });
  return results;
}

try {
  const configPath = path.join(__dirname, 'node_modules', '@prisma', 'config');
  if (fs.existsSync(configPath)) {
    const files = walk(configPath);
    files.forEach(filepath => {
      const content = fs.readFileSync(filepath, 'utf8');
      if (content.includes('PrismaConfig') || content.includes('SchemaEngineConfigClassic')) {
        console.log('\n=========================================');
        console.log(`Found in: ${path.relative(__dirname, filepath)}`);
        const lines = content.split('\n');
        for (let i = 0; i < lines.length; i++) {
          if (lines[i].includes('type PrismaConfig') || lines[i].includes('interface PrismaConfig') || lines[i].includes('SchemaEngineConfigClassic')) {
            console.log(lines.slice(Math.max(0, i - 10), i + 35).join('\n'));
          }
        }
      }
    });
  } else {
    console.log('@prisma/config folder does not exist');
  }
} catch (e) {
  console.error(e);
}
