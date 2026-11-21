import { attachDatabasePool } from "@neon/functions";
import { parseTriggerDelivery } from "@neon/functions/triggers";
import { Hono } from "hono";
import { Pool } from "pg";

const pool = new Pool({ connectionString: process.env.DATABASE_URL, max: 5 });
attachDatabasePool(pool);

type UserRow = {
  id: number;
  username: string;
  email: string;
  created_at: Date;
  updated_at: Date;
};

const app = new Hono();

app.get("/", (c) => c.json({ ok: true }));

app.get("/users", async (c) => {
  const { rows } = await pool.query<UserRow>(
    "SELECT id, username, email, created_at, updated_at FROM users ORDER BY id",
  );
  return c.json(rows);
});

app.get("/users/:id", async (c) => {
  const id = Number(c.req.param("id"));
  if (!Number.isInteger(id) || id < 1) {
    return c.json({ error: "id must be a positive integer" }, 400);
  }

  const { rows } = await pool.query<UserRow>(
    "SELECT id, username, email, created_at, updated_at FROM users WHERE id = $1",
    [id],
  );
  const user = rows[0];
  if (!user) {
    return c.json({ error: "user not found" }, 404);
  }
  return c.json(user);
});

app.post("/cleanup", async (c) => {
  const parsed = await parseTriggerDelivery(c.req.raw);
  if (!parsed.ok) {
    const status = parsed.error === "invalid_body" ? 400 : 401;
    return c.json({ error: parsed.error }, status);
  }
  if (parsed.invocation.type !== "schedule") {
    return c.json({ error: "expected a schedule trigger" }, 400);
  }

  const { rows } = await pool.query<{ id: number }>(
    `DELETE FROM users
     WHERE created_at < NOW() - INTERVAL '1 minute'
     RETURNING id`,
  );
  return c.json({
    deleted: rows.length,
    scheduledAt: parsed.invocation.data.scheduledAt,
  });
});

app.post("/users", async (c) => {
  let body: { username?: unknown; email?: unknown };
  try {
    body = await c.req.json();
  } catch {
    return c.json({ error: "body must be JSON" }, 400);
  }

  const username = typeof body.username === "string" ? body.username.trim() : "";
  const email = typeof body.email === "string" ? body.email.trim() : "";
  if (!username || !email) {
    return c.json({ error: "username and email are required" }, 400);
  }

  try {
    const { rows } = await pool.query<UserRow>(
      `INSERT INTO users (username, email)
       VALUES ($1, $2)
       RETURNING id, username, email, created_at, updated_at`,
      [username, email],
    );
    return c.json(rows[0], 201);
  } catch (error) {
    if (isUniqueViolation(error)) {
      return c.json({ error: "username or email already exists" }, 409);
    }
    throw error;
  }
});

export default app;

function isUniqueViolation(error: unknown): boolean {
  return (
    typeof error === "object" &&
    error !== null &&
    "code" in error &&
    error.code === "23505"
  );
}
