---
layout: post
title: "raccoon.nvim: Reviewing AI-Generated Code in Neovim"
date: 2026-02-12
---

AI agents write code fast. Reviewing what they wrote is the bottleneck.

My workflow looks like this: I describe what I want, an AI agent builds it, and I review the result. The building part is solved. The reviewing part — actually understanding what the agent produced before I ship it — that's where things break down.

GitHub's diff UI is fine for small human PRs. But when an agent generates 15 commits across 8 files, clicking through a browser isn't cutting it. I lose context. I miss things. And honestly, I just don't enjoy it — so I rush through it, which is exactly the wrong thing to do with AI-generated code that I'm putting my name on.

I use Neovim for everything. I figured if the review happened there — in my environment, with my keybindings, in my flow — I might actually do it properly. So I built [raccoon.nvim](https://github.com/bajor/nvim-raccoon).

The design philosophy is influenced by Gabriella Gonzalez's [Beyond Agentic Coding](https://haskellforall.com/2026/02/beyond-agentic-coding). The argument is that good tools keep you in a flow state and in direct contact with the code. That's the guiding star here. I went from dreading PR reviews to clicking into them willingly. For me that's a massive shift.

---

## What It Does

Review GitHub pull requests inside Neovim. Browse diffs with syntax highlighting, leave inline comments, step through commits one by one, and merge. No browser needed.

---

## Installation

Neovim 0.9+, [plenary.nvim](https://github.com/nvim-lua/plenary.nvim), and a GitHub token.

Using [lazy.nvim](https://github.com/folke/lazy.nvim):

```lua
{
  "bajor/nvim-raccoon",
  dependencies = { "nvim-lua/plenary.nvim" },
  config = function()
    require("raccoon").setup()
  end,
}
```

Restart Neovim. Run `:Raccoon config` to create `~/.config/raccoon/config.json`:

```json
{
  "github_username": "your-username",
  "tokens": {
    "your-username": "ghp_xxxxxxxxxxxxxxxxxxxx"
  }
}
```

![GIF: Running :Raccoon config, editing the config file](placeholder-config.gif)

For the token — **classic** ([create here](https://github.com/settings/tokens)) with `repo` scope, or **fine-grained** ([create here](https://github.com/settings/personal-access-tokens)) with read/write access to code, issues, and pull requests.

Multiple orgs? Add a token per org:

```json
{
  "tokens": {
    "your-username": "ghp_personal",
    "work-org": "ghp_work"
  }
}
```

Done. Run `:Raccoon prs`.

---

## Opening a PR

`:Raccoon prs` (or `<leader>pr`) opens a floating picker with your open PRs. Pick one, press Enter.

![GIF: Opening the PR picker, selecting a PR](placeholder-open-pr.gif)

Raccoon shallow-clones the PR branch locally. Neovim's working directory switches to that clone — your LSP, treesitter, and everything else work on the actual source. Reopening the same PR later is fast (fetch, not clone).

You can also open by URL: `:Raccoon open https://github.com/owner/repo/pull/42`

---

## Reviewing Diffs

Changed files open with inline diff highlighting. Green background + `+` signs for additions. Red background + `-` signs for deletions (shown as virtual text).

![GIF: Navigating diff hunks and files with highlights](placeholder-review-diffs.gif)

Navigation:

| Key | Action |
|-----|--------|
| `<leader>j` / `<leader>k` | Next/prev diff hunk |
| `<leader>nf` / `<leader>pf` | Next/prev file |

The statusline shows `[1/3] ✓ In sync` — file 1 of 3, up to date. If someone pushes, it becomes `[1/3] ⚠ 2 commits behind main`. Run `:Raccoon sync` or let auto-sync handle it (runs every 5 minutes by default).

---

## Inline Comments

`<leader>c` at cursor → write comment → `<leader>s` to submit.

![GIF: Writing an inline comment and submitting it](placeholder-comments.gif)

Comments appear as highlights with a 💬 in the sign column. `<leader>ll` lists all comments. `<leader>r` resolves a thread, `<leader>u` unresolves.

---

## Commit Viewer Mode

This is why I built the plugin.

When an AI agent creates a PR, the flat diff is often overwhelming. But the agent didn't write it all at once — it worked commit by commit. First the types, then the implementation, then the tests. That sequence is the story of what happened. Losing it is like looking at a chess game's final position without seeing the moves.

Commit viewer mode lets you replay the agent's work move by move. Press `<leader>cm`.

![GIF: Entering commit viewer mode, grid layout appearing](placeholder-commit-viewer.gif)

The screen splits into three panels:

- **Left** — File tree. Files touched in the current commit are highlighted. Files visible in the grid are brightest.
- **Center** — Diff grid (2x2 by default). Each cell shows one hunk with syntax highlighting.
- **Right** — Commit sidebar. All PR commits + recent base branch commits.

Press `j`/`k` in the sidebar to step through commits. The grid updates instantly. You see what the agent did at each step — the intent behind each commit becomes clear.

This is where reviewing AI code stops feeling like a chore. You're not staring at a wall of changes. You're following a narrative. It's actually engaging.

If a commit has more hunks than the grid fits, `<leader>j`/`<leader>k` pages through them.

### Maximizing a Cell

`<leader>m1` through `<leader>m9` maximizes a grid cell into a full floating window. Good for large files. `q` to close.

![GIF: Maximizing a grid cell for a full file view](placeholder-maximize.gif)

### File Tree Browsing

`<leader>f` moves focus to the file tree. Navigate with `j`/`k`, search with `/`, press Enter to view a file's full content at the current commit. `<leader>f` again to go back.

![GIF: Browsing the file tree, viewing a file at a specific commit](placeholder-file-tree.gif)

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

![GIF: Local commit viewer browsing repo history](placeholder-local-commits.gif)

Same layout: file tree, diff grid, commit sidebar. But the first sidebar entry is **"Current changes"** — a live view of uncommitted work (staged + unstaged vs HEAD).

This is where things get interesting with AI agents. Run `:Raccoon local`, select "Current changes", and watch the agent's edits flow in real-time as it works in another terminal. The view polls every 3 seconds, backs off to 30 seconds when idle, and snaps back to fast polling when changes appear.

![GIF: Watching "Current changes" update in real-time as an agent writes code](placeholder-current-changes.gif)

When the agent commits, new commits appear in the sidebar automatically. Your selection stays where it is — nothing jumps around.

Local mode coexists with PR reviews. Entering pauses any active PR session, exiting resumes it.

---

## Merging

When you're satisfied with what the agent produced:

```
:Raccoon merge
:Raccoon squash
:Raccoon rebase
```

Or `<leader>rr` to pick a method.

![GIF: Merging a PR from Neovim](placeholder-merge.gif)

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

## Config Reference

```json
{
  "github_username": "your-username",
  "github_host": "github.com",
  "tokens": { "your-username": "ghp_..." },
  "clone_root": "~/.local/share/nvim/raccoon/repos",
  "pull_changes_interval": 300,
  "commit_viewer": {
    "grid": { "rows": 2, "cols": 2 },
    "base_commits_count": 20
  }
}
```

| Field | Default | What it does |
|-------|---------|--------------|
| `github_host` | `"github.com"` | GitHub Enterprise: set to your GHE domain |
| `clone_root` | `~/.local/share/nvim/raccoon/repos` | Where PR branches get cloned |
| `pull_changes_interval` | `300` | Auto-sync interval (seconds) |
| `commit_viewer.grid.rows` | `2` | Rows in diff grid |
| `commit_viewer.grid.cols` | `2` | Columns in diff grid |
| `commit_viewer.base_commits_count` | `20` | Base branch commits in sidebar |

---

## Version

This covers raccoon.nvim v0.9.1. The tool is actively evolving — check the [CHANGELOG](https://github.com/bajor/nvim-raccoon/blob/main/CHANGELOG.md) for the latest.

Source: [github.com/bajor/nvim-raccoon](https://github.com/bajor/nvim-raccoon)
