/* =========================================================
   GOLD VISION APP
   Main Application
   ========================================================= */

const APP = {
  name: "Gold Vision",
  slogan: "مسیر رشد و پیشرفت",
  currency: "AFN"
};

let currentUser = null;
let currentProfile = null;

/* =========================================================
   START
   ========================================================= */

document.addEventListener("DOMContentLoaded", async () => {
  try {
    await checkSession();
  } catch (error) {
    console.error("Application start error:", error);
    showLogin();
  }
});

/* =========================================================
   SESSION
   ========================================================= */

async function checkSession() {
  try {
    console.log("Gold Vision: checking session...");

    if (!window.supabase) {
      showErrorPage("کتابخانه Supabase بارگذاری نشده است.");
      return;
    }

    if (!window.supabaseClient) {
      showErrorPage("اتصال Supabase ایجاد نشده است.");
      return;
    }

    const result = await window.supabaseClient.auth.getSession();

    if (result.error) {
      console.error(result.error);
      showLogin();
      return;
    }

    const session = result.data?.session;

    if (session && session.user) {
      currentUser = session.user;
      await loadCurrentProfile();

      if (currentProfile) {
        showDashboard();
      } else {
        showLogin();
      }
    } else {
      showLogin();
    }

  } catch (error) {
    console.error("checkSession error:", error);
    showLogin();
  }
}

/* =========================================================
   PROFILE
   ========================================================= */

async function loadCurrentProfile() {
  if (!currentUser) return null;

  const { data, error } = await supabaseClient
    .from("profiles")
    .select("*")
    .eq("id", currentUser.id)
    .maybeSingle();

  if (error) {
    console.error("Profile error:", error);
    currentProfile = null;
    return null;
  }

  currentProfile = data;
  return data;
}

/* =========================================================
   LOGIN PAGE
   ========================================================= */

function showLogin(message = "") {
  document.body.innerHTML = `
    <div id="app">
      <div class="auth-page">
        <div class="auth-card">

          <div class="auth-logo">GV</div>

          <h1>${APP.name}</h1>
          <p class="auth-subtitle">${APP.slogan}</p>

          <h2>ورود به حساب</h2>

          ${
            message
              ? `<div class="error-box">${escapeHTML(message)}</div>`
              : ""
          }

          <form id="loginForm">

            <label>ایمیل</label>
            <input
              id="loginEmail"
              type="email"
              placeholder="ایمیل خود را وارد کنید"
              autocomplete="email"
              required
            >

            <label>رمز عبور</label>
            <input
              id="loginPassword"
              type="password"
              placeholder="رمز عبور"
              autocomplete="current-password"
              required
            >

            <button
              type="submit"
              class="primary-button"
              id="loginButton"
            >
              ورود
            </button>

          </form>

          <button
            class="secondary-button"
            onclick="showRegister()"
          >
            ایجاد حساب جدید
          </button>

          <button
            class="text-button"
            onclick="showForgotPassword()"
          >
            فراموشی رمز عبور
          </button>

        </div>
      </div>
    </div>
  `;

  const form = document.getElementById("loginForm");

  if (form) {
    form.addEventListener("submit", async function(event) {
      event.preventDefault();
      await loginUser();
    });
  }
}

/* =========================================================
   LOGIN
   ========================================================= */

async function loginUser() {
  const emailInput = document.getElementById("loginEmail");
  const passwordInput = document.getElementById("loginPassword");
  const button = document.getElementById("loginButton");

  const email = emailInput?.value.trim();
  const password = passwordInput?.value;

  if (!email || !password) {
    showLogin("لطفاً ایمیل و رمز عبور را وارد کنید.");
    return;
  }

  if (button) {
    button.disabled = true;
    button.textContent = "در حال ورود...";
  }

  try {
    console.log("Trying login...");

    const { data, error } = await supabaseClient.auth.signInWithPassword({
      email: email,
      password: password
    });

    console.log("Login result:", data, error);

    if (error) {
      console.error("Login error:", error);

      showLogin(
        getAuthErrorMessage(error)
      );

      return;
    }

    if (!data || !data.user) {
      showLogin("ورود انجام نشد. لطفاً دوباره تلاش کنید.");
      return;
    }

    currentUser = data.user;

    await loadCurrentProfile();

    if (!currentProfile) {
      showLogin(
        "حساب وارد شد اما اطلاعات پروفایل پیدا نشد. لطفاً با مدیر تماس بگیرید."
      );
      return;
    }

    showDashboard();

  } catch (error) {
    console.error("Unexpected login error:", error);

    showLogin(
      "خطایی هنگام ورود رخ داد. لطفاً دوباره تلاش کنید."
    );

  } finally {
    const btn = document.getElementById("loginButton");

    if (btn) {
      btn.disabled = false;
      btn.textContent = "ورود";
    }
  }
}

/* =========================================================
   REGISTER PAGE
   ========================================================= */

function showRegister(message = "") {
  document.body.innerHTML = `
    <div id="app">
      <div class="auth-page">
        <div class="auth-card">

          <div class="auth-logo">GV</div>

          <h1>${APP.name}</h1>
          <p class="auth-subtitle">${APP.slogan}</p>

          <h2>ثبت‌نام</h2>

          ${
            message
              ? `<div class="error-box">${escapeHTML(message)}</div>`
              : ""
          }

          <form id="registerForm">

            <label>نام کامل</label>
            <input
              id="registerName"
              type="text"
              placeholder="نام و نام خانوادگی"
              required
            >

            <label>شماره تماس</label>
            <input
              id="registerPhone"
              type="tel"
              placeholder="شماره تماس"
              required
            >

            <label>User ID</label>
            <input
              id="registerUserId"
              type="text"
              placeholder="مثلاً GV-1001"
              required
            >

            <label>کد معرف</label>
            <input
              id="registerReferral"
              type="text"
              placeholder="کد معرف"
              required
            >

            <label>ایمیل</label>
            <input
              id="registerEmail"
              type="email"
              placeholder="ایمیل"
              autocomplete="email"
              required
            >

            <label>رمز عبور</label>
            <input
              id="registerPassword"
              type="password"
              placeholder="حداقل 6 کاراکتر"
              autocomplete="new-password"
              required
            >

            <button
              type="submit"
              class="primary-button"
              id="registerButton"
            >
              ثبت‌نام
            </button>

          </form>

          <button
            class="secondary-button"
            onclick="showLogin()"
          >
            بازگشت به ورود
          </button>

        </div>
      </div>
    </div>
  `;

  const form = document.getElementById("registerForm");

  if (form) {
    form.addEventListener("submit", async function(event) {
      event.preventDefault();
      await registerUser();
    });
  }
}

/* =========================================================
   REGISTER
   ========================================================= */

async function registerUser() {
  const name = document.getElementById("registerName")?.value.trim();
  const phone = document.getElementById("registerPhone")?.value.trim();
  const userId = document.getElementById("registerUserId")?.value.trim();
  const referralCode = document.getElementById("registerReferral")?.value.trim();
  const email = document.getElementById("registerEmail")?.value.trim();
  const password = document.getElementById("registerPassword")?.value;

  const button = document.getElementById("registerButton");

  if (!name || !phone || !userId || !referralCode || !email || !password) {
    showRegister("لطفاً تمام بخش‌ها را تکمیل کنید.");
    return;
  }

  if (password.length < 6) {
    showRegister("رمز عبور باید حداقل ۶ کاراکتر باشد.");
    return;
  }

  if (button) {
    button.disabled = true;
    button.textContent = "در حال ثبت‌نام...";
  }

  try {

    /* -----------------------------------------
       Check User ID
       ----------------------------------------- */

    const { data: validCode, error: codeError } =
      await supabaseClient.rpc(
        "check_registration_code",
        {
          p_user_id: userId
        }
      );

    if (codeError) {
      console.error(codeError);
      showRegister("امکان بررسی User ID وجود ندارد.");
      return;
    }

    if (!validCode) {
      showRegister(
        "این User ID معتبر نیست یا قبلاً استفاده شده است."
      );
      return;
    }

    /* -----------------------------------------
       Check Referral
       ----------------------------------------- */

    const {
      data: referrer,
      error: referralError
    } = await supabaseClient
      .from("profiles")
      .select("id, referral_code")
      .eq("referral_code", referralCode)
      .maybeSingle();

    if (referralError) {
      console.error(referralError);
      showRegister("خطا در بررسی کد معرف.");
      return;
    }

    if (!referrer) {
      showRegister("کد معرف معتبر نیست.");
      return;
    }

    /* -----------------------------------------
       Create Auth Account
       ----------------------------------------- */

    const {
      data: authData,
      error: authError
    } = await supabaseClient.auth.signUp({
      email: email,
      password: password
    });

    if (authError) {
      console.error(authError);
      showRegister(getAuthErrorMessage(authError));
      return;
    }

    const newUser = authData?.user;

    if (!newUser) {
      showRegister(
        "حساب ساخته نشد. لطفاً دوباره تلاش کنید."
      );
      return;
    }

    /* -----------------------------------------
       Create referral code
       ----------------------------------------- */

    const generatedReferralCode =
      "GV" +
      Math.random()
        .toString(36)
        .substring(2, 8)
        .toUpperCase();

    /* -----------------------------------------
       Create profile
       ----------------------------------------- */

    const { error: profileError } =
      await supabaseClient
        .from("profiles")
        .insert({
          id: newUser.id,
          user_id: userId,
          full_name: name,
          phone: phone,
          referral_code: generatedReferralCode,
          referred_by: referrer.id,
          wallet_balance: 0,
          role: "member",
          status: "active"
        });

    if (profileError) {
      console.error(profileError);

      showRegister(
        "حساب ایجاد شد اما ساخت پروفایل کامل نشد. لطفاً با مدیر تماس بگیرید."
      );

      return;
    }

    /* -----------------------------------------
       Mark User ID as used
       ----------------------------------------- */

    const { error: updateCodeError } =
      await supabaseClient
        .from("user_registration_codes")
        .update({
          used: true,
          used_by: newUser.id,
          used_at: new Date().toISOString(),
          assigned_to: newUser.id
        })
        .eq("user_id", userId)
        .eq("used", false);

    if (updateCodeError) {
      console.error(updateCodeError);
    }

    /* -----------------------------------------
       Check session
       ----------------------------------------- */

    const {
      data: sessionData
    } = await supabaseClient.auth.getSession();

    if (sessionData?.session) {

      currentUser = sessionData.session.user;

      await loadCurrentProfile();

      showDashboard();

    } else {

      showLogin(
        "ثبت‌نام با موفقیت انجام شد. اگر تأیید ایمیل فعال باشد، ابتدا ایمیل خود را تأیید کنید و سپس وارد شوید."
      );

    }

  } catch (error) {

    console.error("Register error:", error);

    showRegister(
      "خطایی هنگام ثبت‌نام رخ داد."
    );

  } finally {

    const btn =
      document.getElementById("registerButton");

    if (btn) {
      btn.disabled = false;
      btn.textContent = "ثبت‌نام";
    }

  }
}

/* =========================================================
   FORGOT PASSWORD
   ========================================================= */

function showForgotPassword() {

  document.body.innerHTML = `
    <div id="app">
      <div class="auth-page">
        <div class="auth-card">

          <div class="auth-logo">GV</div>

          <h1>فراموشی رمز عبور</h1>

          <p class="auth-subtitle">
            ایمیل حساب خود را وارد کنید
          </p>

          <form id="forgotForm">

            <label>ایمیل</label>

            <input
              id="forgotEmail"
              type="email"
              placeholder="ایمیل"
              required
            >

            <button
              class="primary-button"
              type="submit"
            >
              ارسال لینک بازیابی
            </button>

          </form>

          <button
            class="secondary-button"
            onclick="showLogin()"
          >
            بازگشت
          </button>

        </div>
      </div>
    </div>
  `;

  document
    .getElementById("forgotForm")
    .addEventListener("submit", sendPasswordReset);
}

async function sendPasswordReset(event) {

  event.preventDefault();

  const email =
    document.getElementById("forgotEmail")
      ?.value.trim();

  if (!email) return;

  try {

    const { error } =
      await supabaseClient.auth.resetPasswordForEmail(
        email,
        {
          redirectTo: window.location.origin
        }
      );

    if (error) {
      alert(getAuthErrorMessage(error));
      return;
    }

    alert(
      "لینک بازیابی رمز به ایمیل شما ارسال شد."
    );

  } catch (error) {

    console.error(error);

    alert(
      "خطایی هنگام ارسال ایمیل رخ داد."
    );

  }
}

/* =========================================================
   DASHBOARD
   ========================================================= */

async function showDashboard() {

  if (!currentUser) {

    const {
      data
    } = await supabaseClient.auth.getUser();

    currentUser = data?.user || null;
  }

  if (!currentProfile) {
    await loadCurrentProfile();
  }

  if (!currentProfile) {
    showLogin(
      "اطلاعات حساب پیدا نشد."
    );
    return;
  }

  document.body.innerHTML = `
    <div id="app">

      <header class="top-header">

        <div class="brand">

          <div class="logo">GV</div>

          <div>
            <h1>${APP.name}</h1>
            <span>${APP.slogan}</span>
          </div>

        </div>

      </header>

      <main>

        <section class="welcome-card">

          <h2>
            خوش آمدید، ${escapeHTML(currentProfile.full_name)}
          </h2>

          <p>
            User ID:
            <strong>
              ${escapeHTML(currentProfile.user_id)}
            </strong>
          </p>

        </section>

        <section class="menu-grid">

          <button
            class="menu-card"
            onclick="showUserStructure()"
          >
            <span class="icon">🌳</span>
            <strong>ساختار تیم</strong>
            <small>مشاهده افراد زیرمجموعه</small>
          </button>

          <button
            class="menu-card"
            onclick="showUserBooks()"
          >
            <span class="icon">📚</span>
            <strong>کتاب‌ها</strong>
            <small>کتاب‌های آموزشی</small>
          </button>

          <button
            class="menu-card"
            onclick="showUserWallet()"
          >
            <span class="icon">💰</span>
            <strong>کیف پول</strong>
            <small>موجودی حساب</small>
          </button>

          <button
            class="menu-card"
            onclick="showUserReferral()"
          >
            <span class="icon">🔗</span>
            <strong>کد دعوت</strong>
            <small>دعوت اعضای جدید</small>
          </button>

          <button
            class="menu-card"
            onclick="showUserProfile()"
          >
            <span class="icon">👤</span>
            <strong>پروفایل</strong>
            <small>اطلاعات حساب</small>
          </button>

          ${
            currentProfile.role === "admin"
              ? `
                <button
                  class="menu-card admin-card"
                  onclick="showAdminPanel()"
                >
                  <span class="icon">👑</span>
                  <strong>پنل مدیریت</strong>
                  <small>مدیریت Gold Vision</small>
                </button>
              `
              : ""
          }

        </section>

        <section id="content"></section>

      </main>

    </div>
  `;
}

/* =========================================================
   USER STRUCTURE
   ========================================================= */

async function showUserStructure() {

  const content = document.getElementById("content");

  if (!content) return;

  content.innerHTML = `
    <section class="content-section">

      <h2>🌳 ساختار تیم</h2>

      <p>
        در حال دریافت ساختار...
      </p>

      <div id="structureList"></div>

    </section>
  `;

  const { data, error } =
    await supabaseClient
      .from("profiles")
      .select(
        "id, user_id, full_name, referral_code, referred_by, status, created_at"
      )
      .eq("referred_by", currentUser.id)
      .order("created_at", {
        ascending: true
      });

  if (error) {
    console.error(error);

    content.innerHTML += `
      <div class="error-box">
        دریافت ساختار با خطا مواجه شد.
      </div>
    `;

    return;
  }

  const list =
    document.getElementById("structureList");

  if (!data || data.length === 0) {

    list.innerHTML = `
      <div class="empty-state">
        هنوز عضوی در ساختار مستقیم شما ثبت نشده است.
      </div>
    `;

    return;
  }

  list.innerHTML = data.map(member => `
    <div class="profile-box">

      <strong>
        ${escapeHTML(member.full_name)}
      </strong>

      <p>
        User ID:
        ${escapeHTML(member.user_id)}
      </p>

      <p>
        وضعیت:
        ${escapeHTML(member.status)}
      </p>

    </div>
  `).join("");
}

/* =========================================================
   BOOKS
   ========================================================= */

async function showUserBooks() {

  const content = document.getElementById("content");

  content.innerHTML = `
    <section class="content-section">

      <h2>📚 کتاب‌های Gold Vision</h2>

      <p>در حال دریافت کتاب‌ها...</p>

      <div id="booksList"></div>

    </section>
  `;

  const {
    data,
    error
  } = await supabaseClient
    .from("books")
    .select("*")
    .eq("active", true)
    .order("created_at", {
      ascending: false
    });

  if (error) {

    console.error(error);

    document.getElementById("booksList").innerHTML = `
      <div class="error-box">
        دریافت کتاب‌ها با خطا مواجه شد.
      </div>
    `;

    return;
  }

  if (!data || data.length === 0) {

    document.getElementById("booksList").innerHTML = `
      <div class="empty-state">
        فعلاً کتابی منتشر نشده است.
      </div>
    `;

    return;
  }

  document.getElementById("booksList").innerHTML =
    data.map(book => `

      <div class="profile-box">

        ${
          book.cover_url
            ? `
              <img
                src="${escapeAttribute(book.cover_url)}"
                style="width:100%;border-radius:12px;"
              >
            `
            : ""
        }

        <h3>
          ${escapeHTML(book.title)}
        </h3>

        <p>
          ${escapeHTML(book.description || "")}
        </p>

        <strong>
          ${formatMoney(book.price)}
        </strong>

        ${
          book.pdf_url
            ? `
              <br><br>
              <a
                href="${escapeAttribute(book.pdf_url)}"
                target="_blank"
                rel="noopener"
                class="primary-button"
              >
                مشاهده / دریافت کتاب
              </a>
            `
            : ""
        }

      </div>

    `).join("");
}

/* =========================================================
   WALLET
   ========================================================= */

async function showUserWallet() {

  const content =
    document.getElementById("content");

  const balance =
    Number(currentProfile.wallet_balance || 0);

  content.innerHTML = `

    <section class="content-section">

      <h2>💰 کیف پول</h2>

      <div class="wallet-box">

        <small>موجودی فعلی</small>

        <h1>
          ${formatMoney(balance)}
        </h1>

      </div>

      <div id="transactions">
        در حال دریافت تراکنش‌ها...
      </div>

    </section>

  `;

  const {
    data,
    error
  } = await supabaseClient
    .from("wallet_transactions")
    .select("*")
    .eq("user_id", currentUser.id)
    .order("created_at", {
      ascending: false
    });

  if (error) {

    console.error(error);

    document.getElementById("transactions").innerHTML = `
      <div class="error-box">
        دریافت تراکنش‌ها با خطا مواجه شد.
      </div>
    `;

    return;
  }

  if (!data || data.length === 0) {

    document.getElementById("transactions").innerHTML = `
      <div class="empty-state">
        هنوز تراکنشی ثبت نشده است.
      </div>
    `;

    return;
  }

  document.getElementById("transactions").innerHTML =
    data.map(transaction => `

      <div class="profile-box">

        <strong>
          ${
            transaction.transaction_type === "credit"
              ? "➕ واریز"
              : "➖ برداشت"
          }
        </strong>

        <p>
          مبلغ:
          ${formatMoney(transaction.amount)}
        </p>

        <p>
          ${escapeHTML(transaction.description || "")}
        </p>

        <small>
          ${formatDate(transaction.created_at)}
        </small>

      </div>

    `).join("");
}

/* =========================================================
   REFERRAL
   ========================================================= */

function showUserReferral() {

  const content =
    document.getElementById("content");

  content.innerHTML = `

    <section class="content-section">

      <h2>🔗 کد دعوت</h2>

      <div class="referral-box">

        <p>
          کد دعوت شما:
        </p>

        <h1>
          ${escapeHTML(currentProfile.referral_code)}
        </h1>

        <button
          class="primary-button"
          onclick="copyText('${escapeAttribute(currentProfile.referral_code)}')"
        >
          کپی کد دعوت
        </button>

      </div>

      <div class="profile-box">

        <p>
          User ID شما:
        </p>

        <strong>
          ${escapeHTML(currentProfile.user_id)}
        </strong>

      </div>

    </section>

  `;
}

/* =========================================================
   PROFILE
   ========================================================= */

function showUserProfile() {

  const content =
    document.getElementById("content");

  content.innerHTML = `

    <section class="content-section">

      <h2>👤 پروفایل</h2>

      <div class="profile-box">

        <p>
          <strong>نام:</strong>
          ${escapeHTML(currentProfile.full_name)}
        </p>

        <p>
          <strong>User ID:</strong>
          ${escapeHTML(currentProfile.user_id)}
        </p>

        <p>
          <strong>شماره تماس:</strong>
          ${escapeHTML(currentProfile.phone || "-")}
        </p>

        <p>
          <strong>ایمیل:</strong>
          ${escapeHTML(currentUser.email || "-")}
        </p>

        <p>
          <strong>کد دعوت:</strong>
          ${escapeHTML(currentProfile.referral_code)}
        </p>

        <p>
          <strong>وضعیت:</strong>
          ${escapeHTML(currentProfile.status)}
        </p>

      </div>

      <button
        class="secondary-button"
        onclick="logoutUser()"
      >
        خروج از حساب
      </button>

    </section>

  `;
}

/* =========================================================
   ADMIN
   ========================================================= */

async function checkAdminAccess() {

  if (!currentUser) return false;

  await loadCurrentProfile();

  return (
    currentProfile &&
    currentProfile.role === "admin" &&
    currentProfile.status === "active"
  );
}

async function showAdminPanel() {

  const allowed =
    await checkAdminAccess();

  if (!allowed) {

    alert(
      "دسترسی مدیریت برای این حساب فعال نیست."
    );

    return;
  }

  const content =
    document.getElementById("content");

  content.innerHTML = `

    <section class="content-section">

      <h2>👑 پنل مدیریت</h2>

      <div class="admin-grid">

        <button
          class="admin-card"
          onclick="createNewUserID()"
        >
          🆔
          <strong>ایجاد User ID</strong>
        </button>

        <button
          class="admin-card"
          onclick="adminMembers()"
        >
          👥
          <strong>مدیریت اعضا</strong>
        </button>

        <button
          class="admin-card"
          onclick="adminWallet()"
        >
          💰
          <strong>مدیریت کیف پول</strong>
        </button>

        <button
          class="admin-card"
          onclick="adminBooks()"
        >
          📚
          <strong>مدیریت کتاب‌ها</strong>
        </button>

        <button
          class="admin-card"
          onclick="adminStructure()"
        >
          🌳
          <strong>ساختار تیم</strong>
        </button>

        <button
          class="admin-card"
          onclick="adminSettings()"
        >
          ⚙️
          <strong>تنظیمات اپ</strong>
        </button>

      </div>

    </section>

  `;
}

/* =========================================================
   CREATE USER ID
   ========================================================= */

async function createNewUserID() {

  const allowed =
    await checkAdminAccess();

  if (!allowed) {
    alert("دسترسی غیرمجاز.");
    return;
  }

  try {

    const {
      data,
      error
    } = await supabaseClient.rpc(
      "create_registration_code"
    );

    if (error) {

      console.error(error);

      alert(
        "ایجاد User ID با خطا مواجه شد: " +
        error.message
      );

      return;
    }

    const userID = data;

    const content =
      document.getElementById("content");

    content.innerHTML = `

      <section class="content-section">

        <h2>🆔 User ID جدید</h2>

        <div class="success-box">

          <p>
            User ID جدید با موفقیت ساخته شد:
          </p>

          <div class="new-user-id">
            ${escapeHTML(userID)}
          </div>

          <button
            class="primary-button"
            onclick="copyText('${escapeAttribute(userID)}')"
          >
            کپی User ID
          </button>

        </div>

        <button
          class="secondary-button"
          onclick="showAdminPanel()"
        >
          بازگشت به پنل مدیریت
        </button>

      </section>

    `;

  } catch (error) {

    console.error(error);

    alert(
      "خطایی هنگام ایجاد User ID رخ داد."
    );

  }
}

/* =========================================================
   ADMIN MEMBERS
   ========================================================= */

async function adminMembers() {

  if (!await checkAdminAccess()) {
    alert("دسترسی غیرمجاز.");
    return;
  }

  const content =
    document.getElementById("content");

  content.innerHTML = `
    <section class="content-section">

      <h2>👥 اعضا</h2>

      <div id="adminMembersList">
        در حال دریافت اعضا...
      </div>

    </section>
  `;

  const {
    data,
    error
  } = await supabaseClient
    .from("profiles")
    .select("*")
    .order("created_at", {
      ascending: false
    });

  if (error) {

    console.error(error);

    document.getElementById("adminMembersList").innerHTML = `
      <div class="error-box">
        ${escapeHTML(error.message)}
      </div>
    `;

    return;
  }

  document.getElementById("adminMembersList").innerHTML =
    data.map(member => `

      <div class="profile-box">

        <strong>
          ${escapeHTML(member.full_name)}
        </strong>

        <p>
          User ID:
          ${escapeHTML(member.user_id)}
        </p>

        <p>
          تلفن:
          ${escapeHTML(member.phone || "-")}
        </p>

        <p>
          نقش:
          ${escapeHTML(member.role)}
        </p>

        <p>
          کیف پول:
          ${formatMoney(member.wallet_balance)}
        </p>

      </div>

    `).join("");
}

/* =========================================================
   ADMIN WALLET
   ========================================================= */

function adminWallet() {

  alert(
    "بخش مدیریت کیف پول آماده اتصال به سیستم اعتباردهی امن ادمین است."
  );
}

/* =========================================================
   ADMIN BOOKS
   ========================================================= */

function adminBooks() {

  alert(
    "بخش مدیریت کتاب‌ها در مرحله بعد تکمیل می‌شود."
  );
}

/* =========================================================
   ADMIN STRUCTURE
   ========================================================= */

function adminStructure() {

  alert(
    "بخش ساختار کامل چندسطحی در مرحله بعد تکمیل می‌شود."
  );
}

/* =========================================================
   ADMIN SETTINGS
   ========================================================= */

async function adminSettings() {

  if (!await checkAdminAccess()) {
    alert("دسترسی غیرمجاز.");
    return;
  }

  const content =
    document.getElementById("content");

  content.innerHTML = `

    <section class="content-section">

      <h2>⚙️ تنظیمات اپ</h2>

      <div id="settingsList">
        در حال دریافت تنظیمات...
      </div>

    </section>

  `;

  const {
    data,
    error
  } = await supabaseClient
    .from("app_settings")
    .select("*")
    .order("setting_key");

  if (error) {

    console.error(error);

    document.getElementById("settingsList").innerHTML = `
      <div class="error-box">
        دریافت تنظیمات امکان‌پذیر نیست.
      </div>
    `;

    return;
  }

  document.getElementById("settingsList").innerHTML =
    data.map(setting => `

      <div class="profile-box">

        <strong>
          ${escapeHTML(setting.setting_key)}
        </strong>

        <p>
          ${escapeHTML(setting.setting_value || "")}
        </p>

      </div>

    `).join("");
}

/* =========================================================
   LOGOUT
   ========================================================= */

async function logoutUser() {

  try {

    const {
      error
    } = await supabaseClient.auth.signOut();

    if (error) {
      console.error(error);
    }

  } catch (error) {

    console.error(error);

  } finally {

    currentUser = null;
    currentProfile = null;

    showLogin();

  }
}

/* =========================================================
   COPY
   ========================================================= */

async function copyText(text) {

  try {

    await navigator.clipboard.writeText(text);

    alert("کپی شد.");

  } catch (error) {

    alert(
      "کپی خودکار انجام نشد."
    );

  }
}

/* =========================================================
   ERROR PAGE
   ========================================================= */

function showErrorPage(message) {

  document.body.innerHTML = `

    <div id="app">

      <div class="auth-page">

        <div class="auth-card">

          <div class="auth-logo">GV</div>

          <h1>${APP.name}</h1>

          <div class="error-box">
            ${escapeHTML(message)}
          </div>

          <button
            class="primary-button"
            onclick="location.reload()"
          >
            تلاش دوباره
          </button>

        </div>

      </div>

    </div>

  `;
}

/* =========================================================
   AUTH ERROR MESSAGES
   ========================================================= */

function getAuthErrorMessage(error) {

  const message =
    String(error?.message || "").toLowerCase();

  if (
    message.includes("invalid login credentials")
  ) {
    return "ایمیل یا رمز عبور اشتباه است.";
  }

  if (
    message.includes("email not confirmed")
  ) {
    return "ایمیل شما هنوز تأیید نشده است.";
  }

  if (
    message.includes("user not found")
  ) {
    return "این حساب پیدا نشد.";
  }

  if (
    message.includes("too many requests")
  ) {
    return "تعداد تلاش‌ها زیاد است. کمی بعد دوباره امتحان کنید.";
  }

  if (
    message.includes("password")
  ) {
    return "رمز عبور واردشده صحیح نیست.";
  }

  return error?.message ||
    "ورود انجام نشد. لطفاً دوباره تلاش کنید.";
}

/* =========================================================
   HELPERS
   ========================================================= */

function formatMoney(amount) {

  const number =
    Number(amount || 0);

  return (
    number.toLocaleString("en-US") +
    " " +
    APP.currency
  );
}

function formatDate(date) {

  if (!date) return "-";

  try {

    return new Date(date)
      .toLocaleString("fa-AF");

  } catch (error) {

    return date;

  }
}

function escapeHTML(value) {

  if (value === null || value === undefined) {
    return "";
  }

  return String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

function escapeAttribute(value) {
  return escapeHTML(value);
}

/* =========================================================
   AUTH STATE LISTENER
   ========================================================= */

if (window.supabaseClient) {

  supabaseClient.auth.onAuthStateChange(
    async (event, session) => {

      console.log(
        "Auth event:",
        event
      );

      if (
        event === "SIGNED_OUT"
      ) {

        currentUser = null;
        currentProfile = null;

        showLogin();

      }

    }
  );

}
