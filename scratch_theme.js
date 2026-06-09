const fs = require('fs');
const path = require('path');

const targetFile = path.join(__dirname, 'app/globals.css');
let content = fs.readFileSync(targetFile, 'utf8');

const darkTheme = `[data-theme="dark"] {
  /* Pitch Black Dark Theme */
  --bg-base:        #050505;
  --bg-surface:     rgba(10, 10, 12, 0.5);
  --bg-card:        rgba(20, 20, 25, 0.4);
  --bg-card-hover:  rgba(35, 35, 45, 0.6);
  --border:         rgba(255, 255, 255, 0.08);
  --border-active:  rgba(255, 255, 255, 0.15);

  --accent:         #6366F1;
  --accent-hover:   #818cf8;

  --cyan:           #06b6d4;
  --cyan-dim:       rgba(6, 182, 212, 0.15);
  --violet:         #8b5cf6;
  --violet-dim:     rgba(139, 92, 246, 0.15);
  --emerald:        #10b981;
  --amber:          #f59e0b;
  --rose:           #ef4444;
  --sky:            #38bdf8;

  --text-primary:   #FFFFFF;
  --text-secondary: #A1A1AA;
  --text-muted:     #71717A;

  --radius-sm:  8px;
  --radius-md:  8px;
  --radius-lg:  12px;
  --radius-xl:  16px;
  --transition: all 0.2s ease;
  
  --shadow-sm: 0 1px 2px rgba(0,0,0,0.4);
  --shadow-md: 0 4px 12px rgba(0,0,0,0.5);
  --shadow-lg: 0 12px 32px rgba(0,0,0,0.6);
  --shadow-glow: none;
}`;

const lightTheme = `:root, [data-theme="light"] {
  /* Crisp Light Theme */
  --bg-base:        #F8FAFC;
  --bg-surface:     #FFFFFF;
  --bg-card:        #FFFFFF;
  --bg-card-hover:  #F1F5F9;
  --border:         #E2E8F0;
  --border-active:  #CBD5E1;

  --accent:         #6366F1;
  --accent-hover:   #4f46e5;

  --cyan:           #0891b2;
  --cyan-dim:       rgba(8, 145, 178, 0.15);
  --violet:         #7c3aed;
  --violet-dim:     rgba(124, 58, 237, 0.15);
  --emerald:        #059669;
  --amber:          #d97706;
  --rose:           #dc2626;
  --sky:            #0284c7;

  --text-primary:   #0F172A;
  --text-secondary: #475569;
  --text-muted:     #64748B;

  --radius-sm:  8px;
  --radius-md:  8px;
  --radius-lg:  12px;
  --radius-xl:  16px;
  --transition: all 0.2s ease;
  
  --shadow-sm: 0 1px 2px rgba(0,0,0,0.05);
  --shadow-md: 0 4px 6px -1px rgba(0,0,0,0.1);
  --shadow-lg: 0 10px 15px -3px rgba(0,0,0,0.1);
  --shadow-glow: none;
}`;

// Replace everything between :root and [data-theme="slate"] with lightTheme
// Replace [data-theme="light"] block with darkTheme
content = content.replace(/:root, \[data-theme="dark"\] \{[\s\S]*?\}\s*\[data-theme="slate"\]/m, lightTheme + '\n\n' + darkTheme + '\n\n[data-theme="slate"]');
// Then we need to remove the old [data-theme="light"] block
content = content.replace(/\[data-theme="light"\] \{[\s\S]*?\}/, '');

fs.writeFileSync(targetFile, content);
console.log('Switched default theme to light.');
