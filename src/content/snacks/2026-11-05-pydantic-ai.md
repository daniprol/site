---
title: Pydantic AI
date: 2026-11-05
kind: library
verdict: keep
take: Agents as plain typed Python, and the output is a model you can trust.
pros:
  - Structured output is a Pydantic model, validated before I see it
  - Tools are ordinary typed functions
  - Swapping model providers is one string
cons:
  - The graph API is a second thing to learn
cover:
  src: ./images/pydantic-ai-run.png
  alt: Terminal output of a small agent calling two tools and returning a typed Verdict object
url: https://ai.pydantic.dev
---

Sample snack. I rewrote a small research agent with Pydantic AI to see how much of my own glue code would disappear. Most of it did.

The idea is that an agent is a typed function. You say what it returns, and the library keeps asking the model until the answer validates:

```python
from pydantic import BaseModel
from pydantic_ai import Agent


class Verdict(BaseModel):
    keep: bool
    reason: str
    caveats: list[str]


agent = Agent("anthropic:claude-haiku-5-5", output_type=Verdict)
```

Tools are ordinary functions with type hints and a docstring. There is no schema to write by hand, and a wrong argument fails in Python, where I can read the traceback, and not three calls later in a prompt.

What I have not made friends with is the graph API for longer workflows. It is powerful, but it is a second mental model on top of the first. For single agents and small teams of them, this is now my default. Merged.
