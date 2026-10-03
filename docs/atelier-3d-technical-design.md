# Atelier 3D 技术方案:react-three-fiber 接入设计

状态:草案 v2 · 面向 `/atelier/explore` 与 `/atelier/try-on` 两个"即将上线"占位页

> v2 修订说明:在 v1(独立的"走廊房间" Explore + 独立的"摄像头试戴" Try-on)基础上,根据反馈把两者合并成**一段连续的 3D 旅程**——进门先是饰品展示环,穿过展示环深处的复古门,再进入试戴间。v1 里"两个互不相关的占位页各建一个场景"的方案作废,以下是新方案。

## 1. 背景与范围

`atelier` 中心页(`src/app/[locale]/atelier/page.tsx`)承诺了"三种参观方式":

| 入口 | 文案 | 当前实现 | 是否涉及 3D |
|---|---|---|---|
| `/atelier/process` | "Behind every piece" | 已上线,`ProcessFilmstrip` 纯 2D 图文轮播 | 否,维持现状 |
| `/atelier/explore` | "Explore the room" — "Walk the shelves of our Osaka studio" | `AtelierComingSoon` 占位 | **是** |
| `/atelier/try-on` | "Try it on" — "See how a piece sits on you, right from your camera" | `AtelierComingSoon` 占位 | **是** |

本方案只覆盖 `explore` 与 `try-on`,`process` 不改动。核心变化:这两个入口不再各自独立实现,而是**同一段 3D 旅程的两个链接**——因为试戴前本来就要先"挑一件",挑选动作本身就是"逛"的过程。

### 关键约束(决定了技术路线)

- 商品是**一件一物的古着**(`sold` 字段体现):不可能为每件商品做 3D 扫描/建模,排除"给所有 SKU 建 3D 模型"的路线。
- 现有资产只有 2D 商品照片(Sanity `images` 数组),没有任何 3D 资产字段。
- 技术栈是 Next.js 16(App Router)+ React 19 + next-intl + Sanity + Zustand,**没有** three.js 相关依赖,需要新增。
- 页面目前是 `async` Server Component(直接 `getTranslations`),3D/摄像头相关代码必须在 Client Component 边界内,且不能进入 SSR bundle。

> 说明:本仓库 `AGENTS.md` 要求在写代码前查阅 `node_modules/next/dist/docs/`。当前环境未安装依赖(`node_modules` 不存在),该目录无法定位,因此本方案基于仓库中实际可见的 Next 16 App Router 用法推导,而非训练数据里的旧版 Next.js 假设。落地实现时请先确认该目录是否存在并核对是否有需要遵守的破坏性变更。

## 2. 依赖选型

```json
{
  "three": "^0.170.0",
  "@react-three/fiber": "^9.x",
  "@react-three/drei": "^9.x",
  "@mediapipe/tasks-vision": "^0.10.x"
}
```

- **three + @react-three/fiber + @react-three/drei**:整段旅程共用的渲染层(展示环、门、试戴间是同一个 `<Canvas>` 里的三个阶段,不是三个独立 Canvas)。`drei` 提供 `useGLTF`、`Environment`、`Html`、`PerformanceMonitor`。
- **@mediapipe/tasks-vision**(仅试戴阶段用):人脸关键点检测,WASM,可在 Web Worker 里跑,推理完全在本地完成、不上传视频帧——试戴文案可以直接强调"本地处理,不上传"。
- 展示环的拖拽旋转**不引入额外手势库**:一个绕 Y 轴的单轴拖拽 + 惯性衰减,用 r3f 内置的指针事件(`onPointerDown/Move/Up`)手写十几行数学就够了,没必要为此加 `@use-gesture/react` 这类依赖。
- 不引入 `@react-three/postprocessing`:优先把性能预算留给核心体验;胶片颗粒感复用现有 `FilmGrainOverlay` 的思路,在试戴阶段用简单 fragment shader 或 CSS 叠加层实现。
- 构建期工具(devDependency):`gltf-transform` CLI,压缩美术提供的 `.glb`(Draco + KTX2),不进运行时 bundle。

`next.config.ts` 预计不需要改动;若后续 drei 子包出现 ESM/CJS 冲突,再按需加 `transpilePackages`。

## 3. 整体体验:一段连续的 3D 旅程

### 3.1 旅程结构(一个状态机,不是三个页面)

```
      ring(展示环)  --用户挑好一件、点击/滑向门--> door(推门过渡) --动画结束--> tryon(试戴间)
```

三个阶段共享同一个 `<Canvas>` 和同一个相机,靠切换场景内容 + 相机动画过渡,**不做整页跳转**——这是"3D 小游戏"体验感的关键:一旦进了门,就没有 loading 白屏或路由切换打断沉浸感。

- **ring**:入口第一眼看到的饰品展示环,可滑动挑选,远处对着镜头方向立着一扇复古门。
- **door**:选定一件(或点了"直接进店")后触发,镜头前推、门被推开、暖光从门缝渗出。
- **tryon**:门后的试戴间,摄像头 + 人脸关键点追踪,默认试戴的正是刚才在展示环里选中的那一件。

### 3.2 `/atelier/explore` 与 `/atelier/try-on` 的关系

两个 URL 挂载**同一个组件** `<AtelierJourney />`,都从 `ring` 阶段开始——原因很直接:试戴前必须先选一件,"试戴"入口不能跳过挑选这一步,否则试戴间里试的是哪件东西没有着落。两个链接的差异只在 atelier 中心页上的营销文案("逛逛" vs "试戴"),不是两套工程实现。这避免了维护两份场景代码,也避免了"直接从 URL 进 try-on 但没有选中商品"这种悬空状态。

### 3.3 视觉方向:橙色 + 米黄,复古高级感

这不是一个"暗色科技感"的 WebGL demo,视觉基调要延续站内既有的暖调:

- 场景背景/雾效用 `--color-cream-deep`(`#efe7d8`)而不是黑色,避免"科幻感"盖过"复古感"。
- 主光源用暖橙调(贴近 `--color-accent` `#c9622c`)从上方偏一侧打下来,像老照相馆的顶光;环境光用米黄色(`--color-cream` `#f6f1e9`)填充阴影,避免死黑。
- 展示环的卡片边框、门的五金件用黄铜色(暖金属),呼应现有商品摄影里反复出现的黄铜/玳瑁材质(见 `story-vanity.jpg` 里的梳子、镜子)。
- Tone mapping 用 `ACESFilmic` + 轻微暖色调曲线,收尾叠一层复用 `FilmGrainOverlay` 思路的颗粒质感。
- 场景内所有 DOM 覆盖层(商品信息卡、提示文案)复用 `font-display`(Fraunces)+ 大写字距文字 + `ParchmentCard` 的米黄卡片质感,让"游戏"和"网站其余部分"是同一套视觉语言,不是两个拼在一起的产品。

## 4. 展示环(Display Ring)场景设计

### 4.1 内容策略

不给商品建 3D 模型。每件商品是一张**带透明背景的产品图卡片**(复用现有 Sanity `images[0]`,用现成的抠图或简单渐隐边缘),挂在半空中围成一圈——`N` 张卡片均匀分布在半径 `R` 的圆周上,面朝圆心(即始终面向相机)。每张卡片下方一个椭圆软阴影 + 轻微上下浮动(不同相位的正弦位移),做出"漂浮"的高级感,不需要任何美术建模成本。

首批展示的商品:每个类目(`earrings-studs` / `ear-clips` / `necklaces`)各挑几件当季/新到货的,由 Server Component 侧用现有 `getProducts`/`products.ts` 查询,只需要 `slug`、`title`、`priceEur`、`images[0]`,传给 client 组件——不需要新的 Sanity 字段。

### 4.2 交互:拖拽旋转 + 惯性 + 吸附

- 横向拖拽(鼠标/触摸)带动整个环组绕 Y 轴旋转,松手后按衰减速度继续转动一小段(惯性),再缓动吸附到最近一张卡片的角度——保证停下来时永远有一张正对镜头,不会卡在"两件商品中间"的尴尬角度。
- 正对镜头(角度 ≈ 0)的卡片视为"选中态":放大一点、亮度提高、卡片下方浮现一个细的暖色光环。
- `prefers-reduced-motion` 为真时:去掉惯性/浮动动画,拖拽即时跟手、无缓动,选中态用静态高亮而非发光动画。

### 4.3 选中态 → 商品信息面板

选中态变化时,Canvas 外的一块 DOM 面板(而不是 in-canvas `Html`,文字锐利度和无障碍都更好)展示该商品的标题/价格,附两个动作:

- "查看详情" → 现有 `Link` 跳商品详情页(`/product/[slug]`),旅程不打断购物路径。
- "试戴这一件 →" → 触发 4.4 的门过渡,带着 `selectedProductId` 进入 `door` 阶段。

### 4.4 环 → 门的触发

触发方式有两条(不互斥):
1. 点选中商品后点击信息面板里的"试戴这一件"。
2. 直接把环往两侧滑到底、或点击场景深处的门本身,进入 door 阶段(此时用当前正对镜头的那件作为默认试戴商品)。

## 5. 复古门(Vintage Door)过渡设计

### 5.1 资产

单个 hero 级 prop,不是整间房——一扇带雕花边框的复古木门 + 黄铜把手,`door.glb`,一次性由美术制作,Draco 压缩,目标体积 < 1MB(比 v1 里整间"走廊房间"轻得多,因为现在只需要一件道具,不是一整个环境)。

### 5.2 推门动画

1. 相机从展示环位置向门前推(dolly-in,0.6–0.8s,`easeInOutCubic`)。
2. 门绕铰链(一个偏置的 pivot 点)旋转推开,门缝透出的暖光用一个强度渐增的点光源模拟(灯光从"试戴间"那侧打过来)。
3. 门开到一定角度后,相机跟着"穿过"门框,场景内容切换为试戴间(环组淡出/隐藏,试戴间背景淡入)。

### 5.3 无障碍与降级

`prefers-reduced-motion` 为真,或设备性能不足(见第 9 节的自动降级)时:跳过推门的相机动画和门旋转插值,直接切场景,只保留一次简单的淡入淡出。

## 6. 试戴间(Try-on Room)场景设计

### 6.1 内容策略(核心决策)

由于商品一物一件,**默认不追求逐件建 3D 模型**,分两个阶段:

- **阶段一(默认路径)**:复用展示环里用过的同一张商品图,做成锚定在人脸/颈部关键点上的 2D 贴图广告牌,随头部姿态做位置/旋转/透视跟随——"贴纸试戴",成本几乎为零。
- **阶段二(增强,选做)**:为少数"主打款"提供真正的低面数 3D 模型,挂在 Sanity 新增字段上,优先用 3D 模型、否则回退到阶段一。

对应的 Sanity schema 增量(`src/sanity/schemaTypes/product.ts`),字段全部可选,不影响现有商品:

```ts
defineField({
  name: "tryOn",
  title: "Try-on (Atelier)",
  type: "object",
  fields: [
    defineField({
      name: "anchor",
      title: "Anchor point",
      type: "string",
      options: { list: ["earlobe", "ear-clip", "neck"] },
    }),
    defineField({ name: "offset", title: "Fine-tune offset [x,y,z]", type: "array", of: [{ type: "number" }] }),
    defineField({ name: "scale", title: "Fine-tune scale", type: "number" }),
    defineField({ name: "model", title: "3D model (.glb, optional)", type: "file" }),
  ],
  description: "Optional. Powers the /atelier try-on stage. Falls back to a photo cutout when no model is set.",
}),
```

`category` 字段已经能直接映射默认 `anchor`,只有需要微调时才要求运营手动填 `offset`/`scale`。

### 6.2 追踪与渲染管线

1. `camera-gate.tsx`:进门动画结束、场景切到试戴间的瞬间,先展示一块 `ParchmentCard` 风格的说明("处理完全在你的设备本地完成,不会上传"),用户同意后才请求 `getUserMedia`。
2. 视频帧同时喂给:
   - `<video>` → `THREE.VideoTexture`,贴在铺满画布的平面上作"镜子"背景(前置摄像头**水平镜像**,和真实镜子一致)。
   - Web Worker 里的 `FaceLandmarker`(`@mediapipe/tasks-vision`),逐帧回传关键点,不阻塞 `useFrame` 渲染循环。
3. 主线程把关键点映射到与视频等比的正交相机坐标系,驱动饰品贴图的 `position`/`rotation`/`scale`,默认商品就是从展示环带过来的 `selectedProductId`。

### 6.3 试戴中切换饰品

试戴间底部保留一条小尺寸的商品缩略图带(复用展示环同一批数据,不是重新查询),点一下缩略图直接切换当前试戴商品,不需要退回展示环重新走一遍推门流程。

### 6.4 降级与边界情况

统一走 `experience-fallback.tsx`(复用 `AtelierComingSoon` 的 parchment 卡片视觉),覆盖:浏览器不支持 WebGL2/`mediaDevices`、用户拒绝摄像头权限、若干秒检测不到人脸。兜底文案都是"没关系,直接去看商品" + 链接回 `/shop`,不是死页面。

## 7. 目录结构

```
src/components/atelier/
  three/                        # 旅程全程共用的 r3f 基础设施
    canvas-stage.tsx            # 唯一的 <Canvas> 包裹层:tone mapping、DPR 上限、色彩管理
    use-webgl-support.ts        # 能力检测(WebGL2 / prefers-reduced-motion / 简单性能分级)
    experience-fallback.tsx     # parchment 风格降级 UI
    loading-veil.tsx            # 首屏 Suspense 占位
  journey/
    atelier-journey.tsx         # 'use client' 总编排:ring/door/tryon 状态机
    display-ring.tsx            # 展示环:N 张漂浮卡片 + 拖拽旋转 + 吸附
    ring-item-card.tsx          # 单张漂浮商品卡(贴图 + 浮动动画 + 光环)
    product-info-panel.tsx      # 选中态 DOM 面板(标题/价格/查看详情/试戴这一件)
    vintage-door.tsx            # 门模型 + 铰链旋转动画 + 灯光渗透
    journey-camera-rig.tsx      # ring↔door↔tryon 之间的相机插值/dolly
  try-on/
    try-on-stage.tsx            # 摄像头权限 + 追踪 + 饰品跟随渲染
    camera-gate.tsx
    face-tracker.ts              # Web Worker:MediaPipe FaceLandmarker 封装
    jewelry-overlay.tsx
    item-switcher.tsx            # 试戴间内的缩略图切换条

src/app/[locale]/atelier/
  explore/page.tsx               # Server Component:i18n 文案 + dynamic(AtelierJourney)
  try-on/page.tsx                # 同上,挂载同一个 AtelierJourney(仅营销文案不同)
```

页面文件保持"服务端拿翻译 + 渲染壳"模式,`AtelierComingSoon` 换成动态引入的旅程组件:

```tsx
// src/app/[locale]/atelier/explore/page.tsx
import dynamic from "next/dynamic";
import { getTranslations } from "next-intl/server";
import { getFeaturedTryOnProducts } from "@/lib/products";

const AtelierJourney = dynamic(
  () => import("@/components/atelier/journey/atelier-journey"),
  { ssr: false, loading: () => <LoadingVeil /> }
);

export default async function AtelierExplorePage() {
  const t = await getTranslations("atelierPage");
  const items = await getFeaturedTryOnProducts();
  return (
    <div>
      {/* 保留原有 eyebrow/title 结构,与其它 atelier 页一致 */}
      <AtelierJourney items={items} />
    </div>
  );
}
```

`ssr: false` 是硬性要求:`Canvas`/`getUserMedia` 在 Node 环境下会直接报错或产生无意义的 hydration 差异。

## 8. 跨阶段的共享基建

- **`canvas-stage.tsx`**:统一设置 `dpr={[1, Math.min(devicePixelRatio, 2)]}`、`gl={{ antialias: true, powerPreference: "high-performance" }}`,挂 `drei` 的 `<PerformanceMonitor>`,掉帧时自动降 DPR、减少展示环卡片的浮动动画精度。
- **代码分割边界**:`three` / `@react-three/fiber` / `@react-three/drei` / `@mediapipe/tasks-vision` 只应出现在这两条路由的 chunk 里,不能被 `site-header`、`site-footer` 等全局布局间接引入。上线前用 `next build` 产物分析确认。
- **i18n**:旅程需要新增文案 key(加载中、拖拽提示、摄像头权限说明、无人脸检测提示、降级文案),补进 `messages/*.json` 全部 10 个语言文件,归入 `atelierPage` 命名空间,作为实现阶段的内容任务,不阻塞本方案。
- **状态**:`selectedProductId`、当前 stage(ring/door/tryon)是这段旅程内部的局部状态,`useState` 足够,不需要接入现有的 Zustand store(`server-wishlist-store.ts` 那类是跨页面共享状态,旅程状态没有跨页面共享的需求;离开 `/atelier/explore` 后旅程状态理应重置)。

## 9. 性能预算

| 项目 | 目标 |
|---|---|
| 路由额外 JS(gzip) | ≤ 350KB(three + fiber + drei 精简导入) |
| 首次看到展示环 | 中端手机(iPhone 12 级别)≤ 3s |
| 展示环卡片数量 | 单圈 ≤ 12 张(超过则分"类目切换"而不是塞进同一圈,避免过密) |
| door.glb 体积 | < 1MB(Draco 压缩后) |
| 试戴追踪帧率 | 桌面 ≥ 30fps,手机 ≥ 24fps,低于阈值 `PerformanceMonitor` 自动降级 |
| MediaPipe WASM 资产 | 仅进入 tryon 阶段、用户授权摄像头后才动态加载,不计入首屏 |

## 10. 分阶段落地计划

1. **M0 基础设施**:装依赖、`canvas-stage`/`use-webgl-support`/降级 UI,两条路由先接入但旅程内容留空(验证 SSR 边界、bundle 隔离、reduced-motion 分支)。
2. **M1 展示环**:漂浮卡片环 + 拖拽旋转/惯性/吸附 + 选中态信息面板 + "查看详情"跳转。这一步本身就是一个完整、可独立验收的"哇"时刻,不依赖门和试戴间。
3. **M2 推门 + 试戴间 v1**:`vintage-door.tsx` 过渡动画 + 摄像头权限流程 + 人脸关键点追踪 + 商品图贴图跟随(阶段一方案),从展示环带入 `selectedProductId`,补 `tryOn.anchor` 的 schema 字段与默认值推导。
4. **M3 增强(选做)**:试戴间内缩略图切换条、为主打款接入真 3D 模型(`tryOn.model`)、展示环按类目分组/可切换、试戴画面叠加与 `FilmGrainOverlay` 呼应的胶片质感 shader。

## 11. 待决问题(需要产品/美术/法务确认)

- 展示环卡片与复古门的美术资产由谁制作(内部美术 / 外包),决定 M1/M2 的排期,不是纯工程问题。
- 试戴阶段二(逐件 3D 建模)投入产出比需要业务侧判断,先按"选做"处理,不影响 M1/M2 上线。
- 摄像头试戴虽然处理完全在本地、不上传视频帧,隐私文案(尤其涉及"面部"关键点这类敏感表述)建议法务过一遍措辞。
