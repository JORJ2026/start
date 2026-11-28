#!/usr/bin/env python3
"""Serve Hollow at http://127.0.0.1:8765 and open it in the browser (standard library only).
You can also just open index.html directly."""
import argparse, functools, http.server, os, threading, webbrowser

ap = argparse.ArgumentParser(description='Run Hollow locally.')
ap.add_argument('--port', type=int, default=8765)
ap.add_argument('--no-browser', action='store_true')
args = ap.parse_args()
root = os.path.dirname(os.path.abspath(__file__))
Handler = functools.partial(http.server.SimpleHTTPRequestHandler, directory=root)
Handler.log_message = lambda *a, **k: None
srv = http.server.ThreadingHTTPServer(('127.0.0.1', args.port), Handler)
url = f'http://127.0.0.1:{args.port}/'
print(f'Hollow running at {url}  (Ctrl+C to stop)')
if not args.no_browser:
    threading.Timer(0.4, lambda: webbrowser.open(url)).start()
try:
    srv.serve_forever()
except KeyboardInterrupt:
    print('\nStopped.')
