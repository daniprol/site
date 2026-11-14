---
title: Claude Haiku 5.5
date: 2026-11-02
kind: model
verdict: keep
url: https://www.anthropic.com
take: Fast enough that I stopped noticing the wait.
pros:
  - Quick enough to fan out without thinking about it
  - Says so when a page has nothing useful
cons:
  - Loses the thread on long, subtle reasoning
---

Sample snack. I used it for a research fan-out today: eight agents, each reading a different corner of the PyO3 and maturin docs, then one pass to merge the notes. The whole run finished before I had switched windows.

![Terminal output of a research fan-out with eight small agents, all finished in under a minute](./images/haiku-fan-out.svg)

Tool use held up better than I expected from a small model. It searched with sensible queries, didn't loop, and **said so when a page had nothing useful** instead of padding the summary.

It still loses the thread on long, subtle reasoning, so the merge step stays on a bigger model. For the fan-out part it is now my default.
