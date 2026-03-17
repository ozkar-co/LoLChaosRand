#!/usr/bin/env python3
"""Minimal HTTP server for LoLChaosRand.

Serves static files from the current directory and exposes a /health endpoint.
"""

import json
import time
from http.server import HTTPServer, SimpleHTTPRequestHandler

START_TIME = time.time()


class Handler(SimpleHTTPRequestHandler):
    def do_GET(self):
        path = self.path.split("?")[0]
        if path == "/health":
            body = json.dumps({"status": "ok", "uptime": round(time.time() - START_TIME)}).encode()
            self.send_response(200)
            self.send_header("Content-Type", "application/json")
            self.send_header("Content-Length", str(len(body)))
            self.end_headers()
            self.wfile.write(body)
        else:
            super().do_GET()

    def log_message(self, fmt, *args):
        print(f"[{self.log_date_time_string()}] {fmt % args}")


if __name__ == "__main__":
    port = 3003
    server = HTTPServer(("", port), Handler)
    print(f"Serving on http://localhost:{port}")
    server.serve_forever()
