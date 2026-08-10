import fs from 'node:fs';
import path from 'node:path';

const ROOT = path.resolve(__dirname, '..');
const SOURCE_DIRS = ['app', 'components', 'constants', 'hooks', 'lib'];

function sourceFiles(dir: string): string[] {
  return fs.readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) return sourceFiles(fullPath);
    return /\.(?:ts|tsx)$/.test(entry.name) ? [fullPath] : [];
  });
}

describe('dark theme static analysis', () => {
  const files = SOURCE_DIRS.flatMap((dir) => sourceFiles(path.join(ROOT, dir)));

  it('does not freeze mutable theme colors in module-level imports', () => {
    const directColorsImport =
      /import\s*\{[^}]*\bcolors\b[^}]*\}\s*from\s*['"][^'"]*constants\/theme['"]/s;
    const violations = files
      .filter((file) => {
        const source = fs.readFileSync(file, 'utf8');
        return directColorsImport.test(source) && /StyleSheet\.create\s*\(/.test(source);
      })
      .map((file) => path.relative(ROOT, file));

    expect(violations).toEqual([]);
  });

  it('does not use hardcoded white for page-level backgrounds', () => {
    const whitePageBackground =
      /\b(?:root|screen|container|page|safe|wrapper|shell|overlay)\s*:\s*\{[^}]{0,240}?backgroundColor\s*:\s*['"](?:#fff(?:fff)?|white)['"]/i;
    const violations = files
      .filter((file) => whitePageBackground.test(fs.readFileSync(file, 'utf8')))
      .map((file) => path.relative(ROOT, file));

    expect(violations).toEqual([]);
  });

  it('configures automatic native appearance with a dark splash background', () => {
    const appConfig = JSON.parse(fs.readFileSync(path.join(ROOT, 'app.json'), 'utf8'));
    const expo = appConfig.expo;
    const splashPlugin = expo.plugins.find(
      (plugin: unknown) => Array.isArray(plugin) && plugin[0] === 'expo-splash-screen',
    );

    expect(expo.userInterfaceStyle).toBe('automatic');
    expect(splashPlugin?.[1]?.dark?.backgroundColor).toBe('#0B1622');
  });
});
