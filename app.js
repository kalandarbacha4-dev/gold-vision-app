const contentSection = document.getElementById("content-section");

function showSection(section) {

  const sections = {

    home: `
      <div class="empty-state">
        <span>✨</span>
        <h3>Gold Vision</h3>
        <p>به مسیر رشد و پیشرفت خود ادامه دهید.</p>
      </div>
    `,

    structure: `
      <div>
        <h3>👥 ساختار من</h3>
        <p style="color:#718096;margin-top:8px;">
          ساختار زیرمجموعه شما در این قسمت نمایش داده خواهد شد.
        </p>

        <div style="
          margin-top:20px;
          padding:16px;
          border:1px solid #e6ebf2;
          border-radius:16px;
          text-align:center;
        ">
          <strong>شما</strong>
          <div style="margin-top:15px;">
            هنوز عضوی ثبت نشده است.
          </div>
        </div>
      </div>
    `,

    books: `
      <div>
        <h3>📚 کتاب‌ها</h3>

        <div style="
          margin-top:18px;
          padding:18px;
          border:1px solid #e6ebf2;
          border-radius:16px;
        ">
          <strong>کتاب‌های Gold Vision</strong>

          <p style="
            color:#718096;
            margin-top:8px;
            font-size:13px;
          ">
            کتاب‌های آموزشی شما در این قسمت قرار می‌گیرند.
          </p>

          <button style="
            margin-top:15px;
            width:100%;
            padding:13px;
            border:0;
            border-radius:12px;
            background:#0d47a1;
            color:white;
            font-weight:700;
          ">
            تهیه کتاب
          </button>
        </div>
      </div>
    `,

    wallet: `
      <div>
        <h3>💰 کیف پول</h3>

        <div style="
          margin-top:18px;
          padding:25px;
          border-radius:18px;
          background:linear-gradient(135deg,#0d47a1,#1976d2);
          color:white;
          text-align:center;
        ">
          <small>موجودی کیف پول</small>

          <div style="
            font-size:30px;
            font-weight:800;
            margin-top:8px;
          ">
            0 AFN
          </div>
        </div>

        <p style="
          color:#718096;
          font-size:12px;
          margin-top:12px;
        ">
          موجودی توسط مدیریت حساب ثبت و به‌روزرسانی می‌شود.
        </p>
      </div>
    `,

    referral: `
      <div>
        <h3>🔗 کد معرف من</h3>

        <div style="
          margin-top:18px;
          padding:22px;
          border:1px solid #e6ebf2;
          border-radius:18px;
          text-align:center;
        ">
          <small style="color:#718096;">
            کد معرف شما
          </small>

          <div style="
            margin-top:10px;
            font-size:25px;
            font-weight:800;
            color:#0d47a1;
          ">
            GV-DEMO
          </div>

          <button
            onclick="copyReferralCode()"
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
      </div>
    `,

    profile: `
      <div>
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
            <small style="color:#718096;">نام</small>
            <strong style="display:block;margin-top:5px;">
              کاربر Gold Vision
            </strong>
          </div>

          <div style="
            padding:15px;
            background:#f5f8fc;
            border-radius:14px;
          ">
            <small style="color:#718096;">User ID</small>
            <strong style="display:block;margin-top:5px;">
              تعیین نشده
            </strong>
          </div>

        </div>
      </div>
    `
  };

  contentSection.innerHTML =
    sections[section] || sections.home;
}


function copyReferralCode() {

  const code = "GV-DEMO";

  navigator.clipboard.writeText(code)
    .then(() => {
      alert("کد معرف کپی شد.");
    })
    .catch(() => {
      alert("کپی کد انجام نشد.");
    });
}


// صفحه اصلی هنگام باز شدن
showSection("home");
