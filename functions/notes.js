const jsonHeaders = {
  "Content-Type": "application/json; charset=utf-8",
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET,POST,OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type",
};

function json(data, init = {}) {
  return new Response(JSON.stringify(data), {
    ...init,
    headers: {
      ...jsonHeaders,
      ...init.headers,
    },
  });
}

function requireDb(env) {
  if (!env.DB) {
    throw new Error("D1 binding DB is not configured.");
  }

  return env.DB;
}

function normalizeNote(input) {
  const now = new Date().toISOString();

  return {
    id: input.id || crypto.randomUUID(),
    title: String(input.title || "제목 없음").trim().slice(0, 80) || "제목 없음",
    content: String(input.content || "").trim(),
    createdAt: input.createdAt || now,
    updatedAt: now,
  };
}

export function onRequestOptions() {
  return new Response(null, { status: 204, headers: jsonHeaders });
}

export async function onRequestGet({ env }) {
  try {
    const db = requireDb(env);
    const { results } = await db
      .prepare(
        `SELECT id, title, content, created_at AS createdAt, updated_at AS updatedAt
         FROM notes
         ORDER BY updated_at DESC`,
      )
      .all();

    return json(results || []);
  } catch (error) {
    return json({ error: error.message }, { status: 500 });
  }
}

export async function onRequestPost({ request, env }) {
  try {
    const db = requireDb(env);
    const body = await request.json();
    const note = normalizeNote(body);

    await db
      .prepare(
        `INSERT INTO notes (id, title, content, created_at, updated_at)
         VALUES (?, ?, ?, ?, ?)`,
      )
      .bind(note.id, note.title, note.content, note.createdAt, note.updatedAt)
      .run();

    return json(note, { status: 201 });
  } catch (error) {
    return json({ error: error.message }, { status: 500 });
  }
}
