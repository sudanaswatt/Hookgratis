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

    // =========================
    // VALIDASI USER
    // =========================

    const { data: userData, error: userError } =
      await supabase.auth.getUser(token);

    if (userError || !userData?.user) {
      return res.status(401).json({ error: "User tidak valid." });
    }

    const userId = userData.user.id;

    // =========================
    // AMBIL PROFILE
    // =========================

    const { data: profile, error: profileError } = await supabase
      .from("profiles")
      .select("credits")
      .eq("id", userId)
      .single();

    if (profileError || !profile) {
      return res.status(500).json({ error: "Profile tidak ditemukan." });
    }

    // =====================================================
    // FREE MODE (Template Engine)
    // =====================================================

    if (mode === "free") {

  const templates = [

`Pernah merasa konten ${platform} kamu sepi interaksi padahal produknya bagus? ${productName} dirancang untuk ${audience} yang ingin tampil lebih percaya diri dan lebih konsisten tanpa harus pusing memikirkan konsep setiap hari.`,

`Kalau kamu ${audience} yang ingin hasil lebih stabil di ${platform}, mungkin saatnya ubah pendekatan. ${productName} hadir sebagai solusi yang lebih praktis dan terarah untuk meningkatkan performa tanpa ribet.`,

`Banyak ${audience} masih kesulitan membuat konten ${platform} yang benar-benar menarik perhatian. Dengan ${productName}, kamu bisa tampil lebih meyakinkan dan lebih terstruktur.`,

`Sudah coba berbagai cara tapi performa ${platform} belum maksimal? ${productName} membantu ${audience} mendapatkan pendekatan yang lebih fokus dan relevan.`,

`Daripada terus mencoba tanpa strategi jelas, ${productName} membantu ${audience} membangun performa yang lebih konsisten di ${platform}.`,

`Jika target kamu adalah ${audience}, maka pendekatan yang lebih tepat sangat penting. ${productName} membantu kamu tampil lebih menonjol di ${platform}.`,

`Konten ${platform} yang kuat selalu dimulai dari pesan yang jelas. ${productName} membantu ${audience} menyampaikan nilai dengan lebih efektif.`,

`Banyak ${audience} gagal bukan karena produknya jelek, tapi karena penyampaian kurang tepat. ${productName} membantu memperkuat pesan kamu di ${platform}.`,

`Ingin tampil lebih profesional di ${platform}? ${productName} membantu ${audience} membangun kepercayaan lebih cepat.`,

`Stop membuat konten tanpa arah. ${productName} membantu ${audience} memiliki pendekatan yang lebih sistematis di ${platform}.`,

`Jika kamu ingin hasil yang lebih nyata di ${platform}, ${productName} bisa menjadi langkah awal yang lebih terukur untuk ${audience}.`,

`Tidak perlu strategi rumit untuk berkembang di ${platform}. ${productName} memberikan solusi yang lebih simpel untuk ${audience}.`,

`Persaingan di ${platform} semakin ketat. ${productName} membantu ${audience} tampil lebih unggul dan lebih relevan.`,

`Banyak ${audience} sudah mulai beralih ke pendekatan yang lebih efektif. ${productName} membantu kamu tidak tertinggal di ${platform}.`,

`Kunci sukses di ${platform} adalah konsistensi. ${productName} membantu ${audience} membangun fondasi yang lebih kuat.`,

`Kalau performa ${platform} terasa stagnan, mungkin kamu butuh pendekatan baru. ${productName} membantu ${audience} bergerak lebih terarah.`,

`Konten yang kuat selalu memiliki struktur yang jelas. ${productName} membantu ${audience} membangun pesan yang lebih tajam di ${platform}.`,

`Tidak semua ${audience} tahu cara memaksimalkan potensi mereka di ${platform}. ${productName} hadir sebagai solusi yang lebih terarah.`,

`Daripada terus menebak strategi terbaik, ${productName} membantu ${audience} fokus pada langkah yang benar di ${platform}.`,

`Jika kamu serius ingin berkembang di ${platform}, ${productName} bisa membantu ${audience} mengambil langkah yang lebih pasti dan lebih konsisten.`
  ];

  const result =
    templates[Math.floor(Math.random() * templates.length)];

  await supabase.from("generate_history").insert({
    user_id: userId,
    product_name: productName,
    result,
    mode: "free",
    platform
  });

  return res.status(200).json({ result });
}

    // =====================================================
    // PRO MODE (Potong Credit + AI)
    // =====================================================

    if (mode === "pro") {

      if (profile.credits <= 0) {
        return res.status(400).json({ error: "Credit habis." });
      }

      // Potong credit
      const { error: updateError } = await supabase
        .from("profiles")
        .update({ credits: profile.credits - 1 })
        .eq("id", userId);

      if (updateError) {
        return res.status(500).json({ error: "Gagal update credit." });
      }

      // Panggil OpenRouter
      const response = await fetch(
        "https://openrouter.ai/api/v1/chat/completions",
        {
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
Buat hook video yang powerfull,${duration}
dengan gaya bahasa creator Indonesia.
dengan detail
kategory: ${category}
Produk: ${productName}
Deskripsi: ${productDesc}
Target: ${audience}
Platform: ${platform}
Gaya: ${style}

Format:
1 kalimat hook powefull
1 paragraf solusi.
1 kalimat CTA.

Tanpa emoji.
Tanpa hashtag.
tanpa tambahan aneh aneh
dan hanya fokus pada produk.
`
              }
            ]
          })
        }
      );

      const aiData = await response.json();

      if (!response.ok) {
        return res.status(500).json({
          error: aiData.error?.message || "OpenRouter error"
        });
      }

      const result =
        aiData.choices?.[0]?.message?.content ||
        "Terjadi kesalahan pada AI.";

      // simpan history
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

    console.error("SERVER ERROR:", err);

    return res.status(500).json({
      error: "Server crash.",
      detail: err?.message
    });
  }
}