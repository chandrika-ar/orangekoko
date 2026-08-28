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

## 上线前必须做的事(重要程度从高到低)

### 1. 防止超卖(重要 — 每件都是孤品)

现在的商品数据（`src/lib/products.ts`）是写死在代码里的静态数组,**下单成功后不会自动标记为"已售"**。也就是说,理论上两个人可以同时买到同一件孤品。这是当前架构里唯一一个"能跑但不能直接拿去卖钱"的地方,上线前必须解决,推荐两个方案按成本排序:

- **最简单**:接入一个轻量数据库/KV(例如 Vercel KV、Supabase 免费额度都够用)存商品的 `sold` 状态,`/api/checkout` 下单前检查、`/api/webhooks/stripe` 收到 `checkout.session.completed` 后写入。webhook 骨架已经搭好在 `src/app/api/webhooks/stripe/route.ts`,只差接一个真实存储。
- **人工兜底**(如果你想先跑起来再说):每天上新时人工核对,一旦某件卖出就手动从 `products.ts` 删除对应条目并重新部署——因为你说的更新频率是"每天几款",人工操作是可行的过渡方案,但仍建议尽快换成数据库方案。

### 2. 真实图片

目前所有图片位置都是占位区(带说明文字的斜纹方块),包括:

- 首页 Hero 人像(占位说明:"自然欧洲女性人像,柔和日光,佩戴单品,避免生硬的合成皮肤质感"）
- Our Story 板块配图(占位说明:"日本 vintage 梳妆台/镜台"）
- 分类卡片 3 张(耳夹/耳钉/项链平铺图)
- Latest Discoveries 5 个新品位
- Condition & Authenticity 装饰图
- 每个商品详情页的多图位(数量在 `products.ts` 里按 `imageCount` 定义)
- About 页头图 + Sourcing 图

把真实照片放进 `public/images/...`,然后把对应组件里的 `<ImagePlaceholder>` 换成 `next/image`（组件在 `src/components/image-placeholder.tsx`,替换方式很直接)。

### 3. 真实商品数据

`src/lib/products.ts` 里现在是 8 个占位商品(标题、价格、材质、年代、来源、文案都标了"占位文案"/"[Placeholder]")。正式商品文案确认后,替换这个文件即可——结构(小标题分区:Condition / Materials / Era / Sourced in / Measurements + Description / Details & Condition / Shipping & Returns / Care 折叠区)已经跟参考网站保持一致,不用改代码,只改内容。

> 注意:每天上新 3–10 款的节奏下,`products.ts` 这种硬编码文件很快会不好维护。等接入第 1 条的数据库后,建议顺手把商品数据也搬进去,做一个简单的后台表单或直接用数据库管理界面(如 Supabase Studio)来加商品,而不是每次改代码文件。

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

- **现在(Phase 0,已完成)**:完整前端 + 设计还原 + 购物车/心愿单/多语言 + Stripe 测试模式打通 + 物流 flat-rate。
- **Phase 1(上线前,你来做/找人做)**:防超卖存储、真实图片、真实商品文案、Stripe 生产环境 + 税务配置、法务页面、域名切到 Vercel。
- **Phase 2(有订单量之后再投入)**:真实物流 API、账号系统/订单历史、简单商品管理后台或 CMS、多币种展示、产品文案多语言翻译流程。
