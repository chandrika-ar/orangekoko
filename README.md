# orangekoko

日本一手 vintage 首饰电商网站。完全自定义代码(Next.js),不依赖 Squarespace / Shopify 等订阅制建站平台——你只需要为域名、Vercel 托管(通常免费额度够用到有一定流量为止)和 Stripe 手续费付费。

参考网站架构 + 你现有 Squarespace 首页图片,已经 1:1 还原了页面结构、板块顺序和排版风格。人像 Hero 图和 Our Story 配图按你的要求换成了占位区(见下方"上线前必须做的事")。

---

## 技术栈

| 模块 | 选型 | 说明 |
|---|---|---|
| 框架 | Next.js 16 (App Router) + TypeScript | 静态+动态混合渲染,部署到 Vercel |
| 样式 | Tailwind CSS v4 | 设计 token 见 `src/app/globals.css` |
| 多语言 | next-intl | 10 种语言,见下文 |
| 状态管理 | Zustand（+ localStorage 持久化） | 购物车 / 心愿单 |
| 支付 | Stripe Checkout | 支持欧洲主流支付方式 |
| 物流 | 自建 flat-rate 模型 | Phase 2 再接入实时物流 API |
| 图标 | lucide-react | |
| 字体 | Fraunces（衬线,标题）+ Inter（无衬线,正文） | via `next/font/google` |
| 内容管理 | Sanity（可视化后台,`/studio` 路径） | 添加/编辑商品图片和信息不用碰代码,见下方"内容管理"一节 |

---

## 本地开发

```bash
npm install
cp .env.local.example .env.local   # 填入 Stripe 测试密钥
npm run dev
```

打开 http://localhost:3000/en （或 /de /fr /nl /es /it /sv /da /no /fi）。

---

## 部署(脱离 Squarespace 的最快路径)

1. 把这个仓库推到 GitHub(已经在正确分支上)。
2. 在 [vercel.com](https://vercel.com) 用 GitHub 账号登录,New Project → 选择这个仓库 → 默认设置直接部署(Vercel 对 Next.js 是零配置的)。
3. 在 Vercel 项目的 Environment Variables 里填入 `.env.local.example` 里的变量(生产环境要换成 Stripe **正式密钥**,不是测试密钥)。
4. 把你的域名 `orangekoko.com` 的 DNS 指向 Vercel(Vercel 会给出具体的 A/CNAME 记录)。
5. 确认网站在新域名上正常后,再去 Squarespace 后台取消订阅。

---

## 环境变量

见 `.env.local.example`。目前只有 Stripe 相关的两个 key 是必须的:

- `STRIPE_SECRET_KEY` — Stripe 后台 → Developers → API keys
- `STRIPE_WEBHOOK_SECRET` — 如果你启用了 `src/app/api/webhooks/stripe/route.ts`,从 Stripe 后台的 Webhook 配置里获取(见下方"防止超卖"）

---

## 内容管理(添加/编辑商品 —— 不用碰代码)

商品数据已经接入 [Sanity](https://sanity.io)(免费额度对你这个体量完全够用),你可以像填表格一样管理商品,填完保存,网站几分钟内自动更新。设置一次即可,之后天天用:

1. 去 [sanity.io](https://sanity.io) 用邮箱或 Google/GitHub 账号免费注册。
2. 注册后创建一个新项目(Create new project),名字随便起(比如 "orangekoko")。数据集(dataset)用默认的 `production` 就行。
3. 项目建好后,在项目设置里能看到一串 **Project ID**(字母数字组合),把这个 ID 发给我(或者你自己填,见下一步)。
4. 在 Vercel 项目的 Environment Variables 里加两个变量:
   - `NEXT_PUBLIC_SANITY_PROJECT_ID` = 你的 Project ID
   - `NEXT_PUBLIC_SANITY_DATASET` = `production`
   加完后 Redeploy 一次。
5. 之后打开 `https://你的域名/studio`,用你刚才注册 Sanity 的账号登录,就能看到一个"Product"列表,点 "Create" 新建商品:填标题、选分类、填价格(欧元)、上传照片(支持拖拽多张、可以框选每张图的焦点区域裁切)、填 Condition / Materials / Era / Sourced in / Measurements / Description,点右上角 Publish 保存。网站几分钟内自动显示,不用推代码、不用找我。
6. 某件卖出后,回到 `/studio` 打开这件商品,把 "Sold" 开关打开,Publish 保存——网站上会立刻标记"已售罄",而且我们的下单接口现在也会在真正生成付款链接前实时核对这个状态,避免同一件孤品被两个人同时买到(比之前纯代码硬编码的方案安全很多,虽然严格意义上仍不是 100% 无竞态,但已经覆盖了绝大多数场景)。
7. 谁能登录 `/studio` 编辑?只有你在 Sanity 项目设置(Members)里邀请过的账号才能登录进去改东西,`/studio` 这个网址本身公开不要紧,没被邀请的人打开也进不去后台。

在没有配置 `NEXT_PUBLIC_SANITY_PROJECT_ID` 之前(比如你现在预览这个链接时),网站会自动显示 `src/lib/products.ts` 里的 8 个占位商品作为兜底演示数据——配置完 Sanity 后会自动切换成你在后台填的真实商品,不需要额外改代码。

首页 Hero 人像、Our Story 配图、分类卡片这几张"氛围图"暂时没接入 Sanity(它们不是逐日更新的商品图,是很少换的品牌视觉),继续按下面第 2 条的方式发给我处理即可。

---

## 上线前必须做的事(重要程度从高到低)

### 1. 防止超卖(重要 — 每件都是孤品)

接入 Sanity 后,`/api/checkout` 在生成付款链接前会实时查一次 Sanity 里的 `sold` 状态,基本解决了"两个人同时买到同一件孤品"的问题——只要你卖出后及时去 `/studio` 把该商品的 Sold 打开。仍然建议做的收尾动作:

- **接入 Stripe webhook 自动标记已售**:`src/app/api/webhooks/stripe/route.ts` 已经搭好骨架,收到 `checkout.session.completed` 后可以调用 Sanity 的写入 API 自动把对应商品的 `sold` 设为 true,不用你手动去后台点——如果你希望我接上这一步,告诉我一声。
- 在此之前,人工流程是:卖出后第一时间去 `/studio` 手动标记 Sold(几秒钟的事),作为最后一道防线。

### 2. 真实图片

商品图片已经通过 `/studio`(见上方"内容管理"一节)管理,上传后自动出现在商品详情页和列表页,不需要碰代码。

还剩几张不属于"商品"的品牌氛围图仍是占位区(带说明文字的斜纹方块),需要你发真实照片给我替换:

- 首页 Hero 人像(占位说明:"自然欧洲女性人像,柔和日光,佩戴单品,避免生硬的合成皮肤质感"）
- Our Story 板块配图(占位说明:"日本 vintage 梳妆台/镜台"）
- 分类卡片 3 张(耳夹/耳钉/项链平铺图,也可以等有真实商品图后从里面挑)
- Condition & Authenticity 装饰图
- About 页头图 + Sourcing 图

把真实照片发给我,我来替换对应组件里的 `<ImagePlaceholder>`(组件在 `src/components/image-placeholder.tsx`)。

### 3. 真实商品数据

已经不需要改代码文件了——去 `/studio` 按上方步骤填写即可,结构(小标题分区:Condition / Materials / Era / Sourced in / Measurements + Description / Details & Condition / Shipping & Returns / Care 折叠区)已经跟参考网站保持一致。`src/lib/products.ts` 里保留的 8 条占位数据只在没配置 Sanity 时作为兜底演示,配置好之后可以不用管它。

### 4. Stripe 生产环境配置

- Stripe 后台开通 iDEAL、Bancontact、SEPA 直接借记、Klarna、giropay、Przelewy24 等你需要的欧洲支付方式(Dashboard → Settings → Payment methods)。Checkout 会自动根据买家所在地区展示可用方式,代码里不需要写死。
- 配置 Webhook endpoint 指向 `https://你的域名/api/webhooks/stripe`,订阅 `checkout.session.completed` 事件。
- 税务:欧盟跨境电商涉及 VAT / OSS 申报,Stripe Tax 可以自动计算,但需要你在 Stripe 后台单独开通并配置——这部分是财务/合规问题,不是代码问题,建议上线前找当地会计确认。

### 5. 法务页面

`/returns`、`/faq`、`/contact` 目前是占位内容。欧盟对孤品/vintage 二手商品的退货权(14 天冷静期,Directive 2011/83/EU)有specific 规则,以及 GDPR cookie 告知——建议上线前请人补齐这几页,内容我已经留好了框架和位置。

---

## 多语言

已支持:英语、德语、法语、荷兰语、西班牙语、意大利语(欧洲主流)+ 瑞典语、丹麦语、挪威语、芬兰语(北欧)。共 10 种,URL 前缀区分(`/en`、`/de`……),右上角 + 页脚都有语言切换器。

翻译文件在 `messages/*.json`,目前覆盖的是**界面文案**（导航、按钮、板块标题等);商品描述文案目前只有英文占位版本,产品内容的多语言翻译是 phase 2 工作量(每天几十条产品文案的多语言翻译建议用翻译工具 + 人工校对的流程,而不是逐条人工翻译)。

新增语言:在 `src/i18n/routing.ts` 的 `locales` 数组加代码,`messages/` 下加一份对应 JSON(可以复制 `en.json` 结构去翻译)。

---

## 购物车 / 心愿单

纯前端实现(Zustand + localStorage),没有账号系统——用户关闭浏览器再回来,购物车和心愿单还在(存在自己设备上),但换设备就没有了。这是大部分小型独立站 MVP 阶段的标准做法。账号系统(跨设备同步、订单历史)建议放 Phase 2,等有真实订单量再做,不然投入产出比不划算。

---

## 物流

`src/lib/shipping.ts` 目前是两档 flat-rate(标准跟踪 / 加急保价),满 €120 免标准运费(跟首页公告条一致)。这是能让你现在就上线收款发货的最小方案——你手动去日本邮局用 e-packet / EMS 发货,填运费到 Stripe 生成的订单邮箱通知里即可。

Phase 2 如果订单量上来了,可以接入:

- **Sendcloud** / **EasyPost** / **Shippo** 这类物流聚合平台,它们都支持日本邮政(Japan Post EMS / e-packet)以及可以在下单后自动生成面单、写入物流单号回传给买家。
- 或直接用日本郵便的官方 API。

这部分需要你先有实际发货量数据(重量/尺寸分布)才好选型,建议先手动发一段时间再决定。

---

## 目录结构

```
src/
  app/
    [locale]/           每个页面路由,locale 前缀
      page.tsx          首页
      ear-clips/ earrings-studs/ necklaces/ new-arrivals/   分类页
      product/[slug]/   商品详情页
      cart/ wishlist/ checkout/   购物车、心愿单、结账
      about/ shipping/ returns/ size-guide/ faq/ contact/ journal/ account/ search/
    api/
      checkout/route.ts        创建 Stripe Checkout Session
      webhooks/stripe/route.ts  Stripe webhook(超卖防护骨架)
  components/            UI 组件(home/ shop/ cart/ 通用)
  lib/                   products.ts(商品数据) / shipping.ts / stripe.ts
  store/                 cart-store.ts / wishlist-store.ts
  i18n/                  next-intl 配置
messages/                10 种语言的界面文案
public/logo-mark.svg     水彩橘子 logo(矢量,可任意缩放)
```

---

## Logo

`public/logo-mark.svg` 是纯 SVG 手绘的水彩橘子图标(用 SVG 滤镜做出水彩晕染的纸感边缘),配文字 wordmark "orangekoko"(衬线字体,跟标题字体统一)。矢量文件,favicon、包装印刷、社交媒体头像都可以直接放大使用不失真。如果之后想要更丰富的插画版本(比如加叶子细节、多个颜色变体),可以在这个基础上再迭代。

---

## Roadmap 总结

- **现在(Phase 0,已完成)**:完整前端 + 设计还原 + 购物车/心愿单/多语言 + Stripe 测试模式打通 + 物流 flat-rate + Sanity 可视化后台(商品/图片管理)。
- **Phase 1(上线前,你来做/找人做)**:注册 Sanity 账号并录入真实商品、品牌氛围图(Hero/Story 等)、Stripe 生产环境 + 税务配置、法务页面、域名切到 Vercel、(可选)接 Stripe webhook 自动标记已售。
- **Phase 2(有订单量之后再投入)**:真实物流 API、账号系统/订单历史、多币种展示、产品文案多语言翻译流程。
