import { sql } from "../lib/db.js";
import { parseDueOn, parseId, parseTitle } from "../lib/todos.js";

export default async function handler(req, res) {
  try {
    if (req.method === "GET") {
      const todos = await sql`select id, title, done, urgent, due_on, notes from todos order by urgent desc, id`;
      return res.status(200).json(todos);
    }
    if (req.method === "POST") {
      const urgent = Boolean(req.body?.urgent);
      const title = parseTitle(req.body?.title);
      const dueOn = parseDueOn(req.body?.dueOn);
      const [todo] = await sql`
        insert into todos (title, urgent, due_on) values (${title}, ${urgent}, ${dueOn})
        returning id, title, done, urgent, due_on`;
      return res.status(201).json(todo);
    }
    if (req.method === "PATCH") {
      const [todo] = await sql`
        update todos set done = not done, completed_at = case when done then null else now() end where id = ${parseId(req.query.id)}
        returning id, title, done, urgent, due_on`;
      return todo ? res.status(200).json(todo) : res.status(404).json({ error: "Not found" });
    }
    res.setHeader("Allow", "GET, POST, PATCH");
    return res.status(405).end();
  } catch (error) {
    return res.status(400).json({ error: error.message });
  }
}
