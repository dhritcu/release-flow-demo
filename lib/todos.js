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
