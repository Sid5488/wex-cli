#!/usr/bin/env node

import { Command } from 'commander';
import fs from 'fs';
import path from 'path';
import { execSync } from 'child_process';
import { createRequire } from 'module';

const require = createRequire(import.meta.url);
const program = new Command();

function copyFilesRecursiveSync(source, target) {
  if (!fs.existsSync(target)) {
    fs.mkdirSync(target, { recursive: true });
  }

  if (fs.lstatSync(source).isDirectory()) {
    const files = fs.readdirSync(source);

    files.forEach((file) => {
      const curSource = path.join(source, file);
      const curTarget = path.join(target, file);

      if (fs.lstatSync(curSource).isDirectory()) {
        copyFilesRecursiveSync(curSource, curTarget);
      } else {
        fs.copyFileSync(curSource, curTarget);
      }
    });
  } else {
    fs.copyFileSync(source, target);
  }
}

function generatePackageJson(projectName, destDir) {
  const packageJson = {
    name: projectName,
    version: '1.0.0',
    description: 'My project description',
    main: './node_modules/wex-js/lib/src/server.mjs',
    type: "module",
    scripts: {
      start: 'node .',
      test: 'echo "Error: no test specified" && exit 1'
    },
    author: 'Your Name',
    license: 'ISC'
  };

  fs.writeFileSync(
    path.join(destDir, 'package.json'),
    JSON.stringify(packageJson, null, 2)
  );
}

program
  .version('1.0.0')
  .description('CLI to setup a new project with a template')
  .argument('<project-name>', 'Name of the new project')
  .action((projectName) => {
    const currentDir = process.cwd();
    const destDir = path.join(currentDir, projectName);

    try {
      if (!fs.existsSync(destDir)) {
        fs.mkdirSync(destDir, { recursive: true });
      }

      generatePackageJson(projectName, destDir);
      execSync('npm install wex-js', { cwd: destDir, stdio: 'inherit' });

      const libPath = path.join(destDir, "node_modules");
      const [wexJsPath, ] = path.dirname(require.resolve("wex-js", { paths: [libPath] })).split("src");
      const sourceDir = path.join(wexJsPath, 'template');

      copyFilesRecursiveSync(sourceDir, destDir);

      console.log(`Project ${projectName} setup and wex-js installed successfully!`);
      console.log(`Next steps:`);
      console.log(`1. cd ${projectName}`);
      console.log(`2. npm start`);
    } catch (err) {
      console.error(`Error setting up project: ${err.message}`);
    }
  });

if (process.argv[2] === undefined) {
  process.argv[2] = "my-app";
}

program.parse(process.argv);
