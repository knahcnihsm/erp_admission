#!/usr/bin/env python3
"""
Academic ERP Admission Portal - One-Click Launcher
==================================================
Automated launcher script to start both Spring Boot backend and Vite frontend,
handle missing dependencies, perform health checks, stream logs in real time,
and open the portal in your default web browser.

Usage:
    python run_project.py
"""

import os
import sys
import time
import shutil
import pathlib
import threading
import subprocess
import urllib.request
import urllib.error
import webbrowser

# Enable ANSI color escape sequences on Windows & reconfigure UTF-8 encoding
if sys.platform == "win32":
    os.system("")
if hasattr(sys.stdout, "reconfigure"):
    try:
        sys.stdout.reconfigure(encoding="utf-8", errors="replace")
    except Exception:
        pass
if hasattr(sys.stderr, "reconfigure"):
    try:
        sys.stderr.reconfigure(encoding="utf-8", errors="replace")
    except Exception:
        pass

# Styling tokens for formatted output
class Colors:
    GREEN = "\033[92m"
    BLUE = "\033[94m"
    CYAN = "\033[96m"
    YELLOW = "\033[93m"
    RED = "\033[91m"
    BOLD = "\033[1m"
    RESET = "\033[0m"

def print_status(message: str, level: str = "info"):
    """Prints a styled status message to the terminal."""
    icons = {
        "success": f"{Colors.GREEN}[OK]{Colors.RESET}",
        "info": f"{Colors.CYAN}[INFO]{Colors.RESET}",
        "warning": f"{Colors.YELLOW}[WARN]{Colors.RESET}",
        "error": f"{Colors.RED}[ERR]{Colors.RESET}",
        "working": f"{Colors.BLUE}[...]{Colors.RESET}",
    }
    prefix = icons.get(level, "*")
    try:
        print(f"{prefix} {Colors.BOLD}{message}{Colors.RESET}")
    except UnicodeEncodeError:
        print(f"[{level.upper()}] {message}")


def is_cmd_available(cmd_name: str) -> bool:
    """Checks if a command is available on the system PATH."""
    return shutil.which(cmd_name) is not None or (
        sys.platform == "win32" and shutil.which(f"{cmd_name}.cmd") is not None
    )

def get_executable(cmd_name: str) -> str:
    """Gets the exact command executable for the current platform (e.g. npm.cmd on Windows)."""
    if sys.platform == "win32":
        cmd_win = shutil.which(f"{cmd_name}.cmd")
        if cmd_win:
            return cmd_win
        bat_win = shutil.which(f"{cmd_name}.bat")
        if bat_win:
            return bat_win
    which_cmd = shutil.which(cmd_name)
    if which_cmd:
        return which_cmd
    return cmd_name

def stream_logs(process: subprocess.Popen, prefix: str, color: str):
    """Streams stdout from a subprocess line-by-line with a styled prefix."""
    try:
        if process.stdout:
            for line in iter(process.stdout.readline, ""):
                if not line:
                    break
                print(f"{color}[{prefix}]{Colors.RESET} {line.rstrip()}")
    except (ValueError, Exception):
        pass

def get_pids_using_port(port: int) -> list[int]:
    """Finds PIDs listening on a given port."""
    pids = set()
    if sys.platform == "win32":
        try:
            output = subprocess.check_output("netstat -ano -p tcp", shell=True, text=True, stderr=subprocess.DEVNULL)
            for line in output.splitlines():
                parts = line.strip().split()
                if len(parts) >= 5 and parts[0].upper() == "TCP":
                    local_addr = parts[1]
                    state = parts[3].upper()
                    pid = parts[4]
                    if local_addr.endswith(f":{port}") and state == "LISTENING":
                        try:
                            pids.add(int(pid))
                        except ValueError:
                            pass
        except Exception:
            pass
    else:
        try:
            output = subprocess.check_output(["lsof", "-ti", f":{port}"], text=True, stderr=subprocess.DEVNULL)
            for line in output.splitlines():
                line = line.strip()
                if line.isdigit():
                    pids.add(int(line))
        except Exception:
            pass
    return list(pids)

def free_port(port: int, service_name: str = "Service"):
    """Frees a port if it is currently in use by an existing process."""
    pids = get_pids_using_port(port)
    for pid in pids:
        if pid == os.getpid():
            continue
        print_status(f"Port {port} ({service_name}) is occupied by PID {pid}. Freeing port...", "warning")
        try:
            if sys.platform == "win32":
                subprocess.run(f"taskkill /F /T /PID {pid}", shell=True, stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
            else:
                import signal
                os.kill(pid, signal.SIGKILL)
        except Exception:
            pass
    if pids:
        time.sleep(1)

def kill_process_tree(proc: subprocess.Popen):
    """Cleanly terminates a subprocess and all its children."""
    if proc and proc.poll() is None:
        try:
            if sys.platform == "win32":
                subprocess.run(f"taskkill /F /T /PID {proc.pid}", shell=True, stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
            else:
                proc.terminate()
                proc.wait(timeout=3)
        except Exception:
            try:
                proc.kill()
            except Exception:
                pass

def wait_for_url(url: str, timeout_seconds: int = 60, interval_seconds: float = 1.0) -> bool:
    """Polls a URL until it responds with HTTP 200/300/400 (indicating server is active)."""
    start_time = time.time()
    while time.time() - start_time < timeout_seconds:
        try:
            req = urllib.request.Request(url, headers={"User-Agent": "ERP-Launcher"})
            with urllib.request.urlopen(req, timeout=2.0) as response:
                if response.status < 500:
                    return True
        except urllib.error.HTTPError as e:
            if e.code < 500:
                return True
        except Exception:
            pass
        time.sleep(interval_seconds)
    return False

def main():
    print(f"\n{Colors.BOLD}{Colors.CYAN}===================================================={Colors.RESET}")
    print(f"{Colors.BOLD}{Colors.CYAN}   Academic ERP Admission Portal - System Launcher  {Colors.RESET}")
    print(f"{Colors.BOLD}{Colors.CYAN}===================================================={Colors.RESET}\n")

    # 1. Project Directory Auto-Detection
    root_dir = pathlib.Path(__file__).resolve().parent
    backend_dir = root_dir / "backend"
    frontend_dir = root_dir

    if not (frontend_dir / "package.json").exists() and (root_dir / "frontend" / "package.json").exists():
        frontend_dir = root_dir / "frontend"

    if not backend_dir.exists() or not (backend_dir / "pom.xml").exists():
        print_status(f"Backend directory not found at: {backend_dir}", "error")
        input("\nPress Enter to exit...")
        sys.exit(1)

    if not (frontend_dir / "package.json").exists():
        print_status(f"Frontend directory (package.json) not found at: {frontend_dir}", "error")
        input("\nPress Enter to exit...")
        sys.exit(1)

    # 2. Prerequisite Checks
    print_status("Checking system prerequisites...", "info")

    if not is_cmd_available("java"):
        print_status("Java Development Kit (JDK) is not installed or not in PATH.", "error")
        print_status("Please install Java JDK 17+ and try again.", "info")
        input("\nPress Enter to exit...")
        sys.exit(1)

    if not is_cmd_available("node"):
        print_status("Node.js is not installed or not in PATH.", "error")
        print_status("Please install Node.js (v18+) from https://nodejs.org/ and try again.", "info")
        input("\nPress Enter to exit...")
        sys.exit(1)

    if not is_cmd_available("npm"):
        print_status("npm package manager is missing.", "error")
        input("\nPress Enter to exit...")
        sys.exit(1)

    mvn_cmd = "mvn"
    if not is_cmd_available("mvn"):
        if (backend_dir / "mvnw").exists() or (backend_dir / "mvnw.cmd").exists():
            mvn_cmd = str((backend_dir / ("mvnw.cmd" if sys.platform == "win32" else "mvnw")).resolve())
        else:
            print_status("Apache Maven ('mvn') is missing and no wrapper found.", "error")
            print_status("Please install Apache Maven or ensure 'mvn' is on PATH.", "info")
            input("\nPress Enter to exit...")
            sys.exit(1)

    print_status("All prerequisite tools found (Java, Node.js, npm, Maven).", "success")

    # 3. Frontend Dependencies Check
    node_modules_dir = frontend_dir / "node_modules"
    if not node_modules_dir.exists():
        print_status("Frontend dependencies ('node_modules') missing. Installing now...", "warning")
        npm_exec = get_executable("npm")
        try:
            install_proc = subprocess.run(
                [npm_exec, "install"],
                cwd=str(frontend_dir),
                check=True,
                stdout=subprocess.PIPE,
                stderr=subprocess.STDOUT,
                text=True
            )
            print_status("Frontend dependencies installed successfully.", "success")
        except subprocess.CalledProcessError as e:
            print_status("Failed to install frontend dependencies:", "error")
            print(e.output)
            input("\nPress Enter to exit...")
            sys.exit(1)

    # 4. Backend Process Launch
    free_port(8080, "Backend")
    print_status("Starting Backend (Spring Boot)...", "working")
    mvn_exec = get_executable(mvn_cmd)
    
    backend_args = [mvn_exec, "spring-boot:run"]
    
    backend_proc = None
    frontend_proc = None
    try:
        backend_proc = subprocess.Popen(
            backend_args,
            cwd=str(backend_dir),
            stdout=subprocess.PIPE,
            stderr=subprocess.STDOUT,
            text=True,
            bufsize=1
        )
    except Exception as e:
        print_status(f"Failed to launch backend process: {e}", "error")
        input("\nPress Enter to exit...")
        sys.exit(1)

    # Thread to stream backend logs in real time
    backend_log_thread = threading.Thread(
        target=stream_logs,
        args=(backend_proc, "Backend", Colors.CYAN),
        daemon=True
    )
    backend_log_thread.start()

    # Wait for Backend HTTP server ready (port 8080)
    backend_url = "http://localhost:8080/api/programs"
    print_status("Waiting for Backend to initialize...", "info")
    backend_ready = wait_for_url(backend_url, timeout_seconds=60)

    if not backend_ready and backend_proc.poll() is not None:
        print_status("Backend process exited prematurely. Check logs above.", "error")
        kill_process_tree(backend_proc)
        input("\nPress Enter to exit...")
        sys.exit(1)

    print_status("Backend Running (http://localhost:8080)", "success")

    # 5. Frontend Process Launch
    free_port(5173, "Frontend")
    print_status("Starting Frontend (Vite)...", "working")
    npm_exec = get_executable("npm")
    
    try:
        frontend_proc = subprocess.Popen(
            [npm_exec, "run", "dev"],
            cwd=str(frontend_dir),
            stdout=subprocess.PIPE,
            stderr=subprocess.STDOUT,
            text=True,
            bufsize=1
        )
    except Exception as e:
        print_status(f"Failed to launch frontend process: {e}", "error")
        kill_process_tree(backend_proc)
        input("\nPress Enter to exit...")
        sys.exit(1)

    # Thread to stream frontend logs in real time
    frontend_log_thread = threading.Thread(
        target=stream_logs,
        args=(frontend_proc, "Frontend", Colors.BLUE),
        daemon=True
    )
    frontend_log_thread.start()

    # Wait for Frontend HTTP server ready (port 5173)
    frontend_url = "http://localhost:5173"
    print_status("Waiting for Frontend server...", "info")
    frontend_ready = wait_for_url(frontend_url, timeout_seconds=30)

    print_status("Frontend Running (http://localhost:5173)", "success")

    # 6. Final Status & Browser Launch
    print(f"\n{Colors.BOLD}{Colors.GREEN}===================================================={Colors.RESET}")
    print_status("Academic ERP Admission Portal is READY!", "success")
    print(f"{Colors.BOLD}{Colors.GREEN}   App URL: {Colors.CYAN}http://localhost:5173{Colors.RESET}")
    print(f"{Colors.BOLD}{Colors.GREEN}   API URL: {Colors.CYAN}http://localhost:8080{Colors.RESET}")
    print(f"{Colors.BOLD}{Colors.GREEN}===================================================={Colors.RESET}\n")
    print(f"{Colors.YELLOW}Press Ctrl+C at any time to stop all services.{Colors.RESET}\n")

    # Automatically open in browser
    try:
        webbrowser.open(frontend_url)
    except Exception:
        pass

    # 7. Monitor Subprocesses until Ctrl+C
    try:
        while True:
            time.sleep(1)
            # If both processes exit, stop monitoring
            if backend_proc and backend_proc.poll() is not None and frontend_proc and frontend_proc.poll() is not None:
                print_status("Both backend and frontend processes have stopped.", "warning")
                break
    except KeyboardInterrupt:
        print(f"\n{Colors.YELLOW}Shutting down Academic ERP services...{Colors.RESET}")
    finally:
        # Clean shutdown of both processes and their children
        if backend_proc:
            kill_process_tree(backend_proc)
        if frontend_proc:
            kill_process_tree(frontend_proc)
        print_status("All services stopped successfully.", "info")

if __name__ == "__main__":
    main()
