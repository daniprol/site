---
title: Claude Haiku 5.5
date: 2026-11-02
kind: model
verdict: keep
take: Fast enough that I stopped noticing the wait, and better at tools than a small model should be.
pros:
  - Quick enough to use inside a loop
  - Held up on tool use across a research fan-out
  - Cheap enough to run many at once
cons:
  - Loses the thread on long, messy instructions
url: https://www.anthropic.com
---

Sample snack. I used it today for a research fan-out: one planner, a dozen small workers, each with a search tool and a page reader. That is the kind of job where a slow model makes you rethink the design.

It did not. Each worker came back in a few seconds, and the tool calls were well formed every time, which I did not expect from the small model in a family.

Where it slips is long, messy instructions. Give it three clear things to do and it does them. Give it a page of caveats and it keeps the first half. That is fine for workers, and it is what the bigger models are for.

It goes in the toolbox as the default for anything that runs in a loop. Merged.
