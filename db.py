from db_connector import mysql_pool

def get_db():
    try:
        conn = mysql_pool.get_connection()
        cursor = conn.cursor(dictionary=True)
        cursor.execute("SELECT NOW();")
        result = cursor.fetchone()
        print("✅ 測試查詢成功，現在時間：", result["NOW()"])
        cursor.close()
        conn.close()
    except Error as e:
        print("❌ 資料庫操作錯誤", e)

# 主帳號資料表
CREATE TABLE main_accounts (
    id INT AUTO_INCREMENT PRIMARY KEY,
    main_code VARCHAR(10) NOT NULL UNIQUE COMMENT '主帳號代碼，如 c1036',
    type ENUM('company','vendor') NOT NULL COMMENT '帳號類型：總公司 / 供應商',
    email VARCHAR(100) NOT NULL UNIQUE COMMENT '登入 email',
    password VARCHAR(255) NOT NULL COMMENT '加密密碼',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
)

# 部門表
CREATE TABLE departments(
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(50) NOT NULL UNIQUE COMMENT '部門名稱，如：業務、財務、生產、全部部門',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
)

-- 插入預設部門（含「全部部門」）
INSERT INTO departments(name) VALUES
('全部部門'), --id=0
('業務部'),
('財務部'),
('企劃部'),
('行政部'),
('商品部'),
('物流部'),
('營業部')

# 子帳號表
CREATE TABLE sub_accounts(
    id INT AUTO_INCREMENT PRIMARY KEY,
    main_account_id INT NOT NULL COMMENT '所屬主帳號 ID',
    sub_code VARCHAR(10) NOT NULL UNIQUE COMMENT '子帳號代碼（如 c103601）',
    email VARCHAR(100) NOT NULL UNIQUE COMMENT '子帳號 email',
    password VARCHAR(255) NOT NULL COMMENT '加密後密碼',
    department_id INT NOT NULL COMMENT  '所屬部門 ID，若為全部部門則指向全部部門那筆',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP ,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ,
    FOREIGN KEY (main_account_id) REFERENCES main_accounts(id) ON DELETE CASCADE,
    FOREIGN KEY (department_id) REFERENCES departments(id)
)

# 全域帳號、信箱表
CREATE TABLE account_registry(
    code VARCHAR(20) PRIMARY KEY COMMENT '全域唯一帳號代碼',
    email VARCHAR(100) NOT NULL UNIQUE COMMENT '全域唯一 email',
    type ENUM ('main','sub') NOT NULL COMMENT '帳號類型：main 或 sub',
    ref_id INT NOT NULL COMMENT  '對應主帳號或子帳號的 id',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
)

# 建立帳號的順序

# ✅ 新增主帳號：
#   1. 查 account_registry，是否有相同 code 或 email
#   2. 新增 main_accounts（取得 id）
#   3. 新增 account_registry（寫入 code、email、type='main'、ref_id=主帳號 id）

# ✅ 新增子帳號：
#   1. 查 account_registry，是否有相同 code 或 email
#   2. 新增 sub_accounts（取得 id）
#   3. 新增 account_registry（寫入 code、email、type='sub'、ref_id=子帳號 id）
