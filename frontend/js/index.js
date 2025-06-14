document.addEventListener("DOMContentLoaded", () => {
  // 1. 直接用 id 抓帳號/密碼欄，比批次 querySelectorAll 還安全
  const accountInput = document.getElementById("login-account");
  const passwordInput = document.getElementById("login-password");
  const loginBtn = document.getElementById("loginBtn");

  // 確認都抓到了
  if (!accountInput || !passwordInput || !loginBtn) {
    console.error("找不到登入欄位，請檢查 id 是否正確");
    return;
  }

  loginBtn.addEventListener("click", async (e) => {
    e.preventDefault();

    const account = accountInput.value.trim();
    const password = passwordInput.value.trim();

    if (!account || !password) {
      alert("請填入帳號、密碼");
      return;
    }

    try {
      const response = await fetch("/api/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ account, password }),
      });
      const result = await response.json();

      if (response.ok) {
        localStorage.setItem("access_token", result.access_token);
        const payload = JSON.parse(atob(result.access_token.split(".")[1]));
        localStorage.setItem("user_role", payload.role);
        window.location.href = "./products_search.html";
      } else {
        alert(result.detail || result.message || "登入失敗");
      }
    } catch (err) {
      console.error("登入時發生錯誤:", err);
      alert("網路異常，請稍後再試");
    }
  });

  // 同樣的，檢查註冊表單和欄位
  const registerBtn = document.getElementById("registerBtn");
  const regEmailInput = document.getElementById("reg-email");
  const regPwdInput = document.getElementById("reg-password");
  const regTypeSelect = document.getElementById("reg-type");

  if (!registerBtn || !regEmailInput || !regPwdInput || !regTypeSelect) {
    console.error("找不到註冊欄位，請檢查 id 是否正確");
    return;
  }

  registerBtn.addEventListener("click", async (e) => {
    e.preventDefault();

    const email = regEmailInput.value.trim();
    const password = regPwdInput.value.trim();
    const type = regTypeSelect.value;
    if (!email || !password) {
      alert("請輸入 Email、密碼");
      return;
    }

    const payload = {
      email: regEmailInput.value,
      password: regPwdInput.value,
      type: regTypeSelect.value,
    };
    try {
      const res = await fetch("/api/register_main", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json();

      if (!res.ok) {
        alert(data.detail || data.message || "註冊失敗");
        return;
      }

      alert(
        `註冊成功！\n您的帳號：${data.code}\n請用此帳號與剛才設定的密碼登入`
      );
      accountInput.value = data.code; // 幫使用者自動填到登入欄
      // 清空註冊欄位
      regEmailInput.value = "";
      regPwdInput.value = "";
      regTypeSelect.value = "company";
    } catch (err) {
      console.error("註冊時發生錯誤:", err);
      alert("網路異常，請稍後再試");
    }
  });
});
