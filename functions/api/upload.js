/**
 * Cloudflare Pages Function: /api/upload
 * Handles bulk upload of parsed substitution records and absences for a specific date.
 * Deletes old records for that date and inserts new ones in a batch/transaction.
 */

export async function onRequestPost(context) {
  const { request, env } = context;

  // Set CORS headers
  const corsHeaders = {
    'Content-Type': 'application/json',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
  };

  try {
    const body = await request.json();
    const { date, records, absences = [] } = body;

    if (!date) {
      return new Response(
        JSON.stringify({ success: false, error: 'Chybí povinný parametr "date" ve formátu YYYY-MM-DD.' }),
        { status: 400, headers: corsHeaders }
      );
    }

    if (!Array.isArray(records)) {
      return new Response(
        JSON.stringify({ success: false, error: 'Parametr "records" musí být pole.' }),
        { status: 400, headers: corsHeaders }
      );
    }

    if (!env.DB) {
      return new Response(
        JSON.stringify({
          success: false,
          error: 'Cloudflare D1 databáze není nakonfigurována (chybí vazba env.DB v wrangler.toml).',
        }),
        { status: 500, headers: corsHeaders }
      );
    }

    // 1. Prepare delete statements for substitutions and absences
    const deleteSubstStmt = env.DB.prepare('DELETE FROM substitution_records WHERE date = ?').bind(date);
    const deleteAbsenceStmt = env.DB.prepare('DELETE FROM absence_records WHERE date = ?').bind(date);

    // 2. Prepare insert statements for substitutions
    const insertSubstStmts = records.map((r) =>
      env.DB.prepare(
        `INSERT INTO substitution_records 
         (date, teacher_name, original_teacher, type, hour_slot, subject, classroom) 
         VALUES (?, ?, ?, ?, ?, ?, ?)`
      ).bind(
        date,
        r.teacher_name,
        r.original_teacher || null,
        r.type === 'DOZOR' ? 'DOZOR' : 'HODINA',
        r.hour_slot || null,
        r.subject || null,
        r.classroom || null
      )
    );

    // 3. Prepare insert statements for absences
    const insertAbsenceStmts = (Array.isArray(absences) ? absences : []).map((a) =>
      env.DB.prepare(
        `INSERT INTO absence_records 
         (date, teacher_name, reason, time_range) 
         VALUES (?, ?, ?, ?)`
      ).bind(
        date,
        a.teacher_name,
        a.reason || 'Neurčeno',
        a.time_range || 'Celý den'
      )
    );

    // Execute atomic batch
    await env.DB.batch([
      deleteSubstStmt,
      deleteAbsenceStmt,
      ...insertSubstStmts,
      ...insertAbsenceStmts,
    ]);

    return new Response(
      JSON.stringify({
        success: true,
        message: `Záznamy pro ${date} byly úspěšně uloženy (${records.length} suplování, ${absences.length} absencí).`,
        date,
        count: records.length,
        absencesCount: absences.length,
      }),
      { status: 200, headers: corsHeaders }
    );
  } catch (error) {
    console.error('Error in /api/upload:', error);
    return new Response(
      JSON.stringify({
        success: false,
        error: error.message || 'Nastala neočekávaná chyba při ukládání záznamů.',
      }),
      { status: 500, headers: corsHeaders }
    );
  }
}

export async function onRequestOptions() {
  return new Response(null, {
    status: 204,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    },
  });
}
