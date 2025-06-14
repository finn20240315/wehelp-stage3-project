document.addEventListener("DOMContentLoaded", () => {
  const token = localStorage.getItem("access_token");
  if (!token) {
    window.location.href = "/index.html";
    return;
  }
  const payload = JSON.parse(atob(token.split(".")[1]));
  console.log("✅ payload：", payload);

  const dept = payload.department;

  console.log("✅ 使用者部門：", dept);

  // ✅ 各部門對應要顯示的功能 ID
  const permissionMap = {
    全部部門: [
      "btn-product",
      "btn-product2",
      "btn-product3",
      "btn-product4",
      "btn-stock",
      "btn-stock2",
      "btn-stock3",
      "btn-accounts",
      "btn-accounts2",
      "btn-accounts3",
    ],
    商品部: ["btn-product", "btn-product2", "btn-product3", "btn-product4"],
    物流部: ["btn-stock", "btn-stock2", "btn-stock3"],
    管理部: ["btn-accounts", "btn-accounts2", "btn-accounts3"],
    // 其他部門可自行擴充
  };

  const allowedIds = permissionMap[dept] || [];
  console.log("✅ allowedIds：", allowedIds);

  allowedIds.forEach((id) => {
    const el = document.getElementById(id);
    if (el) el.style.display = "block";
  });

  const inpName = document.getElementById("input-name");
  const inpBar = document.getElementById("input-barcode");
  const btnSearch = document.getElementById("btn-search");
  const btnClear = document.getElementById("btn-clear");
  const tbody = document.querySelector("#history-table tbody");

  async function loadHistory() {
    try {
      const params = new URLSearchParams();
      if (inpName.value.trim())
        params.append("product_name", inpName.value.trim());
      if (inpBar.value.trim()) params.append("barcode", inpBar.value.trim());

      const url =
        "/api/stock/history" + (params.toString() ? `?${params}` : "");
      let data = [];
      try {
        const res = await fetch(url, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        data = await res.json();
      } catch (err) {
        console.error("❌ 載入錯誤：", err);
        return alert("查詢失敗：" + err.message);
      }

      tbody.innerHTML = ""; // 先清空表格

      // 1. 按 product_id 分組
      const groups = data.reduce((acc, row) => {
        (acc[row.product_id] ||= []).push(row);
        return acc;
      }, {});

      let seq = 1; // 用來做「序號」

      // 2. 針對每組商品渲染
      for (const pid in groups) {
        const rows = groups[pid];
        const first = rows[0];

        // 2.1 第一列：商品基本資訊
        const headerTr = document.createElement("tr");
        headerTr.innerHTML = `
              <td>${seq++}</td>
              <td>${first.product_name}</td>
              <td>${first.spec || "-"}</td>
              <td>${first.barcode || "-"}</td>
              <td>${first.pack_qty ?? "-"}</td>
              <td>${first.unit || "-"}</td>
              <td>-</td>
              <td>-</td>
              <td>-</td>
              <td>-</td>
              <td>-</td>
              <td>-</td>
              <td>-</td>
              <td>-</td>
            `;
        tbody.appendChild(headerTr);

        // 2.2 中間列：該商品的每筆入／出庫
        let totalProfit = 0;
        for (const row of rows) {
          const costSpent =
            row.change_type === "入庫" ? row.change_qty * row.in_price : 0;
          const saleQty = row.change_type === "出庫" ? row.change_qty : 0;
          const salePrice = row.change_type === "出庫" ? row.out_price : 0;
          const saleRevenue = saleQty * salePrice;
          const profit = saleRevenue - costSpent;
          totalProfit += profit;

          const tr = document.createElement("tr");
          tr.innerHTML = `
              <td>-</td>
              <td>-</td>
              <td>-</td>
              <td>-</td>
              <td>-</td>
              <td>-</td>
                <td>${row.change_type}</td>
                <td>${row.change_type === "入庫" ? row.change_qty : "-"}</td>
                <td>${
                  row.change_type === "入庫" ? row.in_price.toFixed(2) : "-"
                }</td>
                <td>${costSpent > 0 ? costSpent.toFixed(2) : "-"}</td>
                <td>${saleQty > 0 ? saleQty : "-"}</td>
                <td>${salePrice > 0 ? salePrice.toFixed(2) : "-"}</td>
                <td>${saleRevenue > 0 ? saleRevenue.toFixed(2) : "-"}</td>
                <td>-</td>
              `;
          tbody.appendChild(tr);
        }

        // 2.3 最後一列：該商品的毛利額總計
        const subtotalTr = document.createElement("tr");
        subtotalTr.innerHTML = `
              <td colspan="13" style="text-align:right;font-weight:bold">
                毛利額：
              </td>
              <td>${totalProfit.toFixed(2)}</td>
            `;
        tbody.appendChild(subtotalTr);
      }
    } catch (err) {
      console.error("❌ 載入錯誤：", err);
      alert("查詢失敗：" + err.message);
    }
  }

  btnSearch.addEventListener("click", () => {
    loadHistory(inpName.value.trim(), inpBar.value.trim());
  });

  // 清除按鈕：清空欄位並顯示全部
  btnClear.addEventListener("click", () => {
    inpName.value = "";
    inpBar.value = "";
    loadHistory();
  });

  loadHistory();
});
