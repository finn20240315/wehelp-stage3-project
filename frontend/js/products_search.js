document.addEventListener("DOMContentLoaded", () => {
  const token = localStorage.getItem("access_token");
  if (!token) {
    window.location.href = "/login.html";
    return;
  }

  const tbody = document.querySelector("#result-table tbody");
  const inputName = document.getElementById("input-name");
  const inputBarcode = document.getElementById("input-barcode");
  const btnSearch = document.getElementById("btn-search");
  const btnClear = document.getElementById("btn-clear");

  // 真正執行 GET /api/products?name=xxx
  async function loadProducts(name = "", barcode = "") {
    try {
      const params = new URLSearchParams();
      if (name) params.append("name", name);
      if (barcode) params.append("barcode", barcode);

      const url = "/api/products" + (params.toString() ? `?${params}` : "");

      const res = await fetch(url, {
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();

      // 清空表格
      tbody.innerHTML = "";
      // 如果沒資料，就顯示「查無資料」列，並結束
      if (data.length === 0) {
        const tr = document.createElement("tr");
        // 你的表頭有11欄，因此 colspan=11
        tr.innerHTML = `
        <td colspan="11" class="text-center">
          查無資料
        </td>
      `;
        tbody.appendChild(tr);
        return;
      }
      data.forEach((p, i) => {
        const tr = document.createElement("tr");
        tr.innerHTML = `
          <td>${i + 1}</td>
          <td>${p.name}</td>
          <td>${p.spec || ""}</td>
          <td>
            <a href="/products_edit.html?id=${p.id}">
              ${p.barcode || ""}
            </a>
          </td>
          <td>${p.pack_qty || ""}</td>
          <td>${p.unit || ""}</td>
          <td>${p.launch_date || ""}</td>
          <td>${p.purchase_price} 元</td>
          <td>${p.selling_price} 元</td>
          <td>${p.gross_margin}</td>
          <td>${formatDatetime(p.updated_at)}</td>
        `;
        tbody.appendChild(tr);
      });
    } catch (err) {
      console.error(err);
      alert("查詢失敗：" + err.message);
    }
  }

  function formatDatetime(dt) {
    const date = new Date(dt);
    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, "0");
    const d = String(date.getDate()).padStart(2, "0");
    const h = String(date.getHours()).padStart(2, "0");
    const min = String(date.getMinutes()).padStart(2, "0");
    const s = String(date.getSeconds()).padStart(2, "0");
    return `${y}-${m}-${d} ${h}:${min}:${s}`;
  }

  // 綁定「查詢」按鈕
  btnSearch.addEventListener("click", () => {
    loadProducts(inputName.value.trim(), inputBarcode.value.trim());
  });

  // 綁定「清除」按鈕：清掉欄位並查所有
  btnClear.addEventListener("click", () => {
    inputName.value = "";
    inputBarcode.value = "";

    loadProducts();
  });

  // 頁面一打開，先查一次（show all）
  loadProducts();
});
