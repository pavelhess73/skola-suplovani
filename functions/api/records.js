/**
 * Cloudflare Pages Function: /api/records
 * Handles updating (PUT/PATCH) and deleting (DELETE) individual substitution/duty records.
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
    const { id, type, hour_slot, subject, classroom, original_teacher, teacher_name, date } = body;

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

    const normType = type === 'DOZOR' ? 'DOZOR' : 'HODINA';

    const updateStmt = env.DB.prepare(`
      UPDATE substitution_records 
      SET 
        type = COALESCE(?, type),
        hour_slot = COALESCE(?, hour_slot),
        subject = COALESCE(?, subject),
        classroom = COALESCE(?, classroom),
        original_teacher = ?,
        teacher_name = COALESCE(?, teacher_name),
        date = COALESCE(?, date)
      WHERE id = ?
    `).bind(
      normType,
      hour_slot !== undefined ? hour_slot : null,
      subject !== undefined ? subject : null,
      classroom !== undefined ? classroom : null,
      original_teacher !== undefined ? (original_teacher || null) : null,
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
    const updatedRecord = await env.DB.prepare('SELECT * FROM substitution_records WHERE id = ?').bind(id).first();

    return new Response(
      JSON.stringify({
        success: true,
        message: 'Záznam suplování byl úspěšně upraven.',
        record: updatedRecord,
      }),
      { status: 200, headers: corsHeaders }
    );
  } catch (error) {
    console.error('Error in PUT /api/records:', error);
    return new Response(
      JSON.stringify({ success: false, error: error.message || 'Chyba při úpravě záznamu.' }),
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

    const deleteStmt = env.DB.prepare('DELETE FROM substitution_records WHERE id = ?').bind(id);
    await deleteStmt.run();

    return new Response(
      JSON.stringify({
        success: true,
        message: 'Záznam suplování byl úspěšně smazán.',
        id: Number(id),
      }),
      { status: 200, headers: corsHeaders }
    );
  } catch (error) {
    console.error('Error in DELETE /api/records:', error);
    return new Response(
      JSON.stringify({ success: false, error: error.message || 'Chyba při mazání záznamu.' }),
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

