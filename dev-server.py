#!/usr/bin/env python3
"""Local dev server for postAI. Plain http.server, but with caching fully
disabled — browsers were serving stale JS modules from disk cache after
edits (even across full reloads), which made live testing unreliable.
"""
import http.server
import sys


class NoCacheHandler(http.server.SimpleHTTPRequestHandler):
    def end_headers(self):
        self.send_header('Cache-Control', 'no-store, no-cache, must-revalidate, max-age=0')
        self.send_header('Pragma', 'no-cache')
        super().end_headers()


if __name__ == '__main__':
    port = int(sys.argv[1]) if len(sys.argv) > 1 else 8123
    http.server.test(HandlerClass=NoCacheHandler, port=port, bind='0.0.0.0')
