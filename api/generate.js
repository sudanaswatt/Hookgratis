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

    const supabase = createClient(
      process.env.SUPABASE_URL,
      process.env.SUPABASE_SERVICE_ROLE_KEY
    );

    // ✅ Validasi user
    const { data: userData, error: userError } =
      await supabase.auth.getUser(token);

    if (userError || !userData?.user) {
      return res.status(401).json({ error: "User tidak valid." });
    }

    const userId = userData.user.id;

    // ✅ Ambil profile
    const { data: profile, error } = await supabase
      .from("profiles")
      .select("credits, last_claim_at")
      .eq("id", userId)
      .single();

    if (error || !profile) {
      return res.status(500).json({ error: "Profile tidak ditemukan." });
    }

    const now = new Date();
    const lastClaim = profile.last_claim_at
      ? new Date(profile.last_claim_at)
      : null;

    // ✅ Cek 24 jam
    if (lastClaim) {
      const diffHours =
        (now.getTime() - lastClaim.getTime()) / (1000 * 60 * 60);

      if (diffHours < 24) {
        const remaining = (24 - diffHours).toFixed(1);
        return res.status(400).json({
          error: `Klaim sudah dilakukan. Coba lagi ${remaining} jam lagi.`
        });
      }
    }

    const newCredit = profile.credits + 10;

    const { error: updateError } = await supabase
      .from("profiles")
      .update({
        credits: newCredit,
        last_claim_at: now.toISOString()
      })
      .eq("id", userId);

    if (updateError) {
      return res.status(500).json({ error: "Gagal update credit." });
    }

    return res.status(200).json({
      message: "Berhasil klaim 10 credit.",
      credits: newCredit
    });

  } catch (err) {
    return res.status(500).json({
      error: "Server crash.",
      detail: err?.message
    });
  }
}