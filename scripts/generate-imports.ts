import { readdirSync, writeFileSync } from 'fs';
import { basename, extname, resolve } from 'path';

try{
const componentsDir = resolve(__dirname, '../src/app/components');
const srcDir = resolve(__dirname, '../src');
const coreDir = resolve(__dirname, '../core');
const srcFiles = readdirSync(srcDir);
const componentFiles = readdirSync(componentsDir);
const imports = getImportPaths(componentFiles, componentsDir) + '\n' + getImportPaths(srcFiles, srcDir);
function getImportPaths(files: string[], dir: string): string {
  return files.filter((file: any) => {
    const ext = extname(file);
    return ext === '.ts' || ext === '.tsx';
  })
  .map((file: any) => {
    const importPath = `${dir}\\${basename(file, extname(file))}`;
    return `import "${importPath}";`;
  })
  .join('\n');
}

writeFileSync("main.ts", imports + '\n' + `import "${coreDir}\\Routing.ts";`);
}catch(e){
  console.error(e);
}