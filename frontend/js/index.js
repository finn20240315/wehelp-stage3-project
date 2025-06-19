document.addEventListener("DOMContentLoaded", () => {
  // 1. 直接用 id 抓帳號/密碼欄，比批次 querySelectorAll 還安全
  const accountInput = document.getElementById("login-account");
  const emailInput = document.getElementById("login-email"); // ← 新增
  const passwordInput = document.getElementById("login-password");
  const loginBtn = document.getElementById("loginBtn");

  // 確認都抓到了
  if (!accountInput || !emailInput || !passwordInput || !loginBtn) {
    console.error("登入欄位輸入有誤，請檢查資料是否正確！");
    return;
  }

  loginBtn.addEventListener("click", async (e) => {
    e.preventDefault();

    const account = accountInput.value.trim();
    const email = emailInput.value.trim(); // ← 新增
    const password = passwordInput.value.trim();

    if (!account || !email || !password) {
      alert("請填入帳號、信箱、密碼");
      return;
    }
    if (!emailInput.checkValidity()) {
      return alert("請輸入正確的電子信箱格式");
    }

    try {
      const response = await fetch("/api/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ account, email, password }),
      });
      const result = await response.json();

      if (!response.ok) {
        // 處理各種 validation error
        if (Array.isArray(result.detail)) {
          const msgs = result.detail
            .map((err) => {
              // field 就是 err.loc 裡的最後一個元素：email / verification_code / …
              const field = err.loc[err.loc.length - 1];
              if (field === "email") {
                return "請輸入正確的電子郵件格式";
              }
              if (field === "verification_code") {
                return "請輸入 6 位數驗證碼";
              }
              // 其他直接顯示 Pydantic 原訊息
              return err.msg;
            })
            .join("\n");
          alert(msgs);
        } else {
          alert(result.detail || result.message || "操作失敗");
        }
        return;
      }
      localStorage.setItem("access_token", result.access_token);
      const payload = JSON.parse(atob(result.access_token.split(".")[1]));
      localStorage.setItem("user_role", payload.role);
      window.location.href = "./products_search.html";
    } catch (err) {
      console.error("登入時發生錯誤:", err);
      alert(err.message || "網路異常，請稍後再試");
    }
  });

  // 同樣的，檢查註冊表單和欄位
  const sendCodeBtn = document.getElementById("send-code-btn");
  const registerBtn = document.getElementById("registerBtn");
  const regEmailInput = document.getElementById("reg-email");
  const regPwdInput = document.getElementById("reg-password");
  const regCodeInput = document.getElementById("reg-code");
  const regTypeSelect = document.getElementById("reg-type");

  if (sendCodeBtn && regEmailInput) {
    sendCodeBtn.addEventListener("click", async () => {
      const email = regEmailInput.value.trim();
      if (!email) return alert("請先輸入 Email");
      try {
        const res = await fetch("/api/send_verification_code", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email }),
        });
        // 先檢查狀態，不 ok 就用 text() 看錯誤訊息
        if (!res.ok) {
          const body = await res.json(); // 直接 parse JSON
          if (Array.isArray(body.detail)) {
            // 轉成中文提示
            const msgs = body.detail
              .map((err) => {
                const field = err.loc[err.loc.length - 1];
                if (field === "email") {
                  return "請輸入正確的電子郵件格式";
                }
                return err.msg; // fallback 顯示原 msg
              })
              .join("\n");
            return alert("寄送驗證碼失敗：\n" + msgs);
          }
          return alert("寄送驗證碼失敗：" + (body.detail || body.message));
        }
        // 按鈕鎖定 60 秒倒數
        sendCodeBtn.disabled = true;
        let sec = 60;
        const originalText = sendCodeBtn.textContent;
        const timer = setInterval(() => {
          sendCodeBtn.textContent = `請稍候(${sec--})`;
          if (sec < 0) {
            clearInterval(timer);
            sendCodeBtn.disabled = false;
            sendCodeBtn.textContent = originalText;
          }
        }, 1000);
        alert("驗證碼已寄出，請至信箱查看");
      } catch (err) {
        console.error("寄送驗證碼失敗：", err);
        alert(err.message || "無法寄出驗證碼，請稍後再試");
      }
    });
  }

  if (
    registerBtn &&
    regEmailInput &&
    regCodeInput &&
    regPwdInput &&
    regTypeSelect
  ) {
    registerBtn.addEventListener("click", async (e) => {
      e.preventDefault();
      const email = regEmailInput.value.trim();
      const password = regPwdInput.value.trim();
      const code = regCodeInput.value.trim();
      const type = regTypeSelect.value;

      if (!email || !password || !code) {
        alert("請輸入 Email、密碼、驗證碼");
        return;
      }

      const payload = {
        email,
        verification_code: code, // 注意欄位名稱改為後端期望的 verification_code
        password,
        type,
      };

      // 2. 呼叫「註冊主帳號」API
      try {
        const res = await fetch("/api/register_main", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });

        // 1) 先 parse JSON，拿到 data
        const data = await res.json();

        if (!res.ok) {
          // 這裡用同一個 data 變數
          if (Array.isArray(data.detail)) {
            const msgs = data.detail.map((err) => err.msg).join("\n");
            throw new Error(msgs);
          }
          throw new Error(data.detail || data.message || "註冊失敗");
        }

        // 註冊成功提示
        alert(
          `註冊成功！\n您的帳號：${data.code}\n請用此帳號及您剛設定的密碼登入`
        );

        // 幫使用者自動填到登入欄
        accountInput.value = data.code;

        // 清空註冊表單
        regEmailInput.value = "";
        regCodeInput.value = "";
        regPwdInput.value = "";
        regTypeSelect.value = "company";
      } catch (err) {
        console.error("註冊失敗：", err);
        alert(err.message || "網路異常，請稍後再試");
      }
    });
  }
});
