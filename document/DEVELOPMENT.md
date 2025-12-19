# 开发手册

> 架构设计、组件规范、UI 设计、开发进度

---

## 一、技术架构

### 技术栈

| 层级 | 技术 | 用途 |
|------|------|------|
| 框架 | VitePress + Vue 3 | 静态站点 + 组件 |
| UI | Vuetify 3 | 基础 UI |
| 类型 | TypeScript | 类型安全 |
| 数据 | Atlas Academy API | FGO 数据源 |

### 核心原则

1. **函数式编程** - 避免 class，优先纯函数
2. **文件限制** - 单文件 < 400 行
3. **JSDoc 优先** - 无普通注释

### 目录结构

```
docs/src/playground/
├── components/story/
│   ├── layout/           # StoryLayout, StoryDemo
│   ├── dialogue/         # DialogueBox, Speaker, Text, Controls, Choices
│   ├── scene/            # SceneCharacter
│   └── editor/           # LayoutEditor
├── services/             # atlas-api, script-parser
├── composables/          # useSceneRenderer, useStoryPlayer
├── utils/                # layout-calculator
└── types/                # 类型定义
```

---

## 二、组件设计

### 组件拆分

| 组件 | 行数限制 | 职责 |
|------|---------|------|
| StoryLayout.vue | <300 | 主布局 + 响应式 |
| DialogueBox.vue | <200 | 对话框容器 |
| DialogueSpeaker.vue | <60 | 名字标签 |
| DialogueText.vue | <150 | 文本渲染 + Ruby + 自适应字体 |
| DialogueControls.vue | <100 | 控制按钮 |
| DialogueChoices.vue | <100 | 选项系统 |
| SceneCharacter.vue | <150 | 角色渲染 |

### Composables

| 函数 | 职责 |
|------|------|
| `useSceneRenderer` | 舞台尺寸、角色布局计算 |
| `useStoryPlayer` | GalGame 状态机 |

---

## 三、UI 设计规范

### 核心约束

- **舞台比例**: 1024:626 (FGO 背景)
- **角色高度**: 768px (身体部分)
- **全屏适配**: 100vh，禁止垂直滚动

### CSS 变量

```css
:root {
  --fgo-gold: #c9a227;
  --fgo-blue: #4a8abf;
  --fgo-dark: #08080a;
  --stage-width: 1024px; /* 动态计算 */
}
```

### 布局结构 (桌面端)

```
┌─────────────────────────────────────────────────┐
│                VitePress NavBar                  │
├─────────┬──────────────────────────┬────────────┤
│ Sidebar │      Story Stage         │  Sidebar   │
│ (240px) │    ┌────────────────┐    │  (240px)   │
│         │    │  Characters    │    │            │
│         │    │  ┌──────────┐  │    │            │
│         │    │  │ Dialogue │  │    │            │
│         │    │  └──────────┘  │    │            │
│         │    └────────────────┘    │            │
└─────────┴──────────────────────────┴────────────┘
```

### FGO UI 资源

| 资源 | 路径 | 用途 |
|------|------|------|
| img_talk_textbg.png | /SystemUI/ | 对话框背景 |
| img_talk_namebg.png | /SystemUI/ | 名字标签 |
| img_talk_selectbg.png | /SystemUI/ | 选项背景 |
| btn_log.png | /SystemUI/ | 复制按钮 |
| btn_ff.png | /SystemUI/ | 返回按钮 |

### 文本格式

| 格式 | 语法 | 渲染 |
|------|------|------|
| Ruby | `{汉字\|注音}` | `<ruby>` |
| 傍点 | `**text**` | text-emphasis |
| 颜色 | `[red:text]` | 红色文字 |

### 响应式

| 屏幕 | 布局 | 侧边栏 |
|------|------|--------|
| > 1100px | 三栏 | 显示 |
| ≤ 1100px | 单栏 | 隐藏 |

---

## 四、已完成功能

### 角色渲染 ✅

- `_merged.png` 精灵图 (768px 身体 + 差分)
- `SVT_SCRIPTS` 控制表情位置
- `overflow: hidden` 裁剪差分
- 1/2/3 人场景布局

**核心代码**:
```typescript
const faceIndex = face - 1
const col = faceIndex % 4
const row = Math.floor(faceIndex / 4)
const offsetY = 768 + row * 256  // 表情从 768px 开始
```

### 对话框 ✅

- FGO UI 资源背景
- 自适应字体大小
- Ruby 注音 + 傍点强调
- 响应式缩放 (`transform: scale()`)

### 布局 ✅

- 舞台 1024:626 严格比例
- 对话框在舞台内部底部
- 窗口 resize 自适应

### 数据流 ✅

- Atlas Academy API 对接
- `nice_war.json` 章节列表
- `nice_servant_lore.json` 从者信息

---

## 五、待办事项

### 高优先级
- [ ] 脚本解析器完善
- [ ] GalGame 状态机
- [ ] 选项交互完整流程

### 中优先级
- [ ] 音频系统 (BGM/SE/Voice)
- [ ] 场景过渡动画
- [ ] CN 审查映射

### 低优先级
- [ ] 阅读进度保存
- [ ] 书签系统
