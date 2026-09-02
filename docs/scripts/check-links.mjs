import { access, readFile, readdir } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const siteBase = '/PICR';
const repositoryEditBase =
  'https://github.com/IsaacInsoll/PICR/edit/master/docs/';
const contentSourceRoot = 'src/content/docs/';
const outputDirectory = fileURLToPath(new URL('../dist/', import.meta.url));
const htmlFiles = [];
const failures = [];
let editLinkCount = 0;

async function collectHtmlFiles(directory) {
  const entries = await readdir(directory, { withFileTypes: true });

  for (const entry of entries) {
    const entryPath = path.join(directory, entry.name);

    if (entry.isDirectory()) {
      await collectHtmlFiles(entryPath);
    } else if (entry.name.endsWith('.html')) {
      htmlFiles.push(entryPath);
    }
  }
}

async function exists(filePath) {
  try {
    await access(filePath);
    return true;
  } catch {
    return false;
  }
}

function outputPathFor(pathname) {
  const relativePath = pathname.slice(siteBase.length).replace(/^\//, '');
  const candidate = path.join(outputDirectory, relativePath);

  if (pathname.endsWith('/') || pathname === siteBase) {
    return path.join(candidate, 'index.html');
  }

  return candidate;
}

await collectHtmlFiles(outputDirectory);

for (const sourceFile of htmlFiles) {
  const sourceHtml = await readFile(sourceFile, 'utf8');
  const references = sourceHtml.matchAll(/(?:href|src)=["']([^"']+)["']/g);

  for (const [, reference] of references) {
    if (reference.startsWith('https://github.com/IsaacInsoll/PICR/edit/')) {
      editLinkCount += 1;

      const sourcePath = reference.slice(repositoryEditBase.length);
      const sourceRootOccurrences =
        sourcePath.split(contentSourceRoot).length - 1;

      if (
        !reference.startsWith(repositoryEditBase) ||
        !sourcePath.startsWith(contentSourceRoot) ||
        sourceRootOccurrences !== 1
      ) {
        failures.push(
          `${path.relative(outputDirectory, sourceFile)} -> ${reference} (invalid edit link)`,
        );
      }
    }

    if (reference !== siteBase && !reference.startsWith(`${siteBase}/`)) {
      continue;
    }

    const url = new URL(reference, 'https://picr.example');
    let targetFile = outputPathFor(decodeURIComponent(url.pathname));

    if (!(await exists(targetFile)) && !path.extname(targetFile)) {
      targetFile = path.join(targetFile, 'index.html');
    }

    if (!(await exists(targetFile))) {
      failures.push(
        `${path.relative(outputDirectory, sourceFile)} -> ${reference}`,
      );
      continue;
    }

    if (url.hash && targetFile.endsWith('.html')) {
      const targetHtml = await readFile(targetFile, 'utf8');
      const anchor = decodeURIComponent(url.hash.slice(1));
      const escapedAnchor = anchor.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

      if (!new RegExp(`id=["']${escapedAnchor}["']`).test(targetHtml)) {
        failures.push(
          `${path.relative(outputDirectory, sourceFile)} -> ${reference} (missing anchor)`,
        );
      }
    }
  }
}

if (editLinkCount === 0) {
  failures.push('No generated documentation edit links were found.');
}

if (failures.length > 0) {
  console.error('Generated documentation contains broken internal links:');
  console.error(failures.map((failure) => `- ${failure}`).join('\n'));
  process.exitCode = 1;
} else {
  console.log(
    `Validated ${htmlFiles.length} generated HTML files, their internal ${siteBase} links, and ${editLinkCount} edit links.`,
  );
}
