# Supervisor

_A step-by-step guide on how to install, configure, and run Supervisor to manage Laravel queue workers and Horizon in production._

---

## Table of Contents

1. [Overview](#1-overview)
2. [Prerequisites](#2-prerequisites)
3. [Installation](#3-installation)
4. [Running Supervisor](#4-running-supervisor)
5. [Testing Supervisor](#5-testing-supervisor)
6. [Laravel Integration](#6-laravel-integration)
7. [Verification](#7-verification)
8. [Troubleshooting](#8-troubleshooting)
9. [Notes](#9-notes)

---

## 1. Overview

**Supervisor** is a process control system that ensures your Laravel **queue workers** or **Horizon** keep running in the background.  
It automatically restarts processes if they fail, making it essential for **production queue management**.

---

## 2. Prerequisites

- **AlmaLinux** or **Ubuntu** server (production environment)
- **Laravel 9+** installed
- **Redis** running (as queue backend)
- **PHP 8.1+** and Composer installed
- Root or sudo access

---

## 3. Installation

### On AlmaLinux (RHEL-based)

```bash
sudo dnf install supervisor -y
```

### On Ubuntu/Debian

```bash
sudo apt install supervisor -y
```

Enable and start Supervisor:

```bash
sudo systemctl enable supervisord --now   # AlmaLinux
sudo systemctl enable supervisor --now    # Ubuntu
```

## 4. Running Supervisor

Supervisor uses config files stored in:

- **AlmaLinux/RHEL** → /etc/supervisord.d/
- **Ubuntu/Debian** → /etc/supervisor/conf.d/

**Example: Queue Worker Config**
Create a new config file:

```bash
sudo nano /etc/supervisor/conf.d/laravel-worker.conf
```

Add the following:

```ini
[program:laravel-worker]
process_name=%(program_name)s_%(process_num)02d
command=php /var/www/laravel-app/artisan queue:work redis --sleep=3 --tries=3 --max-time=3600
autostart=true
autorestart=true
stopasgroup=true
killasgroup=true
user=www-data
numprocs=1
redirect_stderr=true
stdout_logfile=/var/www/laravel-app/storage/logs/worker.log
```

Save and reload Supervisor:

```bash
sudo supervisorctl reread
sudo supervisorctl update
sudo supervisorctl start laravel-worker:*
```

---

## 5. Testing Supervisor

Check status of workers:

```bash
sudo supervisorctl status
```

Expected output:

```nginx
laravel-worker:laravel-worker_00   RUNNING   pid 12345, uptime 0:05:12
```

Stop/restart workers:

```bash
sudo supervisorctl stop laravel-worker:*
sudo supervisorctl start laravel-worker:*
```

---

## 6. Laravel Integration

- Ensure `.env` uses Redis queues:

```env
QUEUE_CONNECTION=redis
```

- Supervisor will keep `php artisan queue:work redis` running.
- Horizon (if installed later) can also be managed by Supervisor.

---

## 7. Verification

### 1. Dispatch a test job:

```bash
php artisan tinker
>>> dispatch(new App\Jobs\ExampleJob());
```

### 2. Check if the job is processed by Supervisor workers:

```bash
tail -f storage/logs/worker.log
```

---

## 8. Troubleshooting

- **Supervisor not starting**
  → Check logs:
  ```bash
  journalctl -u supervisor -f   # Ubuntu
  journalctl -u supervisord -f  # AlmaLinux
  ```
- **Worker not processing jobs**
  → Ensure Redis is running.
  → Check Laravel logs: `storage/logs/laravel.log`.
- **Config changes not applied**
  → Run:
  ```bash
  sudo supervisorctl reread
  sudo supervisorctl update
  ```
- **Permission errors**
  → Ensure `user=www-data` (Ubuntu) or `user=apache/nginx` (AlmaLinux) matches your web server/PHP user.

---

## 9. Notes

- **Use multiple workers** for high-traffic apps by increasing `numprocs`.
- **Monitor logs** (`worker.log` and `laravel.log`) regularly.
- Horizon (Laravel package) can be used **on top of Supervisor** for better monitoring.
- Always restart Supervisor after deployment if configs change.
