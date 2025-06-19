// stock_history.js
document.addEventListener("DOMContentLoaded", async () => {
  const token = localStorage.getItem("access_token");
  if (!token) {
    window.location.href = "/index.html";
    return;
  }

  // 1. 取 URL 參數 product_id
  const params = new URLSearchParams(window.location.search);
  const pid = params.get("product_id");
  if (!pid) {
    return alert("請帶入 product_id 才能查詢歷史");
  }

  // 2. 顯示麵包屑
  document.getElementById("breadcrumb-current").textContent =
    "入／出庫歷史查詢";

  // 3. 從後端拿該商品所有歷史
  let rows = [];
  try {
    const res = await fetch(`/api/stock/history?product_id=${pid}`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    rows = await res.json();
  } catch (err) {
    console.error("載入錯誤：", err);
    return alert("查詢失敗：" + err.message);
  }

  // 4. 把資料 render 到 table
  const tbody = document.querySelector("#history-table tbody");
  tbody.innerHTML = "";
  let totalProfit = 0;

  rows.forEach((rec, i) => {
    // 計算顯示值
    const inQty = rec.change_type === "入庫" ? rec.change_qty : "-";
    const inPrice = rec.in_price != null ? rec.in_price.toFixed(2) : "-";
    const cost =
      rec.change_type === "入庫"
        ? (rec.change_qty * rec.in_price).toFixed(2)
        : "-";

    const outQty = rec.change_type === "出庫" ? rec.change_qty : "-";
    const outPrice = rec.out_price != null ? rec.out_price.toFixed(2) : "-";
    const revenue =
      rec.change_type === "出庫"
        ? (rec.change_qty * rec.out_price).toFixed(2)
        : "-";

    // 計算單筆毛利（數值）
    const profitValue =
      (rec.change_type === "出庫" ? rec.out_price * rec.change_qty : 0) -
      (rec.change_type === "入庫" ? rec.in_price * rec.change_qty : 0);

    totalProfit += profitValue;
    const profitStr = profitValue.toFixed(2);

    const tr = document.createElement("tr");
    tr.innerHTML = `
      <td>${i + 1}</td>
      <td>${rec.product_name}</td>
      <td>${rec.spec}</td>
      <td>${rec.barcode}</td>
      <td>${rec.pack_qty}</td>
      <td>${rec.unit}</td>
      <td>${rec.change_type}</td>
      <td>${inQty}</td>
      <td>${inPrice}</td>
      <td>${cost}</td>
      <td>${outQty}</td>
      <td>${outPrice}</td>
      <td>${revenue}</td>
      <td>${profitStr}</td>
      <td>
        <a 
          href="stock_edit.html?product_id=${pid}&history_id=${rec.id}"
          class="edit-link btn"
        >編輯</a>
      </td>
    `;
    tbody.appendChild(tr);
  });

  // 5. 最後一列：總毛利額
  const footerTr = document.createElement("tr");
  footerTr.innerHTML = `
    <td colspan="13" style="text-align:right;font-weight:bold">
      總毛利額：
    </td>
    <td style="font-weight:bold;color:#007bff">
      ${totalProfit.toFixed(2)}
    </td>
    <td></td>
  `;
  tbody.appendChild(footerTr);
});
