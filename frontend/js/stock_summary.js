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

  const inputName = document.getElementById("input-name");
  const inputBarcode = document.getElementById("input-barcode");
  const btnSearch = document.getElementById("btn-search");
  const btnClear = document.getElementById("btn-clear");
  const tbody = document.querySelector("#stock-table tbody");

  async function loadStockSummary(name = "", barcode = "") {
    try {
      const params = new URLSearchParams();
      if (name) params.append("name", name);
      if (barcode) params.append("barcode", barcode);
      const url =
        "/api/stock/summary" + (params.toString() ? `?${params}` : "");

      const res = await fetch(url, {
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      });

      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();

      tbody.innerHTML = "";

      // 無資料時顯示
      if (data.length === 0) {
        tbody.innerHTML = `
          <tr>
            <td colspan="7" class="text-center">查無資料</td>
          </tr>`;
        return;
      }

      data.forEach((row, index) => {
        const tr = document.createElement("tr");

        const time = row.last_updated
          ? new Date(row.last_updated).toLocaleString("zh-TW")
          : "-";

        const stockColor = row.current_stock <= 0 ? "style='color:red'" : "";

        tr.innerHTML = `
          <td>${
            index + 1
          }</td>                                      <!-- 序號 -->
          <td>${
            row.product_name
          }</td>                               <!-- 商品名稱 -->
              <td>${
                row.product_spec || "-"
              }</td>                        <!-- 規格：純文字 -->

          <td>
            <a href="stock_edit.html?product_id=${row.product_id}" 
              class="stock-link"
            >
              ${row.barcode || "-"}
            </a>
          </td>                        <!-- 規格 -->
        
          <td>${
            row.pack_qty ?? "-"
          }</td>                            <!-- 箱入數 -->
          <td>${
            row.unit || "-"
          }</td>                                <!-- 單位 -->
          <td>${
            row.total_in
          }</td>                                   <!-- 進貨量 -->
          <td>${
            row.total_out
          }</td>                                  <!-- 銷貨量 -->
          <td ${stockColor}>${
          row.current_stock
        }</td>                 <!-- 庫存量 -->
          <td>${time}</td>      
        `;
        tbody.appendChild(tr);
      });
    } catch (err) {
      console.error("❌ 載入錯誤：", err);
      alert("查詢失敗：" + err.message);
    }
  }

  btnSearch.addEventListener("click", () => {
    loadStockSummary(inputName.value.trim(), inputBarcode.value.trim());
  });

  // 清除按鈕：清空欄位並顯示全部
  btnClear.addEventListener("click", () => {
    inputName.value = "";
    inputBarcode.value = "";
    loadStockSummary();
  });

  loadStockSummary();
});
