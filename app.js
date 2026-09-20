// ==========================================
// GOLD VISION APP
// Main Application
// ==========================================


// ==========================================
// START
// ==========================================

document.addEventListener("DOMContentLoaded", () => {
  checkSession();
});


// ==========================================
// SESSION
// ==========================================

async function checkSession() {
  try {
    console.log("Gold Vision: checking session...");

    const result = await supabaseClient.auth.getSession();

    console.log("Gold Vision: session result:", result);

    if (result.error) {
      console.error("Supabase session error:", result.error);
      showLogin();
      return;
    }

    const session = result.data?.session;

    if (session && session.user) {
      console.log("User session found");
      await showDashboard();
    } else {
      console.log("No user session");
      showLogin();
    }

  } catch (error) {
    console.error("checkSession error:", error);
    showLogin();
  }
}


// ==========================================
// LOGIN PAGE
// ==========================================

function showLogin() {

  document.body.innerHTML = `
    <div class="auth-page">

      <div class="auth-card">

        <div class="auth-logo">
          GV
        </div>

        <h1>Gold Vision</h1>

        <p class="auth-subtitle">
          مسیر رشد و پیشرفت
        </p>

        <form onsubmit="loginUser(event)">

          <input
            id="login-email"
            type="email"
            placeholder="ایمیل"
            required
          />

          <input
            id="login-password"
            type="password"
            placeholder="رمز عبور"
            required
          />

          <button type="submit" class="primary-button">
            ورود
          </button>

        </form>

        <button
          class="switch-auth"
          onclick="showRegister()"
        >
          حساب ندارید؟ ثبت‌نام کنید
        </button>

      </div>

    </div>
  `;
}


// ==========================================
// REGISTER PAGE
// ==========================================

function showRegister() {

  document.body.innerHTML = `
    <div class="auth-page">

      <div class="auth-card">

        <div class="auth-logo">
          GV
        </div>

        <h1>ثبت‌نام</h1>

        <p class="auth-subtitle">
          عضویت در Gold Vision
        </p>

        <form onsubmit="registerUser(event)">

          <input
            id="register-name"
            type="text"
            placeholder="نام کامل"
            required
          />

          <input
            id="register-phone"
            type="tel"
            placeholder="شماره تلفن"
            required
          />

          <input
            id="register-user-id"
            type="text"
            placeholder="User ID"
            required
          />

          <input
            id="register-referral"
            type="text"
            placeholder="کد معرف"
            required
          />

          <input
            id="register-email"
            type="email"
            placeholder="ایمیل"
            required
          />

          <input
            id="register-password"
            type="password"
            placeholder="رمز عبور"
            minlength="6"
            required
          />

          <button type="submit" class="primary-button">
            ثبت‌نام
          </button>

        </form>

        <button
          class="switch-auth"
          onclick="showLogin()"
        >
          حساب دارید؟ وارد شوید
        </button>

      </div>

    </div>
  `;
}


// ==========================================
// REGISTER USER
// ==========================================

async function registerUser(event) {

  event.preventDefault();

  const fullName =
    document.getElementById("register-name").value.trim();

  const phone =
    document.getElementById("register-phone").value.trim();

  const userId =
    document.getElementById("register-user-id").value.trim();

  const referralCode =
    document.getElementById("register-referral").value.trim();

  const email =
    document.getElementById("register-email").value.trim();

  const password =
    document.getElementById("register-password").value;


  if (!fullName || !phone || !userId ||
      !referralCode || !email || !password) {

    alert("لطفاً تمام اطلاعات را وارد کنید.");
    return;
  }


  // ------------------------------------------
  // Check User ID
  // ------------------------------------------

  const {
    data: codeValid,
    error: codeError
  } = await supabaseClient.rpc(
    "check_registration_code",
    {
      p_user_id: userId
    }
  );


  if (codeError) {

    alert(
      "خطا در بررسی User ID:\n" +
      codeError.message
    );

    return;
  }


  if (!codeValid) {

    alert(
      "این User ID معتبر نیست یا قبلاً استفاده شده است."
    );

    return;
  }


  // ------------------------------------------
  // Find Referral
  // ------------------------------------------

  const {
    data: referrer,
    error: referrerError
  } = await supabaseClient
    .from("profiles")
    .select("id")
    .eq("referral_code", referralCode)
    .maybeSingle();


  if (referrerError) {

    alert(
      "خطا در بررسی کد معرف:\n" +
      referrerError.message
    );

    return;
  }


  if (!referrer) {

    alert(
      "کد معرف پیدا نشد."
    );

    return;
  }


  // ------------------------------------------
  // Create Auth Account
  // ------------------------------------------

  const {
    data,
    error
  } = await supabaseClient.auth.signUp({

    email: email,

    password: password,

    options: {

      data: {
        full_name: fullName,
        phone: phone,
        user_id: userId
      }

    }

  });


  if (error) {

    alert(
      "خطا در ثبت‌نام:\n" +
      error.message
    );

    return;
  }


  if (!data.user) {

    alert(
      "ثبت‌نام انجام نشد."
    );

    return;
  }


  // ------------------------------------------
  // Create Profile
  // ------------------------------------------

  const generatedReferral =
    "GV" +
    Math.random()
      .toString(36)
      .substring(2, 8)
      .toUpperCase();


  const {
    error: profileError
  } = await supabaseClient
    .from("profiles")
    .insert({

      id: data.user.id,

      user_id: userId,

      full_name: fullName,

      phone: phone,

      referral_code: generatedReferral,

      referred_by: referrer.id,

      wallet_balance: 0,

      role: "member",

      status: "active"

    });


  if (profileError) {

    alert(
      "حساب ساخته شد اما پروفایل ایجاد نشد:\n" +
      profileError.message
    );

    return;
  }


  // ------------------------------------------
  // Mark User ID as assigned
  // ------------------------------------------

  const {
    error: codeUpdateError
  } = await supabaseClient
    .from("user_registration_codes")
    .update({

      used: true,

      used_by: data.user.id,

      used_at: new Date().toISOString(),

      assigned_to: data.user.id

    })
    .eq("user_id", userId);


  if (codeUpdateError) {

    console.error(
      "User ID assignment error:",
      codeUpdateError
    );

  }


  alert(
    "ثبت‌نام با موفقیت انجام شد ✅"
  );


  await showDashboard();
}


// ==========================================
// LOGIN
// ==========================================

async function loginUser(event) {

  event.preventDefault();


  const email =
    document.getElementById("login-email").value.trim();

  const password =
    document.getElementById("login-password").value;


  const {
    data,
    error
  } = await supabaseClient.auth.signInWithPassword({

    email: email,

    password: password

  });


  if (error) {

    alert(
      "ایمیل یا رمز عبور نادرست است."
    );

    console.error(error);

    return;
  }


  if (data.session) {

    await showDashboard();

  }

}


// ==========================================
// DASHBOARD
// ==========================================

async function showDashboard() {

  const {
    data: { user },
    error
  } = await supabaseClient.auth.getUser();


  if (error || !user) {

    showLogin();

    return;
  }


  const {
    data: profile,
    error: profileError
  } = await supabaseClient
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .single();


  if (profileError || !profile) {

    alert(
      "اطلاعات حساب پیدا نشد."
    );

    return;
  }


  document.body.innerHTML = `

    <div id="app">

      <header class="top-header">

        <div class="brand">

          <div class="logo">
            GV
          </div>

          <div>

            <h1>
              Gold Vision
            </h1>

            <span>
              مسیر رشد و پیشرفت
            </span>

          </div>

        </div>

      </header>


      <main>

        <section class="welcome-card">

          <h2>
            سلام ${escapeHTML(profile.full_name)} 👋
          </h2>

          <p>
            به خانواده گولد ویژن خوش آمدید.
          </p>

        </section>


        <section class="menu-grid">

          <button
            class="menu-card"
            onclick="showSection('structure')"
          >

            <span class="icon">
              👥
            </span>

            <strong>
              ساختار من
            </strong>

            <small>
              مشاهده زیرمجموعه
            </small>

          </button>


          <button
            class="menu-card"
            onclick="showSection('books')"
          >

            <span class="icon">
              📚
            </span>

            <strong>
              کتاب‌ها
            </strong>

            <small>
              تهیه و مطالعه کتاب
            </small>

          </button>


          <button
            class="menu-card"
            onclick="showSection('wallet')"
          >

            <span class="icon">
              💰
            </span>

            <strong>
              کیف پول
            </strong>

            <small>
              موجودی حساب
            </small>

          </button>


          <button
            class="menu-card"
            onclick="showSection('referral')"
          >

            <span class="icon">
              🔗
            </span>

            <strong>
              کد معرف
            </strong>

            <small>
              کد اختصاصی من
            </small>

          </button>


          <button
            class="menu-card"
            onclick="showSection('profile')"
          >

            <span class="icon">
              👤
            </span>

            <strong>
              حساب من
            </strong>

            <small>
              اطلاعات حساب
            </small>

          </button>


          ${
            profile.role === "admin"
              ? `
                <button
                  class="menu-card admin-menu-card"
                  onclick="showAdminPanel()"
                >

                  <span class="icon">
                    👑
                  </span>

                  <strong>
                    پنل مدیریت
                  </strong>

                  <small>
                    مدیریت Gold Vision
                  </small>

                </button>
              `
              : ""
          }

        </section>


        <section
          id="content-section"
          class="content-section"
        >

          <div class="empty-state">

            <span>
              ✨
            </span>

            <h3>
              Gold Vision
            </h3>

            <p>
              یکی از بخش‌های بالا را انتخاب کنید.
            </p>

          </div>

        </section>

      </main>


      <nav class="bottom-nav">

        <button onclick="showDashboard()">

          <span>🏠</span>

          <small>
            خانه
          </small>

        </button>


        <button onclick="showSection('structure')">

          <span>👥</span>

          <small>
            ساختار
          </small>

        </button>


        <button onclick="showSection('books')">

          <span>📚</span>

          <small>
            کتاب
          </small>

        </button>


        <button onclick="showSection('wallet')">

          <span>💰</span>

          <small>
            کیف پول
          </small>

        </button>


        <button onclick="showSection('profile')">

          <span>👤</span>

          <small>
            حساب
          </small>

        </button>

      </nav>

    </div>

  `;
}


// ==========================================
// USER SECTIONS
// ==========================================

async function showSection(section) {

  const content =
    document.getElementById("content-section");


  if (!content) return;


  if (section === "structure") {

    await showUserStructure();

    return;

  }


  if (section === "books") {

    await showUserBooks();

    return;

  }


  if (section === "wallet") {

    await showUserWallet();

    return;

  }


  if (section === "referral") {

    await showUserReferral();

    return;

  }


  if (section === "profile") {

    await showUserProfile();

    return;

  }


  if (section === "home") {

    await showDashboard();

    return;

  }

}


// ==========================================
// USER STRUCTURE
// ==========================================

async function showUserStructure() {

  const content =
    document.getElementById("content-section");


  content.innerHTML = `

    <div class="empty-state">

      <span>
        👥
      </span>

      <h3>
        ساختار من
      </h3>

      <p>
        سیستم ساختار تیم در مرحله بعد تکمیل می‌شود.
      </p>

    </div>

  `;
}


// ==========================================
// USER BOOKS
// ==========================================

async function showUserBooks() {

  const content =
    document.getElementById("content-section");


  const {
    data: books,
    error
  } = await supabaseClient
    .from("books")
    .select("*")
    .eq("active", true)
    .order("created_at", {
      ascending: false
    });


  if (error) {

    content.innerHTML = `
      <div class="empty-state">
        <span>⚠️</span>
        <h3>خطا</h3>
        <p>${escapeHTML(error.message)}</p>
      </div>
    `;

    return;
  }


  if (!books || books.length === 0) {

    content.innerHTML = `

      <div class="empty-state">

        <span>
          📚
        </span>

        <h3>
          کتابی موجود نیست
        </h3>

        <p>
          به‌زودی کتاب‌های Gold Vision اضافه می‌شوند.
        </p>

      </div>

    `;

    return;
  }


  content.innerHTML = `

    <h3>
      📚 کتاب‌های Gold Vision
    </h3>

    <div class="books-list">

      ${books.map(book => `

        <div class="book-card">

          ${
            book.cover_url
              ? `
                <img
                  src="${escapeAttribute(book.cover_url)}"
                  alt=""
                />
              `
              : ""
          }

          <h4>
            ${escapeHTML(book.title)}
          </h4>

          <p>
            ${escapeHTML(book.description || "")}
          </p>

          <strong>
            ${book.price} AFN
          </strong>

        </div>

      `).join("")}

    </div>

  `;
}


// ==========================================
// USER WALLET
// ==========================================

async function showUserWallet() {

  const content =
    document.getElementById("content-section");


  const {
    data: { user }
  } = await supabaseClient.auth.getUser();


  if (!user) {

    showLogin();

    return;
  }


  const {
    data: profile,
    error
  } = await supabaseClient
    .from("profiles")
    .select("wallet_balance")
    .eq("id", user.id)
    .single();


  if (error) {

    content.innerHTML = `
      <div class="empty-state">
        <span>⚠️</span>
        <h3>خطا</h3>
        <p>${escapeHTML(error.message)}</p>
      </div>
    `;

    return;
  }


  content.innerHTML = `

    <div class="wallet-box">

      <span>
        💰
      </span>

      <h3>
        موجودی کیف پول
      </h3>

      <div class="wallet-balance">
        ${profile.wallet_balance || 0} AFN
      </div>

      <p>
        افزایش موجودی توسط مدیریت انجام می‌شود.
      </p>

    </div>

  `;
}


// ==========================================
// REFERRAL
// ==========================================

async function showUserReferral() {

  const content =
    document.getElementById("content-section");


  const {
    data: { user }
  } = await supabaseClient.auth.getUser();


  const {
    data: profile,
    error
  } = await supabaseClient
    .from("profiles")
    .select("referral_code,user_id")
    .eq("id", user.id)
    .single();


  if (error) {

    content.innerHTML = `
      <div class="empty-state">
        <span>⚠️</span>
        <h3>خطا</h3>
        <p>${escapeHTML(error.message)}</p>
      </div>
    `;

    return;
  }


  content.innerHTML = `

    <div class="referral-box">

      <span>
        🔗
      </span>

      <h3>
        کد معرف من
      </h3>

      <div class="referral-code">
        ${escapeHTML(profile.referral_code)}
      </div>

      <button
        class="primary-button"
        onclick="copyText('${escapeAttribute(profile.referral_code)}')"
      >
        📋 کپی کد
      </button>

      <p>
        User ID: ${escapeHTML(profile.user_id)}
      </p>

    </div>

  `;
}


// ==========================================
// PROFILE
// ==========================================

async function showUserProfile() {

  const content =
    document.getElementById("content-section");


  const {
    data: { user }
  } = await supabaseClient.auth.getUser();


  const {
    data: profile,
    error
  } = await supabaseClient
    .from("profiles")
    .select("full_name,phone,user_id,referral_code,role,status")
    .eq("id", user.id)
    .single();


  if (error) {

    content.innerHTML = `
      <div class="empty-state">
        <span>⚠️</span>
        <h3>خطا</h3>
        <p>${escapeHTML(error.message)}</p>
      </div>
    `;

    return;
  }


  content.innerHTML = `

    <div class="profile-box">

      <span>
        👤
      </span>

      <h3>
        حساب من
      </h3>

      <div class="profile-row">
        <span>نام</span>
        <strong>
          ${escapeHTML(profile.full_name)}
        </strong>
      </div>

      <div class="profile-row">
        <span>شماره</span>
        <strong>
          ${escapeHTML(profile.phone || "-")}
        </strong>
      </div>

      <div class="profile-row">
        <span>User ID</span>
        <strong>
          ${escapeHTML(profile.user_id)}
        </strong>
      </div>

      <div class="profile-row">
        <span>کد معرف</span>
        <strong>
          ${escapeHTML(profile.referral_code)}
        </strong>
      </div>

      <div class="profile-row">
        <span>وضعیت</span>
        <strong>
          ${escapeHTML(profile.status)}
        </strong>
      </div>

      <button
        class="secondary-button"
        onclick="logoutUser()"
      >
        خروج از حساب
      </button>

    </div>

  `;
}


// ==========================================
// ADMIN ACCESS
// ==========================================

async function checkAdminAccess() {

  const {
    data: { user },
    error
  } = await supabaseClient.auth.getUser();


  if (error || !user) {

    return null;

  }


  const {
    data: profile,
    error: profileError
  } = await supabaseClient
    .from("profiles")
    .select("role,status,full_name,user_id")
    .eq("id", user.id)
    .single();


  if (
    profileError ||
    !profile ||
    profile.role !== "admin" ||
    profile.status !== "active"
  ) {

    return null;

  }


  return profile;
}


// ==========================================
// ADMIN PANEL
// ==========================================

async function showAdminPanel() {

  const admin =
    await checkAdminAccess();


  if (!admin) {

    alert("دسترسی غیرمجاز");

    return;

  }


  const content =
    document.getElementById("content-section");


  if (!content) return;


  content.innerHTML = `

    <div class="admin-panel">

      <div class="admin-header">

        <span class="admin-icon">
          👑
        </span>

        <div>

          <h2>
            پنل مدیریت
          </h2>

          <p>
            ${escapeHTML(admin.full_name)}
          </p>

        </div>

      </div>


      <div class="admin-grid">


        <button
          class="admin-card"
          onclick="createNewUserID()"
        >

          <span>
            🔑
          </span>

          <strong>
            ایجاد User ID
          </strong>

          <small>
            ساخت شناسه جدید
          </small>

        </button>


        <button
          class="admin-card"
          onclick="showAdminMembers()"
        >

          <span>
            👥
          </span>

          <strong>
            مدیریت اعضا
          </strong>

          <small>
            مشاهده اعضا
          </small>

        </button>


        <button
          class="admin-card"
          onclick="showAdminWallet()"
        >

          <span>
            💰
          </span>

          <strong>
            مدیریت کیف پول
          </strong>

          <small>
            مدیریت موجودی
          </small>

        </button>


        <button
          class="admin-card"
          onclick="showAdminBooks()"
        >

          <span>
            📚
          </span>

          <strong>
            مدیریت کتاب‌ها
          </strong>

          <small>
            کتاب و قیمت
          </small>

        </button>


        <button
          class="admin-card"
          onclick="showAdminStructure()"
        >

          <span>
            🌳
          </span>

          <strong>
            ساختار تیم
          </strong>

          <small>
            مشاهده ساختار
          </small>

        </button>


        <button
          class="admin-card"
          onclick="showAdminSettings()"
        >

          <span>
            ⚙️
          </span>

          <strong>
            تنظیمات اپ
          </strong>

          <small>
            مدیریت ظاهر و متن
          </small>

        </button>


      </div>


      <button
        class="secondary-button"
        onclick="showDashboard()"
      >
        🏠 برگشت به خانه
      </button>


    </div>

  `;
}


// ==========================================
// CREATE USER ID
// ==========================================

async function createNewUserID() {

  const admin =
    await checkAdminAccess();


  if (!admin) {

    alert("دسترسی غیرمجاز");

    return;

  }


  const {
    data,
    error
  } = await supabaseClient.rpc(
    "create_registration_code"
  );


  if (error) {

    alert(
      "خطا در ایجاد User ID:\n" +
      error.message
    );

    console.error(error);

    return;

  }


  const newUserID = data;


  const content =
    document.getElementById("content-section");


  content.innerHTML = `

    <div class="success-box">

      <div class="success-icon">
        ✅
      </div>

      <h2>
        User ID ساخته شد
      </h2>

      <div class="new-user-id">
        ${escapeHTML(newUserID)}
      </div>

      <button
        class="primary-button"
        onclick="copyText('${escapeAttribute(newUserID)}')"
      >
        📋 کپی User ID
      </button>


      <button
        class="secondary-button"
        onclick="showAdminPanel()"
      >
        برگشت به پنل مدیریت
      </button>

    </div>

  `;
}


// ==========================================
// ADMIN MEMBERS
// ==========================================

function showAdminMembers() {

  alert(
    "مدیریت اعضا در مرحله بعد فعال می‌شود."
  );

}


// ==========================================
// ADMIN WALLET
// ==========================================

function showAdminWallet() {

  alert(
    "مدیریت کیف پول در مرحله بعد فعال می‌شود."
  );

}


// ==========================================
// ADMIN BOOKS
// ==========================================

function showAdminBooks() {

  alert(
    "مدیریت کتاب‌ها در مرحله بعد فعال می‌شود."
  );

}


// ==========================================
// ADMIN STRUCTURE
// ==========================================

function showAdminStructure() {

  alert(
    "مدیریت ساختار تیم در مرحله بعد فعال می‌شود."
  );

}


// ==========================================
// ADMIN SETTINGS
// ==========================================

function showAdminSettings() {

  alert(
    "تنظیمات اپ در مرحله بعد فعال می‌شود."
  );

}


// ==========================================
// LOGOUT
// ==========================================

async function logoutUser() {

  const {
    error
  } = await supabaseClient.auth.signOut();


  if (error) {

    alert(
      "خطا در خروج از حساب."
    );

    return;

  }


  showLogin();
}


// ==========================================
// SAFE HTML
// ==========================================

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


// ==========================================
// SAFE ATTRIBUTE
// ==========================================

function escapeAttribute(value) {

  return escapeHTML(value);

}
