import { NextResponse } from 'next/server';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import { createSupabaseServiceClient } from '@/lib/supabase/service';

export async function GET() {
  try {
    const server = createSupabaseServerClient();
    const { data: { user }, error: authError } = await server.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const svc = createSupabaseServiceClient();

    // Get user profile to check if work permit is needed
    const { data: profile } = await svc
      .from('user_profiles')
      .select('needs_work_permit')
      .eq('user_id', user.id)
      .maybeSingle();

    // Get documents from database
    const { data: dbDocuments, error: docsError } = await svc
      .from('documents')
      .select('doc_type, status, file_path')
      .eq('user_id', user.id);

    if (docsError) {
      console.error('Error fetching documents:', docsError);
      return NextResponse.json({ error: 'Failed to fetch documents' }, { status: 500 });
    }

    const needsWorkPermit = !!profile?.needs_work_permit;

    // Define all possible documents with their requirements
    const documentTypes = [
      { type: 'citizenship', name: 'Staatsbürgerschaftsnachweis', required: true },
      { type: 'passport', name: 'Pass', required: true },
      { type: 'strafregister', name: 'Strafregister', required: true },
      { type: 'arbeitserlaubnis', name: 'Arbeitserlaubnis', required: needsWorkPermit },
      { type: 'additional', name: 'Zusätzliche Dokumente', required: false }
    ];

    // Map database documents by type
    const dbDocMap = new Map((dbDocuments || []).map(doc => [doc.doc_type, doc]));

    // Build response with current status for each document type
    const documents = documentTypes.map(docType => {
      const dbDoc = dbDocMap.get(docType.type);
      let status: 'missing' | 'pending' | 'approved' = 'missing';

      if (dbDoc) {
        if (dbDoc.status === 'approved') status = 'approved';
        else if (dbDoc.status === 'uploaded') status = 'pending';
        else status = 'missing'; // rejected or other states
      }

      return {
        type: docType.type,
        name: docType.name,
        required: docType.required,
        status: status
      };
    });

    return NextResponse.json({ documents });
  } catch (error) {
    console.error('Unexpected error in /api/me/documents:', error);
    return NextResponse.json({ 
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}
