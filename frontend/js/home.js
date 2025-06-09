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
});

// home.js  
// 這段程式碼會在 DOMContentLoaded 完成後執行，把 /home 回傳的公告列表動態填入 <tbody id="announcements-body">

document.addEventListener('DOMContentLoaded', () => {
  const tbody = document.getElementById('announcements-body');
  if (!tbody) {
    console.error('找不到 <tbody id="announcements-body">');
    return;
  }

  // 1. 先清空舊有內容 (若頁面重整或二次呼叫也不會重複)
  tbody.innerHTML = '';

  // 2. 呼叫後端 /home 路由，取得公告資料
  fetch('/home')
    .then(response => {
      if (!response.ok) {
        throw new Error(`伺服器回傳錯誤: ${response.status}`);
      }
      return response.json();
    })
    .then(data => {
      // 檢查回傳是否為陣列
      if (!Array.isArray(data)) {
        console.error('後端回傳格式非陣列:', data);
        return;
      }

      // 如果沒有任何公告，顯示「目前無公告」
      if (data.length === 0) {
        const trEmpty = document.createElement('tr');
        const tdEmpty = document.createElement('td');
        tdEmpty.setAttribute('colspan', 6);
        tdEmpty.textContent = '目前無公告';
        tdEmpty.style.textAlign = 'center';
        trEmpty.appendChild(tdEmpty);
        tbody.appendChild(trEmpty);
        return;
      }

      // 3. 將每筆公告逐一插入
      data.forEach(item => {
        // 從物件取出對應欄位，若後端欄位名稱不同，請改成實際 key
        const isRead = item.read_status;       // true / false
        const source = item.source || '';       // 訊息來源
        const docNo = item.doc_no || '';        // 公告文號
        const title = item.title || '';         // 標題
        const startDate = item.start_date || ''; // 公告日期
        const endDate = item.end_date || '';     // 截止日期

        // 3.1 建立 <tr>
        const tr = document.createElement('tr');

        // 3.2 「讀取狀態」欄：如果已讀，顯示 ✓，否則顯示 •
        const tdRead = document.createElement('td');
        tdRead.textContent = isRead ? '已讀取' : '未讀取';
        tdRead.classList.add(isRead ? 'read-label' : 'unread-label');
        tr.appendChild(tdRead);

        // 3.3 「訊息來源」欄
        const tdSource = document.createElement('td');
        tdSource.textContent = source;
        tr.appendChild(tdSource);

        // 3.4 「公告文號」欄
        const tdDocNo = document.createElement('td');
        tdDocNo.textContent = docNo;
        tr.appendChild(tdDocNo);

        // 3.5 「標題」欄
        const tdTitle = document.createElement('td');
        tdTitle.textContent = title;
        tr.appendChild(tdTitle);

        // 3.6 「公告日期」欄
        const tdStart = document.createElement('td');
        tdStart.textContent = startDate;
        tr.appendChild(tdStart);

        // 3.7 「截止日期」欄
        const tdEnd = document.createElement('td');
        tdEnd.textContent = endDate;
        tr.appendChild(tdEnd);

        // 3.8 最後把這列 tr 加進 tbody
        tbody.appendChild(tr);
      });
    })
    .catch(err => {
      console.error('載入公告列表失敗: ', err);
      // 顯示錯誤訊息列
      const trError = document.createElement('tr');
      const tdError = document.createElement('td');
      tdError.setAttribute('colspan', 6);
      tdError.textContent = '無法載入公告，請稍後再試';
      tdError.style.textAlign = 'center';
      trError.appendChild(tdError);
      tbody.appendChild(trError);
    });
});
