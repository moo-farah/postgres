# PostgreSQL learning

Practice PostgreSQL against a [Neon](https://neon.tech) database. Each lesson is a `.sql` file in `sql/`. `psql` runs the file, and the tables show up in the Neon console under the `neondb` database.

## Layout

| File | Purpose |
| --- | --- |
| `.env` | `DATABASE_URL` for the Neon database. Git ignores this file. |
| `.gitignore` | Keeps `.env` out of git. |
| `sql/01-first-table.sql` | Creates the `students` table and inserts two rows. |

## Connect

In a new terminal:

```bash
cd /Users/mohamed/Documents/postgres-learning
source .env
psql "$DATABASE_URL"
```

The prompt `neondb=>` means you are connected. Quit with `\q`.

`source .env` is once per terminal. Later commands in that same terminal can use `psql "$DATABASE_URL"` on their own. Inside an open `psql` session, type SQL directly.

## Run a lesson

```bash
psql "$DATABASE_URL" -f sql/01-first-table.sql
```

From inside `psql`, with the shell still in this folder:

```text
\i sql/01-first-table.sql
```

Add the next lesson as `sql/02-something.sql` and run it the same way. Running `sql/01-first-table.sql` again fails on `CREATE TABLE students` because that table already exists.

## Check the result

In `psql`:

```sql
\dt
SELECT * FROM students;
```

In the Neon console, open the project branch and select **Tables**. `students` is listed under `neondb`.
