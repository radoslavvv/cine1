const fs = require('node:fs');
const path = require('node:path');

const root = path.resolve(__dirname, '..');
const source = path.join(root, 'src/frontend/src');
const moves = new Map();

function move(from, to) {
  moves.set(path.join(source, from), path.join(source, to));
}

for (const [feature, component] of [
  ['cinema-entrance', 'CinemaEntrance'],
  ['showtimes', 'ShowtimesPage'],
]) {
  for (const extension of ['tsx', 'theme.ts']) {
    move(
      `features/${feature}/${component}.${extension}`,
      `features/${feature}/components/${component}/${component}.${extension}`,
    );
  }
}

for (const [feature, component] of [
  ['cinema-entrance', 'Auditorium'],
  ['showtimes', 'DatePicker'],
]) {
  for (const extension of ['tsx', 'theme.ts']) {
    move(
      `features/${feature}/components/${component}.${extension}`,
      `features/${feature}/components/${component}/${component}.${extension}`,
    );
  }
}

for (const extension of ['tsx', 'theme.ts']) {
  move(
    `features/showtimes/artwork/MovieArtwork.${extension}`,
    `features/showtimes/components/MovieArtwork/MovieArtwork.${extension}`,
  );
}

for (const [feature, hooks] of [
  ['cinema-entrance', ['useCinemaJourney']],
  [
    'showtimes',
    [
      'useResultsSpace',
      'useShowtimesMotion',
      'useShowtimeClock',
      'useShowtimesReady',
    ],
  ],
]) {
  for (const hook of hooks)
    move(
      `features/${feature}/${hook}.ts`,
      `features/${feature}/hooks/${hook}.ts`,
    );
}

for (const component of ['Button', 'StatusMessage', 'Wordmark']) {
  move(
    `shared/ui/${component}.tsx`,
    `shared/components/${component}/${component}.tsx`,
  );
  if (component !== 'Wordmark')
    move(
      `shared/ui/${component}.theme.ts`,
      `shared/components/${component}/${component}.theme.ts`,
    );
}
move('shared/ui/usePageScrollLock.ts', 'shared/hooks/usePageScrollLock.ts');

function files(directory) {
  return fs.readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    const fullPath = path.join(directory, entry.name);
    return entry.isDirectory() ? files(fullPath) : [fullPath];
  });
}

const originals = files(source).filter((file) => /\.(ts|tsx)$/.test(file));
for (const file of originals) {
  const destination = moves.get(file) ?? file;
  let content = fs.readFileSync(file, 'utf8');
  content = content.replace(
    /((?:from\s+|import\s*)['"])(\.[^'"]+)(['"])/g,
    (match, prefix, specifier, quote) => {
      const base = path.resolve(path.dirname(file), specifier);
      const target = [
        base,
        `${base}.ts`,
        `${base}.tsx`,
        path.join(base, 'index.ts'),
      ].find(
        (candidate) =>
          fs.existsSync(candidate) && fs.statSync(candidate).isFile(),
      );
      if (!target) return match;
      const nextTarget = moves.get(target) ?? target;
      let relative = path
        .relative(path.dirname(destination), nextTarget)
        .replaceAll('\\', '/');
      relative = relative.replace(/\.(ts|tsx)$/, '');
      if (!relative.startsWith('.')) relative = `./${relative}`;
      return `${prefix}${relative}${quote}`;
    },
  );
  fs.mkdirSync(path.dirname(destination), { recursive: true });
  fs.writeFileSync(destination, content);
}

for (const original of moves.keys()) fs.unlinkSync(original);

// All removals are explicitly scoped to repository test paths.
for (const relative of [
  'tests',
  'src/frontend/tests',
  'scripts/verify-backend.ps1',
]) {
  const target = path.resolve(root, relative);
  if (!target.startsWith(`${root}${path.sep}`))
    throw new Error('Removal outside repository');
  fs.rmSync(target, { recursive: true, force: true });
}

const packagePath = path.join(root, 'src/frontend/package.json');
const packageJson = JSON.parse(fs.readFileSync(packagePath, 'utf8'));
delete packageJson.scripts.test;
fs.writeFileSync(packagePath, `${JSON.stringify(packageJson, null, 2)}\n`);

const solutionPath = path.join(root, 'CinemaR.slnx');
fs.writeFileSync(
  solutionPath,
  fs
    .readFileSync(solutionPath, 'utf8')
    .replace(/  <Folder Name="\/tests\/">[\s\S]*?<\/Folder>\r?\n/, ''),
);

function cleanEmptyDirectories(directory) {
  for (const entry of fs.readdirSync(directory, { withFileTypes: true })) {
    if (entry.isDirectory())
      cleanEmptyDirectories(path.join(directory, entry.name));
  }
  if (fs.readdirSync(directory).length === 0) fs.rmdirSync(directory);
}
cleanEmptyDirectories(source);
