#!/usr/bin/env python3
"""
Simple HTTP server for Tetris game
Runs on port 5018
"""

import http.server
import socketserver
import os

PORT = 5018
DIRECTORY = os.path.dirname(os.path.abspath(__file__))


class Handler(http.server.SimpleHTTPRequestHandler):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, directory=DIRECTORY, **kwargs)

    def log_message(self, format, *args):
        print(f"[{self.log_date_time_string()}] {args[0]}")


def main():
    with socketserver.TCPServer(("", PORT), Handler) as httpd:
        print(f"╔{'═' * 50}╗")
        print(f"║{'TETRIS SERVER':^50}║")
        print(f"╠{'═' * 50}╣")
        print(f"║{'':^50}║")
        print(f"║{'Servidor iniciado en:':^50}║")
        print(f"║{f'http://localhost:{PORT}':^50}║")
        print(f"║{'':^50}║")
        print(f"║{'Presiona Ctrl+C para detener':^50}║")
        print(f"║{'':^50}║")
        print(f"╚{'═' * 50}╝")
        print()

        try:
            httpd.serve_forever()
        except KeyboardInterrupt:
            print("\n\nServidor detenido.")


if __name__ == "__main__":
    main()
