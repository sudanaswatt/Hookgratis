import { createClient } from "@supabase/supabase-js";

export default async function handler(req, res) {

  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {

    const { productName, productDesc, audience, style, platform, mode } = req.body;

    if (!productName || !audience || !style || !platform) {
      return res.status(400).json({ error: "Field tidak lengkap." });
    }

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

    const { data: profile } = await supabase
      .from("profiles")
      .select("credits")
      .eq("id", userId)
      .single();

    if (!profile) {
      return res.status(500).json({ error: "Profile tidak ditemukan." });
    }

    // ================= FREE =================

    if (mode === "free") {

      const templates = [
        `Masih kesulitan bikin konten ${platform}? ${productName} cocok untuk ${audience} yang ingin hasil maksimal tanpa ribet.`,
        `${productName} bantu ${audience} tampil lebih maksimal di ${platform} tanpa strategi rumit.`,
        `Kalau kamu ${audience}, ${productName} bisa jadi solusi cepat untuk naikkan performa di ${platform}.`
      ];

      const result = templates[Math.floor(Math.random() * templates.length)];

      await supabase.from("generate_history").insert({
        user_id: userId,
        product_name: productName,
        result,
        mode: "free",
        platform
      });

      return res.status(200).json({ result });
    }

    // ================= PRO =================

    if (mode === "pro") {

      if (profile.credits <= 0) {
        return res.status(400).json({ error: "Credit habis." });
      }

      await supabase
        .from("profiles")
        .update({ credits: profile.credits - 1 })
        .eq("id", userId);

      const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${process.env.OPENROUTER_API_KEY}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          model: "openai/gpt-4o-mini",
          messages: [
            {
              role: "user",
              content: `
Buat hook video yang powerfull.

Produk: ${productName}
Deskripsi: ${productDesc}
Target: ${audience}
Platform: ${platform}
Gaya: ${style}

Tanpa emoji. Tanpa hashtag.
`
            }
          ]
        })
      });

      const aiData = await response.json();

      const result = aiData.choices?.[0]?.message?.content;

      await supabase.from("generate_history").insert({
        user_id: userId,
        product_name: productName,
        result,
        mode: "pro",
        platform
      });

      return res.status(200).json({ result });
    }

    return res.status(400).json({ error: "Mode tidak valid." });

  } catch (err) {

    return res.status(500).json({
      error: "Server crash",
      detail: err.message
    });
  }
}
