<div style="text-align: center;">
  <img src="../../assets/img/logo/horizon.svg" alt="Laravel Horizon Logo" width="300"/>
</div><br>

# Laravel Horizon

_A step-by-step guide on how to install, configure, and run Laravel Horizon for monitoring and managing Redis queues._

---

## Table of Contents

1. [Overview](#1-overview)
2. [Prerequisites](#2-prerequisites)
3. [Installation](#3-installation)
4. [Running Horizon](#4-running-horizon)
5. [Testing Horizon](#5-testing-horizon)
6. [Laravel Integration](#6-laravel-integration)
7. [Verification](#7-verification)
8. [Troubleshooting](#8-troubleshooting)
9. [Notes](#9-notes)

---

## 1. Overview

**Laravel Horizon** is a queue management dashboard that provides real-time monitoring of jobs, throughput, and failures.  
It works on top of **Redis** and is highly recommended for production applications.

---

## 2. Prerequisites

- **Laravel 9+** project installed
- **Redis** running and configured
- **Supervisor** installed and running (for production)
- **PHP 8.1+** and Composer installed

---

## 3. Installation

### 1. Require Horizon package

```bash
composer require laravel/horizon
```

### 2. Publish configuration & assets

```bash
php artisan horizon:install
php artisan vendor:publish --provider="Laravel\Horizon\HorizonServiceProvider"
```

This creates `config/horizon.php`.

### 3. Migrate database (if not yet)

```bash
php artisan migrate
```

---

## 4. Running Horizon

### 1. Start Horizon (dev)

```bash
php artisan horizon
```

Horizon will start managing your Redis queues.

### 2. Run Horizon via Supervisor (production)

Create a Supervisor config file:

```bash
sudo nano /etc/supervisor/conf.d/horizon.conf
```

Add the following:

```ini
[program:horizon]
process_name=%(program_name)s
command=php /var/www/laravel-app/artisan horizon
autostart=true
autorestart=true
stopasgroup=true
killasgroup=true
user=www-data
redirect_stderr=true
stdout_logfile=/var/www/laravel-app/storage/logs/horizon.log
```

Reload Supervisor:

```bash
sudo supervisorctl reread
sudo supervisorctl update
sudo supervisorctl start horizon

```

---

## 5. Testing Horizon

### 1. Visit the Horizon dashboard in your browser:

```arduino
http://your-app.test/horizon
```

### 2. Dispatch a job:

```bash
php artisan tinker
>>> dispatch(new App\Jobs\ExampleJob());
```

### 3. Check Horizon dashboard → Jobs should appear in the processed list.

---

## 6. Laravel Integration

- In `.env`, set Redis as the queue driver:

```env
QUEUE_CONNECTION=redis
```

- Horizon automatically replaces `queue:work redis`.
- You can define **workload balancing**, **tags**, and **retry strategies** in `config/horizon.php`.

---

## 7. Verification

- Run Horizon locally and confirm jobs are processed.
- Ensure Supervisor keeps Horizon running in production:

```bash
sudo supervisorctl status horizon
```

Expected output:

```nginx
horizon   RUNNING   pid 12345, uptime 0:03:45
```

---

## 8. Troubleshooting

- **Horizon dashboard not loading**

  → Check Laravel logs (`storage/logs/laravel.log`).
  → Ensure you ran `php artisan horizon:install`.

- **Jobs not processing**

  → Verify Redis is running.
  → Ensure Supervisor is managing Horizon in production.

- **Changes in config/horizon.php not applied**

  → Run `php artisan horizon:terminate` to restart Horizon.

- **Supervisor config not working**
  → Ensure correct `user` is set (`www-data` for Ubuntu, `apache/nginx` for AlmaLinux).
  → Run:
  ```bash
  sudo supervisorctl reread
  sudo supervisorctl update
  ```

---

## 9. Notes

- Horizon provides a **real-time dashboard** → Useful for debugging stuck jobs.
- Always secure `/horizon` with middleware in **production** (e.g., auth or admin guard).
- Horizon **replaces** `queue:work` → Do not run both at the same time.
- Use `php artisan horizon:terminate` instead of `restart` during deployments.
- For large apps, define **supervisors** in `config/horizon.php` with workload distribution.
