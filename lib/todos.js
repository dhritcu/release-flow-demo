/** Trims a todo title and rejects empty or oversized input. */
export function parseTitle(input) {
  const title = typeof input === "string" ? input.trim() : "";
  if (title.length === 0) throw new Error("Title is required");
  if (title.length > 200) throw new Error("Title must be 200 characters or fewer");
  return title;
}

/** Parses a todo id from the query string; anything but a positive integer is rejected. */
export function parseId(input) {
  const id = Number(input);
  if (!Number.isInteger(id) || id <= 0) throw new Error("Invalid id");
  return id;
}

/** Parses an optional due date; only a real calendar date as YYYY-MM-DD is accepted. */
export function parseDueOn(input) {
  if (input === undefined || input === null || input === "") return null;
  const valid =
    typeof input === "string" &&
    /^\d{4}-\d{2}-\d{2}$/.test(input) &&
    new Date(`${input}T00:00:00Z`).toISOString().startsWith(input);
  if (!valid) throw new Error("Due date must be a date (YYYY-MM-DD)");
  return input;
}

/** Parses the optional urgent flag; only a JSON boolean is accepted, so "false" is not true. */
export function parseUrgent(input) {
  if (input === undefined) return false;
  if (typeof input !== "boolean") throw new Error("Urgent must be true or false");
  return input;
}
