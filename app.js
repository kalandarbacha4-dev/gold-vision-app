const SB = window.supabaseClient;

const ALLOWED_EMAIL = "sahiahmadi590@gmail.com";
const DENIED_MESSAGE = "این جیمیل ثبت شده گولد ویژن نمی‌باشد";

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
  `${Number(value || 0).toLocaleString("en-US")} ${settings.currency || "AFN"}`;


document.addEventListener("DOMContentLoaded", boot);


// ===============================
// START
// ===============================

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


// ===============================
// SETTINGS
// ===============================

async function loadSettings() {

  try {

    const { data } = await SB
      .from("app_settings")
      .select("setting_key,setting_value");

    (data || []).forEach(item => {
      settings[item.setting_key] =
        item.setting_value;
    });

  } catch (error) {

    console.error(error);
  }

  settings.app_name ||= "Gold Vision";
  settings.app_slogan ||= "مسیر رشد و پیشرفت";
  settings.currency ||= "AFN";
}


// ===============================
// PROFILE
// ===============================

async function loadProfile() {

  if (!user?.id) {
    return false;
  }

  try {

    const {
      data,
      error
    } = await SB
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


// ===============================
// SHELL
// ===============================

function shell(body) {

  document.body.innerHTML =
    `<div id="app">${body}</div>`;
}


// ===============================
// LOGIN
// ===============================

function login(message = "") {

  shell(`

    <main class="auth">

      <div class="card auth-card">

        <div class="logo">
          GV
        </div>

        <h1>
          ${esc(settings.app_name)}
        </h1>

        <p class="muted">
          ${esc(settings.app_slogan)}
        </p>

        <h2>
          ورود
        </h2>

        ${
          message
            ? `
              <div class="error">
                ${esc(message)}
              </div>
            `
            : ""
        }

        <form id="loginForm">

          <label>
            جیمیل
          </label>

          <input
            id="email"
            type="email"
            required
            autocomplete="email"
            placeholder="جیمیل خود را وارد کنید"
          >

          <label>
            رمز عبور
          </label>

          <input
            id="password"
            type="password"
            required
            autocomplete="current-password"
            placeholder="رمز عبور"
          >

          <button
            class="primary"
            type="submit"
          >
            ورود
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


    // --------------------------------
    // هر جیمیل غیر از جیمیل مجاز
    // --------------------------------

    if (
      email !==
      ALLOWED_EMAIL.toLowerCase()
    ) {

      return login(DENIED_MESSAGE);
    }


    const button =
      event.submitter;

    button.disabled = true;

    button.textContent =
      "در حال ورود...";


    try {

      const {
        data,
        error
      } = await SB.auth.signInWithPassword({

        email:
          ALLOWED_EMAIL,

        password

      });


      // --------------------------------
      // هر خطایی هم همان پیام ثابت
      // --------------------------------

      if (error || !data?.user) {

        button.disabled = false;

        button.textContent =
          "ورود";

        return login(DENIED_MESSAGE);
      }


      // --------------------------------
      // بررسی نهایی جیمیل
      // --------------------------------

      if (
        data.user.email?.toLowerCase() !==
        ALLOWED_EMAIL.toLowerCase()
      ) {

        await SB.auth.signOut();

        return login(DENIED_MESSAGE);
      }


      user =
        data.user;


      // --------------------------------
      // بررسی پروفایل
      // --------------------------------

      const loaded =
        await loadProfile();


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

      button.textContent =
        "ورود";

      return login(DENIED_MESSAGE);
    }
  };
}


// ===============================
// REGISTER
// ===============================

function register() {

  login(DENIED_MESSAGE);
}


// ===============================
// FORGOT PASSWORD
// ===============================

async function forgot() {

  login(DENIED_MESSAGE);
}


// ===============================
// DASHBOARD
// ===============================

function dashboard() {

  shell(`

    <header>

      <div>

        <b>
          ${esc(settings.app_name)}
        </b>

        <small>
          ${esc(settings.app_slogan)}
        </small>

      </div>

      <button
        class="logout"
        onclick="logout()"
      >
        خروج
      </button>

    </header>


    <main class="page">

      <section class="hero">

        <h2>
          خوش آمدید،
          ${esc(profile.full_name || "کاربر")}
        </h2>

        <p>
          User ID:
          <b>
            ${esc(profile.user_id || "-")}
          </b>
        </p>

      </section>


      <div class="grid">

        ${card(
          "🌳",
          "ساختار تیم",
          "structure()"
        )}

        ${card(
          "📚",
          "کتاب‌ها",
          "books()"
        )}

        ${card(
          "💰",
          "کیف پول",
          "wallet()"
        )}

        ${card(
          "🔗",
          "کد دعوت",
          "referral()"
        )}

        ${card(
          "👤",
          "پروفایل",
          "profilePage()"
        )}

        ${
          profile.role === "admin"
            ? card(
                "👑",
                "پنل مدیریت",
                "admin()"
              )
            : ""
        }

      </div>


      <section id="content"></section>

    </main>

  `);
}


function card(icon, title, action) {

  return `

    <button
      class="menu"
      onclick="${action}"
    >

      <span>
        ${icon}
      </span>

      <b>
        ${title}
      </b>

    </button>

  `;
}


// ===============================
// STRUCTURE
// ===============================

async function structure() {

  $("content").innerHTML = `

    <section class="card">

      <h2>🌳 ساختار تیم</h2>

      <div id="list">
        در حال دریافت...
      </div>

    </section>

  `;


  const {
    data,
    error
  } = await SB
    .from("profiles")
    .select(
      "user_id,full_name,referral_code,referred_by,status,created_at"
    )
    .eq(
      "referred_by",
      user.id
    )
    .order(
      "created_at"
    );


  if (error) {

    return $("list").innerHTML =
      `<div class="error">
        ${esc(error.message)}
      </div>`;
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
          عضوی در ساختار مستقیم شما نیست.
        </p>
      `;
}


// ===============================
// BOOKS
// ===============================

async function books() {

  $("content").innerHTML = `

    <section class="card">

      <h2>📚 کتاب‌ها</h2>

      <div id="list">
        در حال دریافت...
      </div>

    </section>

  `;


  const {
    data,
    error
  } = await SB
    .from("books")
    .select("*")
    .eq(
      "active",
      true
    )
    .order(
      "created_at",
      {
        ascending: false
      }
    );


  if (error) {

    return $("list").innerHTML =
      `<div class="error">
        ${esc(error.message)}
      </div>`;
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
                    مشاهده
                  </a>
                `
                : ""
            }

          </div>

        `).join("")

      : `
        <p class="muted">
          کتابی ثبت نشده است.
        </p>
      `;
}


// ===============================
// WALLET
// ===============================

async function wallet() {

  $("content").innerHTML = `

    <section class="card">

      <h2>💰 کیف پول</h2>

      <div class="balance">
        ${money(profile.wallet_balance)}
      </div>

      <div id="list">
        در حال دریافت...
      </div>

    </section>

  `;


  const {
    data,
    error
  } = await SB
    .from("wallet_transactions")
    .select("*")
    .eq(
      "user_id",
      user.id
    )
    .order(
      "created_at",
      {
        ascending: false
      }
    );


  if (error) {

    return $("list").innerHTML =
      `<div class="error">
        ${esc(error.message)}
      </div>`;
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
                transaction.description ||
                "تراکنش"
              )}

            </span>

            <b>
              ${money(transaction.amount)}
            </b>

          </div>

        `).join("")

      : `
        <p class="muted">
          تراکنشی وجود ندارد.
        </p>
      `;
}


// ===============================
// REFERRAL
// ===============================

function referral() {

  $("content").innerHTML = `

    <section class="card">

      <h2>🔗 کد دعوت</h2>

      <div class="big-code">
        ${esc(profile.referral_code || "-")}
      </div>

      <button
        class="primary"
        onclick="copyReferral()"
      >
        کپی کد
      </button>

    </section>

  `;
}


async function copyReferral() {

  try {

    await navigator.clipboard.writeText(
      profile.referral_code
    );

    alert("کد دعوت کپی شد.");

  } catch {

    alert("کپی انجام نشد.");
  }
}


// ===============================
// PROFILE
// ===============================

function profilePage() {

  $("content").innerHTML = `

    <section class="card">

      <h2>👤 پروفایل</h2>

      <div class="row">
        <span>نام</span>
        <b>${esc(profile.full_name || "-")}</b>
      </div>

      <div class="row">
        <span>User ID</span>
        <b>${esc(profile.user_id || "-")}</b>
      </div>

      <div class="row">
        <span>تلفن</span>
        <b>${esc(profile.phone || "-")}</b>
      </div>

      <div class="row">
        <span>ایمیل</span>
        <b>${esc(user.email || "-")}</b>
      </div>

      <div class="row">
        <span>وضعیت</span>
        <b>${esc(profile.status || "-")}</b>
      </div>

    </section>

  `;
}


// ===============================
// ADMIN
// ===============================

async function admin() {

  if (profile.role !== "admin") {
    return;
  }


  $("content").innerHTML = `

    <section class="card">

      <h2>👑 پنل مدیریت</h2>

      <div class="admin-grid">

        <button onclick="newUid()">
          🆔 ایجاد User ID
        </button>

        <button onclick="members()">
          👥 اعضا
        </button>

        <button onclick="adminBooks()">
          📚 کتاب‌ها
        </button>

        <button onclick="adminWallet()">
          💰 کیف پول
        </button>

        <button onclick="adminSettings()">
          ⚙️ تنظیمات
        </button>

      </div>

      <div id="adminContent"></div>

    </section>

  `;
}


// ===============================
// NEW USER ID
// ===============================

async function newUid() {

  const {
    data,
    error
  } = await SB.rpc(
    "create_registration_code"
  );


  $("adminContent").innerHTML = error

    ? `<div class="error">${esc(error.message)}</div>`

    : `
      <div class="success">
        User ID جدید:
        <b>${esc(data)}</b>
      </div>
    `;
}


// ===============================
// MEMBERS
// ===============================

async function members() {

  const {
    data,
    error
  } = await SB
    .from("profiles")
    .select(
      "user_id,full_name,phone,role,status,wallet_balance,created_at"
    )
    .order(
      "created_at",
      {
        ascending: false
      }
    );


  $("adminContent").innerHTML = error

    ? `<div class="error">${esc(error.message)}</div>`

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


// ===============================
// ADMIN BOOKS
// ===============================

async function adminBooks() {

  const {
    data,
    error
  } = await SB
    .from("books")
    .select("*")
    .order(
      "created_at",
      {
        ascending: false
      }
    );


  $("adminContent").innerHTML = error

    ? `<div class="error">${esc(error.message)}</div>`

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
      || "<p>کتابی نیست.</p>";
}


// ===============================
// ADMIN WALLET
// ===============================

async function adminWallet() {

  $("adminContent").innerHTML = `

    <p class="muted">
      مدیریت امن موجودی در نسخه بعدی
      با RPC تراکنش اتمیک اضافه می‌شود.
    </p>

  `;
}


// ===============================
// ADMIN SETTINGS
// ===============================

async function adminSettings() {

  const {
    data,
    error
  } = await SB
    .from("app_settings")
    .select("*")
    .order(
      "setting_key"
    );


  $("adminContent").innerHTML = error

    ? `<div class="error">${esc(error.message)}</div>`

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


// ===============================
// LOGOUT
// ===============================

async function logout() {

  try {
    await SB.auth.signOut();
  } catch {}

  user = null;
  profile = null;

  login();
}


// ===============================
// FATAL
// ===============================

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
