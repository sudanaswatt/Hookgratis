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

  const hooks = [

`Stop scroll dulu! ${audience}, ini cocok banget buat kamu.

${productName} lagi banyak dipakai karena manfaatnya langsung terasa dan nggak ribet dipakai. Cocok banget buat kamu yang aktif di ${platform} dan pengen hasil yang lebih maksimal tanpa drama.

Kalau lagi cari solusi yang praktis, ini bisa banget dicoba.`,

`Serius, jangan skip ini kalau kamu ${audience}.

${productName} punya fungsi yang jelas dan memang dibuat untuk bantu kebutuhan kamu sehari-hari. Dipakai rutin, hasilnya jauh lebih terasa dan bikin aktivitas di ${platform} jadi lebih optimal.

Banyak yang sudah mulai pakai, sekarang giliran kamu.`,

`${audience} wajib tahu ini.

${productName} bukan cuma sekadar tren, tapi memang membantu dan lebih efektif dibanding alternatif lainnya. Apalagi buat kamu yang aktif di ${platform} dan butuh sesuatu yang benar-benar bekerja.

Kalau lagi cari yang worth it, ini pilihan aman.`,

`Kalau kamu masih pakai produk lama, coba bandingkan dulu dengan ${productName}.

Dirancang khusus untuk ${audience}, manfaatnya terasa lebih cepat dan lebih efisien. Apalagi buat kamu yang aktif di ${platform}, ini bisa bantu performa jadi lebih maksimal.

Kadang upgrade kecil bikin hasil jauh beda.`,

`Jangan sampai ketinggalan info ini, ${audience}.

${productName} punya keunggulan yang bikin banyak orang mulai beralih. Lebih praktis, lebih nyaman dipakai, dan cocok untuk kebutuhan kamu di ${platform}.

Kalau lagi cari yang lebih efektif, ini jawabannya.`,

`${audience} yang aktif di ${platform} pasti ngerti pentingnya kualitas.

${productName} hadir dengan manfaat yang jelas dan penggunaan yang simpel. Tanpa ribet, tanpa proses yang bikin pusing, tapi tetap kasih hasil yang memuaskan.

Makanya sekarang makin banyak yang pakai.`,

`Ini bukan produk biasa buat ${audience}.

${productName} dibuat supaya kamu bisa dapetin hasil lebih maksimal tanpa perlu effort berlebihan. Terutama buat kamu yang sering tampil atau aktif di ${platform}, ini bisa jadi pendukung utama.

Yang penting itu hasilnya terasa.`,

`Kalau kamu pengen hasil lebih cepat dan lebih praktis, ini menarik banget.

${productName} bantu ${audience} dapetin manfaat optimal dengan cara yang simpel. Cocok banget buat kamu yang nggak mau ribet tapi tetap mau hasil terbaik di ${platform}.

Kadang solusi terbaik itu yang paling sederhana.`,

`${audience}, ini solusi yang realistis.

${productName} membantu kebutuhan kamu dengan cara yang lebih efisien dan nggak bertele-tele. Dipakai rutin, efeknya jauh lebih terasa, apalagi buat kamu yang aktif di ${platform}.

Nggak heran banyak yang repeat order.`,

`Kalau kamu masih ragu, coba lihat manfaatnya dulu.

${productName} dirancang untuk ${audience} yang butuh solusi cepat dan efektif. Di ${platform}, performa kamu juga bisa lebih maksimal kalau didukung produk yang tepat.

Investasi kecil, dampaknya besar.`,

`Buat ${audience} yang nggak mau asal pilih produk, ini menarik.

${productName} punya kelebihan yang bikin penggunaan lebih nyaman dan hasil lebih stabil. Apalagi buat kamu yang aktif di ${platform}, ini bisa bantu tingkatkan kualitas aktivitas kamu.

Pilihan cerdas itu yang paling terasa hasilnya.`,

`Kalau kamu sering merasa kurang maksimal, mungkin ini penyebabnya.

Tanpa dukungan produk yang tepat seperti ${productName}, hasil memang sulit optimal. Cocok banget buat ${audience} yang aktif di ${platform} dan mau performa lebih baik.

Sekali coba, biasanya langsung lanjut.`,

`${audience}, jangan cuma fokus ke harga.

Lihat juga kualitas dan manfaatnya. ${productName} bantu kamu dapetin hasil lebih maksimal dengan cara yang praktis dan efisien, terutama buat kamu yang aktif di ${platform}.

Lebih baik pilih yang jelas manfaatnya.`,

`Ini solusi simpel tapi efektif.

${productName} membantu ${audience} yang ingin hasil lebih maksimal tanpa ribet. Terutama buat kamu yang sering tampil atau aktif di ${platform}, ini bisa jadi pendukung penting.

Praktis, jelas, dan terasa.`,

`Kalau kamu cari produk yang nggak cuma janji, ini patut dipertimbangkan.

${productName} dirancang untuk ${audience} yang butuh hasil nyata dan penggunaan yang mudah. Apalagi buat kamu yang aktif di ${platform}, ini bisa bantu tingkatkan performa secara signifikan.

Kadang yang bikin beda itu pilihan yang tepat.`

  ];

  const result =
    hooks[Math.floor(Math.random() * hooks.length)];

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
Buat hook video ${duration || "5-10 detik"} dengan gaya bahasa creator Indonesia.

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
- Fokus pada produk dan ${style}
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