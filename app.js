window.addEventListener("load", async () => {

/* =========================
   INIT
========================= */

const supabase = window.supabase.createClient(
  "https://fvtqwxzkxzauyiaqpauu.supabase.co",
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZ2dHF3eHpreHphdXlpYXFwYXV1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzE2MzkyMDksImV4cCI6MjA4NzIxNTIwOX0.d1s0att2MuxyFBx5v7lYhGOkQdGe-viUCNRw_HXs4Rk"
);

let currentUser = null;
let currentCredit = 0;
let currentMode = "free";

/* =========================
   ELEMENT
========================= */

const loginModal = document.getElementById("loginModal");
const logoutBtn = document.getElementById("logoutBtn");
const buyCreditBtn = document.getElementById("buyCreditBtn");
const addCreditBtn = document.getElementById("addCreditBtn");

const appBox = document.getElementById("appBox");
const userEmail = document.getElementById("userEmail");
const creditValue = document.getElementById("creditValue");
const resultBox = document.getElementById("result");

const proDashboard = document.getElementById("proDashboard");
const proCredit = document.getElementById("proCredit");
const historyList = document.getElementById("historyList");

const freeBtn = document.getElementById("freeBtn");
const proBtn = document.getElementById("proBtn");
const generateBtn = document.getElementById("generateBtn");

const categorySelect = document.getElementById("category");
const platformSelect = document.getElementById("platform");
const audienceSelect = document.getElementById("audience");
const styleSelect = document.getElementById("style");
const durationSelect = document.getElementById("duration");

let currentRequestId = null;
let currentAmount = 0;

function generateUniqueAmount(base) {
  const random = Math.floor(Math.random() * 90) + 10;
  return base + random;
}

/* =========================
   QRIS MODAL
========================= */

/* =========================
   QRIS MODAL
========================= */

const qrisModal = document.getElementById("qrisModal");
const confirmPaymentBtn = document.getElementById("confirmPaymentBtn");
const closeQrisBtn = document.getElementById("closeQrisBtn");

if (buyCreditBtn && qrisModal) {

  buyCreditBtn.onclick = async () => {

    if (!currentUser) return alert("Login dulu.");

    // 1️⃣ Generate kode unik
    const uniqueCode = Math.floor(Math.random() * 90) + 10;
    const baseAmount = 20000;
    const finalAmount = baseAmount + uniqueCode;

    // 2️⃣ Hitung expired 15 menit
    const expiredAt = new Date(
      Date.now() + 15 * 60 * 1000
    ).toISOString();

    // 3️⃣ Insert ke database
    const { data, error } = await supabase
      .from("topup_requests")
      .insert([{
        user_id: currentUser.id,
        amount: finalAmount,
        credit_amount: 100,
        status: "waiting_payment",
        expired_at: expiredAt
      }])
      .select()
      .single();

    if (error) {
      alert("Gagal membuat request");
      return;
    }

    currentRequestId = data.id;

    // 4️⃣ Update nominal di modal
    const amountText = document.getElementById("amountText");
    if (amountText) {
      amountText.innerText =
        "Transfer Rp" + finalAmount.toLocaleString() +
        " untuk 100 Credit";
    }

    qrisModal.style.display = "flex";
  };
}

if (closeQrisBtn && qrisModal) {
  closeQrisBtn.onclick = () => {
    qrisModal.style.display = "none";
  };
}

if (confirmPaymentBtn) {

  confirmPaymentBtn.onclick = async () => {

    if (!currentRequestId) {
      alert("Request tidak ditemukan.");
      return;
    }

    // Ambil expired dulu
    const { data, error } = await supabase
      .from("topup_requests")
      .select("expired_at")
      .eq("id", currentRequestId)
      .single();

    if (error || !data) {
      alert("Request tidak valid.");
      return;
    }

    const now = new Date();
    const expired = new Date(data.expired_at);

    if (now > expired) {
      alert("Waktu pembayaran sudah habis.");
      return;
    }

    // Update jadi pending
    const { error: updateError } = await supabase
      .from("topup_requests")
      .update({ status: "pending" })
      .eq("id", currentRequestId);

    if (updateError) {
      alert("Gagal update status.");
      return;
    }

    qrisModal.style.display = "none";

    window.location.href =
      "/payment-status.html?id=" + currentRequestId;
  };
}
/* =========================
   MODE SYSTEM
========================= */

function updateModeUI() {
  if(currentMode === "free"){
    freeBtn.classList.add("active");
    proBtn.classList.remove("active");
    if(proDashboard) proDashboard.style.display = "none";
  } else {
    proBtn.classList.add("active");
    freeBtn.classList.remove("active");
    if(proDashboard) proDashboard.style.display = "block";
  }
}

freeBtn.onclick = () => {
  currentMode = "free";
  updateModeUI();
};

proBtn.onclick = () => {
  currentMode = "pro";
  updateModeUI();
};

/* =========================
   PROFILE
========================= */

async function loadProfile(user){
  try{
    const { data } = await supabase
      .from("profiles")
      .select("credits")
      .eq("id", user.id)
      .single();

    if(data){
      currentCredit = data.credits;
      if(creditValue) creditValue.innerText = data.credits;
      if(proCredit) proCredit.innerText = data.credits;
    }
  } catch(err){
    console.error("Load profile error", err);
  }
}

/* =========================
   HISTORY
========================= */

async function loadHistory(){

  if(!currentUser || !historyList) return;

  const { data } = await supabase
    .from("generate_history")
    .select("*")
    .eq("user_id", currentUser.id)
    .order("created_at", { ascending: false })
    .limit(10);

  historyList.innerHTML = "";

  if(!data || data.length === 0){
    historyList.innerHTML = "<p>Belum ada riwayat.</p>";
    return;
  }

  data.forEach(item=>{
    historyList.innerHTML += `
      <div>
        <div style="font-size:12px;opacity:.6;margin-bottom:5px;">
          ${item.mode === "pro" ? "AI Premium" : "AI Free"} • ${item.platform}
        </div>
        <div style="white-space:pre-line;">
          ${item.result}
        </div>
      </div>
    `;
  });
}

/* =========================
   ADMIN PANEL
========================= */

async function loadPendingTopup(){

  if(!currentUser) return;

  const ADMIN_EMAIL = "sudanaswatt20@icloud.com";
  if(currentUser.email !== ADMIN_EMAIL) return;

  const { data } = await supabase
    .from("topup_requests")
    .select("*")
    .eq("status", "pending")
    .order("created_at", { ascending: false });

  const adminBox = document.getElementById("adminTopupList");
  if(!adminBox) return;

  adminBox.innerHTML = "";

  if(!data || data.length === 0){
    adminBox.innerHTML = "<p>Tidak ada pending.</p>";
    return;
  }

  data.forEach(item=>{
    adminBox.innerHTML += `
      <div>
        <p><strong>User:</strong> ${item.user_id}</p>
        <p><strong>Amount:</strong> Rp${item.amount}</p>
        <p><strong>Credit:</strong> ${item.credit_amount}</p>
        <button onclick="approveTopup('${item.id}')" class="generate-btn">
          Approve
        </button>
      </div>
    `;
  });
}

window.approveTopup = async function(requestId){

  try {

    const { data: sessionData } = await supabase.auth.getSession();
    const token = sessionData?.session?.access_token;

    if (!token) {
      alert("Session expired.");
      return;
    }

    const response = await fetch("/api/approve-topup", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${token}`
      },
      body: JSON.stringify({ requestId })
    });

    const data = await response.json();

    if(response.ok){
      alert("Topup disetujui.");
      await loadPendingTopup();
      await loadProfile(currentUser);
    } else {
      alert(data.error);
    }

  } catch(err){
    alert("Network error.");
  }

};

/* =========================
   AUTH CHECK
========================= */

async function checkUser(){

  const { data:{user} } = await supabase.auth.getUser();

  if(user){

    currentUser = user;
    loginModal.style.display="none";
    appBox.style.display="block";
    userEmail.innerText = user.email;

    await loadProfile(user);
    await loadHistory();
    await loadPendingTopup();

  } else {

    loginModal.style.display="flex";
    appBox.style.display="none";

  }
}

/* =========================
   LOGIN
========================= */

document.getElementById("loginBtn").onclick = async ()=>{
  const email = document.getElementById("email").value;
  const password = document.getElementById("password").value;

  const { error } = await supabase.auth.signInWithPassword({email,password});
  if(error) return alert(error.message);

  await checkUser();
};

/* =========================
   REGISTER
========================= */

document.getElementById("registerBtn").onclick = async ()=>{
  const email = document.getElementById("email").value;
  const password = document.getElementById("password").value;

  const { error } = await supabase.auth.signUp({email,password});
  if(error) alert(error.message);
  else alert("Cek email konfirmasi.");
};

/* =========================
   LOGOUT
========================= */

logoutBtn.onclick = async ()=>{
  await supabase.auth.signOut();
  currentUser = null;
  resultBox.innerHTML="Hook akan muncul di sini...";
  await checkUser();
};
/* =========================
   DAILY CLAIM +10 CREDIT
========================= */

if(addCreditBtn){
  addCreditBtn.onclick = async () => {

    if(!currentUser) return alert("Login dulu.");

    try {

      const { data: sessionData } = await supabase.auth.getSession();
      const token = sessionData?.session?.access_token;

      if(!token) throw new Error("Session expired");

      const response = await fetch("/api/add-credit", {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${token}`
        }
      });

      const data = await response.json();

      if(response.ok){
        await loadProfile(currentUser);
        alert("10 Credit berhasil ditambahkan.");
      } else {
        alert(data.error || "Sudah di klaim hari ini");
      }

    } catch(err){
      alert("Network error.");
    }

  };
}
/* =========================
   GENERATE
========================= */

generateBtn.onclick = async () => {

  if(generateBtn.disabled) return;
  if(!currentUser) return alert("Login dulu.");

  const name = document.getElementById("productName").value.trim();
  const desc = document.getElementById("productDesc").value.trim();
  const category = categorySelect.value;
  const platform = platformSelect.value;
  const audience = audienceSelect.value;
  const style = styleSelect.value;
  const duration = durationSelect.value;

  if (!name || !platform || !audience || !style || !duration)
    return alert("Lengkapi semua field.");

  generateBtn.disabled = true;
  resultBox.innerHTML = "Generating...";

  try{
    const { data: sessionData } = await supabase.auth.getSession();
    const token = sessionData?.session?.access_token;
    if(!token) throw new Error("Session expired");

    const response = await fetch("/api/generate", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${token}`
      },
      body: JSON.stringify({
        productName: name,
        productDesc: desc,
        category,
        audience,
        style,
        platform,
        duration,
        mode: currentMode
      })
    });

    const data = await response.json();

    if(!response.ok) throw new Error(data.error);

    resultBox.innerHTML = `
      <div class="mode-badge ${currentMode}">
        ${currentMode === "pro" ? "AI Premium (Berbayar)" : "AI Free (Gratis)"}
      </div>
      <div style="white-space:pre-line;">
        ${data.result}
      </div>
    `;

    await loadProfile(currentUser);
    await loadHistory();

  } catch(err){
    resultBox.innerHTML = err.message || "Terjadi kesalahan.";
  }

  generateBtn.disabled = false;
};

/* =========================
   START
========================= */

updateModeUI();
await checkUser();

});