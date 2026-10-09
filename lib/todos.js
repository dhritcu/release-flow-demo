/** Trims a todo title and rejects empty or oversized input. */
export function parseTitle(input) {
  const title = typeof input === "string" ? input.trim() : "";
  if (title.length === 0) throw new Error("Title is required");
  if (title.length > 200) throw new Error("Title must be 200 characters or fewer");
  return title;
}
