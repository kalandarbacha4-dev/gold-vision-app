const SB = window.supabaseClient;
let user = null, profile = null, settings = {};

const $ = id => document.getElementById(id);
const esc = v => String(v ?? "").replace(/[&<>"']/g, c => ({
  "&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#039;"
}[c]));
const money = n => `${Number(n || 0).toLocaleString("en-US")} ${settings.currency || "AFN"}`;

document.addEventListener("DOMContentLoaded", boot);

async function boot() {
  if (!SB) return fatal("اتصال Supabase ایجاد نشده است.");
  await loadSettings();
  const { data } = await SB.auth.getSession();
  if (data.session?.user) {
    user = data.session.user;
    await loadProfile();
    if (profile) return dashboard();
  }
  login();
}

async function loadSettings() {
  const { data } = await SB.from("app_settings").select("setting_key,setting_value");
  (data || []).forEach(x => settings[x.setting_key] = x.setting_value);
  settings.app_name ||= "Gold Vision";
  settings.app_slogan ||= "مسیر رشد و پیشرفت";
  settings.currency ||= "AFN";
}

async function loadProfile() {
  if (!user) return;
  const { data } = await SB.from("profiles").select("*").eq("id", user.id).maybeSingle();
  profile = data || null;
}

function shell(body) {
  document.body.innerHTML = `<div id="app">${body}</div>`;
}

function login(message="") {
  shell(`<main class="auth">
    <div class="card auth-card">
      <div class="logo">GV</div><h1>${esc(settings.app_name)}</h1>
      <p class="muted">${esc(settings.app_slogan)}</p><h2>ورود</h2>
      ${message ? `<div class="error">${esc(message)}</div>` : ""}
      <form id="loginForm">
        <label>ایمیل</label><input id="email" type="email" required autocomplete="email">
        <label>رمز عبور</label><input id="password" type="password" required autocomplete="current-password">
        <button class="primary" type="submit">ورود</button>
      </form>
      <button class="link" onclick="register()">ایجاد حساب</button>
      <button class="link" onclick="forgot()">فراموشی رمز</button>
    </div></main>`);
  $("loginForm").onsubmit = async e => {
    e.preventDefault();
    const btn = e.submitter; btn.disabled = true; btn.textContent = "در حال ورود...";
    const { data, error } = await SB.auth.signInWithPassword({email:$("email").value.trim(),password:$("password").value});
    if (error) return login(authError(error));
    user = data.user; await loadProfile();
    if (!profile) return login("حساب وارد شد اما پروفایل پیدا نشد.");
    dashboard();
  };
}

function register(message="") {
  shell(`<main class="auth"><div class="card auth-card">
    <div class="logo">GV</div><h1>${esc(settings.app_name)}</h1><p class="muted">ثبت‌نام</p>
    ${message ? `<div class="error">${esc(message)}</div>` : ""}
    <form id="regForm">
      <label>نام کامل</label><input id="name" required>
      <label>شماره تماس</label><input id="phone" required>
      <label>User ID</label><input id="uid" placeholder="مثلاً GV-1001" required>
      <label>کد معرف</label><input id="ref" required>
      <label>ایمیل</label><input id="email" type="email" required>
      <label>رمز عبور</label><input id="pass" type="password" minlength="6" required>
      <button class="primary" type="submit">ثبت‌نام</button>
    </form>
    <button class="secondary" onclick="login()">بازگشت</button>
  </div></main>`);
  $("regForm").onsubmit = async e => {
    e.preventDefault();
    const vals = ["name","phone","uid","ref","email","pass"].map(x => $(x).value.trim());
    const [name,phone,uid,ref,email,pass] = vals;
    const btn = e.submitter; btn.disabled=true; btn.textContent="در حال ثبت‌نام...";
    const {data: valid,error:ve} = await SB.rpc("check_registration_code",{p_user_id:uid});
    if (ve || !valid) return register("User ID معتبر نیست یا قبلاً استفاده شده است.");
    const {data: rp,error:re} = await SB.from("profiles").select("id").eq("referral_code",ref).maybeSingle();
    if (re || !rp) return register("کد معرف معتبر نیست.");
    const {data:a,error:ae} = await SB.auth.signUp({email,password:pass});
    if (ae) return register(authError(ae));
    if (!a.user) return register("ثبت‌نام انجام نشد.");
    const {error:pe} = await SB.from("profiles").insert({
      id:a.user.id,user_id:uid,full_name:name,phone,
      referral_code:"GV"+crypto.randomUUID().replaceAll("-","").slice(0,8).toUpperCase(),
      referred_by:rp.id,wallet_balance:0,role:"member",status:"active"
    });
    if (pe) return register("حساب ساخته شد اما پروفایل ساخته نشد: "+pe.message);
    await SB.from("user_registration_codes").update({
      used:true,used_by:a.user.id,assigned_to:a.user.id,used_at:new Date().toISOString()
    }).eq("user_id",uid).eq("used",false);
    login("ثبت‌نام انجام شد. در صورت فعال بودن تأیید ایمیل، ابتدا ایمیل را تأیید کنید.");
  };
}

async function forgot() {
  shell(`<main class="auth"><div class="card auth-card"><h2>بازیابی رمز</h2>
    <form id="forgotForm"><label>ایمیل</label><input id="forgotEmail" type="email" required>
    <button class="primary">ارسال لینک</button></form>
    <button class="secondary" onclick="login()">بازگشت</button></div></main>`);
  $("forgotForm").onsubmit = async e => {
    e.preventDefault();
    const {error}=await SB.auth.resetPasswordForEmail($("forgotEmail").value.trim(),{redirectTo:location.origin});
    alert(error ? authError(error) : "لینک بازیابی ارسال شد.");
  };
}

function dashboard() {
  shell(`<header><div><b>${esc(settings.app_name)}</b><small>${esc(settings.app_slogan)}</small></div>
    <button class="logout" onclick="logout()">خروج</button></header>
    <main class="page">
      <section class="hero"><h2>خوش آمدید، ${esc(profile.full_name)}</h2>
      <p>User ID: <b>${esc(profile.user_id)}</b></p></section>
      <div class="grid">
        ${card("🌳","ساختار تیم","structure()")}
        ${card("📚","کتاب‌ها","books()")}
        ${card("💰","کیف پول","wallet()")}
        ${card("🔗","کد دعوت","referral()")}
        ${card("👤","پروفایل","profilePage()")}
        ${profile.role==="admin" ? card("👑","پنل مدیریت","admin()") : ""}
      </div>
      <section id="content"></section>
    </main>`);
}
function card(icon,title,fn){return `<button class="menu" onclick="${fn}"><span>${icon}</span><b>${title}</b></button>`}

async function structure() {
  $("content").innerHTML=`<section class="card"><h2>🌳 ساختار تیم</h2><div id="list">در حال دریافت...</div></section>`;
  const {data,error}=await SB.from("profiles").select("user_id,full_name,referral_code,referred_by,status,created_at").eq("referred_by",user.id).order("created_at");
  if(error)return $("list").innerHTML=`<div class="error">${esc(error.message)}</div>`;
  $("list").innerHTML=data?.length?data.map(x=>`<div class="row"><b>${esc(x.full_name)}</b><span>${esc(x.user_id)}</span><small>${esc(x.status)}</small></div>`).join(""):"<p class='muted'>عضوی در ساختار مستقیم شما نیست.</p>";
}
async function books() {
  $("content").innerHTML=`<section class="card"><h2>📚 کتاب‌ها</h2><div id="list">در حال دریافت...</div></section>`;
  const {data,error}=await SB.from("books").select("*").eq("active",true).order("created_at",{ascending:false});
  if(error)return $("list").innerHTML=`<div class="error">${esc(error.message)}</div>`;
  $("list").innerHTML=data?.length?data.map(b=>`<div class="row"><div><b>${esc(b.title)}</b><p>${esc(b.description||"")}</p></div><b>${money(b.price)}</b>${b.pdf_url?`<a target="_blank" href="${esc(b.pdf_url)}">مشاهده</a>`:""}</div>`).join(""):"<p class='muted'>کتابی ثبت نشده است.</p>";
}
async function wallet() {
  $("content").innerHTML=`<section class="card"><h2>💰 کیف پول</h2><div class="balance">${money(profile.wallet_balance)}</div><div id="list">در حال دریافت...</div></section>`;
  const {data,error}=await SB.from("wallet_transactions").select("*").eq("user_id",user.id).order("created_at",{ascending:false});
  if(error)return $("list").innerHTML=`<div class="error">${esc(error.message)}</div>`;
  $("list").innerHTML=data?.length?data.map(t=>`<div class="row"><span>${t.transaction_type==="credit"?"➕":"➖"} ${esc(t.description||"تراکنش")}</span><b>${money(t.amount)}</b></div>`).join(""):"<p class='muted'>تراکنشی وجود ندارد.</p>";
}
function referral() {
  $("content").innerHTML=`<section class="card"><h2>🔗 کد دعوت</h2><div class="big-code">${esc(profile.referral_code)}</div><button class="primary" onclick="navigator.clipboard.writeText('${esc(profile.referral_code)}').then(()=>alert('کپی شد'))">کپی کد</button></section>`;
}
function profilePage() {
  $("content").innerHTML=`<section class="card"><h2>👤 پروفایل</h2>
    <div class="row"><span>نام</span><b>${esc(profile.full_name)}</b></div>
    <div class="row"><span>User ID</span><b>${esc(profile.user_id)}</b></div>
    <div class="row"><span>تلفن</span><b>${esc(profile.phone||"-")}</b></div>
    <div class="row"><span>ایمیل</span><b>${esc(user.email||"-")}</b></div>
    <div class="row"><span>وضعیت</span><b>${esc(profile.status)}</b></div></section>`;
}

async function admin() {
  if(profile.role!=="admin") return;
  $("content").innerHTML=`<section class="card"><h2>👑 پنل مدیریت</h2>
    <div class="admin-grid">
      <button onclick="newUid()">🆔 ایجاد User ID</button>
      <button onclick="members()">👥 اعضا</button>
      <button onclick="adminBooks()">📚 کتاب‌ها</button>
      <button onclick="adminWallet()">💰 کیف پول</button>
      <button onclick="adminSettings()">⚙️ تنظیمات</button>
    </div><div id="adminContent"></div></section>`;
}
async function newUid() {
  const {data,error}=await SB.rpc("create_registration_code");
  $("adminContent").innerHTML=error?`<div class="error">${esc(error.message)}</div>`:`<div class="success">User ID جدید: <b>${esc(data)}</b></div>`;
}
async function members() {
  const {data,error}=await SB.from("profiles").select("user_id,full_name,phone,role,status,wallet_balance,created_at").order("created_at",{ascending:false});
  $("adminContent").innerHTML=error?`<div class="error">${esc(error.message)}</div>`:(data||[]).map(x=>`<div class="row"><div><b>${esc(x.full_name)}</b><small>${esc(x.user_id)} · ${esc(x.phone||"")}</small></div><b>${money(x.wallet_balance)}</b></div>`).join("");
}
async function adminBooks() {
  const {data,error}=await SB.from("books").select("*").order("created_at",{ascending:false});
  $("adminContent").innerHTML=error?`<div class="error">${esc(error.message)}</div>`:(data||[]).map(x=>`<div class="row"><b>${esc(x.title)}</b><span>${money(x.price)}</span></div>`).join("")||"<p>کتابی نیست.</p>";
}
async function adminWallet() {
  $("adminContent").innerHTML=`<p class="muted">مدیریت امن موجودی در نسخه بعدی با RPC تراکنش اتمیک اضافه می‌شود.</p>`;
}
async function adminSettings() {
  const {data,error}=await SB.from("app_settings").select("*").order("setting_key");
  $("adminContent").innerHTML=error?`<div class="error">${esc(error.message)}</div>`:(data||[]).map(x=>`<div class="row"><b>${esc(x.setting_key)}</b><span>${esc(x.setting_value||"")}</span></div>`).join("");
}
async function logout(){await SB.auth.signOut();user=null;profile=null;login();}
function authError(e){const m=String(e?.message||"").toLowerCase();if(m.includes("invalid login"))return"ایمیل یا رمز عبور اشتباه است.";if(m.includes("not confirmed"))return"ایمیل هنوز تأیید نشده است.";return e?.message||"عملیات انجام نشد."}
function fatal(m){shell(`<main class="auth"><div class="card"><div class="error">${esc(m)}</div></div></main>`)}
