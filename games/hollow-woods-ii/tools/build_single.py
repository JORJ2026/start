"""Build one self-contained hollow.html (all scripts and levels inlined)."""
import re, sys, os
root = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
html = open(os.path.join(root, 'index.html')).read()
def inline(m):
    code = open(os.path.join(root, m.group(1))).read().replace('</script', '<\\/script')
    return '<script>\n' + code + '\n</script>'
out = re.sub(r'<script src="([^"]+)"></script>', inline, html)
open(sys.argv[1], 'w').write(out)
print(len(out) // 1024, 'KB')
