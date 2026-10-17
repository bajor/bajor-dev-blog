const filters = document.querySelector(".note-filters");
const buttons = filters.querySelectorAll("button");
const notes = Array.from(document.querySelectorAll(".notes-list > li"), (element) => ({
  element,
  tags: JSON.parse(element.dataset.tags),
}));

filters.hidden = false;
filters.addEventListener("click", (event) => {
  const button = event.target.closest("button");
  if (!button) return;

  const tag = button.dataset.tag;
  buttons.forEach((filter) => {
    filter.setAttribute("aria-pressed", String(filter === button));
  });
  notes.forEach((note) => {
    note.element.hidden = tag !== "" && !note.tags.includes(tag);
  });
});
