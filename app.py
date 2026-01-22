#!/usr/bin/env python3
"""
Flask server for Tetris game
Runs on port 5018
"""

from flask import Flask, send_from_directory
import os

app = Flask(__name__, static_folder='.')

@app.route('/')
def index():
    return send_from_directory('.', 'index.html')

@app.route('/<path:filename>')
def static_files(filename):
    return send_from_directory('.', filename)

if __name__ == '__main__':
    print()
    print("╔" + "═" * 50 + "╗")
    print("║" + "TETRIS SERVER (Flask)".center(50) + "║")
    print("╠" + "═" * 50 + "╣")
    print("║" + "".center(50) + "║")
    print("║" + "Servidor iniciado en:".center(50) + "║")
    print("║" + "http://localhost:5018".center(50) + "║")
    print("║" + "".center(50) + "║")
    print("║" + "Presiona Ctrl+C para detener".center(50) + "║")
    print("║" + "".center(50) + "║")
    print("╚" + "═" * 50 + "╝")
    print()

    app.run(host='0.0.0.0', port=5018, debug=False)
