// logout-timer.js
document.addEventListener("DOMContentLoaded", () => {
  const token = localStorage.getItem("access_token");
  const timerEl = document.getElementById("logout-timer");
  const logoutBtn = document.getElementById("btn-logout");
  if (!token || !timerEl || !logoutBtn) return;

  // 1. 計算剩餘秒數：優先用 payload.exp，否則 fallback 到 3600 秒
  const payload = JSON.parse(atob(token.split(".")[1]));
  let secondsLeft = payload.exp
    ? Math.floor((payload.exp * 1000 - Date.now()) / 1000)
    : 3600;

  // 2. 更新畫面函式
  function updateDisplay(sec) {
    const m = String(Math.floor(sec / 60)).padStart(2, "0");
    const s = String(sec % 60).padStart(2, "0");
    timerEl.textContent = `${m}:${s}`;
  }

  // 3. 立即渲染一次
  updateDisplay(secondsLeft);

  // 4. 每秒倒數
  const intervalId = setInterval(() => {
    secondsLeft--;
    if (secondsLeft < 0) {
      clearInterval(intervalId);
      localStorage.removeItem("access_token");
      alert("登入已過期，請重新登入");
      return (window.location.href = "/index.html");
    }
    updateDisplay(secondsLeft);
  }, 1000);

  // 5. 手動登出
  logoutBtn.addEventListener("click", () => {
    clearInterval(intervalId);
    localStorage.removeItem("access_token");
    window.location.href = "/index.html";
  });
});
