const fs = require('fs');
const path = require('path');

const targetFile = path.join(__dirname, 'app/page.tsx');
let content = fs.readFileSync(targetFile, 'utf8');

// 1. Import PathSelectionStage and UserPath
content = content.replace(
  "import { Stage, DataRow, DataSchema } from '@/lib/types';",
  "import PathSelectionStage from '@/components/stages/PathSelectionStage';\nimport { Stage, UserPath, DataRow, DataSchema } from '@/lib/types';"
);

// 2. Add userPath state
content = content.replace(
  "const [stage, setStage] = useState<Stage>('ingest');",
  "const [stage, setStage] = useState<Stage>('ingest');\n  const [userPath, setUserPath] = useState<UserPath>(null);"
);

// 3. Update localforage saving
content = content.replace(
  "stage, appliedOps: Array.from(appliedOps)",
  "stage, userPath, appliedOps: Array.from(appliedOps)"
);
content = content.replace(
  "setStage(data.stage);",
  "setStage(data.stage);\n    if (data.userPath) setUserPath(data.userPath);"
);

// 4. Update CleanStage onProceed
content = content.replace(
  "onProceed={() => setStage('ethics')}",
  "onProceed={() => setStage('path-selection')}"
);

// 5. Update PipelineBar props
content = content.replace(
  /<PipelineBar\s+current=\{stage\}\s+hasData=\{rawRows\.length > 0\}\s+onStageClick=\{setStage\}\s+\/>/m,
  `<PipelineBar
            current={stage}
            userPath={userPath}
            hasData={rawRows.length > 0}
            onStageClick={setStage}
          />`
);

// 6. Insert PathSelectionStage in the main body
const pathSelectionCode = `
        {stage === 'path-selection' && (
          <PathSelectionStage 
            onSelectPath={(path) => {
              setUserPath(path);
              if (path === 'analyst') setStage('analyze');
              else if (path === 'bi') setStage('dashboard');
              else if (path === 'ds') setStage('model');
            }}
          />
        )}
        {stage === 'ethics' && (`;

content = content.replace("{stage === 'ethics' && (", pathSelectionCode);

fs.writeFileSync(targetFile, content);
console.log('Patched app/page.tsx successfully.');
