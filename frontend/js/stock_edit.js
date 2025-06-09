// stock_edit.js
document.addEventListener("DOMContentLoaded", async () => {
  const token = localStorage.getItem("access_token");
  const params = new URLSearchParams(window.location.search);
  const pid = params.get("product_id");
  console.log("✅ stock_edit loaded; product_id =", pid);

  // 依有沒有 product_id 來決定這頁的「新增／編輯」字眼
  const pageLabel = pid ? "編輯入／出庫單" : "新增入／出庫單";

  // 設定 <h1 id="page-title">
  const h1 = document.getElementById("page-title");
  if (h1) h1.textContent = pageLabel;

  // DOM refs
  const selBarcode = document.getElementById("barcode-select");
  const inpBarcode = document.getElementById("inpBarcode");
  const inpName = document.getElementById("product-name");
  const inpSpec = document.getElementById("product-spec");
  const inpPack = document.getElementById("pack-qty");
  const inpUnit = document.getElementById("unit");
  const selType = document.getElementById("flow-type");
  const inpQty = document.getElementById("quantity");
  const inpPrice = document.getElementById("unit-price");
  const inpAmount = document.getElementById("amount");
  const form = document.getElementById("flow-form");

  // calcAmount 函式
  function calcAmount() {
    const q = parseFloat(inpQty.value) || 0;
    const p = parseFloat(inpPrice.value) || 0;
    inpAmount.value = (q * p).toFixed(2);
  }
  inpQty.addEventListener("input", calcAmount);
  inpPrice.addEventListener("input", calcAmount);

  // 如果 URL 有 product_id → 單一模式
  if (pid) {
    // 顯示唯讀欄位
    inpBarcode.style.display = "inline-block";
    // 隱藏下拉
    selBarcode.style.display = "none";

    // 1. 取單一商品
    let product;
    try {
      const res = await fetch(`/api/products/${pid}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error(res.status);
      product = await res.json();
    } catch (e) {
      return alert("無法取得商品資料");
    }

    // 2. 填值
    inpBarcode.value = product.barcode || "";
    inpName.value = product.name || "";
    inpSpec.value = product.spec || "";
    inpPack.value = product.pack_qty || "";
    inpUnit.value = product.unit || "";
    inpPrice.value = product.purchase_price ?? "";

    calcAmount();
  } else {
    // 無 product_id → 下拉選單模式
    selBarcode.style.display = "inline-block";

    // 1. 取全部商品
    let products = [];
    try {
      const res = await fetch("/api/products", {
        headers: { Authorization: `Bearer ${token}` },
      });
      products = await res.json();
    } catch (e) {
      return alert("無法取得商品清單");
    }

    // 2. 填下拉
    products.forEach((p) => {
      const opt = document.createElement("option");
      opt.value = p.id;
      opt.textContent = p.barcode;
      selBarcode.appendChild(opt);
    });

    // 3. 選擇後帶入
    selBarcode.addEventListener("change", () => {
      const id = +selBarcode.value;
      const prod = products.find((x) => x.id === id) || {};
      inpBarcode.value = prod.barcode || "";
      inpName.value = prod.name || "";
      inpSpec.value = prod.spec || "";
      inpPack.value = prod.pack_qty || "";
      inpUnit.value = prod.unit || "";
      inpPrice.value = prod.purchase_price || "";
      calcAmount();
    });
  }

  // 共用：送出入/出庫
  form.addEventListener("submit", async (e) => {
    console.log("✅ submit handler triggered");

    e.preventDefault(); // ← 一定要加，停掉瀏覽器預設提交

    const type = selType.value; // 入庫 or 出庫
    const product_id = pid ? +pid : +selBarcode.value;
    const quantity = +inpQty.value;
    const url = type === "入庫" ? "/api/stock/in" : "/api/stock/out";
    const payload =
      type === "入庫"
        ? { product_id, quantity, status: "已入庫" }
        : { product_id, quantity, status: "已出庫" };
    console.log("✅ payload >", { product_id, quantity, status: type });
    console.log("✅ POST to", url);

    try {
      const res = await fetch(url, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      });

      console.log("✅ fetch resolved, status =", res.status);
      const text = await res.text();
      console.log("✅ response text:", text);

      if (!res.ok) {
        console.error("❌ res.ok false");
        throw new Error(`HTTP ${res.status}`);
      }
      alert(`${type} 單建立成功`);
      window.location.href = "/stock_summary.html";
    } catch (err) {
      console.error("🔥 submit error:", err);
      alert(`${type} 單建立失敗：` + err.message);
    }
  });
});
