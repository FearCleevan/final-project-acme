---
name: feedback-create-daily-log
description: How to handle the "Create Daily Log" command — what to scrape, format rules, and where to save
metadata:
  type: feedback
---

When the user says **"Create Daily Log"**, follow this process every time:

1. **Read all memory files** — check MEMORY.md index, then read every daily log and project memory relevant to today's date
2. **Read the current session** — pull everything done in the active conversation, including tool calls and results
3. **Check the Client Requirements Checklist folder** — read any existing daily log files for context and the June 18 log as a format reference
4. **Write the EDR to the correct date file** — `Client Requirements Checklist/DAILY_LOG_YYYY-MM-DD.md` matching today's date. Never overwrite a previous day's log.
5. **Update the memory session log** — append or update `memory/daily-log-YYYY-MM-DD.md` to reflect all sessions

**Format rules (learned from user correction):**
- Title: `# End of Day Report — [Date]`
- Written in **third person** — never say "you" addressing the reader
- Reads like a **professional business EDR**, not a tutorial or walkthrough
- Sections: Summary → Completed Today (numbered) → Discovered During Work → Pending Carry-Over table → Waiting on Scott table
- No technical jargon — layman's terms throughout
- If stock quantities or specific data were updated, include the full table

**Why:** User corrected a version that said "you" throughout and didn't read like a progress report. The June 19 EDR is the approved format template. [[daily-log-2026-06-19]]
