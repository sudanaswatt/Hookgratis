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

`Stop scroll dulu, ${audience} pasti pernah ngalamin ini.

Di ${platform}, persaingan makin ketat dan banyak yang cuma ikut tren tanpa arah jelas. ${productName} hadir buat bantu kamu tampil lebih beda, lebih terarah, dan nggak cuma sekadar numpang lewat di timeline.

Kadang yang bikin beda itu bukan ribetnya strategi, tapi konsistensinya.`,

`Kalau kamu ${audience} dan lagi serius main di ${platform}, ini penting banget.

Banyak yang fokus ke konten viral, tapi lupa bangun fondasi yang kuat. ${productName} bisa bantu kamu punya pendekatan yang lebih stabil dan nggak gampang tenggelam di antara kompetitor.

Karena yang konsisten biasanya yang menang.`,

`Jujur aja, berapa kali kamu merasa hasil di ${platform} stuck di situ-situ aja?

Padahal effort sudah maksimal. ${productName} bantu ${audience} punya cara yang lebih terarah, jadi bukan cuma coba-coba tanpa hasil jelas.

Kadang kita cuma butuh pendekatan yang lebih tepat.`,

`Banyak ${audience} belum sadar kalau masalahnya bukan di produk, tapi di cara penyampaiannya.

Di ${platform}, perhatian orang cuma beberapa detik. ${productName} bantu kamu tampil lebih relevan dan lebih cepat menarik perhatian tanpa terlihat terlalu memaksa.

Dan itu yang bikin orang berhenti scroll.`,

`Kalau kamu merasa sudah capek bikin konten tapi hasil belum maksimal, mungkin ini waktunya evaluasi.

${productName} dirancang untuk ${audience} yang ingin tampil lebih profesional dan lebih meyakinkan di ${platform}, tanpa harus ribet mikirin strategi kompleks setiap hari.

Kadang yang dibutuhkan cuma sistem yang lebih rapi.`,

`Serius, ${audience} yang main di ${platform} sekarang nggak bisa lagi asal posting.

Algoritma berubah, tren berubah, tapi yang tetap adalah kualitas pendekatan. ${productName} bantu kamu punya arah yang lebih jelas supaya nggak cuma ikut-ikutan tren.

Karena ikut tren tanpa strategi jarang bertahan lama.`,

`Pernah nggak kamu merasa sudah kerja keras, tapi hasil di ${platform} tetap biasa saja?

${productName} bantu ${audience} punya fondasi yang lebih kuat supaya performa lebih stabil dan nggak cuma naik turun karena faktor keberuntungan.

Yang konsisten itu bukan yang paling viral, tapi yang paling terstruktur.`,

`Kalau target kamu di ${platform} cuma sekadar coba-coba, mungkin ini nggak terlalu penting.

Tapi kalau kamu ${audience} yang serius mau berkembang, ${productName} bisa bantu kamu tampil lebih terarah dan lebih percaya diri saat menyampaikan value.

Karena percaya diri itu kelihatan.`,

`Di era sekarang, orang makin pintar memilih konten.

${productName} bantu ${audience} menyampaikan pesan dengan lebih jelas dan lebih fokus di ${platform}, jadi bukan cuma ramai tapi juga berdampak.

Karena yang berdampak biasanya yang diingat.`,

`Banyak yang berpikir makin banyak posting makin bagus.

Padahal yang penting itu relevansi dan konsistensi. ${productName} bantu ${audience} di ${platform} supaya konten lebih terarah dan nggak cuma asal tayang.

Strategi yang tepat lebih penting dari kuantitas.`,

`Kalau kamu merasa hasil di ${platform} sering nggak konsisten, mungkin ini saatnya ubah pendekatan.

${productName} dirancang buat ${audience} yang mau hasil lebih stabil tanpa harus overthinking setiap detail.

Kadang yang bikin beda itu sistem kecil yang dilakukan terus-menerus.`,

`Realitanya, ${platform} sekarang penuh dengan konten serupa.

${productName} bantu ${audience} tampil lebih berbeda dan lebih punya identitas, jadi nggak cuma tenggelam di antara yang lain.

Dan identitas itu yang bikin orang ingat.`,

`Kalau kamu ${audience} yang ingin naik level di ${platform}, jangan cuma fokus di tampilan luar.

${productName} bantu kamu membangun pendekatan yang lebih kuat dari dalam, jadi bukan cuma terlihat bagus tapi juga terasa meyakinkan.

Karena kepercayaan itu dibangun, bukan dipaksakan.`,

`Seringkali kita terlalu fokus ke angka view.

Padahal yang lebih penting adalah kualitas interaksi. ${productName} bantu ${audience} di ${platform} supaya bukan cuma dilihat, tapi juga diperhatikan.

Dan diperhatikan itu jauh lebih bernilai.`,

`Kalau kamu masih merasa hasil di ${platform} belum sesuai ekspektasi, mungkin ini waktunya mencoba pendekatan berbeda.

${productName} bantu ${audience} punya cara yang lebih terstruktur dan lebih matang dalam menyampaikan pesan.

Karena yang matang biasanya bertahan lebih lama.`

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