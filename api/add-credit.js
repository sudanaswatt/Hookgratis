import { createClient } from "@supabase/supabase-js";

export default async function handler(req, res) {

  if (req.method !== "POST")
    return res.status(405).json({ error: "Method not allowed" });

  try {

    const token = req.headers.authorization?.replace("Bearer ", "");
    if (!token)
      return res.status(401).json({ error: "Unauthorized" });

    const supabase = createClient(
      process.env.SUPABASE_URL,
      process.env.SUPABASE_SERVICE_ROLE_KEY
    );

    const { data: userData, error: userError } =
      await supabase.auth.getUser(token);

    if (userError || !userData?.user)
      return res.status(401).json({ error: "User tidak valid." });

    const userId = userData.user.id;

    // Ambil data profile
    const { data: profile } = await supabase
      .from("profiles")
      .select("credits, last_claim_at")
      .eq("id", userId)
      .single();

    const today = new Date();
    const lastClaim = profile.last_claim_at
      ? new Date(profile.last_claim_at)
      : null;

    if (
      lastClaim &&
      lastClaim.toDateString() === today.toDateString()
    ) {
      return res.status(400).json({
        error: "Sudah di klaim hari ini"
      });
    }

    // Tambah credit
    await supabase
      .from("profiles")
      .update({
        credits: profile.credits + 10,
        last_claim_at: today
      })
      .eq("id", userId);

    return res.status(200).json({
      message: "10 Credit berhasil ditambahkan."
    });

  } catch (err) {
    return res.status(500).json({
      error: "Server crash",
      detail: err.message
    });
  }
}