const fs = require('fs');
const path = '/Users/chenzhikun/project/GitHub/claudeBuild/corvo-bianco/src/data/content.js';
let content = fs.readFileSync(path, 'utf-8');

// Match patterns like: '(豆狸) XXX狸~\n(粒狸) ……XXX狸！'
// or: '(豆狸) XXX狸！\n(粒狸) ……XXX狸！'
content = content.replace(
  /'\(豆狸\) (.+?)狸[！~！]\n\(粒狸\) (…….+?狸[！）]?）?)'/g,
  (match, mainPart, liRepeat) => {
    let repeatClean = liRepeat.replace(/[';]$/, '');
    return `'豆狸&粒狸: ${mainPart}狸！ ( ${repeatClean}）'`;
  }
);

fs.writeFileSync(path, content);
console.log('Done - conversion complete');
