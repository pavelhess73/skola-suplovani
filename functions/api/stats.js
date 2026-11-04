/**
 * Cloudflare Pages Function: /api/stats
 * Retrieves aggregated substitution and duty statistics for teachers within a date range,
 * along with detailed individual records and teacher absences summary.
 */

export async function onRequestGet(context) {
  const { request, env } = context;

  const corsHeaders = {
    'Content-Type': 'application/json',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
  };

  try {
    const url = new URL(request.url);
    const startDate = url.searchParams.get('startDate');
    const endDate = url.searchParams.get('endDate');

    if (!startDate || !endDate) {
      return new Response(
        JSON.stringify({
          success: false,
          error: 'Chybí parametry startDate a endDate (formát YYYY-MM-DD).',
        }),
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

    // 1. Fetch teacher substitution summary (excluding is_replacement = 1 from workload hours and total)
    const summaryQuery = `
      SELECT 
        teacher_name,
        COUNT(CASE WHEN type = 'HODINA' AND (is_replacement = 0 OR is_replacement IS NULL) THEN 1 END) AS hours_count,
        COUNT(CASE WHEN type = 'DOZOR' THEN 1 END) AS duties_count,
        COUNT(CASE WHEN is_replacement = 1 THEN 1 END) AS replacements_count,
        (COUNT(CASE WHEN type = 'HODINA' AND (is_replacement = 0 OR is_replacement IS NULL) THEN 1 END) + COUNT(CASE WHEN type = 'DOZOR' THEN 1 END)) AS total_count
      FROM substitution_records
      WHERE date >= ? AND date <= ?
      GROUP BY teacher_name
      ORDER BY total_count DESC, duties_count DESC, teacher_name ASC
    `;

    const summaryResult = await env.DB.prepare(summaryQuery).bind(startDate, endDate).all();
    const summary = summaryResult.results || [];

    // 2. Fetch detailed substitution records for the period
    const detailsQuery = `
      SELECT 
        id,
        date,
        teacher_name,
        original_teacher,
        type,
        hour_slot,
        subject,
        classroom,
        COALESCE(is_replacement, 0) AS is_replacement,
        created_at
      FROM substitution_records
      WHERE date >= ? AND date <= ?
      ORDER BY date DESC, hour_slot ASC, id ASC
    `;

    const detailsResult = await env.DB.prepare(detailsQuery).bind(startDate, endDate).all();
    const records = detailsResult.results || [];

    // 3. Fetch absence records for the period
    const absencesQuery = `
      SELECT 
        id,
        date,
        teacher_name,
        reason,
        time_range,
        created_at
      FROM absence_records
      WHERE date >= ? AND date <= ?
      ORDER BY date DESC, teacher_name ASC
    `;

    const absencesResult = await env.DB.prepare(absencesQuery).bind(startDate, endDate).all();
    const absences = absencesResult.results || [];

    // 4. Fetch absences grouped by reason
    const reasonsQuery = `
      SELECT 
        reason,
        COUNT(*) AS count
      FROM absence_records
      WHERE date >= ? AND date <= ?
      GROUP BY reason
      ORDER BY count DESC
    `;

    const reasonsResult = await env.DB.prepare(reasonsQuery).bind(startDate, endDate).all();
    const absencesByReason = reasonsResult.results || [];

    // 5. Fetch absences grouped by teacher
    const teachersQuery = `
      SELECT 
        teacher_name,
        COUNT(*) AS count
      FROM absence_records
      WHERE date >= ? AND date <= ?
      GROUP BY teacher_name
      ORDER BY count DESC, teacher_name ASC
    `;

    const teachersResult = await env.DB.prepare(teachersQuery).bind(startDate, endDate).all();
    const absencesByTeacher = teachersResult.results || [];

    // 6. Compute overall totals
    let totalHours = 0;
    let totalDuties = 0;
    let totalReplacements = 0;
    summary.forEach((item) => {
      totalHours += Number(item.hours_count || 0);
      totalDuties += Number(item.duties_count || 0);
      totalReplacements += Number(item.replacements_count || 0);
    });

    return new Response(
      JSON.stringify({
        success: true,
        startDate,
        endDate,
        summary,
        records,
        absences,
        absenceSummary: {
          totalAbsences: absences.length,
          byReason: absencesByReason,
          byTeacher: absencesByTeacher,
        },
        totals: {
          teachersCount: summary.length,
          totalHours,
          totalDuties,
          totalReplacements,
          grandTotal: totalHours + totalDuties,
          totalAbsences: absences.length,
        },
      }),
      { status: 200, headers: corsHeaders }
    );
  } catch (error) {
    console.error('Error in /api/stats:', error);
    return new Response(
      JSON.stringify({
        success: false,
        error: error.message || 'Chyba při načítání statistik z databáze.',
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
      'Access-Control-Allow-Methods': 'GET, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    },
  });
}
