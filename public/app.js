const list = document.querySelector("#list");
const form = document.querySelector("#add");

async function render() {
  const todos = await (await fetch("/api/todos")).json();
  list.replaceChildren(
    ...todos.map((todo) => {
      const item = document.createElement("li");
      const due = todo.due_on ? ` (due ${todo.due_on.slice(0, 10)})` : "";
      item.textContent = (todo.urgent ? `● ${todo.title}` : todo.title) + due;
      item.classList.toggle("done", todo.done);
      item.onclick = async () => {
        await fetch(`/api/todos?id=${todo.id}`, { method: "PATCH" });
        render();
      };
      return item;
    }),
  );
}

form.onsubmit = async (event) => {
  event.preventDefault();
  await fetch("/api/todos", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ title: form.title.value, urgent: form.urgent.checked, dueOn: form.dueOn.value }),
  });
  form.reset();
  render();
};

const version = await (await fetch("/api/version")).json();
document.querySelector("#version").textContent =
  `env: ${version.environment} · commit: ${version.sha.slice(0, 7)} · flags: ${JSON.stringify(version.flags)}`;
render();
