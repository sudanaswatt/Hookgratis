import { createClient } from "@supabase/supabase-js";

export default async function handler(req, res) {

  if (req.method !== "POST")
    return res.status(405).json({ error: "Method not allowed" });

  try {

    const { requestId } = req.body;
    if (!requestId)
      return res.status(400).json({ error: "Request ID diperlukan." });

    const token = req.headers.authorization?.replace("Bearer ", "");
    if (!token)
      return res.status(401).json({ error: "Unauthorized." });

    if (!process.env.SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY)
      return res.status(500).json({ error: "Supabase env missing." });

    const supabase = createClient(
      process.env.SUPABASE_URL,
      process.env.SUPABASE_SERVICE_ROLE_KEY
    );

    // =========================
    // VALIDASI ADMIN
    // =========================

    const { data: userData, error: userError } =
      await supabase.auth.getUser(token);

    if (userError || !userData?.user)
      return res.status(401).json({ error: "User tidak valid." });

    const ADMIN_EMAIL = "sudanaswatt20@icloud.com";

    if (userData.user.email !== ADMIN_EMAIL)
      return res.status(403).json({ error: "Bukan admin." });

    // =========================
    // AMBIL REQUEST
    // =========================

    const { data: request, error: requestError } = await supabase
      .from("topup_requests")
      .select("*")
      .eq("id", requestId)
      .single();

    if (requestError || !request)
      return res.status(404).json({ error: "Request tidak ditemukan." });

    if (request.status !== "pending")
      return res.status(400).json({ error: "Sudah diproses." });

    // =========================
    // AMBIL PROFILE USER
    // =========================

    const { data: profile, error: profileError } = await supabase
      .from("profiles")
      .select("credits")
      .eq("id", request.user_id)
      .single();

    if (profileError || !profile)
      return res.status(404).json({ error: "Profile tidak ditemukan." });

    // =========================
    // UPDATE CREDIT
    // =========================

    const { error: updateCreditError } = await supabase
      .from("profiles")
      .update({
        credits: profile.credits + request.credit_amount
      })
      .eq("id", request.user_id);

    if (updateCreditError)
      return res.status(500).json({ error: "Gagal update credit." });

    // =========================
    // UPDATE STATUS REQUEST
    // =========================

    const { error: updateRequestError } = await supabase
      .from("topup_requests")
      .update({ status: "approved" })
      .eq("id", requestId);

    if (updateRequestError)
      return res.status(500).json({ error: "Gagal update status." });

    return res.status(200).json({
      message: "Topup berhasil disetujui."
    });

  } catch (err) {

    console.error("APPROVE ERROR:", err);

    return res.status(500).json({
      error: "Server crash",
      detail: err.message
    });
  }
}