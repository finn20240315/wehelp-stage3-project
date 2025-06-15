-- ✅ 註冊&登入帳號表
CREATE TABLE IF NOT EXISTS main_accounts (
    id INT AUTO_INCREMENT PRIMARY KEY,
    main_code VARCHAR(10) NOT NULL UNIQUE,
    type ENUM('company','vendor') NOT NULL,
    email VARCHAR(100) NOT NULL UNIQUE,
    password VARCHAR(255) NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) 
CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- 部門表
CREATE TABLE IF NOT EXISTS departments(
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(50) NOT NULL UNIQUE,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

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
    main_account_id INT NOT NULL,
    sub_code VARCHAR(10) NOT NULL UNIQUE,
    email VARCHAR(100) NOT NULL UNIQUE,
    password VARCHAR(255) NOT NULL,
    department_id INT NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (main_account_id) REFERENCES main_accounts(id) ON DELETE CASCADE,
    FOREIGN KEY (department_id) REFERENCES departments(id)
) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
-- 全域帳號、信箱表
CREATE TABLE IF NOT EXISTS account_registry(
    code VARCHAR(20) PRIMARY KEY,
    email VARCHAR(100) NOT NULL UNIQUE,
    type ENUM ('main','sub') NOT NULL,
    ref_id INT NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;


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
    purchase_price DECIMAL(10,2) NOT NULL, 
    selling_price DECIMAL(10,2) NOT NULL, 
    gross_margin DECIMAL(5,2), 
    promo_purchase_price DECIMAL(10,2), 
    promo_selling_price DECIMAL(10,2), 
    promo_gross_margin DECIMAL(5,2), 
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP, 
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP 
) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;


-- ✅ 建立公文資料表
CREATE TABLE IF NOT EXISTS announcements (
  id INT AUTO_INCREMENT PRIMARY KEY,
  `read` BOOLEAN      NOT NULL DEFAULT FALSE ,
  source VARCHAR(50)  NOT NULL,
  doc_no VARCHAR(50)  NOT NULL,
  title VARCHAR(255)  NOT NULL,
  start_date DATE     NOT NULL,
  end_date DATE       NOT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP 
                    ON UPDATE CURRENT_TIMESTAMP
) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;


-- ✅ 建立入庫單
CREATE TABLE IF NOT EXISTS stock_in_orders (
    id INT AUTO_INCREMENT PRIMARY KEY,
    product_id INT NOT NULL,
    quantity INT NOT NULL,
    status ENUM('已入庫', '退貨') DEFAULT '已入庫',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE
) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- ✅ 建立出庫單
CREATE TABLE IF NOT EXISTS stock_out_orders (
    id INT AUTO_INCREMENT PRIMARY KEY,
    product_id INT NOT NULL,
    quantity INT NOT NULL,
    status ENUM('已出庫', '缺貨') DEFAULT '已出庫',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE
) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- ✅ 商品出入庫歷史
CREATE TABLE IF NOT EXISTS stock_flows (
    id INT AUTO_INCREMENT PRIMARY KEY,
    product_id INT NOT NULL,
    change_type ENUM('入庫', '出庫') NOT NULL,
    change_qty INT NOT NULL,
    stock_after INT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE
) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

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
