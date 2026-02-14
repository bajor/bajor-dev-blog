---
layout: post
title: "raccoon.nvim: Reviewing AI-Generated PRs in Neovim by Replaying Commits Like Chess Moves"
date: 2026-02-12
---

AI agents write code fast. Reviewing what they wrote is the bottleneck.

My workflow looks like this: I describe what I want, an AI agent builds it, and I review the result. The building part is solved. The reviewing part — actually understanding what the agent produced before I ship it — that's where I struggle. I get bored with code reviews quickly, especially long ones.

GitHub's diff UI is fine for small human PRs. But when an agent generates 15 commits across 8 files, clicking through a browser isn't cutting it. I lose context. I miss things. And I rush through it, which is exactly the wrong thing to do with AI-generated code that I'm putting my name on.

I've never been a full-time Neovim user. I've bounced between IntelliJ, VSCode with vim plugins — could never quite get Neovim to work smoothly with full projects (probably a skill issue). But I always loved vim-style navigation. And PR review doesn't require extensive editing — it's mostly navigating through a codebase and reading. That made Neovim feel like a natural fit. So I built [raccoon.nvim](https://github.com/bajor/nvim-raccoon).

## Replaying commits like chess moves

A PR's flat diff is a final board position. It tells you what changed but not why. To understand a chess game, you don't stare at the final position — you replay it move by move. Each move reveals intent: why this piece, why now, what's the plan.

AI agent PRs have the same structure. The agent didn't write everything at once — it worked commit by commit. First the types, then the implementation, then the tests. That sequence is the reasoning. The flat diff throws it away.

raccoon.nvim's commit viewer lets you step through a PR commit by commit. You see what the agent did at each step, in order, with full syntax highlighting and LSP support. Press `<leader>cm` to enter it.

{% include video.html src="/assets/videos/raccoon/commit-viewer.mov" %}

The screen splits into three panels. The file tree on the left highlights files touched in the current commit. The center shows a diff grid — 2x2 by default — with one syntax-highlighted hunk per cell. The commit sidebar on the right lists all PR commits. Press `j`/`k` in the sidebar to step through them. The grid updates instantly — you see what changed at each step and why.

Any grid cell can expand to a full floating window for large files, and the file tree is searchable — navigate with `j`/`k`, search with `/`, press Enter to view a file's full content at the current commit.

{% include video.html src="/assets/videos/raccoon/maximize-and-tree.mov" %}

## The basics

Commit replay is the point, but raccoon.nvim also covers the standard PR workflow.

`:Raccoon prs` (or `<leader>pr`) opens a floating picker with your open PRs. Pick one, press Enter. Raccoon shallow-clones the PR branch locally — your LSP, treesitter, and everything else work on the actual source. Reopening the same PR later is fast (fetch, not clone).

{% include video.html src="/assets/videos/raccoon/open-pr.mov" %}

Changed files open with inline diff highlighting — green for additions, red for deletions shown as virtual text. Navigate hunks with `<leader>j`/`<leader>k`, files with `<leader>nf`/`<leader>pf`.

{% include video.html src="/assets/videos/raccoon/review-diffs.mov" %}

`<leader>c` at cursor to write an inline comment, `<leader>s` to submit. Comments appear as highlights with a sign column marker. `<leader>ll` lists all comments, `<leader>r` resolves a thread. When you're done, `<leader>rr` to merge.

{% include video.html src="/assets/videos/raccoon/comments.mov" %}

All keymaps are configurable; `<leader>?` shows them.

## Watching the agent think

The commit viewer replays finished games. `:Raccoon local` is watching a live one.

`:Raccoon local` opens the same three-panel layout on any git repo — no PR, no GitHub token needed. The first sidebar entry is **"Current changes"** — a live view of uncommitted work (staged + unstaged vs HEAD).

{% include video.html src="/assets/videos/raccoon/local-commits.mov" %}

Run `:Raccoon local`, select "Current changes", and watch the agent's edits appear in real-time as it works in another terminal. The view polls every 3 seconds, backs off to 30 seconds when idle, and snaps back to fast polling when changes appear. When the agent commits, new commits appear in the sidebar automatically.

{% include video.html src="/assets/videos/raccoon/current-changes.mov" %}

As AI agents get better at writing code, reviewing what they wrote becomes the actual job. Learning to do that efficiently — staying close to the code while the agent runs — feels like the skill worth investing in. Gabriella Gonzalez's [Beyond Agentic Coding](https://haskellforall.com/2026/02/beyond-agentic-coding) put this into words better than I could: good tools keep you in flow state and in direct contact with the code. That's what raccoon.nvim is for.

Source and installation on [GitHub](https://github.com/bajor/nvim-raccoon).
