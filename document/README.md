# FGO Story Archive

> GalGame 风格 FGO 剧情阅读器 | VitePress + Vue 3 + Atlas Academy API

## 项目状态

| 模块 | 状态 |
|------|------|
| 角色渲染 (768px + 表情差分) | ✅ |
| 对话框 (文本格式 + 自适应字体) | ✅ |
| 布局 (响应式 + 比例缩放) | ✅ |
| 脚本解析 (原始脚本 → JSON) | 🚧 |
| GalGame 交互 (选项/回退/历史) | 🚧 |

## 文档索引

| 文档 | 内容 |
|------|------|
| [DEVELOPMENT.md](./DEVELOPMENT.md) | **开发手册** - 架构、组件、UI、进度 |
| [SCRIPT.md](./SCRIPT.md) | **脚本系统** - 格式分析、解析器、GalGame 交互 |
| [ATLAS.md](./ATLAS.md) | **数据源** - API、资源 URL、角色渲染原理 |
| [EXTRAS.md](./EXTRAS.md) | **扩展功能** - CN 映射、剧情索引、工具 |

## 快速开始

```bash
pnpm install
pnpm docs:dev
# 访问 http://localhost:5173/playground/test-pages/story-layout-demo.html
```

## 技术栈

- **VitePress** - 静态站点
- **Vue 3 + TypeScript** - 组件开发
- **Vuetify 3** - UI 组件
- **Atlas Academy API** - 数据源

## 外部参考

- [Atlas Academy API](https://api.atlasacademy.io/docs)
- [Atlas Academy Apps](https://github.com/atlasacademy/apps)
