 const contentSection = document.getElementById("content-section");


// ==========================================
// AUTH STATE
// ==========================================

async function checkSession() {

  const {
    data: { session }
  } = await supabaseClient.auth.getSession();

  if (session) {
    await showDashboard(session.user);
  } else {
    showLogin();
  }
}


// ==========================================
// LOGIN PAGE
// ==========================================

function showLogin() {

  document.body.innerHTML = `

    <div id="auth-app">

      <div class="auth-card">

        <div class="auth-logo">
          GV
        </div>

        <h1>Gold Vision</h1>

        <p class="auth-subtitle">
          ورود به حساب کاربری
        </p>


        <form id="login-form">

          <label>
            ایمیل
          </label>

          <input
            id="login-email"
            type="email"
            placeholder="ایمیل خود را وارد کنید"
            required
          />


          <label>
            رمز عبور
          </label>

          <input
            id="login-password"
            type="password"
            placeholder="رمز عبور"
            required
          />


          <button type="submit">
            ورود
          </button>

        </form>


        <p id="login-message"></p>


        <button
          class="switch-auth"
          onclick="showRegister()"
        >
          حساب ندارید؟ ثبت‌نام کنید
        </button>

      </div>

    </div>
  `;


  document
    .getElementById("login-form")
    .addEventListener("submit", loginUser);
}


// ==========================================
// REGISTER PAGE
// ==========================================

function showRegister() {

  document.body.innerHTML = `

    <div id="auth-app">

      <div class="auth-card">

        <div class="auth-logo">
          GV
        </div>

        <h1>Gold Vision</h1>

        <p class="auth-subtitle">
          ساخت حساب جدید
        </p>


        <form id="register-form">

          <label>
            نام کامل
          </label>

          <input
            id="register-name"
            type="text"
            placeholder="نام و نام خانوادگی"
            required
          />


          <label>
            شماره تلفن
          </label>

          <input
            id="register-phone"
            type="tel"
            placeholder="شماره تلفن"
            required
          />


          <label>
            User ID
          </label>

          <input
            id="register-user-id"
            type="text"
            placeholder="شناسه کاربری"
            required
          />


          <label>
            کد معرف
          </label>

          <input
            id="register-referral"
            type="text"
            placeholder="کد معرف"
            required
          />


          <label>
            ایمیل
          </label>

          <input
            id="register-email"
            type="email"
            placeholder="ایمیل"
            required
          />


          <label>
            رمز عبور
          </label>

          <input
            id="register-password"
            type="password"
            placeholder="حداقل ۶ کاراکتر"
            minlength="6"
            required
          />


          <button type="submit">
            ثبت‌نام
          </button>

        </form>


        <p id="register-message"></p>


        <button
          class="switch-auth"
          onclick="showLogin()"
        >
          قبلاً حساب دارید؟ ورود
        </button>

      </div>

    </div>
  `;


  document
    .getElementById("register-form")
    .addEventListener("submit", registerUser);
}


// ==========================================
// REGISTER USER
// ==========================================

async function registerUser(event) {

  event.preventDefault();


  const name =
    document.getElementById("register-name").value.trim();

  const phone =
    document.getElementById("register-phone").value.trim();

  const userId =
    document.getElementById("register-user-id").value.trim();

  const referral =
    document.getElementById("register-referral").value.trim();

  const email =
    document.getElementById("register-email").value.trim();

  const password =
    document.getElementById("register-password").value;


  const message =
    document.getElementById("register-message");


  message.textContent = "در حال ثبت‌نام...";


  try {

    const {
      data,
      error
    } = await supabaseClient.auth.signUp({

      email: email,

      password: password,

      options: {

        data: {
          full_name: name,
          phone: phone,
          user_id: userId,
          referral_code: referral
        }

      }

    });


    if (error) {
      throw error;
    }


    if (!data.user) {
      throw new Error(
        "ثبت‌نام انجام نشد."
      );
    }


    message.textContent =
      "ثبت‌نام انجام شد. در حال ورود...";


    const user = data.user;


    // ایجاد پروفایل
    const {
      error: profileError
    } = await supabaseClient
      .from("profiles")
      .insert({

        id: user.id,

        user_id: userId,

        full_name: name,

        phone: phone,

        referral_code: referral

      });


    if (profileError) {
      throw profileError;
    }


    await showDashboard(user);


  } catch (error) {

    console.error(error);

    message.textContent =
      error.message ||
      "خطایی در ثبت‌نام رخ داد.";

  }
}


// ==========================================
// LOGIN USER
// ==========================================

async function loginUser(event) {

  event.preventDefault();


  const email =
    document.getElementById("login-email").value.trim();

  const password =
    document.getElementById("login-password").value;


  const message =
    document.getElementById("login-message");


  message.textContent =
    "در حال ورود...";


  const {
    data,
    error
  } = await supabaseClient.auth.signInWithPassword({

    email: email,

    password: password

  });


  if (error) {

    message.textContent =
      error.message;

    return;
  }


  await showDashboard(data.user);
}


// ==========================================
// DASHBOARD
// ==========================================

async function showDashboard(user) {

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
            خوش آمدید 👋
          </h2>

          <p>
            حساب شما با موفقیت وارد شد.
          </p>

        </section>


        <section class="menu-grid">

          <button
            class="menu-card"
            onclick="showSection('structure')"
          >
            <span class="icon">👥</span>
            <strong>ساختار من</strong>
            <small>مشاهده زیرمجموعه</small>
          </button>


          <button
            class="menu-card"
            onclick="showSection('books')"
          >
            <span class="icon">📚</span>
            <strong>کتاب‌ها</strong>
            <small>تهیه و مطالعه کتاب</small>
          </button>


          <button
            class="menu-card"
            onclick="showSection('wallet')"
          >
            <span class="icon">💰</span>
            <strong>کیف پول</strong>
            <small>مشاهده موجودی</small>
          </button>


          <button
            class="menu-card"
            onclick="showSection('referral')"
          >
            <span class="icon">🔗</span>
            <strong>کد معرف</strong>
            <small>کد اختصاصی من</small>
          </button>


          <button
            class="menu-card"
            onclick="showSection('profile')"
          >
            <span class="icon">👤</span>
            <strong>حساب من</strong>
            <small>اطلاعات حساب</small>
          </button>

        </section>


        <section
          id="content-section"
          class="content-section"
        >

          <div class="empty-state">

            <span>✨</span>

            <h3>
              Gold Vision
            </h3>

            <p>
              به پنل خود خوش آمدید.
            </p>

          </div>

        </section>

      </main>


      <nav class="bottom-nav">

        <button onclick="showSection('home')">
          <span>🏠</span>
          <small>خانه</small>
        </button>

        <button onclick="showSection('structure')">
          <span>👥</span>
          <small>ساختار</small>
        </button>

        <button onclick="showSection('books')">
          <span>📚</span>
          <small>کتاب</small>
        </button>

        <button onclick="showSection('wallet')">
          <span>💰</span>
          <small>کیف پول</small>
        </button>

        <button onclick="showSection('profile')">
          <span>👤</span>
          <small>حساب</small>
        </button>

      </nav>

    </div>

  `;


  showSection("home");
}


// ==========================================
// SECTIONS
// ==========================================

async function showSection(section) {

  const content =
    document.getElementById("content-section");

  if (!content) return;


  if (section === "home") {

    content.innerHTML = `

      <div class="empty-state">

        <span>✨</span>

        <h3>
          Gold Vision
        </h3>

        <p>
          به مسیر رشد و پیشرفت خود ادامه دهید.
        </p>

      </div>

    `;

    return;
  }


  if (section === "profile") {

    const {
      data: { user }
    } = await supabaseClient.auth.getUser();


    const {
      data: profile
    } = await supabaseClient
      .from("profiles")
      .select("*")
      .eq("id", user.id)
      .single();


    content.innerHTML = `

      <h3>👤 حساب من</h3>

      <div style="
        margin-top:18px;
        display:flex;
        flex-direction:column;
        gap:10px;
      ">

        <div style="
          padding:15px;
          background:#f5f8fc;
          border-radius:14px;
        ">
          <small>نام</small>

          <strong style="
            display:block;
            margin-top:5px;
          ">
            ${profile?.full_name || "-"}
          </strong>
        </div>


        <div style="
          padding:15px;
          background:#f5f8fc;
          border-radius:14px;
        ">
          <small>User ID</small>

          <strong style="
            display:block;
            margin-top:5px;
          ">
            ${profile?.user_id || "-"}
          </strong>
        </div>


        <button
          onclick="logoutUser()"
          style="
            margin-top:10px;
            padding:14px;
            border:0;
            border-radius:12px;
            background:#0d47a1;
            color:white;
            font-weight:700;
          "
        >
          خروج از حساب
        </button>

      </div>

    `;

    return;
  }


  if (section === "wallet") {

    const {
      data: { user }
    } = await supabaseClient.auth.getUser();


    const {
      data: profile
    } = await supabaseClient
      .from("profiles")
      .select("wallet_balance")
      .eq("id", user.id)
      .single();


    const balance =
      profile?.wallet_balance || 0;


    content.innerHTML = `

      <h3>💰 کیف پول</h3>

      <div style="
        margin-top:18px;
        padding:25px;
        border-radius:18px;
        background:linear-gradient(
          135deg,
          #0d47a1,
          #1976d2
        );
        color:white;
        text-align:center;
      ">

        <small>
          موجودی کیف پول
        </small>

        <div style="
          font-size:30px;
          font-weight:800;
          margin-top:8px;
        ">
          ${balance} AFN
        </div>

      </div>

      <p style="
        color:#718096;
        font-size:12px;
        margin-top:12px;
      ">
        موجودی توسط مدیریت حساب ثبت و به‌روزرسانی می‌شود.
      </p>

    `;

    return;
  }


  if (section === "referral") {

    const {
      data: { user }
    } = await supabaseClient.auth.getUser();


    const {
      data: profile
    } = await supabaseClient
      .from("profiles")
      .select("referral_code")
      .eq("id", user.id)
      .single();


    const code =
      profile?.referral_code || "-";


    content.innerHTML = `

      <h3>
        🔗 کد معرف من
      </h3>

      <div style="
        margin-top:18px;
        padding:22px;
        border:1px solid #e6ebf2;
        border-radius:18px;
        text-align:center;
      ">

        <small>
          کد معرف شما
        </small>

        <div style="
          margin-top:10px;
          font-size:25px;
          font-weight:800;
          color:#0d47a1;
        ">
          ${code}
        </div>

        <button
          onclick="copyReferralCode('${code}')"
          style="
            margin-top:15px;
            padding:12px 20px;
            border:0;
            border-radius:12px;
            background:#0d47a1;
            color:white;
            font-weight:700;
          "
        >
          کپی کد
        </button>

      </div>

    `;

    return;
  }


  if (section === "books") {

    const {
      data: books
    } = await supabaseClient
      .from("books")
      .select("*")
      .eq("active", true)
      .order("created_at", {
        ascending: false
      });


    if (!books || books.length === 0) {

      content.innerHTML = `

        <div class="empty-state">

          <span>📚</span>

          <h3>
            هنوز کتابی اضافه نشده است
          </h3>

          <p>
            کتاب‌های Gold Vision بعداً از پنل مدیریت اضافه می‌شوند.
          </p>

        </div>

      `;

      return;
    }


    content.innerHTML = `

      <h3>
        📚 کتاب‌ها
      </h3>

      <div style="
        margin-top:18px;
        display:flex;
        flex-direction:column;
        gap:12px;
      ">

        ${books.map(book => `

          <div style="
            padding:18px;
            border:1px solid #e6ebf2;
            border-radius:16px;
          ">

            <strong>
              ${book.title}
            </strong>

            <p style="
              color:#718096;
              margin-top:8px;
              font-size:13px;
            ">
              ${book.description || ""}
            </p>

            <div style="
              margin-top:12px;
              font-weight:800;
              color:#0d47a1;
            ">
              ${book.price} AFN
            </div>

          </div>

        `).join("")}

      </div>

    `;

    return;
  }


  if (section === "structure") {

    content.innerHTML = `

      <div class="empty-state">

        <span>👥</span>

        <h3>
          ساختار من
        </h3>

        <p>
          سیستم ساختار چندسطحی در مرحله بعدی فعال می‌شود.
        </p>

      </div>

    `;

  }

}


// ==========================================
// COPY REFERRAL
// ==========================================

async function copyReferralCode(code) {

  try {

    await navigator.clipboard.writeText(code);

    alert("کد معرف کپی شد.");

  } catch {

    alert("کپی کد انجام نشد.");

  }

}


// ==========================================
// LOGOUT
// ==========================================

async function logoutUser() {

  await supabaseClient.auth.signOut();

  showLogin();

}


// ==========================================
// START
// ==========================================

checkSession();
