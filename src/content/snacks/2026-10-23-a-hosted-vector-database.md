---
title: A hosted vector database
date: 2026-10-23
kind: service
verdict: drop
url: https://example.com
take: A whole service to do what one Postgres extension already did.
---

Sample snack. I tried a hosted vector database for a small retrieval feature: about forty thousand chunks, one index, a handful of queries a minute.

It worked on the first try, and the dashboard is nice. But it also meant a second place to keep data in sync, a second bill and a second thing to be down.

The same queries on the Postgres I already run came back just as fast at this size. Dropped, for now. I'd look again at a hundred times the data.
