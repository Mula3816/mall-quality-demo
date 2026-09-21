# Mall Quality Demo 商城与自动化测试项目

## 1. 项目整体目标

本项目目标是搭建一个用于学习、展示和继续扩展的 B2C 商城系统，并同步建设独立的自动化测试工程。

系统对标一个典型 B2C 电商平台：前台面向购物用户，后台面向经营商家和公司管理人员。当前重点覆盖购买业务、发货业务、售后业务、商品管理、搜索、购物车、支付、订单流转、评价，以及 PC Web、移动端 H5、管理后台和自动化测试的完整闭环。

自动化测试工程必须和商城业务工程隔离，统一放在 `mall-automation-tests` 目录，不能混入前端或后端目录。

## 2. 当前项目进度

### 已完成

- 阶段 1：最小商城系统
  - FastAPI 后端
  - PC Web 前台
  - 商品、购物车、地址、订单基础链路

- 阶段 2：接口自动化测试
  - 买家登录、注册、地址、购物车、下单、支付等 API 用例
  - 后台商品、订单、用户、角色权限等 API 用例

- 阶段 3：PC Web UI 自动化测试
  - 买家登录、浏览商品、商品详情、加购、提交订单、支付

- 阶段 4：管理后台与后台自动化测试
  - 独立后台前端
  - 商家和公司管理人员双角色
  - 后台概览、商品管理、订单管理、用户管理
  - 后台 API 和 UI 自动化

- 阶段 5：移动端 H5 与移动端自动化测试
  - 移动端商品、详情、购物车、订单
  - 移动端登录、加购、下单、购物车编辑自动化

- 支付和订单状态流转
  - created -> paid / canceled
  - paid -> shipped / canceled
  - shipped -> completed
  - completed / canceled 为终态

- 物流、售后、评价
  - 后台填写快递公司、快递单号、物流备注并发货
  - 买家端展示物流
  - 买家申请售后
  - 后台处理售后状态并回复
  - 订单完成后买家评价商品
  - 商品详情展示评价

- 搜索能力
  - PC Web 商品搜索
  - PC Web 订单搜索
  - 移动端订单搜索
  - 后台概览、商品、订单、用户搜索

- 当前最新验证结果
  - PC 前台构建通过
  - 移动端 H5 构建通过
  - 管理后台构建通过
  - 最终 Playwright 全量回归通过：`20 passed`

### 尚未完成或后续建议

- SKU / 多规格库存
  - 当前只有商品级库存，没有颜色、尺码、版本等 SKU 独立库存。

- 商品上下架
  - 当前后台能新增、编辑、删除商品，但没有上架 / 下架状态。

- 买家确认收货
  - 当前订单完成主要由后台推进，买家端还没有确认收货按钮。

- 商家数据隔离
  - 当前有商家角色，但商品和订单还没有绑定具体商家 ID。
  - 多商家场景下还不能做到商家只看自己的商品和订单。

- 真实支付与退款
  - 当前是模拟支付，没有微信 / 支付宝 / 银行卡支付。
  - 没有支付流水、支付回调、退款单和退款到账流程。

- 更完整售后
  - 当前是轻量售后：申请、处理、回复、状态展示。
  - 还没有退货物流、换货、退款、凭证图片、售后原因分类。

- 抢购业务
  - 还没有秒杀 / 限时抢购活动、抢购库存、抢购价、限购规则。

- 优惠券业务
  - 之前已明确：优惠券先排除，不作为当前优先实现范围。

- 测试工程化
  - 可继续补 CI、测试报告归档、测试数据隔离、环境变量化、多浏览器矩阵。

- 简历和项目展示
  - 可整理项目亮点、测试覆盖、架构图、业务流程图、演示录屏。

## 2.5 各端已实现功能

### 后端 `mall-backend`

- 账号与认证
  - 用户登录。
  - 用户注册，新注册用户默认为买家角色。
  - 简化 token 认证。
  - 买家、商家、公司管理人员三类角色权限控制。

- 商品业务
  - 商品列表。
  - 商品详情。
  - 后台新增、编辑、删除商品。
  - 商品基础库存管理。
  - 商品评价列表查询。

- 地址业务
  - 买家新增收货地址。
  - 买家查看地址列表。
  - 买家删除自己的地址。
  - 下单必须选择有效地址。

- 购物车业务
  - 加入购物车。
  - 查看购物车。
  - 修改购物车商品数量。
  - 删除购物车商品。
  - 加购和下单时校验库存。

- 订单业务
  - 创建订单。
  - 查看订单列表和订单详情。
  - 订单保存商品快照、价格快照和地址快照。
  - 模拟支付。
  - 取消订单。
  - 后台按合法状态机推进订单。

- 物流业务
  - 后台填写快递公司、快递单号、物流备注。
  - 保存物流后可自动推进订单为已发货。
  - 买家端订单返回物流信息。

- 售后业务
  - 买家提交售后申请。
  - 后台处理售后状态。
  - 后台填写售后回复。
  - 买家端订单返回售后状态和商家回复。

- 评价业务
  - 订单完成后买家评价商品。
  - 每个订单商品限制评价一次。
  - 商品详情可展示评价列表。

- 后台统计
  - 商品总数。
  - 用户总数。
  - 订单总数。
  - 累计收入。
  - 待处理订单。
  - 低库存商品数。

### PC Web 前台 `mall-web`

- 买家登录。
- 买家注册。
- 商品列表展示。
- 商品搜索。
- 商品详情展示。
- 商品评价展示。
- 加入购物车。
- 购物车数量修改。
- 删除购物车商品。
- 收货地址维护。
- 提交订单。
- 订单列表展示。
- 订单搜索。
- 模拟支付。
- 取消订单。
- 查看订单状态和状态时间。
- 查看物流信息。
- 提交售后申请。
- 查看售后处理状态和商家回复。
- 订单完成后提交商品评价。
- 前台只允许买家角色登录使用。

### 移动端 H5 `mall-mobile`

- 买家登录。
- 商品列表展示。
- 商品列表搜索。
- 商品详情展示。
- 商品评价展示。
- 加入购物车。
- 跳转购物车。
- 购物车数量修改。
- 删除购物车商品。
- 收货地址维护。
- 提交订单。
- 订单列表展示。
- 订单搜索。
- 模拟支付。
- 取消订单。
- 查看订单状态和状态时间。
- 查看物流信息。
- 提交售后申请。
- 查看售后处理状态和商家回复。
- 订单完成后提交商品评价。
- 移动端买家功能基本对齐 PC Web 前台。

### 管理后台 `mall-admin`

- 后台账号登录。
- 顶部显示当前登录用户昵称和角色。
- 退出登录。
- 后台角色控制：
  - 商家：概览、商品管理、订单管理。
  - 公司管理人员：概览、商品管理、订单管理、用户管理。

- 概览 tab
  - 展示商品总数、用户总数、订单总数、累计收入、待处理订单、低库存商品。
  - 支持概览指标搜索。

- 商品管理 tab
  - 新增商品。
  - 编辑商品。
  - 删除商品。
  - 维护价格、库存、分类、图片、描述。
  - 支持商品搜索。

- 订单管理 tab
  - 查看订单列表。
  - 查看订单用户、商品明细、金额和状态。
  - 支持订单搜索。
  - 按合法状态机保存订单状态。
  - 填写和更新物流信息。
  - 查看物流信息。
  - 查看售后申请。
  - 处理售后状态并回复。
  - 查看买家评价。

- 用户管理 tab
  - 仅公司管理人员可访问。
  - 查看用户 ID、用户名、昵称、角色、订单数、购物车商品数、地址数、注册日期。
  - 支持用户搜索。

### 自动化测试工程 `mall-automation-tests`

- 买家侧 API 自动化
  - 健康检查。
  - 登录失败校验。
  - 注册、地址维护、带地址下单。
  - 地址权限隔离。
  - 商品加购、下单、查询订单、支付。

- PC Web UI 自动化
  - 买家登录。
  - 商品页搜索框检查。
  - 商品详情。
  - 加入购物车。
  - 提交订单。
  - 订单页搜索框检查。
  - 模拟支付。

- 管理后台 API 自动化
  - 未登录禁止访问后台。
  - 公司管理人员查看概览、商品、订单、用户。
  - 买家不能访问后台。
  - 商家可访问后台但不能访问用户管理。
  - 商品新增、编辑、删除。
  - 订单合法状态流转。
  - 后台发货、买家查看物流、申请售后、后台处理售后、买家评价商品。

- 管理后台 UI 自动化
  - 公司管理人员登录并查看概览。
  - 后台所有功能页搜索框检查。
  - 商家登录并验证不能进入用户管理。
  - 后台新增、编辑、删除商品。
  - 后台更新订单状态。

- 移动端 H5 自动化
  - 买家登录。
  - 商品浏览和搜索。
  - 商品详情、加购、提交订单。
  - 移动端订单页搜索框检查。
  - 购物车数量修改和删除商品。

## 3. 目录说明

```text
mall-quality-demo/
  mall-backend/              后端服务，FastAPI + SQLAlchemy + SQLite
  mall-web/                  PC Web 商城前台，React + TypeScript + Vite
  mall-mobile/               移动端 H5 商城前台，React + TypeScript + Vite
  mall-admin/                商城管理后台，React + TypeScript + Vite
  mall-automation-tests/     独立自动化测试工程，Playwright
  README.md                  当前交接手册和使用指南
```

### 3.1 `mall-backend`

后端业务服务，核心文件是：

- `mall-backend/app/main.py`
  - FastAPI 应用主文件。
  - 包含用户、商品、地址、购物车、订单、物流、售后、评价、后台接口。
  - 包含简化认证、角色权限、默认数据初始化、SQLite schema 兼容迁移。

- `mall-backend/app/database.py`
  - 数据库连接配置。
  - 当前使用 SQLite，数据库文件固定生成在后端目录 `mall-backend/mall.db`。
  - 可通过环境变量 `MALL_DB_URL` 切换为其他数据库（完整 SQLAlchemy URL）。

- `mall-backend/requirements.txt`
  - Python 依赖：FastAPI、Uvicorn、SQLAlchemy。

运行后会生成或使用：

- `mall-backend/mall.db`
  - SQLite 数据库文件。
  - 换电脑后如果没有该文件，后端启动时会自动建表和种子数据。

### 3.2 `mall-web`

PC Web 商城前台。

重要文件：

- `mall-web/src/App.tsx`
  - 前台路由入口。

- `mall-web/src/api/`
  - 前台 API 调用封装。
  - `products.ts`、`cart.ts`、`orders.ts`、`addresses.ts`、`auth.ts`、`types.ts`。

- `mall-web/src/pages/`
  - 前台页面。
  - 登录、商品列表、商品详情、购物车、地址、订单。

- `mall-web/src/styles/global.css`
  - PC 前台全局样式。

### 3.3 `mall-mobile`

移动端 H5 商城前台，功能与 PC Web 对齐。

重要文件：

- `mall-mobile/src/App.tsx`
  - 移动端路由入口。

- `mall-mobile/src/api/`
  - 移动端 API 调用封装。

- `mall-mobile/src/pages/`
  - 移动端登录、商品、详情、购物车、地址、订单页面。

- `mall-mobile/src/styles/global.css`
  - 移动端样式。

### 3.4 `mall-admin`

管理后台前端，后台角色分为商家和公司管理人员。

重要文件：

- `mall-admin/src/App.tsx`
  - 后台路由和权限守卫。
  - 商家看不到用户管理。
  - 公司管理人员可以访问全部后台页面。

- `mall-admin/src/api/admin.ts`
  - 后台 API 调用封装。

- `mall-admin/src/api/client.ts`
  - 后台 token、昵称、角色的 localStorage 管理。

- `mall-admin/src/pages/`
  - `DashboardPage.tsx`：概览。
  - `ProductManagePage.tsx`：商品管理。
  - `OrderManagePage.tsx`：订单、物流、售后、评价管理。
  - `UserListPage.tsx`：用户管理，仅公司管理人员可见。
  - `LoginPage.tsx`：后台登录页。

- `mall-admin/src/styles/global.css`
  - 后台全局样式。

### 3.5 `mall-automation-tests`

独立自动化测试工程，不能和商城前后端代码混放。

重要文件：

- `mall-automation-tests/playwright.config.ts`
  - Playwright 配置。
  - 自动拉起或复用后端、PC 前台、后台、移动端 H5。
  - 测试项目分为：
    - `storefront-api`
    - `storefront-ui`
    - `admin-console-api`
    - `admin-console-ui`
    - `mobile-h5`

- `mall-automation-tests/tests/api/`
  - 买家侧 API 自动化。

- `mall-automation-tests/tests/ui/`
  - PC Web UI 自动化。

- `mall-automation-tests/tests/admin-console/api/`
  - 管理后台 API 自动化。

- `mall-automation-tests/tests/admin-console/ui/`
  - 管理后台 UI 自动化。

- `mall-automation-tests/tests/mobile-h5/`
  - 移动端 H5 自动化。

- `mall-automation-tests/playwright-report/`
  - Playwright HTML 报告输出目录。

- `mall-automation-tests/test-results/`
  - Playwright 失败截图、trace 等输出目录。

## 4. 默认账号

| 端 | 角色 | 用户名 | 密码 | 说明 |
|---|---|---|---|---|
| PC 前台 / 移动端 | 买家 | `buyer` | `123456` | 只能访问买家端功能 |
| 管理后台 | 商家 | `merchant` | `123456` | 可访问概览、商品管理、订单管理 |
| 管理后台 | 公司管理人员 | `admin` | `123456` | 可访问后台全部功能，包括用户管理 |

权限规则：

- 买家账号不能访问后台接口。
- 商家和公司管理人员账号不能访问买家端接口。
- 商家不能访问用户管理。
- 用户管理只允许公司管理人员访问。

## 5. 本地端口

| 服务 | 地址 |
|---|---|
| 后端 API | `http://127.0.0.1:8000` |
| 后端健康检查 | `http://127.0.0.1:8000/api/health` |
| PC Web 前台 | `http://127.0.0.1:5173` |
| 管理后台 | `http://127.0.0.1:5174` |
| 移动端 H5 | `http://127.0.0.1:5175` |

注意：后端根路径 `http://127.0.0.1:8000/` 返回 `{"detail":"Not Found"}` 是正常的，因为后端只提供 API，不提供页面。页面要访问 5173、5174、5175。

### 5.1 环境变量配置（均可选，不设置时使用默认值）

| 环境变量 | 作用 | 默认值 |
|---|---|---|
| `MALL_DB_URL` | 后端数据库连接（完整 SQLAlchemy URL） | `sqlite:///<后端目录>/mall.db` |
| `MALL_CORS_ORIGINS` | 后端允许的跨域来源，逗号分隔 | 本地 5173/5174/5175 的 localhost 和 127.0.0.1 |
| `MALL_API_URL` | 自动化测试使用的后端地址 | `http://127.0.0.1:8000` |
| `MALL_API_PORT` | 后端端口（自动化测试拉起后端时使用） | `8000` |
| `MALL_WEB_PORT` | PC 前台端口 | `5173` |
| `MALL_ADMIN_PORT` | 管理后台端口 | `5174` |
| `MALL_MOBILE_PORT` | 移动端 H5 端口 | `5175` |
| `MALL_WEB_URL` | 自动化测试访问 PC 前台的地址 | `http://127.0.0.1:5173` |
| `MALL_ADMIN_URL` | 自动化测试访问管理后台的地址 | `http://127.0.0.1:5174` |
| `MALL_MOBILE_URL` | 自动化测试访问移动端 H5 的地址 | `http://127.0.0.1:5175` |
| `VITE_API_BASE_URL` | 前端访问的后端 API 地址（打包时注入） | `http://127.0.0.1:8000/api` |

说明：

- 三个前端的 `npm run dev` / `vite preview` 端口由各自的 `vite.config.ts` 读取 `MALL_WEB_PORT` / `MALL_ADMIN_PORT` / `MALL_MOBILE_PORT`；Playwright 配置读取同一套环境变量，改端口时两端自动保持一致。
- `mall.db` 固定生成在后端目录 `mall-backend/` 下，与启动命令所在的当前目录无关。
- 部署到远程服务器时：后端设 `MALL_CORS_ORIGINS` 指向前端域名，前端构建时设 `VITE_API_BASE_URL` 指向后端域名，自动化测试设 `MALL_API_URL` / `MALL_WEB_URL` / `MALL_ADMIN_URL` / `MALL_MOBILE_URL` 指向远程地址。

## 6. 换电脑后的环境准备

以下命令均在项目根目录 `mall-quality-demo` 下执行，子目录路径随项目实际放置的位置而定，不再依赖固定盘符和用户名。

### 6.1 基础环境

建议安装：

- Python 3.10 或以上
- Node.js 20 或以上
- npm
- Chromium 浏览器依赖由 Playwright 安装

Windows 上如果 `npm` 不在 PATH，可临时使用：

```powershell
$env:PATH='C:\Program Files\nodejs;' + $env:PATH
```

### 6.2 安装后端依赖

```bash
cd mall-backend
pip install -r requirements.txt
```

### 6.3 安装前端依赖

```bash
cd mall-web
npm install

cd ../mall-admin
npm install

cd ../mall-mobile
npm install
```

### 6.4 安装自动化测试依赖

```bash
cd ../mall-automation-tests
npm install
npx playwright install
```

## 7. 启动项目

建议开 4 个终端分别启动。

### 7.1 启动后端

```bash
cd mall-backend
python -m uvicorn app.main:app --host 127.0.0.1 --port 8000
```

确认：

```text
http://127.0.0.1:8000/api/health
```

应返回：

```json
{"status":"ok","service":"mall-backend"}
```

### 7.2 启动 PC Web 前台

```bash
cd ../mall-web
npm run dev -- --host 127.0.0.1 --port 5173
```

访问：

```text
http://127.0.0.1:5173
```

### 7.3 启动管理后台

```bash
cd ../mall-admin
npm run dev -- --host 127.0.0.1 --port 5174
```

访问：

```text
http://127.0.0.1:5174
```

### 7.4 启动移动端 H5

```bash
cd ../mall-mobile
npm run dev -- --host 127.0.0.1 --port 5175
```

访问：

```text
http://127.0.0.1:5175
```

## 8. 构建和测试

### 8.1 后端编译检查

```bash
cd mall-backend
python -m compileall app
```

### 8.2 前端构建

```bash
cd mall-web
npm run build

cd ../mall-admin
npm run build

cd ../mall-mobile
npm run build
```

### 8.3 自动化测试

```bash
cd ../mall-automation-tests
npm test
```

常用分组：

```bash
npm run test:api
npm run test:ui
npm run test:admin
npm run test:admin:api
npm run test:admin:ui
npm run test:mobile
npm run report
```

Playwright 配置会自动启动或复用以下服务：

- 后端：8000
- PC 前台：5173
- 管理后台：5174
- 移动端 H5：5175

如果端口已有旧服务，Playwright 可能复用旧服务。改了后端或前端代码后，建议先停掉旧进程再跑测试，避免旧代码导致误判。

## 9. 当前核心业务流程

### 9.1 买家购买流程

1. 买家登录 PC 前台或移动端。
2. 浏览商品列表。
3. 搜索商品。
4. 查看商品详情和评价。
5. 加入购物车。
6. 修改购物车数量或删除商品。
7. 维护收货地址。
8. 提交订单。
9. 模拟支付。
10. 查看订单状态。
11. 查看物流。
12. 申请售后。
13. 订单完成后评价商品。

### 9.2 后台经营流程

1. 商家或公司管理人员登录后台。
2. 查看概览指标。
3. 搜索商品、订单、用户或指标。
4. 新增、编辑、删除商品。
5. 查看订单。
6. 推进订单状态。
7. 填写物流信息并发货。
8. 处理售后申请。
9. 查看评价。
10. 公司管理人员可查看用户管理。

## 10. 重要业务规则

### 10.1 订单状态机

```text
created -> paid / canceled
paid -> shipped / canceled
shipped -> completed
completed -> 终态
canceled -> 终态
```

### 10.2 支付

- 只有 `created` 状态订单可以模拟支付。
- 支付后状态变为 `paid`。

### 10.3 取消订单

- `created` 和 `paid` 可以取消。
- `shipped`、`completed`、`canceled` 不允许买家取消。

### 10.4 发货

- 后台可对 `paid` 或 `shipped` 订单填写物流信息。
- 对 `paid` 订单保存物流会自动推进为 `shipped`。

### 10.5 售后

- 买家可对 `paid`、`shipped`、`completed` 订单提交售后申请。
- 每个订单当前只允许一条售后申请。
- 后台可把售后状态改为：`pending`、`approved`、`rejected`、`done`。

### 10.6 评价

- 只有 `completed` 订单可以评价。
- 每个订单内每个商品只能评价一次。
- 商品详情页展示该商品的评价列表。

## 11. 重要提醒和风险点

- 不要把自动化测试文件写进 `mall-web`、`mall-mobile`、`mall-admin` 或 `mall-backend`。
  - 自动化测试必须放在 `mall-automation-tests`。

- 不要保留“无需地址也能下单”的兼容逻辑。
  - 下单必须带有效收货地址。

- 改后端权限时要小心依赖递归。
  - `get_current_customer` 和 `get_current_admin` 必须依赖 `get_current_user`，不能依赖自身。

- 改订单状态时要遵守状态机。
  - 不要让后台随意跳状态。

- 跑测试前注意旧服务。
  - 如果 8000、5173、5174、5175 有旧进程，可能复用旧代码。
  - 端口占用导致 `exit code 1` 不一定是功能失败，先看日志是否为 `Port is already in use`。

- SQLite 是本地文件数据库。
  - `mall.db` 固定生成在后端目录 `mall-backend/`，与启动命令所在的当前目录无关。
  - 换电脑后如果没有 `mall.db`，后端会自动建表和初始化默认账号。
  - 如果复制旧 `mall.db`，启动时 `ensure_schema()` 会补缺失字段。

- 前后台 token 存在 localStorage。
  - PC 前台：`access_token`
  - 移动端：`mobile_access_token`
  - 后台：`admin_access_token`、`admin_role`、`admin_nickname`
  - 如果页面角色异常，先退出登录或清理浏览器 localStorage。

- 已接入 Git 仓库（GitHub），本地仓库与远端同步。
  - `mall.db`、`node_modules`、`dist`、`playwright-report`、`test-results` 均不进入版本库（见 `.gitignore`）。

- 不要把 `node_modules`、`dist`、`playwright-report`、`test-results` 当成核心源码。
  - 换电脑后可重新 `npm install` 和重新跑测试生成。

## 12. 后续优先级建议

推荐后续按这个顺序继续补：

1. 商品上下架
   - 后台增加上架 / 下架状态。
   - 前台只展示上架商品。
   - 自动化覆盖上下架后前台可见性。

2. 买家确认收货
   - 买家端订单页增加确认收货按钮。
   - `shipped -> completed` 由买家确认。
   - 后台仍可作为运营兜底处理。

3. 商家数据隔离
   - 商品增加 `merchant_id`。
   - 订单根据商品关联商家。
   - 商家只能看自己的商品和订单。
   - 公司管理人员可看全部。

4. SKU / 多规格库存
   - 商品下挂 SKU。
   - 购物车和订单记录 SKU 快照。
   - PC、移动端、后台同步 SKU 选择和库存。

5. 更完整售后退款
   - 售后类型：退款、退货退款、换货。
   - 售后凭证图片。
   - 退货物流。
   - 退款金额和退款状态。

6. 抢购业务
   - 活动配置。
   - 抢购价格、抢购库存、开始 / 结束时间。
   - 限购规则。

7. 测试工程化
   - CI。
   - 测试数据工厂。
   - 测试报告归档。
   - 环境变量配置。

8. 简历和项目展示
   - 项目介绍。
   - 架构图。
   - 流程图。
   - 测试覆盖截图。
   - 演示视频。

优惠券业务暂时排除，除非后续明确要做。

## 13. 换电脑后的交接提示词

后续换电脑后，可以把下面这段直接发给 Comate 或新的 AI 编程助手：

```text
请继续维护和补全这个项目：mall-quality-demo（项目根目录，路径以实际存放位置为准）。

这是一个“商城系统 + 独立自动化测试工程”的项目。请先阅读项目根目录 README.md，然后再读当前代码，不要凭空假设。

项目结构：
- mall-backend：FastAPI + SQLAlchemy + SQLite 后端。
- mall-web：PC Web 商城前台。
- mall-mobile：移动端 H5 商城前台。
- mall-admin：管理后台。
- mall-automation-tests：独立 Playwright 自动化测试工程，自动化代码必须放这里，不能混进商城前后端目录。

默认账号：
- 买家：buyer / 123456，只能访问 PC 前台和移动端。
- 商家：merchant / 123456，可访问后台概览、商品管理、订单管理。
- 公司管理人员：admin / 123456，可访问后台全部功能，包括用户管理。

当前已完成：
- 商品、购物车、地址、订单。
- 支付和订单状态流转。
- 商家 / 公司管理人员后台双角色。
- PC Web、移动端 H5、管理后台。
- 物流、售后、评价。
- PC 商品搜索、PC 订单搜索、移动端订单搜索、后台所有 tab 搜索。
- Playwright 全量回归当前已做到 20 passed。

重要规则：
- 回复我请使用中文。
- 自动化测试必须保持在 mall-automation-tests 目录。
- 不要恢复“无需地址也能下单”的旧兼容逻辑。
- 修改订单状态必须遵守状态机：created -> paid/canceled，paid -> shipped/canceled，shipped -> completed。
- 优惠券暂时不做，除非我明确要求。
- 每次改完要至少跑相关构建和 Playwright 回归。
- 如果端口 8000/5173/5174/5175 有旧服务，先判断是否需要停止旧进程，避免测试复用旧代码。

请先做这些检查：
1. 确认 Node.js、npm、Python 是否可用。
2. 如果依赖缺失，分别在 mall-web、mall-mobile、mall-admin、mall-automation-tests 执行 npm install；在 mall-backend 执行 pip install -r requirements.txt。
3. 启动或用 Playwright 自动启动四端服务：后端 8000，PC 前台 5173，后台 5174，移动端 5175。
4. 运行：cd mall-automation-tests && npm test。
5. 如果测试失败，先看是不是旧服务、端口占用、数据库迁移或 localStorage 登录态问题。

后续优先补的功能建议：
1. 商品上下架。
2. 买家确认收货。
3. 商家数据隔离。
4. SKU / 多规格库存。
5. 更完整售后退款。
6. 抢购业务。
7. 测试工程化和简历项目展示。
```

## 14. 快速验收清单

换电脑或大改后，建议按这个顺序验收：

1. 后端健康检查返回 ok。
2. PC 前台能用 `buyer / 123456` 登录。
3. 移动端能用 `buyer / 123456` 登录。
4. 后台能用 `merchant / 123456` 登录，且看不到用户管理。
5. 后台能用 `admin / 123456` 登录，且能看到用户管理。
6. PC 前台能搜索商品、加购、下单、支付。
7. 后台能搜索订单、填写物流、处理售后。
8. 买家端能查看物流、申请售后、完成后评价。
9. 商品详情能展示评价。
10. `mall-automation-tests` 下 `npm test` 通过。
