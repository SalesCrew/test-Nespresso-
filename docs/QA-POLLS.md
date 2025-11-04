# Realtime Polls - QA Checklist

Run across two browsers (admin and promotor accounts) in the same conversation.

1. Create poll (admin)
   - Open attachment menu → Abstimmung → enter question and at least 2 options → send.
   - Both clients receive a new poll message instantly.
   - Options start with 0 votes; no “Stimmen ansehen” present.

2. Vote (promotor)
   - Single-choice: selecting an option switches selection; bars and counts update in real-time on both clients.
   - Multi-choice: selecting/deselecting options updates tallies in real-time.
   - Avatars cap at 3 gray placeholders; count increases beyond 3.

3. Admin voting
   - Admin can also vote; tallies update for both clients.

4. Persistence
   - Refresh both clients; messages API returns poll payload with tallies and my selections.

5. Edge cases
   - Attempt vote when not participant → blocked.
   - Network drop during vote → recover on reconnect.
   - Read-only group: promotor cannot send text but can vote in polls.

6. Visual
   - Admin bubble green gradient; promotor bubble blue gradient.
   - Emoji icons only visible on focused inputs in modal; no focus rings/scrollbars.

If any step fails, check Socket.IO logs and Supabase tables: chat_polls, chat_poll_options, chat_poll_votes.

