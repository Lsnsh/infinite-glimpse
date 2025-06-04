# 无限掠影 (Infinite Glimpse)

一个基于 Three.js 的 Web3D 体验项目，模拟透过窗户观看无限变化的美丽风景。

## 功能特点

- 🌊 **梦幻瀑布场景** - 基于自定义着色器的流动效果
- 🎨 **动态色彩** - 深蓝紫色调的艺术化渲染
- ✨ **粒子系统** - 增强视觉沉浸感
- 🖼️ **窗户框架** - 模拟真实的观看体验
- 📱 **响应式设计** - 适配各种屏幕尺寸

## 技术栈

- **Three.js** - 3D 图形渲染
- **TypeScript** - 类型安全的开发
- **Vite** - 快速的构建工具
- **GSAP** - 流畅的动画效果
- **WebGL Shaders** - 自定义视觉效果

## 安装和运行

```bash
# 安装依赖
npm install

# 开发模式
npm run dev

# 构建生产版本
npm run build

# 预览构建结果
npm run preview
```

## 项目结构

```
src/
├── core/           # 核心系统
│   ├── BaseScene.ts
│   └── SceneManager.ts
├── scenes/         # 场景实现
│   └── WaterfallScene.ts
├── ui/            # 用户界面
│   └── UI.ts
├── styles/        # 样式文件
│   └── main.css
└── main.ts        # 主入口文件
```

## 开发说明

### 添加新场景

1. 继承 `BaseScene` 类
2. 实现 `init()` 和 `update()` 方法
3. 在 `SceneManager` 中注册新场景

### 自定义着色器

项目大量使用 WebGL 着色器实现视觉效果，主要位于各个场景文件中。

## 浏览器支持

- Chrome 88+
- Firefox 78+
- Safari 14+
- Edge 88+

需要支持 WebGL 2.0 的现代浏览器。
