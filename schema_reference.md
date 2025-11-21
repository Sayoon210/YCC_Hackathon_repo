# Database Schema Reference

## Table: `tasks`

| Column Name | Data Type | Nullable | Notes |
|---|---|---|---|
| `id` | bigint | NO | Primary Key. Frontend currently uses string IDs. |
| `member_id` | bigint | YES | Foreign Key to `users.id`. |
| `title` | text | NO | Matches frontend. |
| `description` | text | YES | Frontend uses `details`. |
| `total_score` | integer | NO | Frontend currently calculates this from local votes. |
| `progress` | numeric | YES | New field. |
| `achieved_score` | integer | YES | New field. |

## Table: `users`

| Column Name | Data Type | Nullable | Notes |
|---|---|---|---|
| `id` | bigint | NO | Primary Key. |
| `name` | text | NO | User's display name. |

## Raw Definition (`tasks`)
```json
[
  {
    "column_name": "id",
    "data_type": "bigint",
    "is_nullable": "NO",
    "column_default": "nextval('tasks_id_seq'::regclass)"
  },
  {
    "column_name": "member_id",
    "data_type": "bigint",
    "is_nullable": "YES",
    "column_default": null
  },
  {
    "column_name": "title",
    "data_type": "text",
    "is_nullable": "NO",
    "column_default": null
  },
  {
    "column_name": "description",
    "data_type": "text",
    "is_nullable": "YES",
    "column_default": null
  },
  {
    "column_name": "total_score",
    "data_type": "integer",
    "is_nullable": "NO",
    "column_default": null
  },
  {
    "column_name": "progress",
    "data_type": "numeric",
    "is_nullable": "YES",
    "column_default": null
  },
  {
    "column_name": "achieved_score",
    "data_type": "integer",
    "is_nullable": "YES",
    "column_default": null
  }
]
```

## Raw Definition (`users`)
```json
[
  {
    "column_name": "id",
    "data_type": "bigint",
    "is_nullable": "NO",
    "column_default": "nextval('users_id_seq'::regclass)"
  },
  {
    "column_name": "name",
    "data_type": "text",
    "is_nullable": "NO",
    "column_default": null
  }
]
```
