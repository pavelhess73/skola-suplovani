/**
 * Cloudflare Pages Function: /api/fairplay
 * Returns active teachers sorted ASCENDING by workload for a given month or date range.
 * Provides separate rankings for substitutions ('HODINA') and duties ('DOZOR'),
 * making it easy for coordinators to find teachers with the least duties.
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
    let startDate = url.searchParams.get('startDate');
    let endDate = url.searchParams.get('endDate');
    const month = url.searchParams.get('month');

    // Default to current month or provided month
    if (month && /^\d{4}-\d{2}$/.test(month)) {
      startDate = `${month}-01`;
      // Handle month end date
      const [year, m] = month.split('-').map(Number);
      const lastDay = new Date(year, m, 0).getDate();
      endDate = `${month}-${String(lastDay).padStart(2, '0')}`;
    } else if (!startDate || !endDate) {
      const now = new Date();
      const currentYear = now.getFullYear();
      const currentMonth = String(now.getMonth() + 1).padStart(2, '0');
      const lastDay = new Date(currentYear, now.getMonth() + 1, 0).getDate();
      startDate = `${currentYear}-${currentMonth}-01`;
      endDate = `${currentYear}-${currentMonth}-${String(lastDay).padStart(2, '0')}`;
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

    // CTE to get all known teachers so teachers with 0 duties/hours in this period are included!
    const query = `
      WITH all_teachers AS (
        SELECT DISTINCT teacher_name FROM substitution_records
        UNION
        SELECT DISTINCT teacher_name FROM absence_records
      )
      SELECT 
        t.teacher_name,
        COALESCE(COUNT(CASE WHEN s.type = 'HODINA' AND (s.is_replacement = 0 OR s.is_replacement IS NULL) THEN 1 END), 0) AS hours_count,
        COALESCE(COUNT(CASE WHEN s.type = 'DOZOR' THEN 1 END), 0) AS duties_count,
        COALESCE(COUNT(CASE WHEN s.is_replacement = 1 THEN 1 END), 0) AS replacements_count,
        COALESCE((
          COUNT(CASE WHEN s.type = 'HODINA' AND (s.is_replacement = 0 OR s.is_replacement IS NULL) THEN 1 END) + 
          COUNT(CASE WHEN s.type = 'DOZOR' THEN 1 END)
        ), 0) AS total_count
      FROM all_teachers t
      LEFT JOIN substitution_records s 
        ON t.teacher_name = s.teacher_name 
        AND s.date >= ? 
        AND s.date <= ?
      GROUP BY t.teacher_name
    `;

    const result = await env.DB.prepare(query).bind(startDate, endDate).all();
    const teachers = (result.results || []).map((row) => ({
      teacher_name: row.teacher_name,
      hours_count: Number(row.hours_count || 0),
      duties_count: Number(row.duties_count || 0),
      replacements_count: Number(row.replacements_count || 0),
      total_count: Number(row.total_count || 0),
    }));

    // Ranking for Dozory (Duties): lowest duties first
    const byDuties = [...teachers].sort((a, b) => {
      if (a.duties_count !== b.duties_count) return a.duties_count - b.duties_count;
      if (a.total_count !== b.total_count) return a.total_count - b.total_count;
      return a.teacher_name.localeCompare(b.teacher_name, 'cs');
    });

    // Ranking for Suplování (Hours): lowest substitution hours first
    const byHours = [...teachers].sort((a, b) => {
      if (a.hours_count !== b.hours_count) return a.hours_count - b.hours_count;
      if (a.total_count !== b.total_count) return a.total_count - b.total_count;
      return a.teacher_name.localeCompare(b.teacher_name, 'cs');
    });

    // Ranking for Total Workload: lowest total first
    const byTotal = [...teachers].sort((a, b) => {
      if (a.total_count !== b.total_count) return a.total_count - b.total_count;
      if (a.duties_count !== b.duties_count) return a.duties_count - b.duties_count;
      return a.teacher_name.localeCompare(b.teacher_name, 'cs');
    });

    return new Response(
      JSON.stringify({
        success: true,
        startDate,
        endDate,
        totalTeachers: teachers.length,
        byDuties,
        byHours,
        byTotal,
        topRecommendations: {
          duty: byDuties.slice(0, 3),
          substitution: byHours.slice(0, 3),
          fairplay: byTotal.slice(0, 3),
        },
      }),
      { status: 200, headers: corsHeaders }
    );
  } catch (error) {
    console.error('Error in /api/fairplay:', error);
    return new Response(
      JSON.stringify({
        success: false,
        error: error.message || 'Chyba při načítání fair-play doporučení.',
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
