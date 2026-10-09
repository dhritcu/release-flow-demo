import { sql } from "../lib/db.js";
import { parseTitle } from "../lib/todos.js";

export default async function handler(req, res) {
  try {
    if (req.method === "GET") {
      const todos = await sql`select id, title, done, urgent, due_on, notes from todos order by urgent desc, id`;
      return res.status(200).json(todos);
    }
    if (req.method === "POST") {
      const { urgent = false, dueOn = null } = req.body ?? {};
      const title = parseTitle(req.body?.title);
      const [todo] = await sql`
        insert into todos (title, urgent, due_on) values (${title}, ${Boolean(urgent)}, ${dueOn || null})
        returning id, title, done, urgent, due_on`;
      return res.status(201).json(todo);
    }
    if (req.method === "PATCH") {
      const [todo] = await sql`
        update todos set done = not done, completed_at = case when done then null else now() end where id = ${Number(req.query.id)}
        returning id, title, done, urgent, due_on`;
      return todo ? res.status(200).json(todo) : res.status(404).json({ error: "Not found" });
    }
    res.setHeader("Allow", "GET, POST, PATCH");
    return res.status(405).end();
  } catch (error) {
    return res.status(400).json({ error: error.message });
  }
}
