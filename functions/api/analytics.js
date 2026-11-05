/**
 * Cloudflare Pages Function: /api/analytics
 * Returns aggregated analytics for charts:
 * 1. Absence timeline (weekly and monthly trend of absences / illness)
 * 2. Top 5 most substituted subjects
 * 3. Top 5 most substituted classrooms / classes
 * 4. Breakdown of absence reasons
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
    const startDate = url.searchParams.get('startDate') || '2000-01-01';
    const endDate = url.searchParams.get('endDate') || '2099-12-31';

    if (!env.DB) {
      return new Response(
        JSON.stringify({
          success: false,
          error: 'Cloudflare D1 databáze není nakonfigurována (chybí vazba env.DB v wrangler.toml).',
        }),
        { status: 500, headers: corsHeaders }
      );
    }

    // 1. Weekly absence timeline
    const weeklyAbsencesQuery = `
      SELECT 
        strftime('%Y-W%W', date) AS period,
        MIN(date) AS sample_date,
        COUNT(*) AS total_absences,
        COUNT(CASE WHEN LOWER(reason) LIKE '%sick%' OR LOWER(reason) LIKE '%nemoc%' THEN 1 END) AS sickness_count,
        COUNT(CASE WHEN LOWER(reason) LIKE '%lékař%' OR LOWER(reason) LIKE '%lekar%' THEN 1 END) AS doctor_count,
        COUNT(CASE WHEN LOWER(reason) LIKE '%školení%' OR LOWER(reason) LIKE '%skoleni%' THEN 1 END) AS training_count,
        COUNT(CASE WHEN LOWER(reason) LIKE '%očr%' OR LOWER(reason) LIKE '%ocr%' THEN 1 END) AS family_care_count
      FROM absence_records
      WHERE date >= ? AND date <= ?
      GROUP BY period
      ORDER BY period ASC
    `;
    const weeklyResult = await env.DB.prepare(weeklyAbsencesQuery).bind(startDate, endDate).all();
    const weeklyTimeline = (weeklyResult.results || []).map((row) => ({
      period: row.period,
      sample_date: row.sample_date,
      total_absences: Number(row.total_absences || 0),
      sickness_count: Number(row.sickness_count || 0),
      doctor_count: Number(row.doctor_count || 0),
      training_count: Number(row.training_count || 0),
      family_care_count: Number(row.family_care_count || 0),
    }));

    // 2. Monthly absence timeline
    const monthlyAbsencesQuery = `
      SELECT 
        strftime('%Y-%m', date) AS period,
        COUNT(*) AS total_absences,
        COUNT(CASE WHEN LOWER(reason) LIKE '%sick%' OR LOWER(reason) LIKE '%nemoc%' THEN 1 END) AS sickness_count,
        COUNT(CASE WHEN LOWER(reason) LIKE '%lékař%' OR LOWER(reason) LIKE '%lekar%' THEN 1 END) AS doctor_count
      FROM absence_records
      WHERE date >= ? AND date <= ?
      GROUP BY period
      ORDER BY period ASC
    `;
    const monthlyResult = await env.DB.prepare(monthlyAbsencesQuery).bind(startDate, endDate).all();
    const monthlyTimeline = (monthlyResult.results || []).map((row) => ({
      period: row.period,
      total_absences: Number(row.total_absences || 0),
      sickness_count: Number(row.sickness_count || 0),
      doctor_count: Number(row.doctor_count || 0),
    }));

    // 3. Top 5 most frequently substituted subjects (type = 'HODINA')
    const topSubjectsQuery = `
      SELECT 
        COALESCE(NULLIF(TRIM(subject), ''), 'Neuvedeno') AS name,
        COUNT(*) AS count
      FROM substitution_records
      WHERE type = 'HODINA' 
        AND date >= ? AND date <= ?
        AND subject IS NOT NULL 
        AND TRIM(subject) != ''
      GROUP BY name
      ORDER BY count DESC
      LIMIT 5
    `;
    const topSubjectsResult = await env.DB.prepare(topSubjectsQuery).bind(startDate, endDate).all();
    const topSubjects = (topSubjectsResult.results || []).map((row) => ({
      name: row.name,
      count: Number(row.count || 0),
    }));

    // 4. Top 5 most affected classes / classrooms
    const topClassroomsQuery = `
      SELECT 
        COALESCE(NULLIF(TRIM(classroom), ''), 'Neuvedeno') AS name,
        COUNT(*) AS count
      FROM substitution_records
      WHERE date >= ? AND date <= ?
        AND classroom IS NOT NULL 
        AND TRIM(classroom) != ''
      GROUP BY name
      ORDER BY count DESC
      LIMIT 5
    `;
    const topClassroomsResult = await env.DB.prepare(topClassroomsQuery).bind(startDate, endDate).all();
    const topClassrooms = (topClassroomsResult.results || []).map((row) => ({
      name: row.name,
      count: Number(row.count || 0),
    }));

    // 5. Reasons breakdown
    const reasonsQuery = `
      SELECT 
        COALESCE(NULLIF(TRIM(reason), ''), 'Neuvedeno') AS name,
        COUNT(*) AS count
      FROM absence_records
      WHERE date >= ? AND date <= ?
      GROUP BY name
      ORDER BY count DESC
      LIMIT 6
    `;
    const reasonsResult = await env.DB.prepare(reasonsQuery).bind(startDate, endDate).all();
    const topReasons = (reasonsResult.results || []).map((row) => ({
      name: row.name,
      count: Number(row.count || 0),
    }));

    return new Response(
      JSON.stringify({
        success: true,
        startDate,
        endDate,
        weeklyTimeline,
        monthlyTimeline,
        topSubjects,
        topClassrooms,
        topReasons,
      }),
      { status: 200, headers: corsHeaders }
    );
  } catch (error) {
    console.error('Error in /api/analytics:', error);
    return new Response(
      JSON.stringify({
        success: false,
        error: error.message || 'Chyba při načítání analytických dat.',
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
