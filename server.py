#!/usr/bin/env python3
"""Minimal HTTP server for LoLChaosRand.

Serves static files from the current directory and exposes a /health endpoint.
Injects dynamic Open Graph meta tags into index.html for social media sharing.
"""

import html
import json
import os
import re
import time
from http.server import HTTPServer, SimpleHTTPRequestHandler
from urllib.parse import parse_qs, urlparse

START_TIME = time.time()
BASE_DIR = os.path.dirname(os.path.abspath(__file__))

# Data loaded at startup
_CHAMPION_NAMES: dict[str, str] = {}
_ROLE_NAMES: dict[str, str] = {}
_BUILD_NAMES: set[str] = set()
_INDEX_HTML: str = ""
_OG_BLOCK_RE = re.compile(r"<!-- og:meta-start -->.*?<!-- og:meta-end -->", re.DOTALL)


def _load_data() -> None:
    """Load champion, role, and build data from JSON files."""
    champion_file = os.path.join(BASE_DIR, "data", "champion.json")
    with open(champion_file, encoding="utf-8") as f:
        champion_json = json.load(f)
    for champ in champion_json["data"].values():
        _CHAMPION_NAMES[champ["id"]] = champ["name"]

    role_file = os.path.join(BASE_DIR, "data", "roles.json")
    with open(role_file, encoding="utf-8") as f:
        role_json = json.load(f)
    for role in role_json["roles"]:
        _ROLE_NAMES[role["id"]] = role["name"]

    playstyle_file = os.path.join(BASE_DIR, "data", "playstyle.json")
    with open(playstyle_file, encoding="utf-8") as f:
        playstyle_json = json.load(f)
    for style in playstyle_json["playstyles"]:
        for build in style["builds"]:
            _BUILD_NAMES.add(build["name"])

    global _INDEX_HTML
    index_path = os.path.join(BASE_DIR, "index.html")
    with open(index_path, encoding="utf-8") as f:
        _INDEX_HTML = f.read()


def _get_base_url(handler: "Handler") -> str:
    """Derive the base URL from request headers."""
    host = handler.headers.get("Host", f"localhost:{handler.server.server_address[1]}")
    forwarded_proto = handler.headers.get("X-Forwarded-Proto", "")
    if forwarded_proto in ("http", "https"):
        scheme = forwarded_proto
    elif host.split(":")[0] in ("localhost", "127.0.0.1"):
        scheme = "http"
    else:
        scheme = "https"
    return f"{scheme}://{host}"


def _build_og_tags(base_url: str, current_url: str, champion_id: str, role_id: str, build_name: str) -> str:
    """Build Open Graph and Twitter Card meta tag HTML for social sharing."""
    champion_name = _CHAMPION_NAMES.get(champion_id, "")
    role_name = _ROLE_NAMES.get(role_id, "")
    valid_build = build_name if build_name in _BUILD_NAMES else ""

    if champion_name and role_name and valid_build:
        title = f"{champion_name} · {role_name} · {valid_build} | LoL Chaos Randomizer"
        desc = (
            f"¡Me salió {champion_name} de {role_name} con build {valid_build}! "
            "¿Te atreves a girar la ruleta del caos en League of Legends?"
        )
    elif champion_name:
        title = f"{champion_name} | LoL Chaos Randomizer"
        desc = (
            f"¡Me salió {champion_name}! "
            "¿Te atreves a girar la ruleta del caos en League of Legends?"
        )
    else:
        title = "LoL Chaos Randomizer"
        desc = (
            "Ruleta de caos para League of Legends: gira y recibe un campeón, "
            "un rol y una build absurda. ¿Te atreves?"
        )

    if champion_name:
        image_url = f"{base_url}/assets/loading/{champion_id}.jpg"
    else:
        image_url = f"{base_url}/assets/tiles/Ahri.jpg"

    t = html.escape(title)
    d = html.escape(desc)
    img = html.escape(image_url)
    url = html.escape(current_url)

    return (
        f'    <meta name="description" content="{d}" />\n'
        f'    <meta property="og:site_name" content="LoL Chaos Randomizer" />\n'
        f'    <meta property="og:type" content="website" />\n'
        f'    <meta property="og:url" content="{url}" />\n'
        f'    <meta property="og:title" content="{t}" />\n'
        f'    <meta property="og:description" content="{d}" />\n'
        f'    <meta property="og:image" content="{img}" />\n'
        f'    <meta name="twitter:card" content="summary_large_image" />\n'
        f'    <meta name="twitter:title" content="{t}" />\n'
        f'    <meta name="twitter:description" content="{d}" />\n'
        f'    <meta name="twitter:image" content="{img}" />'
    )


class Handler(SimpleHTTPRequestHandler):
    def do_GET(self):
        parsed = urlparse(self.path)
        path = parsed.path

        if path == "/health":
            body = json.dumps({"status": "ok", "uptime": round(time.time() - START_TIME)}).encode()
            self.send_response(200)
            self.send_header("Content-Type", "application/json")
            self.send_header("Content-Length", str(len(body)))
            self.end_headers()
            self.wfile.write(body)
            return

        if path in ("/", "/index.html"):
            params = parse_qs(parsed.query)
            champion_id = params.get("champion", [""])[0]
            role_id = params.get("role", [""])[0]
            build_name = params.get("build", [""])[0]

            base_url = _get_base_url(self)
            current_url = f"{base_url}{self.path}"
            og_tags = _build_og_tags(base_url, current_url, champion_id, role_id, build_name)

            html_content = _OG_BLOCK_RE.sub(og_tags, _INDEX_HTML)

            body = html_content.encode("utf-8")
            self.send_response(200)
            self.send_header("Content-Type", "text/html; charset=utf-8")
            self.send_header("Content-Length", str(len(body)))
            self.end_headers()
            self.wfile.write(body)
            return

        super().do_GET()

    def log_message(self, fmt, *args):
        print(f"[{self.log_date_time_string()}] {fmt % args}")


if __name__ == "__main__":
    _load_data()
    port = 3003
    server = HTTPServer(("", port), Handler)
    print(f"Serving on http://localhost:{port}")
    server.serve_forever()
