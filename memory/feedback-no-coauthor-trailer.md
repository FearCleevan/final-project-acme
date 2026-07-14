---
name: feedback-no-coauthor-trailer
description: "Do not add \"Co-Authored-By: Claude Sonnet 5 <noreply@anthropic.com>\" trailer to git commit messages for this user"
metadata: 
  node_type: memory
  type: feedback
  originSessionId: 8e03d74c-51c1-430c-af17-35823940a9fc
---

Never add the `Co-Authored-By: Claude Sonnet 5 <noreply@anthropic.com>` trailer to git commit messages.

**Why:** User explicitly asked to have it omitted (2026-07-09), during the cart-activity-tracking/visitor-map work on the Acme Lamp & Sign project. No reason given, just a standing preference.

**How to apply:** When constructing any `git commit -m` message (via heredoc or otherwise) for this user's repos, leave off the Co-Authored-By trailer entirely — just the commit subject/body, nothing appended after.

**Subagents also do this by default** (their own git-commit instructions add it) — dispatch prompts for implementer/fix subagents should explicitly say "do not add a Co-Authored-By trailer." If one slips through anyway, `git commit --amend` to strip it before merging/finishing the branch (safe since these are local, unmerged feature-branch commits).
