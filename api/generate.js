import { createClient } from "@supabase/supabase-js";

export default async function handler(req, res) {

  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {

    const {
      productName,
      productDesc,
      audience,
      style,
      platform,
      mode,
      duration,
      category
    } = req.body;

    if (!productName || !audience || !style || !platform || !mode) {
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

    // ================= VALIDASI USER =================

    const { data: userData, error: userError } =
      await supabase.auth.getUser(token);

    if (userError || !userData?.user) {
      return res.status(401).json({ error: "User tidak valid." });
    }

    const userId = userData.user.id;

    // ================= AMBIL PROFILE =================

    const { data: profile, error: profileError } = await supabase
      .from("profiles")
      .select("credits")
      .eq("id", userId)
      .single();

    if (profileError || !profile) {
      return res.status(500).json({ error: "Profile tidak ditemukan." });
    }

    // =====================================================
    // FREE MODE (20 Variasi Panjang)
    // =====================================================

    if (mode === "free") {

      const templates = [

`Pernah merasa konten ${platform} kamu kurang mendapat perhatian? ${productName} hadir untuk ${audience} yang ingin tampil lebih percaya diri dan lebih konsisten tanpa harus memikirkan strategi rumit setiap hari.`,

`${productName} dirancang untuk membantu ${audience} mendapatkan hasil yang lebih stabil di ${platform}. Dengan pendekatan yang lebih terarah, kamu bisa membangun performa yang lebih kuat.`,

`Jika kamu ${audience} yang ingin meningkatkan performa di ${platform}, ${productName} bisa menjadi langkah awal yang lebih terukur dan lebih efisien.`,

`Persaingan di ${platform} semakin ketat. ${productName} membantu ${audience} tampil lebih relevan dan lebih menarik perhatian.`,

`Daripada terus mencoba tanpa arah, ${productName} membantu ${audience} membangun strategi yang lebih konsisten di ${platform}.`,

`${productName} bukan hanya sekadar produk, tetapi solusi untuk ${audience} yang ingin berkembang lebih cepat di ${platform}.`,

`Konten yang kuat dimulai dari pesan yang jelas. ${productName} membantu ${audience} menyampaikan nilai produk dengan lebih efektif di ${platform}.`,

`Jika performa ${platform} terasa stagnan, mungkin saatnya mencoba pendekatan baru dengan ${productName} yang dirancang untuk ${audience}.`,

`${productName} membantu ${audience} membangun kepercayaan lebih cepat dan lebih konsisten di ${platform}.`,

`Untuk ${audience} yang ingin hasil nyata di ${platform}, ${productName} menawarkan pendekatan yang lebih praktis dan lebih fokus.`,

`${productName} hadir sebagai solusi untuk ${audience} yang ingin meningkatkan kualitas konten mereka di ${platform}.`,

`Tidak perlu strategi rumit untuk berkembang di ${platform}. ${productName} membantu ${audience} tampil lebih percaya diri.`,

`${productName} membantu ${audience} mendapatkan pendekatan yang lebih terstruktur dan lebih profesional di ${platform}.`,

`Banyak ${audience} sudah mulai beralih ke solusi yang lebih efektif seperti ${productName} untuk meningkatkan performa di ${platform}.`,

`${productName} memberikan fondasi yang lebih kuat bagi ${audience} yang ingin membangun kehadiran lebih solid di ${platform}.`,

`Jika kamu serius ingin berkembang di ${platform}, ${productName} bisa membantu ${audience} mengambil langkah yang lebih tepat.`,

`${productName} membantu ${audience} mengoptimalkan potensi mereka di ${platform} tanpa harus membuang waktu mencoba hal yang tidak efektif.`,

`Daripada terus menebak strategi terbaik, ${productName} membantu ${audience} fokus pada pendekatan yang lebih konsisten di ${platform}.`,

`${productName} dirancang untuk ${audience} yang ingin hasil lebih stabil dan lebih terukur di ${platform}.`,

`Saatnya ${audience} mengambil langkah yang lebih pasti di ${platform} dengan bantuan ${productName} yang lebih terarah.`
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

      const prompt = `
Buat hook video ${duration || "5-10 detik"} yang powerfull dengan gaya bahasa creator Indonesia.

Kategori: ${category || "Umum"}
Produk: ${productName}
Deskripsi: ${productDesc}
Target Audience: ${audience}
Platform: ${platform}
Gaya Promosi: ${style}

Format wajib:
1 kalimat hook yang sangat menarik perhatian.
1 paragraf solusi yang meyakinkan.
1 kalimat CTA yang kuat.

Aturan:
- Tanpa emoji
- Tanpa hashtag
- Tanpa simbol dekoratif
- Fokus penuh pada produk
`;

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

      const result =
        aiData.choices?.[0]?.message?.content ||
        "Terjadi kesalahan pada AI.";

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