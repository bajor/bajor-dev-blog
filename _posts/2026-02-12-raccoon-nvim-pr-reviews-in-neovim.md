---
layout: post
title: "raccoon.nvim: Reviewing AI-Generated Code in Neovim"
date: 2026-02-12
---

AI agents write code fast. Reviewing what they wrote is the bottleneck.

My workflow looks like this: I describe what I want, an AI agent builds it, and I review the result. The building part is solved. The reviewing part — actually understanding what the agent produced before I ship it — that's where I struggle. I get bored with code reviews quickly, especially long ones.

GitHub's diff UI is fine for small human PRs. But when an agent generates 15 commits across 8 files, clicking through a browser isn't cutting it. I lose context. I miss things. And I rush through it, which is exactly the wrong thing to do with AI-generated code that I'm putting my name on.

I've never been a full-time Neovim user. I've bounced between IntelliJ, VSCode with vim plugins — could never quite get Neovim to work smoothly with full projects (probably a skill issue). But I always loved vim-style navigation. And PR review doesn't require extensive editing — it's mostly navigating through a codebase and reading. That made Neovim feel like a natural fit. So I built [raccoon.nvim](https://github.com/bajor/nvim-raccoon).

---

## What It Does

Review GitHub pull requests inside Neovim. Browse diffs with syntax highlighting, leave inline comments, step through commits one by one, and merge. No browser needed.

---

## Opening a PR

`:Raccoon prs` (or `<leader>pr`) opens a floating picker with your open PRs. Pick one, press Enter.

{% include video.html src="/assets/videos/raccoon/open-pr.mov" %}

Raccoon shallow-clones the PR branch locally. Neovim's working directory switches to that clone — your LSP, treesitter, and everything else work on the actual source. Reopening the same PR later is fast (fetch, not clone).

You can also open by URL: `:Raccoon open https://github.com/owner/repo/pull/42`

---

## Reviewing Diffs

Changed files open with inline diff highlighting. Green background + `+` signs for additions. Red background + `-` signs for deletions (shown as virtual text).

{% include video.html src="/assets/videos/raccoon/review-diffs.mov" %}

Navigation:

| Key | Action |
|-----|--------|
| `<leader>j` / `<leader>k` | Next/prev diff hunk |
| `<leader>nf` / `<leader>pf` | Next/prev file |

The statusline shows `[1/3] ✓ In sync` — file 1 of 3, up to date. If someone pushes, it becomes `[1/3] ⚠ 2 commits behind main`. Run `:Raccoon sync` or let auto-sync handle it (runs every 5 minutes by default).

---

## Inline Comments

`<leader>c` at cursor → write comment → `<leader>s` to submit.

{% include video.html src="/assets/videos/raccoon/comments.mov" %}

Comments appear as highlights with a 💬 in the sign column. `<leader>ll` lists all comments. `<leader>r` resolves a thread, `<leader>u` unresolves.

---

## Commit Viewer Mode

When an AI agent creates a PR, the flat diff is often overwhelming. But the agent didn't write it all at once — it worked commit by commit. First the types, then the implementation, then the tests. That sequence is the story of what happened. Losing it is like looking at a chess game's final position without seeing the moves.

Commit viewer mode lets you replay the agent's work move by move. Press `<leader>cm`.

{% include video.html src="/assets/videos/raccoon/commit-viewer.mov" %}

The screen splits into three panels:

- **Left** — File tree. Files touched in the current commit are highlighted. Files visible in the grid are brightest.
- **Center** — Diff grid (2x2 by default). Each cell shows one hunk with syntax highlighting.
- **Right** — Commit sidebar. All PR commits + recent base branch commits.

Press `j`/`k` in the sidebar to step through commits. The grid updates instantly. You see what the agent did at each step — the intent behind each commit becomes clear.

This is where reviewing AI code stops feeling like a chore. You're not staring at a wall of changes. You're following a narrative. It's actually engaging.

I'm still figuring this out, but stepping through commits like this genuinely makes PR review less painful — sometimes even enjoyable. I think that matters. As AI agents get better at writing code, reviewing what they wrote becomes the actual job (right after figuring out what you want and designing the solution). Learning to do that efficiently feels like the skill worth investing in. Gabriella Gonzalez's [Beyond Agentic Coding](https://haskellforall.com/2026/02/beyond-agentic-coding) put this into words better than I could — good tools keep you in flow and in direct contact with the code.

If a commit has more hunks than the grid fits, `<leader>j`/`<leader>k` pages through them.

### Maximizing a Cell & File Tree

`<leader>m1` through `<leader>m9` maximizes a grid cell into a full floating window. Good for large files. `q` to close. `<leader>f` moves focus to the file tree — navigate with `j`/`k`, search with `/`, press Enter to view a file's full content at the current commit. `<leader>f` again to go back.

{% include video.html src="/assets/videos/raccoon/maximize-and-tree.mov" %}

### Commit Viewer Keymaps

| Key | Action |
|-----|--------|
| `j` / `k` | Step through commits |
| `<leader>j` / `<leader>k` | Page diff hunks |
| `<leader>m1`..`m9` | Maximize grid cell |
| `<leader>f` | Toggle sidebar / file tree |
| `q` | Close maximized view |
| `<leader>cm` | Exit commit viewer |

---

## Local Commit Viewer

`:Raccoon local` opens the commit viewer on any git repo — no PR, no GitHub token.

{% include video.html src="/assets/videos/raccoon/local-commits.mov" %}

Same layout: file tree, diff grid, commit sidebar. But the first sidebar entry is **"Current changes"** — a live view of uncommitted work (staged + unstaged vs HEAD).

This is where things get interesting with AI agents. Run `:Raccoon local`, select "Current changes", and watch the agent's edits flow in real-time as it works in another terminal. The view polls every 3 seconds, backs off to 30 seconds when idle, and snaps back to fast polling when changes appear.

{% include video.html src="/assets/videos/raccoon/current-changes.mov" %}

When the agent commits, new commits appear in the sidebar automatically.

Local mode coexists with PR reviews. Entering pauses any active PR session, exiting resumes it.

---

## Shortcuts

All configurable in `~/.config/raccoon/config.json`. Defaults:

| Key | Action |
|-----|--------|
| `<leader>pr` | Open PR picker |
| `<leader>j` / `<leader>k` | Next/prev diff hunk |
| `<leader>nf` / `<leader>pf` | Next/prev file |
| `<leader>nt` / `<leader>pt` | Next/prev comment thread |
| `<leader>c` | Comment at cursor |
| `<leader>dd` | PR description |
| `<leader>ll` | List all comments |
| `<leader>rr` | Merge PR |
| `<leader>cm` | Toggle commit viewer |
| `<leader>?` | Show all shortcuts |
| `<leader>q` | Close / exit |

Set any shortcut to `false` to disable it. `:Raccoon` commands still work.

---

## Statusline

For [lualine.nvim](https://github.com/nvim-lualine/lualine.nvim):

```lua
{
  require('raccoon').statusline,
  cond = require('raccoon').is_active,
}
```

Shows: `✓ In sync` (green), `⚠ 2 commits behind` (yellow), `⛔ CONFLICTS` (red).

---

Installation, configuration, and full reference are covered on [GitHub](https://github.com/bajor/nvim-raccoon).
