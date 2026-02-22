window.addEventListener("load", async () => {

/* =========================
   INIT
========================= */

const supabase = window.supabase.createClient(
  "https://fvtqwxzkxzauyiaqpauu.supabase.co",
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZ2dHF3eHpreHphdXlpYXFwYXV1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzE2MzkyMDksImV4cCI6MjA4NzIxNTIwOX0.d1s0att2MuxyFBx5v7lYhGOkQdGe-viUCNRw_HXs4Rk"
);

let currentUser = null;
let currentMode = "free";
let currentRequestId = null;

/* =========================
   ELEMENT
========================= */

const loginModal = document.getElementById("loginModal");
const logoutBtn = document.getElementById("logoutBtn");
const buyCreditBtn = document.getElementById("buyCreditBtn");
const confirmPaymentBtn = document.getElementById("confirmPaymentBtn");
const closeQrisBtn = document.getElementById("closeQrisBtn");

const qrisModal = document.getElementById("qrisModal");
const appBox = document.getElementById("appBox");
const userEmail = document.getElementById("userEmail");
const creditValue = document.getElementById("creditValue");
const resultBox = document.getElementById("result");

const freeBtn = document.getElementById("freeBtn");
const proBtn = document.getElementById("proBtn");
const proDashboard = document.getElementById("proDashboard");

const generateBtn = document.getElementById("generateBtn");

/* =========================
   MODE SYSTEM
========================= */

function updateModeUI(){
  if(currentMode === "free"){
    if(freeBtn) freeBtn.classList.add("active");
    if(proBtn) proBtn.classList.remove("active");
    if(proDashboard) proDashboard.style.display = "none";
  } else {
    if(proBtn) proBtn.classList.add("active");
    if(freeBtn) freeBtn.classList.remove("active");
    if(proDashboard) proDashboard.style.display = "block";
  }
}

if(freeBtn){
  freeBtn.onclick = ()=>{
    currentMode = "free";
    updateModeUI();
  };
}

if(proBtn){
  proBtn.onclick = ()=>{
    currentMode = "pro";
    updateModeUI();
  };
}

/* =========================
   AUTH CHECK
========================= */

async function checkUser(){

  const { data:{ user } } = await supabase.auth.getUser();

  if(user){
    currentUser = user;
    loginModal.style.display = "none";
    appBox.style.display = "block";
    userEmail.innerText = user.email;

    await loadProfile(user);
    await loadHistory();

  } else {
    currentUser = null;
    loginModal.style.display = "flex";
    appBox.style.display = "none";
  }
}

/* =========================
   LOGIN
========================= */

document.getElementById("loginBtn").onclick = async ()=>{
  const email = document.getElementById("email").value;
  const password = document.getElementById("password").value;

  const { error } = await supabase.auth.signInWithPassword({ email, password });

  if(error){
    alert(error.message);
    return;
  }

  await checkUser();
};

/* =========================
   REGISTER
========================= */

document.getElementById("registerBtn").onclick = async ()=>{
  const email = document.getElementById("email").value;
  const password = document.getElementById("password").value;

  const { error } = await supabase.auth.signUp({ email, password });

  if(error) alert(error.message);
  else alert("Cek email konfirmasi.");
};

/* =========================
   LOGOUT
========================= */

if(logoutBtn){
  logoutBtn.onclick = async ()=>{
    await supabase.auth.signOut();
    currentUser = null;
    await checkUser();
  };
}

/* =========================
   LOAD PROFILE
========================= */

async function loadProfile(user){

  const { data } = await supabase
    .from("profiles")
    .select("credits")
    .eq("id", user.id)
    .single();

  if(data){
    const credits = data.credits || 0;
    if(creditValue) creditValue.innerText = credits;

    const proCredit = document.getElementById("proCredit");
    if(proCredit) proCredit.innerText = credits;
  }
}

/* =========================
   LOAD HISTORY (FINAL CLEAN)
========================= */

async function loadHistory(){

  if(!currentUser) return;

  const twentyFourHoursAgo = new Date(
    Date.now() - 24 * 60 * 60 * 1000
  ).toISOString();

  const { data, error } = await supabase
    .from("generate_history")
    .select("*")
    .eq("user_id", currentUser.id)
    .gte("created_at", twentyFourHoursAgo)
    .order("created_at", { ascending: false });

  const historyList = document.getElementById("historyList");
  if(!historyList) return;

  historyList.innerHTML = "";

  if(error || !data || data.length === 0){
    historyList.innerHTML = "<p>Belum ada riwayat.</p>";
    return;
  }

  let expanded = false;

  function renderHistory(list){

    historyList.innerHTML = "";

    list.forEach((item, index)=>{

      const isFirst = index === 0;
      const shouldOpen = expanded || isFirst;

      historyList.innerHTML += `
        <div style="margin-bottom:15px;">
          <div style="font-size:12px;opacity:.6;">
            ${item.mode === "pro" ? "AI Premium" : "AI Free"} • ${item.platform}
          </div>

          ${shouldOpen ? `
            <div style="white-space:pre-line;margin-top:5px;">
              ${item.result}
            </div>
          ` : ""}
        </div>
      `;
    });

    if(list.length > 1){
      historyList.innerHTML += `
        <button id="toggleHistoryBtn"
          style="margin-top:10px;background:none;border:none;color:#8b5cf6;cursor:pointer;">
          ${expanded ? "Tutup" : "Lihat Semua"}
        </button>
      `;

      document.getElementById("toggleHistoryBtn").onclick = ()=>{
        expanded = !expanded;
        renderHistory(list);
      };
    }
  }

  renderHistory(data);
}

/* =========================
   BUY CREDIT (QRIS)
========================= */

if(buyCreditBtn){
  buyCreditBtn.onclick = async ()=>{

    if(!currentUser) return alert("Login dulu.");

    const uniqueCode = Math.floor(Math.random()*90)+10;
    const baseAmount = 20000;
    const finalAmount = baseAmount + uniqueCode;

    const expiredAt = new Date(
      Date.now() + 15*60*1000
    ).toISOString();

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

    if(error){
      alert("Gagal membuat request");
      return;
    }

    currentRequestId = data.id;

    document.getElementById("amountText").innerText =
      "Transfer Rp"+finalAmount.toLocaleString()+
      " untuk 100 Credit";

    qrisModal.style.display = "flex";
  };
}

/* =========================
   CLOSE QRIS
========================= */

if(closeQrisBtn){
  closeQrisBtn.onclick = ()=>{
    qrisModal.style.display = "none";
  };
}

/* =========================
   CONFIRM PAYMENT
========================= */

if(confirmPaymentBtn){
  confirmPaymentBtn.onclick = async ()=>{

    if(!currentRequestId)
      return alert("Request tidak ditemukan.");

    const { data } = await supabase
      .from("topup_requests")
      .select("expired_at")
      .eq("id", currentRequestId)
      .single();

    if(!data)
      return alert("Request invalid.");

    if(new Date() > new Date(data.expired_at))
      return alert("Waktu pembayaran sudah habis.");

    await supabase
      .from("topup_requests")
      .update({ status:"pending" })
      .eq("id", currentRequestId);

    qrisModal.style.display = "none";

    window.location.href =
      "/status.html?id="+currentRequestId;
  };
}

/* =========================
   GENERATE AI
========================= */

if(generateBtn){
  generateBtn.onclick = async ()=>{

    if(!currentUser) return alert("Login dulu.");

    const productName = document.getElementById("productName")?.value.trim();
    const productDesc = document.getElementById("productDesc")?.value.trim();
    const category = document.getElementById("category")?.value;
    const platform = document.getElementById("platform")?.value;
    const audience = document.getElementById("audience")?.value;
    const style = document.getElementById("style")?.value;
    const duration = document.getElementById("duration")?.value;

    if(!productName || !audience || !style || !platform){
      alert("Field tidak lengkap.");
      return;
    }

    generateBtn.disabled = true;
    resultBox.innerHTML = "Generating...";

    try{
      const { data: sessionData } = await supabase.auth.getSession();
      const token = sessionData?.session?.access_token;

      const response = await fetch("/api/generate",{
        method:"POST",
        headers:{
          "Content-Type":"application/json",
          "Authorization":`Bearer ${token}`
        },
        body: JSON.stringify({
          productName,
          productDesc,
          category,
          platform,
          audience,
          style,
          duration,
          mode: currentMode
        })
      });

      const data = await response.json();

      if(!response.ok) throw new Error(data.error);

      resultBox.innerHTML = `
        <div style="font-size:12px;opacity:.6;margin-bottom:5px;">
          ${currentMode === "pro" ? "AI Premium" : "AI Free"}
        </div>
        <div style="white-space:pre-line;">
          ${data.result}
        </div>
      `;

      await loadProfile(currentUser);
      await loadHistory();

    } catch(err){
      resultBox.innerHTML = err.message;
    }

    generateBtn.disabled = false;
  };
}

/* =========================
   START
========================= */

updateModeUI();
await checkUser();

});