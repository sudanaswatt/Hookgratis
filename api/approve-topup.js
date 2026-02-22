import { createClient } from "@supabase/supabase-js";

export default async function handler(req, res) {

  if (req.method !== "POST")
    return res.status(405).json({ error: "Method not allowed" });

  try {

    const { requestId } = req.body;

    if (!requestId)
      return res.status(400).json({ error: "Request ID diperlukan." });

    const supabase = createClient(
      process.env.SUPABASE_URL,
      process.env.SUPABASE_SERVICE_ROLE_KEY
    );

    // Ambil data request
    const { data: request, error } = await supabase
      .from("topup_requests")
      .select("*")
      .eq("id", requestId)
      .single();

    if (error || !request)
      return res.status(404).json({ error: "Request tidak ditemukan." });

    if (request.status !== "pending")
      return res.status(400).json({ error: "Sudah diproses." });

    // Ambil credit user
    const { data: profile } = await supabase
      .from("profiles")
      .select("credits")
      .eq("id", request.user_id)
      .single();

    // Tambah credit
    await supabase
      .from("profiles")
      .update({
        credits: profile.credits + request.credit_amount
      })
      .eq("id", request.user_id);

    // Update status request
    await supabase
      .from("topup_requests")
      .update({ status: "approved" })
      .eq("id", requestId);

    return res.status(200).json({
      message: "Topup berhasil disetujui."
    });

  } catch (err) {
    return res.status(500).json({
      error: "Server crash",
      detail: err.message
    });
  }
}