---
layout: post
title: "50k Lines of AI Slop at Data Science Summit AI Edition 2026"
date: 2026-08-17
---

I had the pleasure of speaking at [Data Science Summit AI Edition 2026](https://ml.dssconf.pl/). My talk was called **50k Lines of AI Slop and What I've Learned From It**.

The talk was about working with AI coding assistants without losing control of the codebase. It started from a personal case study: a project that grew to roughly 50,000 lines of AI-assisted code, became hard to understand, and forced me to change how I use these tools.

The main point was not that AI coding tools are useless. They are too powerful to ignore. The problem starts when generation speed outruns understanding. If I cannot explain the critical parts of a system, reason about the trade-offs, and challenge the output, I am not moving faster. I am creating long-term risk.

The old good practices did not become less relevant because AI can generate code quickly. They became more important. Planning, small changes, code review, CI, and maintainability are the things that keep generation from turning into a slot machine.

The practical part of the talk focused on habits that make AI-assisted work more reviewable:

- plan before implementation
- keep pull requests small
- treat code review as the bottleneck on purpose
- use CI to catch obvious dead or unreachable code
- use mutation testing to find tests that pass without really checking behavior
- extend existing code instead of gluing new pieces onto the side
- treat AI reviewers as filters, not actual reviewers
- use custom tooling only when it actually improves the workflow

I also showed some of my own setups for longer planning and review sessions: using a VPS with persistent terminal sessions, writing implementation plans into Obsidian, and using AI-generated diagrams to make pull requests easier to inspect.

## Slides

**[Download the slides as a static PDF.](/assets/docs/dss-ai-edition-2026/50k-loc-ai-slop-data-science-summit-ai-edition-2026-slides.pdf)**

The PDF is static, so it does not include the motion from the original presentation, but it has the full slide deck.

There is also a [conference certificate](https://api.fundacjaap.org.pl/api/Admin/Lecturer/2707af09-d81e-42f4-81c5-495655362fa6/Certificate/8aa7f2c0-89fb-4663-9d95-7921e0592601?lang=en) for the talk.
