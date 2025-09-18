<div style="text-align: center;">
  <img src="../../assets/img/logo/scout.svg" alt="Laravel Scout Logo" width="300"/>
</div><br>

# Laravel Scout

_This document provides guidelines on how Laravel Scout is implemented and used in this project.  
Scout is responsible for making Eloquent models searchable by syncing them with **Meilisearch** and handling queries efficiently._

---

## Table of Contents

1. [Overview](#1-overview)
2. [Configuration](#2-configuration)
3. [Making Models Searchable](#3-making-models-searchable)
4. [Indexing Data](#4-indexing-data)
5. [Performing Searches](#5-performing-searches)
6. [Customizing Indexing](#6-customizing-indexing)
7. [Indexing Relationships](#7-indexing-relationships)
8. [Queues & Redis](#8-queues-redis)
9. [Troubleshooting](#9-troubleshooting)
10. [Notes](#10-notes)

---

## 1. Overview

Laravel Scout is a driver-based full-text search package for Eloquent.  
In this project:

- **Search Engine**: Meilisearch
- **Queue System**: Redis
- **Models Indexed**: Searchable models (Ex. SanctionList)

---

## 2. Configuration

### Service Provider

Scout is auto-registered via Laravel 12.

Config file: `config/scout.php`

### Scout configuration on .env

```bash title=".env configuration" linenums="20" hl_lines="1"
SCOUT_DRIVER=meilisearch
MEILISEARCH_HOST=http://127.0.0.1:7700
MEILISEARCH_KEY=YOUR_MASTER_KEY
QUEUE_CONNECTION=redis

```

---

## 3. Making Models Searchable

To make a model searchable:

```php title="SanctionList.php (Model)" linenums="1" hl_lines="1 5"
use Laravel\Scout\Searchable;

class SanctionList extends Model
{
    use Searchable;
}

```

---

## 4. Indexing Data

#### Manually index existing records:

```bash title="Terminal" linenums="1"
php artisan scout:import "App\Models\SanctionList"
```

#### Clear the index and re-import:

```bash title="Terminal" linenums="1"
php artisan scout:flush "App\Models\SanctionList"
php artisan scout:import "App\Models\SanctionList"
```

---

## 5. Performing Searches

In your code:

```php title="NameScreeningController.php (Controller)" linenums="54"
$sanctionLists = SanctionList::search('keyword')->get();
```

---

## 6. Customizing Indexing

Define what fields should be indexed by overriding `toSearchableArray()`:

```php title="SanctionList.php (Model)" linenums="9"
public function toSearchableArray(): array
{
    return [
        'id' => $this->id,
        'title' => $this->title,
        'content' => $this->content,
    ];
}
```

---

## 7. Indexing Relationships

Sometimes you want related data (e.g., **tags**, **categories**, **author**) to be searchable.
You can include them in the `toSearchableArray()` method.
Example: Post with Tags and Category

```php title="SanctionList.php (Model)" linenums="9" hl_lines="7 8"
public function toSearchableArray(): array
{
    return [
        'id' => $this->id,
        'title' => $this->title,
        'content' => $this->content,
        'category' => $this->category?->name,
        'tags' => $this->tags->pluck('name')->toArray(),
    ];
}
```

This way, a search for a tag or category name will return the post.

> _**Tip**: Always eager load relationships before importing, otherwise Scout may cause N+1 queries._

With eager loading:

```php title="NameScreeningController.php (Controller)" linenums="14"
SanctionList::with(['category', 'tags'])->searchable();
```

---

## 8. Queues & Redis

Since Scout operations are queued, configure Redis for performance:

```env title=".env" linenums="18"
QUEUE_CONNECTION=redis
```

Run the worker:

```bash title="Terminal" linenums="1"
php artisan queue:work
```

This ensures indexing jobs are handled in the background.

---

## 9. Troubleshooting

1.  **Models not searchable**

    - **Check the trait**: Make sure the model uses the `Searchable` trait.

    ```php title="SanctionList.php (Model)" linenums="1"
    use Laravel\Scout\Searchable;

    class SanctionList extends Model
    {
        use Searchable;
    }

    ```

    - **Confirm Scout sees it**: Run

    ```bash title="Terminal" linenums="1"
    php artisan scout:import "App\Models\SanctionList"
    ```

    If nothing gets indexed, your model may not have the trait or the toSearchableArray() is returning empty.

---

2.  **Index not updating**

    - **Queue worker required**: Scout pushes updates (create/update/delete) to the queue. If the worker isn’t running, indexes won’t update.

    ```bash title="Terminal" linenums="1"
    php artisan queue:work
    ```

    - **Check queue connection**: Ensure .env is set:

    ```env title=".env" linenums="18"
    QUEUE_CONNECTION=redis
    ```

    - **Verify jobs**: Run

    ```bash title="Terminal" linenums="1"
    php artisan queue:failed
    ```

    to see if jobs are failing silently.

---

3.  **Invalid API key**

    - **Check** `.env` **values**:

    ```env title=".env" linenums="24"
    MEILISEARCH_HOST=http://127.0.0.1:7700
    MEILISEARCH_KEY=YOUR_MASTER_KEY
    ```

    - **Test connectivity** with curl:

    ```bash title="Terminal" linenums="1"
    curl -H "Authorization: Bearer masterKey" http://127.0.0.1:7700/health
    ```

    You should see:

    ```json title="Response" linenums="1"
    { "status": "available" }
    ```

    - If this fails → regenerate your key in Meilisearch or use the correct one.

---

4.  **Slow searches**

    - **Check Redis performance**: Make sure Redis is running, since queueing/search sync depends on it.

    ```bash title="Terminal" linenums="1"
    redis-cli ping
    ```

    You should see:

    ```bash title="Response" linenums="1"
    PONG
    ```

    - **Check Meilisearch load**: If you index a large dataset, searches might lag.
      - Use smaller batch imports:
      ```bash title="Terminal" linenums="1"
      php artisan scout:import --chunk=500
      ```
      - Allocate more memory/CPU to Meilisearch if needed.

---

5.  **Missing relationships in index**

    - **Problem**: Only the model fields are indexed, related data (e.g., tags, categories) is missing.
    - **Solution**: Update `toSearchableArray()`:

    ```php title="SanctionList.php (Model)" linenums="24" hl_lines="7 8"
    public function toSearchableArray(): array
    {
        return [
            'id' => $this->id,
            'title' => $this->title,
            'content' => $this->content,
            'category' => $this->category?->name,
            'tags' => $this->tags->pluck('name')->toArray(),
        ];
    }
    ```

---

## 10. Notes

- Scout is only a **bridge** → It does not perform searches; Meilisearch handles that.
- Always add the **`Searchable` trait** → Without it, models won’t sync to the index.
- **Eager load relationships** before indexing → Prevents N+1 queries during bulk imports.
- **Keep indexes lightweight** → Only include fields you really need in `toSearchableArray()`.
- A **queue worker must be running** → Otherwise, create/update/delete events won’t update the index.
- **Check Redis and Meilisearch health first** before assuming Scout is the problem.
- Use **`scout:flush` + `scout:import`** when making major changes to indexed fields.
