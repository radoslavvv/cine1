const fs = require('node:fs');
const path = require('node:path');
const ts = require('../src/frontend/node_modules/typescript');
const prettier = require('../src/frontend/node_modules/prettier');

const root = path.resolve(__dirname, '..');
const check = process.argv.includes('--check');

function sourceFiles(directory) {
  return fs.readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    const filename = path.join(directory, entry.name);

    if (entry.isDirectory()) {
      if (
        ['node_modules', 'dist', 'bin', 'obj', 'coverage'].includes(entry.name)
      ) {
        return [];
      }

      return sourceFiles(filename);
    }

    if (/\.(?:[cm]?js|tsx?)$/.test(entry.name)) {
      return [filename];
    }

    return [];
  });
}

function statementGroup(statement) {
  if (ts.isImportDeclaration(statement)) {
    return 'import';
  }

  if (ts.isVariableStatement(statement)) {
    if (
      statement.declarationList.declarations.some((declaration) => {
        return (
          declaration.initializer && ts.isArrowFunction(declaration.initializer)
        );
      })
    ) {
      return undefined;
    }

    return 'declaration';
  }

  if (ts.isExpressionStatement(statement)) {
    return 'operation';
  }

  return undefined;
}

function formatReadable(filename, source) {
  const tree = ts.createSourceFile(
    filename,
    source,
    ts.ScriptTarget.Latest,
    true,
  );
  const insertions = new Map();

  function insert(position, text) {
    const existing = insertions.get(position) ?? '';

    insertions.set(position, existing + text);
  }

  function separateStatements(statements) {
    for (let index = 1; index < statements.length; index += 1) {
      const previous = statements[index - 1];
      const current = statements[index];
      const group = statementGroup(previous);

      if (group && group === statementGroup(current)) {
        continue;
      }

      const gap = source.slice(previous.end, current.getStart(tree));

      if (!/\n\s*\n/.test(gap)) {
        insert(previous.end, '\n\n');
      }
    }
  }

  function visit(node) {
    const namedArrow =
      ts.isArrowFunction(node) &&
      ts.isVariableDeclaration(node.parent) &&
      node.parent.initializer === node &&
      !ts.isBlock(node.body);

    if (namedArrow) {
      insert(node.body.getFullStart(), '\n{\nreturn (');
    }

    function visitBody(body) {
      if (ts.isBlock(body)) {
        visit(body);

        return;
      }

      insert(body.getFullStart(), ' {\n');
      visit(body);
      insert(body.end, '\n}');
    }

    if (ts.isIfStatement(node)) {
      visit(node.expression);
      visitBody(node.thenStatement);

      if (node.elseStatement) {
        if (ts.isIfStatement(node.elseStatement)) {
          visit(node.elseStatement);
        } else {
          visitBody(node.elseStatement);
        }
      }
    } else if (
      ts.isForStatement(node) ||
      ts.isForOfStatement(node) ||
      ts.isForInStatement(node) ||
      ts.isWhileStatement(node) ||
      ts.isDoStatement(node)
    ) {
      ts.forEachChild(node, (child) => {
        if (child === node.statement) {
          visitBody(child);
        } else {
          visit(child);
        }
      });
    } else {
      ts.forEachChild(node, visit);
    }

    if (namedArrow) {
      insert(node.body.end, ');\n}');
    }

    if (ts.isBlock(node) || ts.isSourceFile(node)) {
      separateStatements(node.statements);
    }
  }

  visit(tree);

  let result = source;

  for (const [position, text] of [...insertions].sort((left, right) => {
    return right[0] - left[0];
  })) {
    result = result.slice(0, position) + text + result.slice(position);
  }

  return result;
}

async function main() {
  let changed = 0;

  for (const directory of ['src/frontend', 'scripts']) {
    for (const filename of sourceFiles(path.join(root, directory))) {
      const source = fs.readFileSync(filename, 'utf8');
      const options = await prettier.resolveConfig(filename);
      const formatted = await prettier.format(
        formatReadable(filename, source),
        {
          ...options,
          filepath: filename,
        },
      );

      if (formatted === source) {
        continue;
      }

      changed += 1;

      if (check) {
        console.error(
          `Readable formatting required: ${path.relative(root, filename)}`,
        );
      } else {
        fs.writeFileSync(filename, formatted);
      }
    }
  }

  if (check && changed > 0) {
    process.exitCode = 1;
  }

  console.log(
    `Readable formatting: ${changed} file(s) ${check ? 'need changes' : 'updated'}.`,
  );
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
