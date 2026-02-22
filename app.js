window.addEventListener("load", async () => {

/* =========================
   INIT
========================= */

const supabase = window.supabase.createClient(
  "https://fvtqwxzkxzauyiaqpauu.supabase.co",
  "YOUR_PUBLIC_ANON_KEY"
);

let currentUser = null;
let currentCredit = 0;
let currentMode = "free";

/* =========================
   ELEMENT
========================= */

const loginModal = document.getElementById("loginModal");
const logoutBtn = document.getElementById("logoutBtn");
const addCreditBtn = document.getElementById("addCreditBtn");
const buyCreditBtn = document.getElementById("buyCreditBtn");

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

/* =========================
   QRIS POPUP SYSTEM
========================= */

const qrisModal = document.getElementById("qrisModal");
const confirmPaymentBtn = document.getElementById("confirmPaymentBtn");
const closeQrisBtn = document.getElementById("closeQrisBtn");

if (buyCreditBtn && qrisModal) {
  buyCreditBtn.onclick = () => {
    qrisModal.style.display = "flex";
  };
}

if (closeQrisBtn && qrisModal) {
  closeQrisBtn.onclick = () => {
    qrisModal.style.display = "none";
  };
}

if (confirmPaymentBtn && qrisModal) {
  confirmPaymentBtn.onclick = async () => {

    if (!currentUser) return alert("Login dulu.");

    const { data: sessionData } = await supabase.auth.getSession();
    const token = sessionData?.session?.access_token;
    if (!token) return alert("Session expired.");

    const response = await fetch("/api/request-topup", {
      method: "POST",
      headers: { "Authorization": `Bearer ${token}` }
    });

    const data = await response.json();

    if (response.ok) {
      alert("Topup dikirim. Tunggu konfirmasi admin.");
      qrisModal.style.display = "none";
    } else {
      alert(data.error || "Terjadi kesalahan.");
    }
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
  const { data, error } = await supabase
    .from("profiles")
    .select("credits")
    .eq("id", user.id)
    .single();

  if(error) return;

  if(data){
    currentCredit = data.credits;
    creditValue.innerText = data.credits;
    if(proCredit) proCredit.innerText = data.credits;
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
   ADMIN TOPUP
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
      <div style="margin-bottom:15px;padding:10px;background:#1e293b;border-radius:10px;">
        <p><strong>User ID:</strong> ${item.user_id}</p>
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

  const response = await fetch("/api/approve-topup", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ requestId })
  });

  const data = await response.json();

  if(response.ok){
    alert("Topup disetujui.");
    await loadPendingTopup();
  } else {
    alert(data.error);
  }
};

/* =========================
   CHECK USER
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
    await loadPendingTopup(); // 🔥 penting

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
   GENERATE
========================= */

generateBtn.onclick = async () => {

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

  const { data: sessionData } = await supabase.auth.getSession();
  const token = sessionData?.session?.access_token;

  if(!token){
    generateBtn.disabled = false;
    return alert("Session expired.");
  }

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

  if(!response.ok){
    resultBox.innerHTML = data.error || "Terjadi kesalahan.";
    generateBtn.disabled = false;
    return;
  }

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

  generateBtn.disabled = false;
};

/* =========================
   START
========================= */

updateModeUI();
await checkUser();

});