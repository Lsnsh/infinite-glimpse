# 无限掠影 - 项目架构文档

## 📁 项目结构

```
src/
├── core/                    # 核心模块
│   ├── BaseScene.ts        # 场景基类
│   ├── SceneManager.ts     # 场景管理器
│   └── CameraController.ts # 相机控制器
├── scenes/                 # 场景模块
│   ├── SceneRegistry.ts    # 场景注册表
│   ├── waterfall/          # 瀑布场景
│   │   ├── index.ts        # 导出文件
│   │   ├── config.ts       # 场景配置
│   │   └── WaterfallScene.ts # 场景实现
│   └── nebula/            # 星云场景
│       ├── index.ts        # 导出文件
│       ├── config.ts       # 场景配置
│       └── NebulaScene.ts  # 场景实现
├── types/                  # 类型定义
│   └── scene.ts           # 场景相关类型
├── ui/                     # 用户界面
│   └── UI.ts              # UI管理器
└── main.ts                # 应用入口
```

## 🏗️ 架构设计

### 核心模块 (core/)

#### BaseScene
所有场景的基类，定义了场景的基本接口：
- `init()`: 异步初始化场景
- `update()`: 每帧更新
- `onActivate()`: 场景激活时调用
- `onDeactivate()`: 场景停用时调用
- `onResize()`: 窗口大小改变时调用

#### SceneManager
场景管理器，负责：
- 管理所有场景实例
- 处理场景切换
- 渲染当前活动场景
- 相机管理

#### CameraController
相机控制器，支持不同的相机运动模式：
- `orbit`: 环绕运动（适用于瀑布场景）
- `flythrough`: 飞行穿越（适用于星云场景）

### 场景模块 (scenes/)

#### 场景配置
每个场景都有独立的配置文件，包含：
- 场景基本信息（名称、描述）
- 相机设置（初始位置、运动参数）

#### 场景注册表
统一管理所有场景：
- 自动注册场景类和配置
- 提供场景创建工厂方法
- 支持动态场景加载

### 类型系统 (types/)

#### SceneConfig
场景配置接口，定义：
- 场景基本属性
- 相机运动类型（OrbitMovement | FlythroughMovement）

## 🔄 数据流

1. **应用启动**
   - 从SceneRegistry获取所有场景配置
   - 异步创建场景实例
   - 注册到SceneManager

2. **场景切换**
   - UI触发切换事件
   - SceneManager停用当前场景
   - 激活新场景并启动相机运动
   - UI更新场景信息

3. **渲染循环**
   - SceneManager更新当前场景
   - 渲染场景到画布
   - CameraController处理相机动画

## 🎯 扩展指南

### 添加新场景

1. 在 `src/scenes/` 下创建场景目录
2. 创建场景配置文件 `config.ts`
3. 实现场景类继承 `BaseScene`
4. 创建索引文件 `index.ts`
5. 在 `SceneRegistry.ts` 中注册场景

### 添加新的相机运动模式

1. 在 `src/types/scene.ts` 中定义新的运动类型
2. 在 `CameraController.ts` 中实现运动逻辑
3. 在场景配置中使用新的运动模式

## 🚀 性能优化

- 场景懒加载：只在需要时创建场景实例
- 相机动画优化：使用 requestAnimationFrame
- 资源管理：场景切换时清理不需要的资源
- 模块化：按需加载场景相关代码 