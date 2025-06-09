document.addEventListener("DOMContentLoaded", () => {
  const token = localStorage.getItem("access_token");
  if (!token) return;

  const payload = JSON.parse(atob(token.split(".")[1]));
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
  allowedIds.forEach((id) => {
    const el = document.getElementById(id);
    if (el) el.style.display = "block";
  });

  const role = localStorage.getItem("user_role");
  if (role !== "main") {
    // 隱藏主帳限定功能
    const addButton = document.getElementById("btn-add-product");
    if (addButton) addButton.style.display = "none";
  }

  // 2. 下拉選單：年／月
  const yearSel = document.getElementById("launch_year");
  const monthSel = document.getElementById("launch_month");
  for (let y = 2020; y <= 2030; y++) {
    yearSel.insertAdjacentHTML(
      "beforeend",
      `<option value="${y}">${y}</option>`
    );
  }
  for (let m = 1; m <= 12; m++) {
    monthSel.insertAdjacentHTML(
      "beforeend",
      `<option value="${m}">${m}</option>`
    );
  }

  // 3. 毛利計算
  const purchaseInput = document.getElementById("purchase_price");
  const sellingInput = document.getElementById("selling_price");
  const marginInput = document.getElementById("gross_margin");
  const promoPurchaseInput = document.getElementById("promo_purchase_price");
  const promoSellingInput = document.getElementById("promo_selling_price");
  const promoMarginInput = document.getElementById("promo_gross_margin");

  function calculateGrossMargin() {
    const pur = parseFloat(purchaseInput.value);
    const sel = parseFloat(sellingInput.value);
    if (isNaN(pur) || isNaN(sel) || sel === 0) {
      marginInput.value = "";
      return;
    }
    marginInput.value = Math.round(((sel - pur) / sel) * 10000) / 100;
  }
  function calculatePromoGrossMargin() {
    const pur = parseFloat(promoPurchaseInput.value);
    const sel = parseFloat(promoSellingInput.value);
    if (isNaN(pur) || isNaN(sel) || sel === 0) {
      promoMarginInput.value = "";
      return;
    }
    promoMarginInput.value = Math.round(((sel - pur) / sel) * 10000) / 100;
  }
  purchaseInput.addEventListener("input", calculateGrossMargin);
  sellingInput.addEventListener("input", calculateGrossMargin);
  promoPurchaseInput.addEventListener("input", calculatePromoGrossMargin);
  promoSellingInput.addEventListener("input", calculatePromoGrossMargin);
  // 一開始也跑一次
  calculateGrossMargin();
  calculatePromoGrossMargin();

  // 4. 新品提報：只呼叫 POST
  const form = document.getElementById("product-form");
  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    const payload = {
      name: form.name.value,
      spec: form.spec.value,
      length: parseFloat(form.length.value),
      width: parseFloat(form.width.value),
      height: parseFloat(form.height.value),
      barcode: form.barcode.value,
      origin_country: form.origin_country.value,
      shelf_life_value: parseInt(form.shelf_life_value.value, 10),
      shelf_life_unit: form.shelf_life_unit.value,
      unit: form.unit.value,
      pack_qty: parseInt(form.pack_qty.value, 10),
      selling_price: parseFloat(sellingInput.value),
      purchase_price: parseFloat(purchaseInput.value),
      promo_purchase_price: parseFloat(promoPurchaseInput.value) || 0,
      promo_selling_price: parseFloat(promoSellingInput.value) || 0,
      launch_date: `${yearSel.value}-${String(monthSel.value).padStart(
        2,
        "0"
      )}-01`,
    };

    try {
      const res = await fetch("/api/products", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      });
      if (!res.ok) {
        let message;
        const contentType = res.headers.get("content-type") || "";
        if (contentType.includes("application/json")) {
          const err = await res.json();
          message = err.detail || err.message;
        } else {
          message = await res.text();
        }
        throw new Error(message);
      }
      alert("新增成功！");
      window.location.href = "/products.html";
    } catch (err) {
      console.error(err);
      alert("新增失敗：" + err.message);
    }
  });
});
