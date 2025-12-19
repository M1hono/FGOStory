# FGO Story Reader - Playground

## Overview
This playground area is used to test and develop Vue components for the FGO Story Reader. All components here are based on the validated HTML prototypes in `/playground/html/` and the design specifications in `/document/`.

## Structure

```
playground/
├── components/story/         # Vue 组件
│   ├── scene/               # 场景渲染组件
│   ├── dialogue/            # 对话系统组件  
│   ├── sidebars/            # 侧边栏组件
│   ├── controls/            # 控制面板组件
│   └── animations/          # 动效组件
├── composables/             # Vue Composables
├── utils/                   # 工具函数
├── types/                   # TypeScript 类型定义
├── styles/                  # 样式文件
└── test-pages/             # 测试页面
```

## Testing Approach

1. **Component Testing**: Each component is tested in isolation
2. **Integration Testing**: Test component interactions
3. **Responsive Testing**: Validate mobile/tablet/desktop layouts
4. **Performance Testing**: Ensure smooth animations and rendering

## Key References

- HTML Prototypes: `/playground/html/test-*.html` (validated rendering logic)
- Design Docs: `/document/COMPONENTS.md`, `/document/UI_DESIGN.md`
- API Integration: `/document/VITEPRESS_INTEGRATION.md`

## Development Rules

- Each component file must be < 400 lines
- Follow functional programming patterns  
- Use TypeScript with strict type checking
- Test on multiple screen sizes
- Validate against HTML prototype behavior
