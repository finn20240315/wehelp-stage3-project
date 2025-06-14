-- ✅ 註冊&登入帳號表
CREATE TABLE IF NOT EXISTS main_accounts (
    id INT AUTO_INCREMENT PRIMARY KEY,
    main_code VARCHAR(10) NOT NULL UNIQUE COMMENT '主帳號代碼，如 c1036',
    type ENUM('company','vendor') NOT NULL COMMENT '帳號類型：總公司 / 供應商',
    email VARCHAR(100) NOT NULL UNIQUE COMMENT '登入 email',
    password VARCHAR(255) NOT NULL COMMENT '加密密碼',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- 部門表
CREATE TABLE IF NOT EXISTS departments(
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(50) NOT NULL UNIQUE COMMENT '部門名稱，如：業務、財務、生產、全部部門',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- 插入預設部門（含「全部部門」）
INSERT IGNORE INTO departments(name) VALUES
('全部部門'), -- id=0
('業務部'),
('財務部'),
('企劃部'),
('行政部'),
('商品部'),
('物流部'),
('營業部');

-- 子帳號表
CREATE TABLE IF NOT EXISTS sub_accounts(
    id INT AUTO_INCREMENT PRIMARY KEY,
    main_account_id INT NOT NULL COMMENT '所屬主帳號 ID',
    sub_code VARCHAR(10) NOT NULL UNIQUE COMMENT '子帳號代碼（如 c103601）',
    email VARCHAR(100) NOT NULL UNIQUE COMMENT '子帳號 email',
    password VARCHAR(255) NOT NULL COMMENT '加密後密碼',
    department_id INT NOT NULL COMMENT  '所屬部門 ID，若為全部部門則指向全部部門那筆',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (main_account_id) REFERENCES main_accounts(id) ON DELETE CASCADE,
    FOREIGN KEY (department_id) REFERENCES departments(id)
);
-- 全域帳號、信箱表
CREATE TABLE IF NOT EXISTS account_registry(
    code VARCHAR(20) PRIMARY KEY COMMENT '全域唯一帳號代碼',
    email VARCHAR(100) NOT NULL UNIQUE COMMENT '全域唯一 email',
    type ENUM ('main','sub') NOT NULL COMMENT '帳號類型：main 或 sub',
    ref_id INT NOT NULL COMMENT  '對應主帳號或子帳號的 id',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- 建立帳號的順序
-- ✅ 新增主帳號：
-- 1. 查 account_registry，是否有相同 code 或 email
-- 2. 新增 main_accounts（取得 id）
-- 3. 新增 account_registry（寫入 code、email、type='main'、ref_id=主帳號 id）

-- ✅ 新增子帳號：
-- 1. 查 account_registry，是否有相同 code 或 email
-- 2. 新增 sub_accounts（取得 id）
-- 3. 新增 account_registry（寫入 code、email、type='sub'、ref_id=子帳號 id）

-- ✅ 建立商品資料表
CREATE TABLE IF NOT EXISTS products (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    spec VARCHAR(50),
    length DECIMAL(6,2),
    width DECIMAL(6,2),
    height DECIMAL(6,2),
    barcode VARCHAR(13),
 
    origin_country VARCHAR(100),
   
    shelf_life_value INT, 
    shelf_life_unit ENUM('日', '月', '年'),
   
    pack_qty INT,
    unit VARCHAR(10),
    launch_date DATE,

    purchase_price DECIMAL(10,2) NOT NULL, -- 原始進價
    selling_price DECIMAL(10,2) NOT NULL, --原始售價
    gross_margin DECIMAL(5,2), --原始毛利

    promo_purchase_price DECIMAL(10,2), -- 促銷進價
    promo_selling_price DECIMAL(10,2), -- 促銷售價
    gross_margin DECIMAL(5,2), --促銷毛利

    created_at DATETIME DEFAULT CURRENT_TIMESTAMP, -- 建立時間
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP -- 更新時間
);


-- ✅ 建立公文資料表
CREATE TABLE IF NOT EXISTS announcements (
  id INT AUTO_INCREMENT PRIMARY KEY,
  `read` BOOLEAN      NOT NULL DEFAULT FALSE COMMENT '是否已讀',
  source VARCHAR(50)  NOT NULL COMMENT '訊息來源',
  doc_no VARCHAR(50)  NOT NULL COMMENT '公告文號',
  title VARCHAR(255)  NOT NULL COMMENT '標題',
  start_date DATE     NOT NULL COMMENT '公告日期',
  end_date DATE       NOT NULL COMMENT '截止日期',
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP COMMENT '建立時間',
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP 
                    ON UPDATE CURRENT_TIMESTAMP COMMENT '更新時間'
);


-- ✅ 建立入庫單
CREATE TABLE IF NOT EXISTS stock_in_orders (
    id INT AUTO_INCREMENT PRIMARY KEY,
    product_id INT NOT NULL COMMENT '對應商品 ID',
    quantity INT NOT NULL COMMENT '入庫數量',
    warehouse VARCHAR(50) DEFAULT '主倉' COMMENT '倉庫名稱',
    status ENUM('已入庫', '退貨') DEFAULT '已入庫',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE
);

-- ✅ 建立出庫單
CREATE TABLE IF NOT EXISTS stock_out_orders (
    id INT AUTO_INCREMENT PRIMARY KEY,
    product_id INT NOT NULL COMMENT '對應商品 ID',
    quantity INT NOT NULL COMMENT '出庫數量',
    status ENUM('已出庫', '缺貨') DEFAULT '已出庫',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE
);

-- ✅ 商品出入庫歷史
CREATE TABLE IF NOT EXISTS stock_flows (
    id INT AUTO_INCREMENT PRIMARY KEY,
    product_id INT NOT NULL COMMENT '商品 ID',
    change_type ENUM('入庫', '出庫') NOT NULL COMMENT '變動類型',
    change_qty INT NOT NULL COMMENT '變動數量（正數或負數）',
    stock_after INT COMMENT '當下庫存（可選）',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE
);

-- ✅ 修改公告 announcements 資料表 的read 欄位
ALTER TABLE `announcements`
  CHANGE COLUMN `read` `read_status` TINYINT(1) NOT NULL DEFAULT 0;

-- ✅ products 刪除欄位
ALTER TABLE products
  DROP COLUMN description,
  DROP COLUMN category,
  DROP COLUMN is_exclusive,
  DROP COLUMN is_flammable,
  DROP COLUMN tax_type;

-- ✅ products 更改 shelf_life_unit ENUM('日','月','年')
ALTER TABLE products
MODIFY COLUMN shelf_life_unit ENUM('日','月','年') NULL;

-- ✅ 新增 promo_gross_margin 欄位，並更新值
ALTER TABLE products
ADD COLUMN promo_gross_margin DECIMAL(5,2) NOT NULL DEFAULT 0.00;

UPDATE products
SET promo_gross_margin = ROUND(
    (promo_selling_price - promo_purchase_price)
    / promo_selling_price * 100,
    2
)
WHERE promo_selling_price > 0 AND id > 0;


-- 1. 把 barcode 設成 UNIQUE
ALTER TABLE `products`
  ADD UNIQUE INDEX `uidx_barcode` (`barcode`);

-- 2. 把 shelf_life_unit 移到 shelf_life_value 之後
ALTER TABLE `products`
  MODIFY COLUMN `shelf_life_unit` 
    ENUM('日','月','年') 
    NULL 
    AFTER `shelf_life_value`;

-- 3. 把 selling_price 移到 purchase_price 之後
ALTER TABLE `products`
  MODIFY COLUMN `selling_price` 
    DECIMAL(10,2) 
    NOT NULL 
    AFTER `purchase_price`;

-- 4. 把 gross_margin 移到 selling_price 之後（亦即 purchase_price 之後緊接著）
ALTER TABLE `products`
  MODIFY COLUMN `gross_margin` 
    DECIMAL(5,2) 
    NULL 
    AFTER `selling_price`;

-- ✅ 刪掉 stock_in_order 的 warehouse 欄位
ALTER TABLE stock_in_orders
DROP COLUMN warehouse;

-- ✅ 新增 stock_flows 的 updated_at 欄位
ALTER TABLE stock_flows
  ADD COLUMN updated_at DATETIME NOT NULL
    DEFAULT CURRENT_TIMESTAMP
    AFTER created_at,
  MODIFY created_at DATETIME NOT NULL
    DEFAULT CURRENT_TIMESTAMP;

-- ✅ stock_flows 資料表加入單價 unit_price 欄位
ALTER TABLE stock_flows ADD COLUMN unit_price DECIMAL(10,2) DEFAULT NULL;

-- ✅ stock_in_orders 資料表加入單價 unit_price 欄位
ALTER TABLE stock_in_orders ADD COLUMN unit_price DECIMAL(12,2) NULL;

-- ✅ stock_out_orders 資料表加入單價 unit_price 欄位
ALTER TABLE stock_out_orders ADD COLUMN unit_price DECIMAL(12,2) NULL;

-- ✅ 在出庫單表加一欄 sale_price
ALTER TABLE stock_out_orders
  ADD COLUMN sale_price DECIMAL(10,2) NULL AFTER unit_price;

-- ✅ 在入庫單表加一欄 sale_price
ALTER TABLE stock_in_orders
  ADD COLUMN sale_price DECIMAL(10,2) NULL AFTER unit_price;

-- ✅ 在 stock_flows 表也加一欄 sale_price
ALTER TABLE stock_flows
  ADD COLUMN sale_price DECIMAL(10,2) NULL AFTER unit_price;

-- ✅ 在 stock_flows 表也加一欄 sale_price
ALTER TABLE stock_out_orders
  DROP COLUMN unit_price,
  DROP COLUMN sale_price;
