const fs = require('fs');
const path = require('path');

const targetFile = path.join(__dirname, 'app/globals.css');
// Read the raw buffer
const buf = fs.readFileSync(targetFile);

// The original file is UTF-8. Powershell appended UTF-16 LE at the end.
// We know the good file ends around line 1164. Let's just read as utf8 and split at the first null byte \x00
let content = buf.toString('utf8');
const nullIndex = content.indexOf('\x00');

if (nullIndex !== -1) {
  content = content.substring(0, nullIndex);
  // Also trim back to the last newline before the null byte, just in case
  const lastNewline = content.lastIndexOf('\n');
  if (lastNewline !== -1) {
    content = content.substring(0, lastNewline);
  }
}

// Now append the correct string in UTF-8
const newCSS = `

/* Active/Input Dark Mode States */
.btn:active, 
.btn-primary:active, 
.btn-secondary:active {
  background-color: #0f172a !important;
  color: #f8fafc !important;
  border-color: #0f172a !important;
}

input:focus,
input:not(:placeholder-shown),
textarea:focus,
textarea:not(:placeholder-shown),
select:focus {
  background-color: #0f172a !important;
  color: #f8fafc !important;
  border-color: #0f172a !important;
}
`;

fs.writeFileSync(targetFile, content + newCSS, 'utf8');
console.log('Fixed CSS encoding issue!');
