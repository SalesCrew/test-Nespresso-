import { NextResponse } from 'next/server';
import { createSupabaseServiceClient } from '@/lib/supabase/service';

export async function POST(req: Request) {
  try {
    const svc = createSupabaseServiceClient();
    const now = new Date();

    console.log('🕐 Checking for scheduled messages to send at:', now.toISOString());

    // Find all scheduled messages that should be sent now
    const { data: dueMessages, error: fetchError } = await svc
      .from('messages')
      .select('*')
      .eq('status', 'scheduled')
      .lte('scheduled_send_time', now.toISOString());

    if (fetchError) {
      console.error('Error fetching due messages:', fetchError);
      return NextResponse.json({ error: fetchError.message }, { status: 500 });
    }

    console.log(`📬 Found ${dueMessages?.length || 0} messages ready to send`);

    if (!dueMessages || dueMessages.length === 0) {
      return NextResponse.json({ 
        success: true, 
        sent_count: 0, 
        message: 'No messages due for sending' 
      });
    }

    let sentCount = 0;
    const errors: string[] = [];

    // Process each due message
    for (const message of dueMessages) {
      try {
        console.log(`📤 Sending message ${message.id}: "${message.message_text.substring(0, 50)}..."`);
        
        // Update message status to 'sent' and set sent_at timestamp
        const { error: updateError } = await svc
          .from('messages')
          .update({
            status: 'sent',
            sent_at: now.toISOString()
          })
          .eq('id', message.id);

        if (updateError) {
          console.error(`❌ Error updating message ${message.id}:`, updateError);
          errors.push(`Message ${message.id}: ${updateError.message}`);
        } else {
          console.log(`✅ Message ${message.id} successfully marked as sent`);
          sentCount++;
        }
      } catch (error: any) {
        console.error(`❌ Error processing message ${message.id}:`, error);
        errors.push(`Message ${message.id}: ${error.message}`);
      }
    }

    console.log(`📊 Processing complete: ${sentCount} sent, ${errors.length} errors`);

    return NextResponse.json({
      success: true,
      sent_count: sentCount,
      total_due: dueMessages.length,
      errors: errors.length > 0 ? errors : undefined,
      timestamp: now.toISOString()
    });

  } catch (e: any) {
    console.error('❌ Critical error in send-scheduled:', e);
    return NextResponse.json({ 
      error: e?.message || 'Server error' 
    }, { status: 500 });
  }
}
