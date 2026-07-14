---
name: feedback-git-push
description: Never run git push or git commit — user handles all git operations manually
metadata: 
  node_type: memory
  type: feedback
  originSessionId: c8c599b2-4bc5-4057-8890-920b021b0b65
---

Never run `git push`, `git commit`, `git add`, or any destructive git commands. The user handles all git operations (commit, push) manually.

**Why:** User's explicit preference — they want control over what gets committed and pushed.

**How to apply:** After making code changes, stop at the file edits. Tell the user what was changed and let them commit/push themselves. Do not stage, commit, or push even if it seems like a natural next step.
