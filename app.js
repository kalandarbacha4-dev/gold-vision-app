const SB = window.supabaseClient;
const ALLOWED_EMAIL = "sahiahmadi590@gmail.com";
const DENIED_MESSAGE =
  "Diese E-Mail-Adresse ist nicht für Gold Vision registriert.";
let user = null;
let profile = null;
let settings = {};
const $ = id => document.getElementById(id);
const esc = value =>
  String(value ?? "").replace(/[&<>"']/g, char => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#039;"
  }[char]));
const money = value =>
  `${Number(value || 0).toLocaleString("de-DE")} ${settings.currency || "AFN"}`;
document.addEventListener("DOMContentLoaded", boot);
async function boot() {
  if (!SB) {
    return fatal(DENIED_MESSAGE);
  }
  try {
    await loadSettings();
    const { data } = await SB.auth.getSession();
    if (data?.session?.user) {
      const sessionUser = data.session.user;
      if (
        sessionUser.email?.toLowerCase() !==
        ALLOWED_EMAIL.toLowerCase()
      ) {
        await SB.auth.signOut();
        user = null;
        profile = null;
        return login(DENIED_MESSAGE);
      }
      user = sessionUser;
      const loaded = await loadProfile();
      if (loaded) {
        return dashboard();
      }
      await SB.auth.signOut();
      user = null;
      profile = null;
      return login(DENIED_MESSAGE);
    }
    login();
  } catch (error) {
    console.error(error);
    return login(DENIED_MESSAGE);
  }
}
async function loadSettings() {
  try {
    const { data } = await SB
      .from("app_settings")
      .select("setting_key,setting_value");
    (data || []).forEach(item => {
      settings[item.setting_key] = item.setting_value;
    });
  } catch (error) {
    console.error(error);
  }
  settings.app_name ||= "Gold Vision";
  settings.app_slogan ||= "Wachstum und Fortschritt";
  settings.currency ||= "AFN";
}
async function loadProfile() {
  if (!user?.id) {
    return false;
  }
  try {
    const { data, error } = await SB
      .from("profiles")
      .select("*")
      .eq("id", user.id)
      .maybeSingle();
    if (error || !data) {
      return false;
    }
    profile = data;
    return true;
  } catch (error) {
    console.error(error);
    return false;
  }
}
function shell(body) {
  document.body.innerHTML =
    `<div id="app">${body}</div>`;
}
function login(message = "") {
  shell(`
    <main class="auth">
      <div class="card auth-card">
        <div class="logo">GV</div>
        <h1>${esc(settings.app_name)}</h1>
        <p class="muted">
          ${esc(settings.app_slogan)}
        </p>
        <h2>Anmelden</h2>
        ${
          message
            ? `<div class="error">${esc(message)}</div>`
            : ""
        }
        <form id="loginForm">
          <label>E-Mail</label>
          <input
            id="email"
            type="email"
            required
            autocomplete="email"
            placeholder="Geben Sie Ihre E-Mail-Adresse ein"
          >
          <label>Passwort</label>
          <input
            id="password"
            type="password"
            required
            autocomplete="current-password"
            placeholder="Geben Sie Ihr Passwort ein"
          >
          <button class="primary" type="submit">
            Anmelden
          </button>
        </form>
      </div>
    </main>
  `);
  $("loginForm").onsubmit = async event => {
    event.preventDefault();
    const email =
      $("email").value.trim().toLowerCase();
    const password =
      $("password").value;
    if (email !== ALLOWED_EMAIL.toLowerCase()) {
      return login(DENIED_MESSAGE);
    }
    const button = event.submitter;
    button.disabled = true;
    button.textContent = "Anmeldung läuft...";
    try {
      const { data, error } =
        await SB.auth.signInWithPassword({
          email: ALLOWED_EMAIL,
          password
        });
      if (error || !data?.user) {
        button.disabled = false;
        button.textContent = "Anmelden";
        return login(DENIED_MESSAGE);
      }
      if (
        data.user.email?.toLowerCase() !==
        ALLOWED_EMAIL.toLowerCase()
      ) {
        await SB.auth.signOut();
        return login(DENIED_MESSAGE);
      }
      user = data.user;
      const loaded = await loadProfile();
      if (!loaded) {
        await SB.auth.signOut();
        user = null;
        profile = null;
        return login(DENIED_MESSAGE);
      }
      dashboard();
    } catch (error) {
      console.error(error);
      button.disabled = false;
      button.textContent = "Anmelden";
      return login(DENIED_MESSAGE);
    }
  };
}
function register() {
  login(DENIED_MESSAGE);
}
async function forgot() {
  login(DENIED_MESSAGE);
}
function dashboard() {
  shell(`
    <header>
      <div>
        <b>${esc(settings.app_name)}</b>
        <small>
          ${esc(settings.app_slogan)}
        </small>
      </div>
      <button class="logout" onclick="logout()">
        Abmelden
      </button>
    </header>
    <main class="page">
      <section class="hero">
        <h2>
          Willkommen, ${esc(profile.full_name || "Benutzer")}
        </h2>
        <p>
          Benutzer-ID:
          <b>${esc(profile.user_id || "-")}</b>
        </p>
      </section>
      <div class="grid">
        ${card("🌳", "Teamstruktur", "structure()")}
        ${card("📚", "Bücher", "books()")}
        ${card("💰", "Wallet", "wallet()")}
        ${card("🔗", "Einladungscode", "referral()")}
        ${card("👤", "Profil", "profilePage()")}
        ${
          profile.role === "admin"
            ? card("👑", "Admin-Bereich", "admin()")
            : ""
        }
      </div>
      <section id="content"></section>
    </main>
  `);
}
function card(icon, title, action) {
  return `
    <button class="menu" onclick="${action}">
      <span>${icon}</span>
      <b>${title}</b>
    </button>
  `;
}
async function structure() {
  $("content").innerHTML = `
    <section class="card">
      <h2>🌳 Teamstruktur</h2>
      <div id="list">
        Daten werden geladen...
      </div>
    </section>
  `;
  const { data, error } = await SB
    .from("profiles")
    .select(
      "user_id,full_name,referral_code,referred_by,status,created_at"
    )
    .eq("referred_by", user.id)
    .order("created_at");
  if (error) {
    return $("list").innerHTML =
      `<div class="error">${esc(error.message)}</div>`;
  }
  $("list").innerHTML =
    data?.length
      ? data.map(member => `
          <div class="row">
            <b>
              ${esc(member.full_name)}
            </b>
            <span>
              ${esc(member.user_id)}
            </span>
            <small>
              ${esc(member.status)}
            </small>
          </div>
        `).join("")
      : `
        <p class="muted">
          Es befinden sich keine direkten Mitglieder in Ihrer Struktur.
        </p>
      `;
}
async function books() {
  $("content").innerHTML = `
    <section class="card">
      <h2>📚 Bücher</h2>
      <div id="list">
        Daten werden geladen...
      </div>
    </section>
  `;
  const { data, error } = await SB
    .from("books")
    .select("*")
    .eq("active", true)
    .order("created_at", { ascending: false });
  if (error) {
    return $("list").innerHTML =
      `<div class="error">${esc(error.message)}</div>`;
  }
  $("list").innerHTML =
    data?.length
      ? data.map(book => `
          <div class="row">
            <div>
              <b>
                ${esc(book.title)}
              </b>
              <p>
                ${esc(book.description || "")}
              </p>
            </div>
            <b>
              ${money(book.price)}
            </b>
            ${
              book.pdf_url
                ? `
                  <a
                    target="_blank"
                    rel="noopener"
                    href="${esc(book.pdf_url)}"
                  >
                    Öffnen
                  </a>
                `
                : ""
            }
          </div>
        `).join("")
      : `
        <p class="muted">
          Es wurden noch keine Bücher hinzugefügt.
        </p>
      `;
}
async function wallet() {
  $("content").innerHTML = `
    <section class="card">
      <h2>💰 Wallet</h2>
      <div class="balance">
        ${money(profile.wallet_balance)}
      </div>
      <div id="list">
        Daten werden geladen...
      </div>
    </section>
  `;
  const { data, error } = await SB
    .from("wallet_transactions")
    .select("*")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false });
  if (error) {
    return $("list").innerHTML =
      `<div class="error">${esc(error.message)}</div>`;
  }
  $("list").innerHTML =
    data?.length
      ? data.map(transaction => `
          <div class="row">
            <span>
              ${
                transaction.transaction_type === "credit"
                  ? "➕"
                  : "➖"
              }
              ${esc(
                transaction.description || "Transaktion"
              )}
            </span>
            <b>
              ${money(transaction.amount)}
            </b>
          </div>
        `).join("")
      : `
        <p class="muted">
          Es sind keine Transaktionen vorhanden.
        </p>
      `;
}
function referral() {
  $("content").innerHTML = `
    <section class="card">
      <h2>🔗 Einladungscode</h2>
      <div class="big-code">
        ${esc(profile.referral_code || "-")}
      </div>
      <button
        class="primary"
        onclick="copyReferral()"
      >
        Code kopieren
      </button>
    </section>
  `;
}
async function copyReferral() {
  try {
    await navigator.clipboard.writeText(
      profile.referral_code
    );
    alert("Einladungscode wurde kopiert.");
  } catch {
    alert("Der Code konnte nicht kopiert werden.");
  }
}
function profilePage() {
  $("content").innerHTML = `
    <section class="card">
      <h2>👤 Profil</h2>
      <div class="row">
        <span>Name</span>
        <b>${esc(profile.full_name || "-")}</b>
      </div>
      <div class="row">
        <span>Benutzer-ID</span>
        <b>${esc(profile.user_id || "-")}</b>
      </div>
      <div class="row">
        <span>Telefon</span>
        <b>${esc(profile.phone || "-")}</b>
      </div>
      <div class="row">
        <span>E-Mail</span>
        <b>${esc(user.email || "-")}</b>
      </div>
      <div class="row">
        <span>Status</span>
        <b>${esc(profile.status || "-")}</b>
      </div>
    </section>
  `;
}
async function admin() {
  if (profile.role !== "admin") {
    return;
  }
  $("content").innerHTML = `
    <section class="card">
      <h2>👑 Admin-Bereich</h2>
      <div class="admin-grid">
        <button onclick="newUid()">
          🆔 Benutzer-ID erstellen
        </button>
        <button onclick="members()">
          👥 Mitglieder
        </button>
        <button onclick="adminBooks()">
          📚 Bücher
        </button>
        <button onclick="adminWallet()">
          💰 Wallet
        </button>
        <button onclick="adminSettings()">
          ⚙️ Einstellungen
        </button>
      </div>
      <div id="adminContent"></div>
    </section>
  `;
}
async function newUid() {
  const { data, error } =
    await SB.rpc("create_registration_code");
  $("adminContent").innerHTML = error
    ? `
      <div class="error">
        ${esc(error.message)}
      </div>
    `
    : `
      <div class="success">
        Neue Benutzer-ID:
        <b>
          ${esc(data)}
        </b>
      </div>
    `;
}
async function members() {
  const { data, error } = await SB
    .from("profiles")
    .select(
      "user_id,full_name,phone,role,status,wallet_balance,created_at"
    )
    .order("created_at", { ascending: false });
  $("adminContent").innerHTML = error
    ? `
      <div class="error">
        ${esc(error.message)}
      </div>
    `
    : (data || [])
        .map(member => `
          <div class="row">
            <div>
              <b>
                ${esc(member.full_name)}
              </b>
              <small>
                ${esc(member.user_id)}
                ·
                ${esc(member.phone || "")}
              </small>
            </div>
            <b>
              ${money(member.wallet_balance)}
            </b>
          </div>
        `)
        .join("");
}
async function adminBooks() {
  const { data, error } = await SB
    .from("books")
    .select("*")
    .order("created_at", { ascending: false });
  $("adminContent").innerHTML = error
    ? `
      <div class="error">
        ${esc(error.message)}
      </div>
    `
    : (data || [])
        .map(book => `
          <div class="row">
            <b>
              ${esc(book.title)}
            </b>
            <span>
              ${money(book.price)}
            </span>
          </div>
        `)
        .join("")
      || `
        <p>
          Es sind keine Bücher vorhanden.
        </p>
      `;
}
async function adminWallet() {
  $("adminContent").innerHTML = `
    <p class="muted">
      Die sichere Verwaltung des Wallet-Guthabens
      wird in der nächsten Version mit einer
      atomaren RPC-Transaktion hinzugefügt.
    </p>
  `;
}
async function adminSettings() {
  const { data, error } = await SB
    .from("app_settings")
    .select("*")
    .order("setting_key");
  $("adminContent").innerHTML = error
    ? `
      <div class="error">
        ${esc(error.message)}
      </div>
    `
    : (data || [])
        .map(setting => `
          <div class="row">
            <b>
              ${esc(setting.setting_key)}
            </b>
            <span>
              ${esc(setting.setting_value || "")}
            </span>
          </div>
        `)
        .join("");
}
async function logout() {
  try {
    await SB.auth.signOut();
  } catch {}
  user = null;
  profile = null;
  login();
}
function fatal(message) {
  shell(`
    <main class="auth">
      <div class="card">
        <div class="error">
          ${esc(message)}
        </div>
      </div>
    </main>
  `);
}
