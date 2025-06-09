document.addEventListener("DOMContentLoaded", () => {
  // 1. 拿當前檔名與參數
  const path = window.location.pathname.split("/").pop();
  const hasPid = new URLSearchParams(window.location.search).has("product_id");

  // 2. 靜態 mapping
  const labelMap = {
    "home.html": "首頁",
    "products.html": "新品提報",
    "products_edit.html": "新品修改",
    "products_search.html": "商品查詢",
    "stock_summary.html": "商品庫存查詢",
    // stock_edit.html 先不要在這裡寫
    "accounts.html": "帳號管理",
    "register_main.html": "註冊主帳號",
    "register_sub.html": "註冊子帳號",
    // …其他頁面
  };

  // 3. 動態決定 stock_edit.html
  let label;
  if (path === "stock_edit.html") {
    label = hasPid ? "編輯入/出庫單" : "新增入/出庫單";
  } else {
    // 4. 一般頁面都直接從 labelMap 拿
    label = labelMap[path] || path.replace(/\.\w+$/, "");
  }

  // 5. 顯示到畫面上
  document.getElementById("breadcrumb-current").textContent = label;
  console.log("✅ 麵包屑路徑 path：", path);
  console.log("✅ 麵包屑路徑 label：", label);
});
