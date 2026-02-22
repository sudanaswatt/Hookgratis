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
   QRIS MODAL
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

    confirmPaymentBtn.disabled = true;

    try {
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
    } catch (err) {
      alert("Network error.");
    }

    confirmPaymentBtn.disabled = false;
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

  try{
    const response = await fetch("/api/approve-topup", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
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