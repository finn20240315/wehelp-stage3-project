document.addEventListener("DOMContentLoaded", () => {
  // 解析 JWT，取得 main_code（假設 JWT payload 有 account 這個欄位）
  const token = localStorage.getItem("access_token");
  console.log(
    "✅ ",
    JSON.parse(atob(localStorage.getItem("access_token").split(".")[1]))
  );

  if (!token) {
    alert("請先登入主帳號");
    window.location.href = "/index.html";
    return;
  }
  let main_code = "";
  try {
    const payload = JSON.parse(atob(token.split(".")[1]));
    main_code = payload.sub; // 依你 JWT payload 結構
  } catch (e) {
    alert("登入資訊失效，請重新登入");
    window.location.href = "/index.html";
    return;
  }

  // 將 main_code 自動帶入並設為不可編輯
  const mainCodeInput = document.getElementById("main_code");
  mainCodeInput.value = main_code;
  mainCodeInput.readOnly = true; // 這一行就是讓欄位不能編輯

  // 原本的表單提交流程
  const form = document.getElementById("register-sub-form");
  form.addEventListener("submit", async (e) => {
    e.preventDefault();

    const main_code = document.getElementById("main_code").value.trim();
    const email = document.getElementById("email_sub").value.trim();
    const password = document.getElementById("password_sub").value.trim();
    const department_id = parseInt(
      document.getElementById("department_id").value,
      10
    );

    try {
      const res = await fetch("/api/register_sub", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          main_code,
          email,
          password,
          department_id,
        }),
      });

      const result = await res.json();
      if (res.ok) {
        alert(`子帳號註冊成功！帳號：${result.code}`);
        window.location.href = "./register_sub.html";
      } else {
        // 如果是 Pydantic 格式（陣列），轉成中文提示
        if (Array.isArray(result.detail)) {
          // 收集並翻譯訊息
          const messages = result.detail
            .map((err) => {
              // 自動中翻譯關鍵字（可依需求擴充）
              let field = err.loc[1];
              if (field === "email") field = "信箱";
              if (field === "password") field = "密碼";
              if (field === "main_code") field = "主帳號代碼";
              if (field === "department_id") field = "部門";
              // 常見英文訊息翻譯
              let msg = err.msg;
              msg = msg.replace(
                "value is not a valid email address",
                "無效的信箱格式"
              );
              msg = msg.replace(
                "The part after the @-sign is not valid. It should have a period.",
                "@ 後面必須包含.com"
              );
              msg = msg.replace(
                "ensure this value has at least 6 characters",
                "長度至少要6個字"
              );
              msg = msg.replace("field required", "此欄位必填");

              return `[${field}] ${msg}`;
            })
            .join("\n");
          alert("註冊失敗：\n" + messages);
        } else if (typeof result.detail === "string") {
          alert("註冊失敗：" + result.detail);
        } else {
          alert("註冊失敗：" + JSON.stringify(result));
        }
      }
    } catch (err) {
      console.error("註冊錯誤", err);
      alert("網路異常，請稍後再試");
    }
  });
});
