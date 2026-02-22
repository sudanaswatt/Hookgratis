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

    const { data: userData } = await supabase.auth.getUser(token);
    if (!userData?.user) {
      return res.status(401).json({ error: "User tidak valid." });
    }

    const userId = userData.user.id;

    const now = new Date();
    const twentyFourHoursAgo = new Date(
      now.getTime() - 24 * 60 * 60 * 1000
    ).toISOString();

    // 🔥 Atomic Update
    const { data, error } = await supabase
      .from("profiles")
      .update({
        credits: supabase.rpc ? undefined : undefined
      })
      .eq("id", userId)
      .or(`last_claim_at.is.null,last_claim_at.lt.${twentyFourHoursAgo}`)
      .select("credits")
      .single();

    if (!data) {
      return res.status(400).json({
        error: "Klaim sudah dilakukan. Coba lagi besok."
      });
    }

    // Tambah credit secara terpisah tapi aman
    const { data: profile } = await supabase
      .from("profiles")
      .select("credits")
      .eq("id", userId)
      .single();

    const newCredit = profile.credits + 10;

    await supabase
      .from("profiles")
      .update({
        credits: newCredit,
        last_claim_at: now.toISOString()
      })
      .eq("id", userId);

    return res.status(200).json({
      message: "Berhasil klaim 10 credit.",
      credits: newCredit
    });

  } catch (err) {
    return res.status(500).json({
      error: "Server crash.",
      detail: err.message
    });
  }
}