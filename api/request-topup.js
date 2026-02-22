import { createClient } from "@supabase/supabase-js";

export default async function handler(req, res) {

  if (req.method !== "POST")
    return res.status(405).json({ error: "Method not allowed" });

  try {

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
    // VALIDASI USER
    // =========================

    const { data: userData, error: userError } =
      await supabase.auth.getUser(token);

    if (userError || !userData?.user)
      return res.status(401).json({ error: "User tidak valid." });

    const userId = userData.user.id;

    // =========================
    // CEK REQUEST PENDING (ANTI SPAM)
    // =========================

    const { data: existingRequest } = await supabase
      .from("topup_requests")
      .select("id")
      .eq("user_id", userId)
      .eq("status", "pending")
      .maybeSingle();

    if (existingRequest)
      return res.status(400).json({
        error: "Masih ada request pending. Tunggu konfirmasi admin."
      });

    // =========================
    // FIXED PACKAGE
    // =========================

    const amount = 20000;        // Rp20.000
    const creditAmount = 100;    // 100 credit

    const { error: insertError } = await supabase
      .from("topup_requests")
      .insert({
        user_id: userId,
        amount,
        credit_amount: creditAmount,
        status: "pending"
      });

    if (insertError)
      return res.status(500).json({
        error: "Gagal membuat request topup."
      });

    return res.status(200).json({
      message: "Request topup berhasil dikirim."
    });

  } catch (err) {

    console.error("REQUEST TOPUP ERROR:", err);

    return res.status(500).json({
      error: "Server crash.",
      detail: err?.message || String(err)
    });
  }
}