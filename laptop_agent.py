#!/usr/bin/env python3
"""
SecureMonitor AI - Machine-to-Machine Laptop Telemetry Agent
Transmits real-time system metrics (CPU, RAM, Disk, Network I/O, Processes)
to the SecureMonitor AI backend with X-Laptop-Telemetry-Key authentication.

Requirements:
    pip install psutil requests

Usage:
    python3 laptop_agent.py
"""

import time
import datetime
import psutil
import requests
import json
import sys
import os

# SecureMonitor AI Backend Endpoint
# Replace with your deployed Cloud Run URL or local URL:
DASHBOARD_API_URL = os.environ.get("DASHBOARD_API_URL", "http://localhost:3000/api/telemetry/laptop")

# Dedicated Machine-to-Machine API Key (matches LAPTOP_TELEMETRY_API_KEY on the server)
API_KEY = os.environ.get("LAPTOP_TELEMETRY_API_KEY", "sec-laptop-telemetry-ae9948fe-key-2026")

# n8n Webhook Endpoint (optional fallback / parallel ingestion)
N8N_WEBHOOK_URL = os.environ.get("N8N_WEBHOOK_URL", "https://geetha22.app.n8n.cloud/webhook/laptop-monitor")

POLL_INTERVAL_SECONDS = 30
DEVICE_ID = "laptop-user-ae9948fe"

def collect_metrics():
    # Measure network throughput over a 1 second window
    net_start = psutil.net_io_counters()
    time.sleep(1)
    net_end = psutil.net_io_counters()

    bytes_sent = net_end.bytes_sent - net_start.bytes_sent
    bytes_recv = net_end.bytes_recv - net_start.bytes_recv

    upload_mb = round(bytes_sent / (1024 * 1024), 2)
    download_mb = round(bytes_recv / (1024 * 1024), 2)

    # Get CPU, RAM, Disk, Process count
    cpu_percent = round(psutil.cpu_percent(interval=None), 1)
    ram_percent = round(psutil.virtual_memory().percent, 1)
    
    # Disk usage on root or current drive
    disk_path = '/' if sys.platform != 'win32' else 'C:\\'
    disk_percent = round(psutil.disk_usage(disk_path).percent, 1)
    
    process_count = len(psutil.pids())

    now_str = datetime.datetime.now().strftime("%Y-%m-%d %H:%M:%S")

    payload = {
        "deviceId": DEVICE_ID,
        "timestamp": now_str,
        "cpu": cpu_percent,
        "ram": ram_percent,
        "disk": disk_percent,
        "upload_mb": upload_mb,
        "download_mb": download_mb,
        "processes": process_count
    }
    return payload

def send_telemetry():
    payload = collect_metrics()
    print(f"[{payload['timestamp']}] CPU: {payload['cpu']}% | RAM: {payload['ram']}% | Disk: {payload['disk']}% | Net: ↑{payload['upload_mb']}MB ↓{payload['download_mb']}MB | PIDs: {payload['processes']}")

    # Authenticated Machine-to-Machine Headers
    headers = {
        "Content-Type": "application/json",
        "X-Laptop-Telemetry-Key": API_KEY,
    }

    # 1. Send directly to SecureMonitor AI Backend
    try:
        resp = requests.post(DASHBOARD_API_URL, json=payload, headers=headers, timeout=10)
        if resp.status_code == 200:
            print(f" -> [SecureMonitor AI] Telemetry accepted: {resp.json()}")
        elif resp.status_code == 401:
            print(f" -> [SecureMonitor AI] 401 Unauthorized: Invalid X-Laptop-Telemetry-Key.")
        else:
            print(f" -> [SecureMonitor AI] HTTP {resp.status_code}: {resp.text.strip()}")
    except Exception as e:
        print(f" -> [SecureMonitor AI] Connection error: {e}")

    # 2. Also send to n8n Webhook
    if N8N_WEBHOOK_URL:
        try:
            n8n_resp = requests.post(N8N_WEBHOOK_URL, json=payload, headers={"Content-Type": "application/json"}, timeout=10)
            print(f" -> [n8n Webhook] HTTP {n8n_resp.status_code}: {n8n_resp.text.strip()}")
        except Exception as e:
            print(f" -> [n8n Webhook] Error: {e}")

def main():
    print("=" * 65)
    print("SecureMonitor AI — Authenticated Laptop Monitoring Agent")
    print(f"Device ID: {DEVICE_ID}")
    print(f"Target API: {DASHBOARD_API_URL}")
    print(f"Sampling interval: {POLL_INTERVAL_SECONDS}s")
    print("=" * 65)

    while True:
        try:
            send_telemetry()
        except KeyboardInterrupt:
            print("\nAgent terminated by user.")
            break
        except Exception as e:
            print(f"Unexpected error: {e}")

        time.sleep(POLL_INTERVAL_SECONDS)

if __name__ == "__main__":
    main()
