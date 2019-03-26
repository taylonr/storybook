import rollup from 'rollup';
import path from 'path';
import fs from 'fs-extra';
import findCacheDir from 'find-cache-dir';

const cacheDir = findCacheDir({ name: 'storybook' });
const workDir = process.cwd();


async function build(input) {
  const bundle = await rollup.rollup({ input });
  await bundle.write({
    dir: cacheDir,
    format: 'esm',
  });
}

export const splitter = async ({ configFile }) => {
  const fullConfig = require(configFile);
  const managerExports = ['entries', 'preview'].filter(i => !!fullConfig[i])
  const previewExports = ['entries', 'preview'].filter(i => !!fullConfig[i])

  const managerConfig = `
    export { ${managerExports.join(', ')} } from '${configFile}';
  `;
  const previewConfig = `
    export { ${previewExports.join(', ')} } from '${configFile}';
  `;

  const managerConfigLocation = path.join(cacheDir, 'managerConfigRaw.js');
  const previewConfigLocation = path.join(cacheDir, 'previewConfigRaw.js');

  await fs.outputFile(managerConfigLocation, managerConfig);
  await fs.outputFile(previewConfigLocation, previewConfig);

  await build(managerConfigLocation);
  await build(previewConfigLocation);
}

splitter({ configFile: path.join(__dirname, '..', 'storybook.config.js')}).then(() => console.log('success'), (e) => console.log('failure', e))
