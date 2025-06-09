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

  // ... 你原本的邏輯放這邊繼續執行

  const form = document.getElementById("product-form");
  const yearSel = document.getElementById("launch_year");
  const monthSel = document.getElementById("launch_month");

  const urlParams = new URLSearchParams(window.location.search);
  const productId = urlParams.get("id");

  // 載入下拉選項
  async function loadOptions() {
    // 年月
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
  }

  // 編輯時填入既有值
  async function loadProduct() {
    if (!productId) return;
    try {
      const res = await fetch(`/api/products/${productId}`, {
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      });
      if (!res.ok) return;
      const p = await res.json();
      form.name.value = p.name;
      form.spec.value = p.spec;
      form.length.value = p.length;
      form.width.value = p.width;
      form.height.value = p.height;
      form.barcode.value = p.barcode;

      form.origin_country.value = p.origin_country;
      form.shelf_life_value.value = p.shelf_life_value;
      form.shelf_life_unit.value = p.shelf_life_unit;
      form.unit.value = p.unit;
      form.pack_qty.value = p.pack_qty;

      if (p.launch_date) {
        const [y, mo] = p.launch_date.split("-");
        form.launch_year.value = y;
        form.launch_month.value = parseInt(mo, 10);
      }
      // 正確的「蛇底式」＋ form
      form.selling_price.value = p.selling_price;
      form.purchase_price.value = p.purchase_price;
      form.gross_margin.value = p.gross_margin;

      form.promo_selling_price.value = p.promo_selling_price;
      form.promo_purchase_price.value = p.promo_purchase_price;
      form.promo_gross_margin.value = p.promo_gross_margin;
    } catch (err) {
      console.error("✅ 載入商品失敗", err);
    }
  }

  // 表單送出
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

      selling_price: parseFloat(form.selling_price.value),
      purchase_price: parseFloat(form.purchase_price.value),

      promo_purchase_price: parseFloat(form.promo_purchase_price.value) || 0,
      promo_selling_price: parseFloat(form.promo_selling_price.value) || 0,

      launch_date: `${form.launch_year.value}-${String(
        form.launch_month.value
      ).padStart(2, "0")}-01`,
    };

    try {
      const res = await fetch(`/api/products/${productId}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const errBody = await res.json();
        console.error("伺服器驗證錯誤 detail：", errBody.detail);
        throw new Error(`HTTP ${res.status}`);
      }
      alert("儲存成功！");
      window.location.href = "/products_search.html";
    } catch (err) {
      console.error(err);
      alert("儲存失敗：" + err.message);
    }
  });

  // 啟動
  loadOptions().then(loadProduct);
});

// 取得三個 input 元素
const purchaseInput = document.getElementById("purchase_price");
const sellingInput = document.getElementById("selling_price");
const marginInput = document.getElementById("gross_margin");

const promoPurchaseInput = document.getElementById("promo_purchase_price");
const promoSellingInput = document.getElementById("promo_selling_price");
const promoMarginInput = document.getElementById("promo_gross_margin");

// 計算毛利率的函式
function calculateGrossMargin() {
  // 先讀取使用者輸入的數值（字串轉成浮點數）
  const purchaseVal = parseFloat(purchaseInput.value);
  const sellingVal = parseFloat(sellingInput.value);

  // 如果「原始售價」或「原始進價」其中一個不是有效數值，就把毛利欄清空
  if (isNaN(purchaseVal) || isNaN(sellingVal) || sellingVal === 0) {
    marginInput.value = "";
    return;
  }

  // 毛利率 = (售價 − 成本) ÷ 售價 × 100
  const grossRatio = ((sellingVal - purchaseVal) / sellingVal) * 100;

  // 四捨五入到小數第 2 位
  const rounded = Math.round(grossRatio * 100) / 100;

  // 將結果填入毛利率欄
  marginInput.value = rounded;
}

// 當「原始進價」改變時，重新計算
purchaseInput.addEventListener("input", calculateGrossMargin);

// 當「原始售價」改變時，重新計算
sellingInput.addEventListener("input", calculateGrossMargin);

// （可選）如果想在頁面一開始就把毛利率初始化，也可以呼叫一次：
calculateGrossMargin();

function calculatePromoGrossMargin() {
  const pur = parseFloat(promoPurchaseInput.value);
  const sel = parseFloat(promoSellingInput.value);
  if (isNaN(pur) || isNaN(sel) || sel === 0) {
    promoMarginInput.value = "";
    return;
  }
  const ratio = ((sel - pur) / sel) * 100;
  promoMarginInput.value = Math.round(ratio * 100) / 100;
}

promoPurchaseInput.addEventListener("input", calculatePromoGrossMargin);
promoSellingInput.addEventListener("input", calculatePromoGrossMargin);
// 一開始也跑一次
calculatePromoGrossMargin();
