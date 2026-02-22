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

    const { data: userData } = await supabase.auth.getUser(token);
    if (!userData?.user)
      return res.status(401).json({ error: "User tidak valid" });

    const userId = userData.user.id;

    // Contoh harga tetap
    const amount = 20000;
    const creditAmount = 100;

    await supabase.from("topup_requests").insert({
      user_id: userId,
      amount,
      credit_amount: creditAmount,
      status: "pending"
    });

    return res.status(200).json({
      message: "Request topup berhasil dikirim."
    });

  } catch (err) {
    return res.status(500).json({
      error: "Server crash",
      detail: err.message
    });
  }
}
