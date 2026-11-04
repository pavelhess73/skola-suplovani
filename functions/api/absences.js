/**
 * Cloudflare Pages Function: /api/absences
 * Supports PUT/PATCH for editing an absence record and DELETE for removing one.
 */

export async function onRequestPut(context) {
  return handleUpdate(context);
}

export async function onRequestPatch(context) {
  return handleUpdate(context);
}

async function handleUpdate(context) {
  const { request, env } = context;

  const corsHeaders = {
    'Content-Type': 'application/json',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, PUT, PATCH, DELETE, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
  };

  try {
    const body = await request.json();
    const { id, reason, time_range, teacher_name, date } = body;

    if (!id) {
      return new Response(
        JSON.stringify({ success: false, error: 'Chybí ID záznamu pro úpravu.' }),
        { status: 400, headers: corsHeaders }
      );
    }

    if (!env.DB) {
      return new Response(
        JSON.stringify({
          success: false,
          error: 'Cloudflare D1 databáze není nakonfigurována.',
        }),
        { status: 500, headers: corsHeaders }
      );
    }

    // Update query
    const updateStmt = env.DB.prepare(`
      UPDATE absence_records 
      SET 
        reason = COALESCE(?, reason),
        time_range = COALESCE(?, time_range),
        teacher_name = COALESCE(?, teacher_name),
        date = COALESCE(?, date)
      WHERE id = ?
    `).bind(
      reason !== undefined ? reason : null,
      time_range !== undefined ? time_range : null,
      teacher_name !== undefined ? teacher_name : null,
      date !== undefined ? date : null,
      id
    );

    const result = await updateStmt.run();

    if (result.meta && result.meta.changes === 0) {
      return new Response(
        JSON.stringify({ success: false, error: `Záznam s ID ${id} nebyl nalezen.` }),
        { status: 404, headers: corsHeaders }
      );
    }

    // Fetch updated record
    const updatedRecord = await env.DB.prepare('SELECT * FROM absence_records WHERE id = ?').bind(id).first();

    return new Response(
      JSON.stringify({
        success: true,
        message: 'Záznam absence byl úspěšně upraven.',
        record: updatedRecord,
      }),
      { status: 200, headers: corsHeaders }
    );
  } catch (error) {
    console.error('Error in PUT /api/absences:', error);
    return new Response(
      JSON.stringify({ success: false, error: error.message || 'Chyba při úpravě absence.' }),
      { status: 500, headers: corsHeaders }
    );
  }
}

export async function onRequestDelete(context) {
  const { request, env } = context;

  const corsHeaders = {
    'Content-Type': 'application/json',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, PUT, PATCH, DELETE, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
  };

  try {
    const url = new URL(request.url);
    let id = url.searchParams.get('id');

    // Also check body if not in query params
    if (!id) {
      const body = await request.json().catch(() => ({}));
      id = body.id;
    }

    if (!id) {
      return new Response(
        JSON.stringify({ success: false, error: 'Chybí ID záznamu ke smazání.' }),
        { status: 400, headers: corsHeaders }
      );
    }

    if (!env.DB) {
      return new Response(
        JSON.stringify({
          success: false,
          error: 'Cloudflare D1 databáze není nakonfigurována.',
        }),
        { status: 500, headers: corsHeaders }
      );
    }

    const deleteStmt = env.DB.prepare('DELETE FROM absence_records WHERE id = ?').bind(id);
    const result = await deleteStmt.run();

    return new Response(
      JSON.stringify({
        success: true,
        message: 'Záznam absence byl úspěšně smazán.',
        id: Number(id),
      }),
      { status: 200, headers: corsHeaders }
    );
  } catch (error) {
    console.error('Error in DELETE /api/absences:', error);
    return new Response(
      JSON.stringify({ success: false, error: error.message || 'Chyba při mazání absence.' }),
      { status: 500, headers: corsHeaders }
    );
  }
}

export async function onRequestOptions() {
  return new Response(null, {
    status: 204,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, PUT, PATCH, DELETE, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    },
  });
}

