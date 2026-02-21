import { createClient } from "@supabase/supabase-js";

export default async function handler(req, res) {

  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {

    const token = req.headers.authorization?.replace("Bearer ", "");
    if (!token) {
      return res.status(401).json({ error: "Unauthorized." });
    }

    if (!process.env.SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
      return res.status(500).json({ error: "Supabase env missing." });
    }

    const supabase = createClient(
      process.env.SUPABASE_URL,
      process.env.SUPABASE_SERVICE_ROLE_KEY
    );

    /* =========================
       VALIDASI USER
    ========================= */

    const { data: userData, error: userError } =
      await supabase.auth.getUser(token);

    if (userError || !userData?.user) {
      return res.status(401).json({ error: "User tidak valid." });
    }

    const userId = userData.user.id;

    /* =========================
       AMBIL PROFILE
    ========================= */

    const { data: profile, error: profileError } = await supabase
      .from("profiles")
      .select("credits")
      .eq("id", userId)
      .single();

    if (profileError || !profile) {
      return res.status(500).json({ error: "Profile tidak ditemukan." });
    }

    /* =========================
       BATAS MAX CREDIT (ANTI SPAM)
    ========================= */

    const MAX_CREDIT = 10000;

    if (profile.credits >= MAX_CREDIT) {
      return res.status(400).json({
        error: "Credit sudah mencapai batas maksimum."
      });
    }

    const CREDIT_TO_ADD = 10;
    const newCredit = profile.credits + CREDIT_TO_ADD;

    /* =========================
       UPDATE CREDIT
    ========================= */

    const { error: updateError } = await supabase
      .from("profiles")
      .update({ credits: newCredit })
      .eq("id", userId);

    if (updateError) {
      return res.status(500).json({ error: "Gagal menambah credit." });
    }

    /* =========================
       OPTIONAL: SIMPAN LOG
    ========================= */

    await supabase.from("credit_logs").insert({
      user_id: userId,
      amount: CREDIT_TO_ADD,
      type: "manual_test"
    }).catch(()=>{}); // tidak crash kalau tabel belum ada

    return res.status(200).json({
      message: "Credit berhasil ditambahkan.",
      credits: newCredit
    });

  } catch (err) {

    console.error("ADD CREDIT ERROR:", err);

    return res.status(500).json({
      error: "Server crash.",
      detail: err?.message || String(err)
    });
  }
}
