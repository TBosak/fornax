import { readdirSync, writeFileSync } from 'fs';
import { basename, extname, resolve } from 'path';

try{
const componentsDir = resolve(__dirname, '../components');
const files = readdirSync(componentsDir);

const imports = files
  .filter((file: any) => {
    const ext = extname(file);
    return ext === '.ts' || ext === '.tsx';
  })
  .map((file: any) => {
    const importPath = `./components/${basename(file, extname(file))}`;
    return `import '${importPath}';`;
  })
  .join('\n');

writeFileSync("main.ts", "import './src/Routing';\n" + imports);
}catch(e){
  console.error(e);
}