import { createClient } from "@supabase/supabase-js";

export default async function handler(req, res) {

  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {

    const {
      productName,
      productDesc,
      category,
      audience,
      style,
      platform,
      duration,
      mode
    } = req.body;

    if (!productName || !audience || !style || !platform || !duration) {
      return res.status(400).json({ error: "Field tidak lengkap." });
    }

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

    /* =====================================================
       FREE MODE (Template Engine)
    ===================================================== */

    if (mode === "free") {

      const templates = [

`Masih kesulitan bikin konten ${platform} yang benar-benar menarik perhatian? ${productName} dirancang untuk ${audience} yang ingin hasil lebih maksimal tanpa ribet. Saatnya gunakan pendekatan yang lebih praktis dan langsung terasa manfaatnya dalam ${duration}.`,

`Kalau kamu termasuk ${audience} yang ingin performa konten naik, ${productName} bisa jadi langkah tepat. Cocok untuk ${category} dan efektif dipakai di ${platform} dengan format ${duration}.`,

`${productName} hadir sebagai solusi untuk ${audience} yang ingin tampil lebih percaya diri di ${platform}. Gunakan strategi sederhana tapi konsisten dalam ${duration}.`,

`Konten ${platform} kamu terasa biasa saja? ${productName} membantu ${audience} menciptakan pendekatan yang lebih kuat dan lebih relevan hanya dalam ${duration}.`,

`Untuk ${audience} yang ingin hasil lebih cepat dan lebih terarah, ${productName} adalah pilihan tepat dalam kategori ${category}. Mulai sekarang dengan format ${duration}.`
];

      const hook = templates[Math.floor(Math.random() * templates.length)];

      await supabase.from("generate_history").insert({
        user_id: userId,
        product_name: productName,
        result: hook,
        mode: "free",
        platform,
        category,
        duration
      });

      return res.status(200).json({ result: hook });
    }

    /* =====================================================
       PRO MODE (Potong Credit + AI)
    ===================================================== */

    if (mode === "pro") {

      if (profile.credits <= 0) {
        return res.status(400).json({ error: "Credit habis." });
      }

      const { error: updateError } = await supabase
        .from("profiles")
        .update({ credits: profile.credits - 1 })
        .eq("id", userId);

      if (updateError) {
        return res.status(500).json({ error: "Gagal update credit." });
      }

      const apiKey = process.env.OPENROUTER_API_KEY;
      if (!apiKey) {
        return res.status(500).json({ error: "OpenRouter key missing." });
      }

      const prompt = `
Buat hook video yang powerfull dan natural seperti creator Indonesia.

Format:
1 kalimat hook menarik.
1 paragraf solusi.
1 kalimat CTA.

Platform: ${platform}
Kategori: ${category}
Durasi: ${duration}

Produk: ${productName}
Deskripsi: ${productDesc}
Target: ${audience}
Gaya: ${style}

Aturan:
- Tanpa emoji.
- Tanpa hashtag.
- Tanpa simbol dekoratif.
- Fokus pada pesan utama.
`;

      const response = await fetch(
        "https://openrouter.ai/api/v1/chat/completions",
        {
          method: "POST",
          headers: {
            "Authorization": `Bearer ${apiKey}`,
            "Content-Type": "application/json"
          },
          body: JSON.stringify({
            model: "openai/gpt-4o-mini",
            messages: [{ role: "user", content: prompt }]
          })
        }
      );

      const aiData = await response.json();

      if (!response.ok) {
        return res.status(500).json({
          error: aiData.error?.message || "OpenRouter error"
        });
      }

      const resultText = aiData?.choices?.[0]?.message?.content;

      if (!resultText) {
        return res.status(500).json({ error: "AI response kosong." });
      }

      await supabase.from("generate_history").insert({
        user_id: userId,
        product_name: productName,
        result: resultText,
        mode: "pro",
        platform,
        category,
        duration
      });

      return res.status(200).json({ result: resultText });
    }

    return res.status(400).json({ error: "Mode tidak valid." });

  } catch (err) {

    console.error("SERVER ERROR:", err);

    return res.status(500).json({
      error: "Server crash.",
      detail: err?.message || String(err)
    });
  }
}
