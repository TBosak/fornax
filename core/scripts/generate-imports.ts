import { readdirSync, writeFileSync } from 'fs';
import { basename, extname, join, resolve } from 'path';
import { loadConfig } from './load-config';
import { copyFolderRecursiveSync } from '../Utilities';

const config = loadConfig();

try{
const componentsDir = resolve(config.srcDir, './app/components');
const srcDir = resolve(config.srcDir);
const srcFiles = readdirSync(config.srcDir);
const componentFiles = readdirSync(componentsDir);
const imports = getImportPaths(componentFiles, componentsDir) + '\n' + getImportPaths(srcFiles, srcDir);
function getImportPaths(files: string[], dir: string): string {
  return files.filter((file: any) => {
    const ext = extname(file);
    return (ext === '.ts' || ext === '.tsx') && !file.endsWith('main.ts');
  })
  .map((file: any) => {
    const importPath = `${dir.replaceAll("\\","/")}/${basename(file, extname(file))}`;
    return `import "${importPath}";`;
  })
  .join('\n');
}

const code = imports;
const entryFile = join(process.cwd(), 'main.ts');
const routes = join(config.srcDir, 'routes.ts');

writeFileSync(entryFile, code, 'utf-8');

const build = await Bun.build({
  entrypoints: [entryFile, routes],
  outdir: config.distDir,
  target: "browser",
  splitting: true,
  minify: true,
  naming: {
    entry: '[name].[ext]'
  },
});

copyFolderRecursiveSync(join(config.srcDir, 'assets'), join(config.distDir, 'assets'));

if(build.logs.length){
  console.log(build.logs);
}

}catch(e){
  console.error(e);
}