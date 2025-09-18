<div style="text-align: center;">
  <img src="assets/img/logo/amlakas.webp" alt="Diagram" width="300" height="200" />
</div><br>

# AMLakas Documentation

Welcome to the documentation for this project.  
This directory contains setup and integration guides for core services that power the application.

---

## Available Service Guides

Each guide includes installation, configuration, troubleshooting, and notes.

- [:simple-redis: edis](services/redis.md)
- [:simple-meilisearch: eilisearch](services/meilisearch.md)
- [<img src="assets/img/logo/scout.svg" alt="Laravel Scout Logo" width="100"/>](services/laravel-scout.md)
- [:simple-laravel: Supervisor](services/supervisor.md)
- [<img src="assets/img/logo/horizon.svg" alt="Laravel Scout Logo" width="100"/>](services/laravel-horizon.md)

---

## How to Use

- Start with **Meilisearch** → for full-text search.
- Configure **Laravel Scout** → sync models with Meilisearch.
- Add **Redis** → base dependency for queues, caching, sessions.
- Setup **Supervisor** → keep queue workers/Horizon running in production.
- Enable **Horizon** → manage and monitor Redis queues with a dashboard.

---

```mermaid
sequenceDiagram
    autonumber
    participant M as Meilisearch
    participant S as Scout
    participant R as Redis
    participant SP as Supervisor
    participant H as Horizon

    %% Search ecosystem first
    Note over M: 1️⃣ Start Meilisearch
    M->>M: Running service...
    loop Health Check
        M->>M: Checking configuration...
        M->>M: Checking errors...
    end

    Note over S: 2️⃣ Initialize Scout
    loop Health Check
        S->>M: Check Meilisearch index
        S->>M: Check search endpoint
    end
    S-->>M: Connected to Meilisearch
    Note over M,S: Search engine is running

    %% Queue ecosystem next
    Note over R: 3️⃣ Start Redis
    R->>R: Running service...
    loop Health Check
        R->>R: Checking configuration...
        R->>R: Checking errors...
    end

    Note over SP: 4️⃣ Start Supervisor
    SP->>SP: Running service...
    loop Health Check
        SP->>R: Check Redis connection
    end

    Note over H: 5️⃣ Start Horizon
    H->>H: Running service...
    loop Health Check
        H->>R: Check Redis queues
        H->>SP: Check Supervisor workers
    end
    H-->>H: ✅ Horizon dashboard is running
```

---

## Notes

- Each guide is self-contained.
- Use these docs as both **setup reference** and **troubleshooting handbook**.
