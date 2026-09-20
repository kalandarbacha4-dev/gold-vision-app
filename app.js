let currentUser = null;
let currentProfile = null;


/* =========================================
   START APP
========================================= */

document.addEventListener(
  "DOMContentLoaded",
  startApp
);


async function startApp() {

  console.log("Gold Vision App Started");


  if (!window.supabaseClient) {

    showError(
      "اتصال Supabase ایجاد نشده است."
    );

    return;

  }


  try {

    const {
      data,
      error
    } =
      await window.supabaseClient
        .auth
        .getSession();


    if (error) {

      console.error(error);

      showLogin(
        "خطا در بررسی حساب."
      );

      return;

    }


    if (
      data &&
      data.session &&
      data.session.user
    ) {

      currentUser =
        data.session.user;


      await loadProfile();


      if (currentProfile) {

        showDashboard();

      } else {

        showLogin(
          "پروفایل حساب پیدا نشد."
        );

      }

    } else {

      showLogin();

    }

  }

  catch (error) {

    console.error(
      "START ERROR:",
      error
    );

    showError(
      "خطایی هنگام اتصال به سیستم رخ داد."
    );

  }

}


/* =========================================
   LOGIN
========================================= */

function showLogin(message = "") {

  document.getElementById(
    "app"
  ).innerHTML = `

    <div class="auth-page">

      <div class="auth-card">

        <div class="logo">
          GV
        </div>

        <h1>
          Gold Vision
        </h1>

        <p class="subtitle">
          مسیر رشد و پیشرفت
        </p>


        <h2>
          ورود به حساب
        </h2>


        ${
          message
            ? `
              <div class="error-box">
                ${escapeHTML(message)}
              </div>
            `
            : ""
        }


        <form
          id="loginForm"
        >

          <label>
            ایمیل
          </label>

          <input
            id="loginEmail"
            type="email"
            placeholder="ایمیل خود را وارد کنید"
            autocomplete="email"
            required
          >


          <label>
            رمز عبور
          </label>

          <input
            id="loginPassword"
            type="password"
            placeholder="رمز عبور"
            autocomplete="current-password"
            required
          >


          <button
            id="loginButton"
            class="primary-button"
            type="submit"
          >
            ورود
          </button>

        </form>


        <button
          id="testButton"
          class="secondary-button"
          type="button"
        >
          تست اتصال
        </button>

      </div>

    </div>

  `;


  const form =
    document.getElementById(
      "loginForm"
    );


  form.addEventListener(
    "submit",
    async function(event) {

      event.preventDefault();

      await loginUser();

    }
  );


  document
    .getElementById("testButton")
    .addEventListener(
      "click",
      testSupabase
    );

}


/* =========================================
   LOGIN FUNCTION
========================================= */

async function loginUser() {

  console.log(
    "LOGIN BUTTON CLICKED"
  );


  const email =
    document
      .getElementById(
        "loginEmail"
      )
      .value
      .trim();


  const password =
    document
      .getElementById(
        "loginPassword"
      )
      .value;


  if (!email || !password) {

    showLogin(
      "ایمیل و رمز عبور را وارد کنید."
    );

    return;

  }


  const button =
    document.getElementById(
      "loginButton"
    );


  button.disabled = true;

  button.textContent =
    "در حال ورود...";


  try {

    console.log(
      "Sending login request..."
    );


    const {
      data,
      error
    } =
      await window.supabaseClient
        .auth
        .signInWithPassword({

          email: email,

          password: password

        });


    console.log(
      "LOGIN RESULT:",
      data,
      error
    );


    if (error) {

      showLogin(
        getErrorMessage(error)
      );

      return;

    }


    if (
      !data ||
      !data.user
    ) {

      showLogin(
        "ورود انجام نشد."
      );

      return;

    }


    currentUser =
      data.user;


    await loadProfile();


    if (!currentProfile) {

      showLogin(
        "حساب وارد شد اما پروفایل پیدا نشد."
      );

      return;

    }


    showDashboard();

  }

  catch (error) {

    console.error(
      "LOGIN ERROR:",
      error
    );


    showLogin(
      "خطایی هنگام ورود رخ داد."
    );

  }

  finally {

    const btn =
      document.getElementById(
        "loginButton"
      );


    if (btn) {

      btn.disabled = false;

      btn.textContent =
        "ورود";

    }

  }

}


/* =========================================
   TEST SUPABASE
========================================= */

async function testSupabase() {

  console.log(
    "SUPABASE TEST START"
  );


  if (!window.supabaseClient) {

    alert(
      "Supabase Client وجود ندارد."
    );

    return;

  }


  try {

    const {
      data,
      error
    } =
      await window.supabaseClient
        .from("app_settings")
        .select("*")
        .limit(1);


    console.log(
      "SUPABASE TEST RESULT:",
      data,
      error
    );


    if (error) {

      alert(
        "اتصال برقرار است اما Supabase خطا داد:\n\n" +
        error.message
      );

      return;

    }


    alert(
      "اتصال Supabase موفق است ✅"
    );

  }

  catch (error) {

    console.error(error);

    alert(
      "خطای اتصال:\n\n" +
      error.message
    );

  }

}


/* =========================================
   PROFILE
========================================= */

async function loadProfile() {

  if (!currentUser) {

    return null;

  }


  const {
    data,
    error
  } =
    await window.supabaseClient
      .from("profiles")
      .select("*")
      .eq(
        "id",
        currentUser.id
      )
      .maybeSingle();


  if (error) {

    console.error(
      "PROFILE ERROR:",
      error
    );

    currentProfile =
      null;

    return null;

  }


  currentProfile =
    data;


  return data;

}


/* =========================================
   DASHBOARD
========================================= */

function showDashboard() {

  document.getElementById(
    "app"
  ).innerHTML = `

    <header class="top-header">

      <div>

        <h1>
          Gold Vision
        </h1>

        <span>
          مسیر رشد و پیشرفت
        </span>

      </div>

    </header>


    <main>

      <section class="welcome-card">

        <h2>
          خوش آمدید
        </h2>

        <p>
          ${
            escapeHTML(
              currentProfile.full_name
            )
          }
        </p>


        <p>

          User ID:

          <strong>
            ${
              escapeHTML(
                currentProfile.user_id
              )
            }
          </strong>

        </p>

      </section>


      <section class="dashboard-grid">

        <div class="dashboard-card">
          🌳
          <strong>
            ساختار تیم
          </strong>
        </div>


        <div class="dashboard-card">
          📚
          <strong>
            کتاب‌ها
          </strong>
        </div>


        <div class="dashboard-card">
          💰
          <strong>
            کیف پول
          </strong>
        </div>


        <div class="dashboard-card">
          🔗
          <strong>
            کد دعوت
          </strong>
        </div>


        <div class="dashboard-card">
          👤
          <strong>
            پروفایل
          </strong>
        </div>


        ${
          currentProfile.role === "admin"
            ? `
              <div
                class="dashboard-card admin"
              >
                👑
                <strong>
                  پنل مدیریت
                </strong>
              </div>
            `
            : ""
        }

      </section>


      <button
        class="secondary-button"
        onclick="logoutUser()"
      >
        خروج از حساب
      </button>

    </main>

  `;

}


/* =========================================
   LOGOUT
========================================= */

async function logoutUser() {

  await window.supabaseClient
    .auth
    .signOut();


  currentUser = null;

  currentProfile = null;


  showLogin();

}


/* =========================================
   ERROR
========================================= */

function showError(message) {

  document.getElementById(
    "app"
  ).innerHTML = `

    <div class="auth-page">

      <div class="auth-card">

        <div class="logo">
          GV
        </div>

        <h1>
          Gold Vision
        </h1>

        <div class="error-box">
          ${escapeHTML(message)}
        </div>

      </div>

    </div>

  `;

}


/* =========================================
   ERROR MESSAGE
========================================= */

function getErrorMessage(error) {

  const message =
    String(
      error?.message || ""
    ).toLowerCase();


  if (
    message.includes(
      "invalid login credentials"
    )
  ) {

    return (
      "ایمیل یا رمز عبور اشتباه است."
    );

  }


  if (
    message.includes(
      "email not confirmed"
    )
  ) {

    return (
      "ایمیل حساب هنوز تأیید نشده است."
    );

  }


  return (
    error?.message ||
    "ورود انجام نشد."
  );

}


/* =========================================
   SECURITY
========================================= */

function escapeHTML(value) {

  if (
    value === null ||
    value === undefined
  ) {

    return "";

  }


  return String(value)

    .replace(
      /&/g,
      "&amp;"
    )

    .replace(
      /</g,
      "&lt;"
    )

    .replace(
      />/g,
      "&gt;"
    )

    .replace(
      /"/g,
      "&quot;"
    )

    .replace(
      /'/g,
      "&#039;"
    );

}


/* =========================================
   GLOBAL FUNCTIONS
========================================= */

window.loginUser =
  loginUser;

window.logoutUser =
  logoutUser;

window.testSupabase =
  testSupabase;
