window.addEventListener("load", async () => {

  const supabase = window.supabase.createClient(
    "https://fvtqwxzkxzauyiaqpauu.supabase.co",
    "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZ2dHF3eHpreHphdXlpYXFwYXV1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzE2MzkyMDksImV4cCI6MjA4NzIxNTIwOX0.d1s0att2MuxyFBx5v7lYhGOkQdGe-viUCNRw_HXs4Rk"
);

  const ADMIN_EMAIL = "sudanaswatt20@icloud.com";

  const { data:{user} } = await supabase.auth.getUser();

  if(!user || user.email !== ADMIN_EMAIL){
    document.getElementById("notAdmin").style.display = "block";
    return;
  }

  document.getElementById("adminContent").style.display = "block";

});