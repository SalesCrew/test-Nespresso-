# Krankenstand/Notfall Daily Application Setup

## Overview
The krankenstand/notfall system requires a daily job to apply special status to new assignments for users who have active krankenstand or notfall status.

## API Endpoint
```
GET /api/special-status/apply-daily
```

This endpoint:
1. Fetches all users with active special status (krankenstand/notfall)
2. Finds their assignments for today
3. Updates those assignments with the appropriate special_status

## Vercel Cron Job Setup

Add to your `vercel.json`:

```json
{
  "crons": [{
    "path": "/api/special-status/apply-daily",
    "schedule": "0 6 * * *"
  }]
}
```

This runs daily at 6 AM UTC (7 AM CET / 8 AM CEST).

## Manual Trigger
You can manually trigger the daily application by visiting:
```
https://your-app.vercel.app/api/special-status/apply-daily
```

## Alternative: Supabase Edge Function

If you prefer using Supabase Edge Functions:

```typescript
// supabase/functions/apply-special-status-daily/index.ts
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

serve(async (req) => {
  const response = await fetch('https://your-app.vercel.app/api/special-status/apply-daily')
  const data = await response.json()
  
  return new Response(JSON.stringify(data), {
    headers: { 'Content-Type': 'application/json' },
  })
})
```

Then schedule it in Supabase Dashboard under "Edge Functions" > "Scheduled Functions".

## Testing
To test the daily application locally:
1. Create a krankenstand/notfall request as a promotor
2. Approve it as an admin
3. Call the apply-daily endpoint
4. Check that today's assignments show the special status
