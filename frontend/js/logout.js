// logout.js
document.addEventListener("DOMContentLoaded", () => {
  const btnLogout = document.getElementById("btn-logout");
  if (!btnLogout) return;

  btnLogout.addEventListener("click", () => {
    // 1) 先清掉 localStorage 內所有登入狀態
    localStorage.removeItem("access_token");
    localStorage.removeItem("user_role");
    localStorage.removeItem("user_department");
    // （若你額外有存 email、帳號，也一起移除）
    // localStorage.removeItem("user_email");
    // localStorage.removeItem("user_account");

    // 2) 導回登入頁
    window.location.href = "./index.html";
  });
});
