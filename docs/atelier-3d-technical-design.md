# Atelier 3D 技术方案:react-three-fiber 接入设计

状态:草案 · 面向 `/atelier/explore` 与 `/atelier/try-on` 两个"即将上线"占位页

## 1. 背景与范围

`atelier` 中心页(`src/app/[locale]/atelier/page.tsx`)承诺了"三种参观方式":

| 入口 | 文案 | 当前实现 | 是否涉及 3D |
|---|---|---|---|
| `/atelier/process` | "Behind every piece" | 已上线,`ProcessFilmstrip` 纯 2D 图文轮播 | 否,维持现状 |
| `/atelier/explore` | "Explore the room" — "Walk the shelves of our Osaka studio" | `AtelierComingSoon` 占位 | **是** |
| `/atelier/try-on` | "Try it on" — "See how a piece sits on you, right from your camera" | `AtelierComingSoon` 占位 | **是** |

本方案只覆盖 `explore` 与 `try-on` 两个页面的 3D/AR 实现,`process` 不改动。

### 关键约束(决定了技术路线)

- 商品是**一件一物的古着**(`sold` 字段体现):不可能为每件商品做 3D 扫描/建模,这排除了"给所有 SKU 建 3D 模型"的路线。
- 现有资产只有 2D 商品照片(Sanity `images` 数组),没有任何 3D 资产字段。
- 技术栈是 Next.js 16(App Router)+ React 19 + next-intl + Sanity + Zustand,**没有** three.js 相关依赖,需要新增。
- 页面目前是 `async` Server Component(直接 `getTranslations`),3D/摄像头相关代码必须在 Client Component 边界内,且不能进入 SSR bundle。

> 说明:本仓库 `AGENTS.md` 要求在写代码前查阅 `node_modules/next/dist/docs/`。当前环境未安装依赖(`node_modules` 不存在),该目录无法定位,因此本方案基于仓库中实际可见的 Next 16 App Router 用法(现有页面/组件的 server/client 划分方式)推导,而非训练数据里的旧版 Next.js 假设。落地实现时请先确认该目录是否存在并核对是否有需要遵守的破坏性变更。

## 2. 依赖选型

新增运行时依赖:

```json
{
  "three": "^0.170.0",
  "@react-three/fiber": "^9.x",
  "@react-three/drei": "^9.x",
  "@mediapipe/tasks-vision": "^0.10.x"
}
```

- **three + @react-three/fiber + @react-three/drei**:两个场景通用的渲染层。`drei` 提供 `useGLTF`、`Environment`、`Html`、`PerformanceMonitor` 等,减少手写样板代码。
- **@mediapipe/tasks-vision**(仅 try-on 用):Google 官方维护的人脸/手部关键点检测,WASM + 可选 GPU 委托,可在 Web Worker 里跑,推理完全在客户端本地完成、不上传视频帧——这对"摄像头试戴"这种敏感场景是重要的隐私卖点,文案上也可以直接体现("本地处理,不上传")。
- 不引入 `@react-three/postprocessing`:两个场景都要跑在中低端手机上,先把预算留给核心体验,滤镜类效果(如现有的 `FilmGrainOverlay`)在 try-on 里可以用一个简单的 fragment shader 或退化为 CSS 叠加层,不必上完整后处理管线。
- 构建期工具(devDependency):`gltf-transform` CLI 用于把美术提供的 `.glb` 做 Draco/Meshopt 压缩 + 贴图重打包,不进运行时 bundle。

`next.config.ts` 预计不需要改动(three.js 走标准 ESM,`drei` 亦然);若后续 `gltf-transform` 产物或 drei 子包出现 CJS/ESM 冲突,再按需加 `transpilePackages`。

## 3. 目录结构

```
src/components/atelier/
  three/                        # 两个场景共用的 r3f 基础设施
    canvas-stage.tsx            # <Canvas> 包裹层:tone mapping、DPR 上限、色彩管理
    use-webgl-support.ts        # 能力检测 hook(WebGL2 / prefers-reduced-motion)
    experience-fallback.tsx     # 复用 ParchmentCard 风格的降级 UI
    loading-veil.tsx            # 首屏 Suspense 占位(配合 FilmGrainOverlay 质感)
  explore/
    explore-experience.tsx      # 'use client',内部再动态 import 场景本体
    explore-scene.tsx           # r3f 场景:Room.glb + CameraRig + Hotspot
    camera-rig.tsx              # 沿预设样条移动的镜头控制
    hotspot.tsx                 # 货架热点 → 商品详情页
  try-on/
    try-on-experience.tsx       # 'use client',权限流程编排
    camera-gate.tsx             # 摄像头权限/隐私说明界面
    face-tracker.ts             # Web Worker:MediaPipe FaceLandmarker 封装
    jewelry-overlay.tsx         # r3f 场景:视频背景 + 饰品贴图跟随锚点

src/app/[locale]/atelier/
  explore/page.tsx              # Server Component:i18n 文案 + dynamic(ExploreExperience)
  try-on/page.tsx                # 同上,dynamic(TryOnExperience)
```

页面文件保持现有"服务端拿翻译 + 渲染壳"的模式,只把 `AtelierComingSoon` 换成动态引入的 3D 体验:

```tsx
// src/app/[locale]/atelier/explore/page.tsx
import dynamic from "next/dynamic";
import { getTranslations } from "next-intl/server";

const ExploreExperience = dynamic(
  () => import("@/components/atelier/explore/explore-experience"),
  { ssr: false, loading: () => <LoadingVeil /> }
);

export default async function AtelierExplorePage() {
  const t = await getTranslations("atelierPage");
  return (
    <div>
      {/* 保留原有 eyebrow/title 结构,与其它 atelier 页一致 */}
      <ExploreExperience />
    </div>
  );
}
```

`ssr: false` 是硬性要求:`Canvas`/`getUserMedia` 在 Node 环境下会直接报错或产生无意义的 hydration 差异。

## 4. Explore("逛店")场景设计

### 4.1 内容策略

不对商品做 3D 建模。房间本身是**一次性**制作的静态环境(大阪工作室的走廊/货架),由美术在 Blender 里做一版,导出 `room.glb`,`gltf-transform` 做 Draco 压缩 + 贴图 KTX2,目标体积 2–5MB。货架上的"商品"用带 alpha 的商品照片贴在简单平面/展示牌上即可,不需要每个商品单独建模。

### 4.2 导航方式

文案是"one corner at a time"(一次逛一个角落),不做自由飞行(容易眩晕、且要处理碰撞检测,收益不高)。采用**预设路径 + 分段停靠点**:

- 用 `CatmullRomCurve3` 定义 3–4 个"角落"停靠点。
- 复用 `ProcessFilmstrip` 已有的"Previous step / Next step"交互范式(`process` 命名空间里已有对应文案 key),在 explore 里加一组同构的翻页箭头驱动镜头在停靠点间插值移动,而不是允许玩家自由拖拽转圈。
- `prefers-reduced-motion` 为真时,跳过插值动画,直接切镜头。

### 4.3 热点(Hotspot)

- 页面 Server Component 侧只需 fetch 少量字段(`slug`, `title`, `images[0]`)传给 client 组件作为 hotspot 数据源,不需要额外的 Sanity schema 改动。
- 用 `drei` 的 `<Html transform>` 或简单的屏幕投影 sprite 渲染一个可点击标记,点击后用现有 `Link`(`@/i18n/navigation`)跳到商品详情页——3D 场景不接管购买流程,只做"发现 → 跳转"。

### 4.4 视觉一致性

- Tone mapping 用 `ACESFilmic`,配合暖色点光源逼近现有暖调(`--color-cream` / `--color-accent`)氛围;阴影/AO 尽量在 Blender 里烘焙进贴图,运行时只留 1–2 个动态光源,省 GPU。

## 5. Try-on("试戴")场景设计

这是复杂度和不确定性最高的部分,分阶段做。

### 5.1 内容策略(核心决策)

由于商品是一物一件,**默认不追求逐件建 3D 模型**。分两个阶段:

- **阶段一(默认路径)**:复用现有商品照片,做成**带透明背景的 2D 贴图广告牌(billboard)**,锚定到人脸/颈部关键点上,随头部姿态做简单的位置/旋转/透视矫正跟随。效果类似"贴纸试戴",成本几乎为零(不需要重新拍摄或建模)。
- **阶段二(增强,选做)**:为少数"主打款"提供真正的低面数 3D 模型(摄影测量或手工建模),挂在 Sanity 新增字段上,试戴时优先用 3D 模型、否则回退到阶段一的贴图方案。

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
  description: "Optional. Powers the /atelier/try-on preview. Falls back to a photo cutout when no model is set.",
}),
```

`category` 字段(`earrings-studs` / `ear-clips` / `necklaces`)已经能直接映射到默认 `anchor`,只有需要微调时才要求运营手动填 `offset`/`scale`。

### 5.2 追踪与渲染管线

1. `camera-gate.tsx`:请求 `getUserMedia` 前先展示一块 `ParchmentCard` 风格的说明("处理完全在你的设备本地完成,不会上传"),用户同意后才开摄像头——先解释再要权限,避免浏览器权限弹窗突兀。
2. 视频帧同时喂给:
   - 一个 `<video>` 元素 → 转成 `THREE.VideoTexture` 贴到一个铺满画布的平面上,作为"镜子"背景(前置摄像头需要**水平镜像**,和真实镜子一致)。
   - 一个 Web Worker 里的 `FaceLandmarker`(`@mediapipe/tasks-vision`),逐帧返回人脸关键点。
3. 主线程把关键点(视频像素坐标)映射到与视频等比的正交相机世界坐标系,驱动 `jewelry-overlay.tsx` 里贴图/模型的 `position`/`rotation`/`scale`。
4. Worker 中跑推理是为了不阻塞 r3f 的渲染循环(`useFrame`),避免掉帧。

### 5.3 降级与边界情况

统一走 `experience-fallback.tsx`(视觉上复用 `AtelierComingSoon` 的 parchment 卡片),覆盖:

- 浏览器不支持 WebGL2 / `mediaDevices`。
- 用户拒绝摄像头权限。
- 若干秒内检测不到人脸(光线太暗、镜头被挡)。
- `prefers-reduced-motion`:仍可试戴,但跳过任何镜头平滑/呼吸动画,直接贴合关键点。

每种情况的兜底文案都是"没关系,直接去看商品"+ 链接回 `/shop`,而不是死页面。

## 6. 跨场景的共享基建

- **`canvas-stage.tsx`**:统一设置 `dpr={[1, Math.min(devicePixelRatio, 2)]}`、`gl={{ antialias: true, powerPreference: "high-performance" }}`,并挂 `drei` 的 `<PerformanceMonitor>`,持续掉帧时自动降 DPR/关阴影,而不是一开始就假设设备能力。
- **代码分割边界**:`three` / `@react-three/fiber` / `@react-three/drei` / `@mediapipe/tasks-vision` 只应出现在这两条路由的 chunk 里,不能被 `site-header`、`site-footer` 等全局布局间接引入。上线前用 `next build` 的产物分析确认。
- **i18n**:两个体验都需要新增文案 key(加载中、摄像头权限说明、无人脸检测提示、降级文案),补进 `messages/*.json` 全部 10 个语言文件,归入现有 `atelierPage` 命名空间下,作为实现阶段的内容任务,不阻塞本方案。
- **状态**:两个场景都是页面局部状态(当前停靠点 / 权限状态/追踪状态),用组件内 `useState`/`useRef` 即可,暂不需要接入现有的 Zustand store(`server-wishlist-store.ts` 这类是跨页面共享状态,3D 场景状态没有跨页面共享的需求)。

## 7. 性能预算

| 项目 | 目标 |
|---|---|
| Explore 路由额外 JS(gzip) | ≤ 350KB(three + fiber + drei 精简导入) |
| Explore 首次可交互 | 中端手机(如 iPhone 12 级别)≤ 3s 看到房间 |
| room.glb 体积 | 2–5MB(Draco + KTX2 压缩后) |
| Try-on 追踪帧率 | 桌面 ≥ 30fps,手机 ≥ 24fps,低于阈值时 `PerformanceMonitor` 自动降级 |
| MediaPipe WASM 资产 | 仅在用户点击"开始试戴"、授权摄像头之后才动态加载,不计入首屏 |

## 8. 分阶段落地计划

1. **M0 基础设施**:装依赖、`canvas-stage`/`use-webgl-support`/降级 UI,两个路由先接入但场景内容留空(验证 SSR 边界、bundle 隔离、reduced-motion 分支都工作正常)。
2. **M1 Explore v1**:一版 Blender 房间 + 分段镜头导航 + 商品热点跳转,无需 Sanity schema 改动。
3. **M2 Try-on v1**:摄像头权限流程 + 人脸关键点追踪 + 商品照片贴图跟随(阶段一方案),覆盖 `earrings-studs` / `ear-clips` / `necklaces` 三类,补 `tryOn.anchor` 的 schema 字段与默认值推导。
4. **M3 增强(选做)**:为主打款接入真 3D 模型(`tryOn.model`),Explore 房间增加更多"角落",试戴画面叠加与 `FilmGrainOverlay` 呼应的胶片质感 shader。

## 9. 待决问题(需要产品/美术/法务确认)

- Explore 房间的 3D 环境由谁制作(内部美术 / 外包),这决定 M1 的排期,不是纯工程问题。
- Try-on 阶段二(逐件 3D 建模)投入产出比需要业务侧判断,先按"选做"处理,不影响 M1/M2 上线。
- 摄像头试戴虽然处理完全在本地、不上传视频帧,隐私文案(尤其涉及"面部"关键点这类敏感表述)建议法务过一遍措辞。
