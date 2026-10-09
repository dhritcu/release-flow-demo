import { sql } from "../lib/db.js";
import { parseTitle } from "../lib/todos.js";

export default async function handler(req, res) {
  try {
    if (req.method === "GET") {
      const todos = await sql`select id, title, done from todos order by id`;
      return res.status(200).json(todos);
    }
    if (req.method === "POST") {
      const title = parseTitle(req.body?.title);
      const [todo] = await sql`insert into todos (title) values (${title}) returning id, title, done`;
      return res.status(201).json(todo);
    }
    if (req.method === "PATCH") {
      const [todo] = await sql`
        update todos set done = not done where id = ${Number(req.query.id)}
        returning id, title, done`;
      return todo ? res.status(200).json(todo) : res.status(404).json({ error: "Not found" });
    }
    res.setHeader("Allow", "GET, POST, PATCH");
    return res.status(405).end();
  } catch (error) {
    return res.status(400).json({ error: error.message });
  }
}
