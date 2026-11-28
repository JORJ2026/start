// Inlines src/*.js and src/style.css into one self-contained dist/index.html.
import fs from 'node:fs';
import path from 'node:path';
const root = path.resolve(path.dirname(new URL(import.meta.url).pathname), '..');
const srcDir = fs.existsSync(path.join(root, 'src')) ? 'src' : 'source';
const order = ['core', 'story', 'audio', 'world', 'game', 'render', 'input', 'ui', 'main'];
const js = order.map(n => `// ===== ${n}.js =====\n` + fs.readFileSync(path.join(root, srcDir, n + '.js'), 'utf8')).join('\n');
const css = fs.readFileSync(path.join(root, srcDir, 'style.css'), 'utf8');
let html = fs.readFileSync(path.join(root, srcDir, 'template.html'), 'utf8');
html = html.replace('/*CSS*/', () => css).replace('/*JS*/', () => js);
fs.mkdirSync(path.join(root, 'dist'), { recursive: true });
fs.writeFileSync(path.join(root, 'dist', 'index.html'), html);
console.log('built dist/index.html', (html.length / 1024).toFixed(1) + ' KB');
