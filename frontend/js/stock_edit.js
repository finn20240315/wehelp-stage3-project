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
  const form = document.getElementById("flow-form");

  // 3）「入庫」欄位 refs
  const inQty = document.getElementById("in-quantity");
  const inPrice = document.getElementById("in-price");
  const inAmt = document.getElementById("in-amount");
  // 4）「出庫」欄位 refs
  const outQty = document.getElementById("out-quantity");
  const outPrice = document.getElementById("out-price");
  const outAmt = document.getElementById("out-amount");

  // 5）根據入／出庫顯示不同欄位
  function toggleBlocks() {
    const isIn = selType.value === "入庫";

    document.querySelectorAll(".in-block").forEach((el) => {
      el.classList.toggle("hidden", !isIn);
    });
    document.querySelectorAll(".out-block").forEach((el) => {
      el.classList.toggle("hidden", isIn);
    });
  }

  selType.addEventListener("change", toggleBlocks);
  toggleBlocks();

  // 6）計算入庫成本
  function calcIn() {
    const cost =
      (parseFloat(inQty.value) || 0) * (parseFloat(inPrice.value) || 0);
    inAmt.value = cost > 0 ? cost.toFixed(2) : "";
  }
  inQty.addEventListener("input", calcIn);
  inPrice.addEventListener("input", calcIn);

  // 7）計算出庫收入
  function calcOut() {
    const revenue =
      (parseFloat(outQty.value) || 0) * (parseFloat(outPrice.value) || 0);
    outAmt.value = revenue > 0 ? revenue.toFixed(2) : "";
  }
  outQty.addEventListener("input", calcOut);
  outPrice.addEventListener("input", calcOut);

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
    inPrice.value = product.purchase_price.toFixed(2); // 进价
    outPrice.value = product.selling_price.toFixed(2); // 售价

    // 一開始先算一次
    calcIn();
    calcOut();
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
      inPrice.value = prod.purchase_price?.toFixed(2) || "";
      outPrice.value = prod.selling_price?.toFixed(2) || "";
      calcIn();
      calcOut();
    });
  }

  // 共用：送出入/出庫
  form.addEventListener("submit", async (e) => {
    console.log("✅ submit handler triggered");

    e.preventDefault(); // ← 一定要加，停掉瀏覽器預設提交

    const type = selType.value; // 入庫 or 出庫
    const product_id = pid ? +pid : +selBarcode.value;
    // ▶️ 这里不要再用 inQty 一律取值了，改成根据类型分别取
    let quantity, unit_price;
    if (type === "入庫") {
      quantity = +inQty.value; // 进货量
      unit_price = +inPrice.value; // 进价
    } else {
      quantity = +outQty.value; // 销货量
      unit_price = +outPrice.value; // 售价
    }

    const payload = {
      product_id,
      quantity,
      unit_price,
      unit: inpUnit.value || null,
      status: type === "入庫" ? "已入庫" : "已出庫",
    };

    console.log("✅ payload >", payload);

    const url = type === "入庫" ? "/api/stock/in" : "/api/stock/out";

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
      alert(`${type}單建立成功`);
      window.location.href = "/stock_summary.html";
    } catch (err) {
      console.error("🔥 submit error:", err);
      alert(`${type}單建立失敗：` + err.message);
    }
  });
});
