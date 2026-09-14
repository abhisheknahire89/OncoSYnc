const fs = require('fs');
const js = fs.readFileSync('js/app.js', 'utf8');

const regex = /<button[^>]*class="[^"]*btn[^"]*"[^>]*>/g;
let match;
while ((match = regex.exec(js)) !== null) {
  if (!match[0].includes('id=')) {
    console.log(match[0]);
  }
}
