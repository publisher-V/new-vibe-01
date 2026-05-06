const jsonHeaders = {
  "Content-Type": "application/json; charset=utf-8",
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "PUT,DELETE,OPTIONS",
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

function normalizeNote(input, oldNote) {
  const now = new Date().toISOString();

  return {
    id: oldNote.id,
    title: String(input.title || "제목 없음").trim().slice(0, 80) || "제목 없음",
    content: String(input.content || "").trim(),
    createdAt: oldNote.createdAt,
    updatedAt: now,
  };
}

async function findNote(db, id) {
  return db
    .prepare(
      `SELECT id, title, content, created_at AS createdAt, updated_at AS updatedAt
       FROM notes
       WHERE id = ?`,
    )
    .bind(id)
    .first();
}

export function onRequestOptions() {
  return new Response(null, { status: 204, headers: jsonHeaders });
}

export async function onRequestPut({ request, env, params }) {
  try {
    const db = requireDb(env);
    const id = decodeURIComponent(params.id);
    const oldNote = await findNote(db, id);

    if (!oldNote) {
      return json({ error: "Note not found" }, { status: 404 });
    }

    const body = await request.json();
    const note = normalizeNote(body, oldNote);

    await db
      .prepare(
        `UPDATE notes
         SET title = ?, content = ?, updated_at = ?
         WHERE id = ?`,
      )
      .bind(note.title, note.content, note.updatedAt, note.id)
      .run();

    return json(note);
  } catch (error) {
    return json({ error: error.message }, { status: 500 });
  }
}

export async function onRequestDelete({ env, params }) {
  try {
    const db = requireDb(env);
    const id = decodeURIComponent(params.id);
    const oldNote = await findNote(db, id);

    if (!oldNote) {
      return json({ error: "Note not found" }, { status: 404 });
    }

    await db.prepare("DELETE FROM notes WHERE id = ?").bind(id).run();
    return json({ ok: true });
  } catch (error) {
    return json({ error: error.message }, { status: 500 });
  }
}
