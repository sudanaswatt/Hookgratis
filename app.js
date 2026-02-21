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

/* =========================
   MODE SYSTEM
========================= */

function updateModeUI() {

  if(currentMode === "free"){

    freeBtn.classList.add("active");
    proBtn.classList.remove("active");
    proDashboard.style.display = "none";

  } else {

    proBtn.classList.add("active");
    freeBtn.classList.remove("active");
    proDashboard.style.display = "block";
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
   ADD CREDIT
========================= */

addCreditBtn.onclick = async () => {

  if(!currentUser) return alert("Login dulu.");

  const { data: sessionData } = await supabase.auth.getSession();
  const token = sessionData?.session?.access_token;

  if(!token) return alert("Session expired.");

  const response = await fetch("/api/add-credit", {
    method: "POST",
    headers: { "Authorization": `Bearer ${token}` }
  });

  const data = await response.json();

  if(response.ok){
    await loadProfile(currentUser);
    alert("Credit ditambahkan.");
  } else {
    alert(data.error || "Gagal tambah credit.");
  }
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