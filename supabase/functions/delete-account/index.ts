import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "jsr:@supabase/supabase-js@2";

// Hesap silme — Apple App Store (Haziran 2023+) tüm hesap oluşturan uygulamalar
// için uygulama içi hesap silme zorunluluğu. Çağıran kullanıcının JWT'si doğrulanır,
// tüm verileri service_role ile temizlenir ve auth kullanıcısı silinir.

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

// Kullanıcıya ait satır içeren tablolar (user_id ile). profiles `id` kullanır.
const USER_TABLES = [
  "post_likes",
  "post_comments",
  "community_posts",
  "breathing_exercise_logs",
  "craving_logs",
  "smoke_logs",
  "daily_check_ins",
  "panic_events",
  "relapse_logs",
  "user_achievements",
  "user_milestone_progress",
  "user_settings",
  "quit_journeys",
];

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  const json = (body: unknown, status = 200) =>
    new Response(JSON.stringify(body), {
      status,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) return json({ error: "missing_authorization" }, 401);

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const anonKey = Deno.env.get("SUPABASE_ANON_KEY")!;
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

    // Çağıranı kimliklendir (kendi JWT'siyle).
    const userClient = createClient(supabaseUrl, anonKey, {
      global: { headers: { Authorization: authHeader } },
    });
    const {
      data: { user },
      error: userErr,
    } = await userClient.auth.getUser();
    if (userErr || !user) return json({ error: "invalid_token" }, 401);

    const admin = createClient(supabaseUrl, serviceKey);
    const uid = user.id;

    // Önce tüm kullanıcı verilerini sil (FK cascade yok).
    for (const table of USER_TABLES) {
      const { error } = await admin.from(table).delete().eq("user_id", uid);
      if (error) return json({ error: `cleanup_failed:${table}`, detail: error.message }, 500);
    }
    // profiles tablosu birincil anahtar olarak auth id kullanır.
    await admin.from("profiles").delete().eq("id", uid);

    // Son olarak auth kullanıcısını sil.
    const { error: delErr } = await admin.auth.admin.deleteUser(uid);
    if (delErr) return json({ error: "auth_delete_failed", detail: delErr.message }, 500);

    return json({ success: true });
  } catch (e) {
    return json({ error: "unexpected", detail: String(e) }, 500);
  }
});
