import * as THREE from 'three';
import { gsap } from 'gsap';
import { SceneManager } from './core/SceneManager';
import { getSceneConfigs, createScene } from './scenes/SceneRegistry';
import { UI } from './ui/UI';

class InfiniteGlimpse {
    private renderer!: THREE.WebGLRenderer;
    private sceneManager!: SceneManager;
    private ui!: UI;
    private isInitialized = false;
    private currentSceneIndex = 0;
    private sceneIds: string[] = [];

    constructor() {
        this.init();
    }

    private async init() {
        try {
            // 初始化渲染器
            this.initRenderer();
            
            // 初始化UI
            this.ui = new UI();
            
            // 初始化场景管理器
            this.sceneManager = new SceneManager(this.renderer);
            
            // 添加场景
            await this.addScenes();
            
            // 设置事件监听
            this.setupEventListeners();
            
            // 开始渲染循环
            this.animate();
            
            // 隐藏加载屏幕
            this.hideLoadingScreen();
            
            this.isInitialized = true;
            
        } catch (error) {
            console.error('初始化失败:', error);
        }
    }

    private initRenderer() {
        const canvas = document.getElementById('main-canvas') as HTMLCanvasElement;
        const container = document.getElementById('canvas-container');
        
        this.renderer = new THREE.WebGLRenderer({
            canvas,
            antialias: true,
            alpha: true,
            powerPreference: "high-performance"
        });
        
        this.renderer.setSize(container!.clientWidth, container!.clientHeight);
        this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
        this.renderer.outputColorSpace = THREE.SRGBColorSpace;
        this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
        this.renderer.toneMappingExposure = 1.5;
        
        // 启用阴影
        this.renderer.shadowMap.enabled = true;
        this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
        
        // 优化透明物体渲染
        this.renderer.sortObjects = true;
    }

    private async addScenes() {
        // 获取所有场景配置
        const configs = getSceneConfigs();
        this.sceneIds = configs.map(config => config.id);
        
        console.log('场景ID列表:', this.sceneIds);
        
        // 创建并添加场景
        for (const config of configs) {
            console.log(`正在加载场景: ${config.name} (ID: ${config.id})`);
            const scene = await createScene(config.id);
            if (scene) {
                this.sceneManager.addScene(config.id, scene, config);
                console.log(`场景加载完成: ${config.name}`);
            } else {
                console.error(`场景创建失败: ${config.id}`);
            }
        }
    }

    private setupEventListeners() {
        // 窗口大小调整
        window.addEventListener('resize', () => this.onWindowResize());
        
        // UI事件
        this.ui.onStartExperience(() => {
            this.startExperience();
        });
        
        this.ui.onSceneChange((direction) => {
            this.changeScene(direction);
        });
        
        this.ui.onBackToHome(() => {
            this.backToHome();
        });
    }

    private onWindowResize() {
        const container = document.getElementById('canvas-container');
        if (!container) return;
        
        const width = window.innerWidth;
        const height = window.innerHeight;
        
        this.renderer.setSize(width, height);
        this.sceneManager.onResize(width, height);
    }

    private startExperience() {
        this.ui.showSceneControls();
        this.activateCurrentScene();
        
        // 平滑过渡到第一个场景
        gsap.to(document.getElementById('home-screen'), {
            opacity: 0,
            duration: 1,
            onComplete: () => {
                document.getElementById('home-screen')!.style.display = 'none';
            }
        });
    }

    private changeScene(direction: 'next' | 'prev') {
        if (direction === 'next') {
            this.currentSceneIndex = (this.currentSceneIndex + 1) % this.sceneIds.length;
        } else {
            this.currentSceneIndex = (this.currentSceneIndex - 1 + this.sceneIds.length) % this.sceneIds.length;
        }
        
        // 添加场景切换动画
        const camera = this.sceneManager.getCamera();
        const currentPos = camera.position.clone();
        
        // 短暂的过渡效果
        gsap.to(camera.position, {
            z: currentPos.z + 5,
            duration: 0.3,
            onComplete: () => {
                // 切换场景并更新UI
                this.activateCurrentScene();
                
                // 恢复相机位置会在相机控制器中处理
            }
        });
        
        console.log('切换到场景:', this.sceneIds[this.currentSceneIndex]);
    }

    private activateCurrentScene() {
        const sceneId = this.sceneIds[this.currentSceneIndex];
        console.log(`激活场景: ${sceneId} (索引: ${this.currentSceneIndex})`);
        this.sceneManager.setActiveScene(sceneId);
        
        // 更新UI文案
        const config = this.sceneManager.getCurrentSceneConfig();
        if (config) {
            console.log(`场景配置: ${config.name}`);
            this.ui.updateSceneInfo(config.name, config.description);
        } else {
            console.error('无法获取场景配置');
        }
    }

    private backToHome() {
        this.ui.showHomeScreen();
        this.sceneManager.setActiveScene(null);
        
        const homeScreen = document.getElementById('home-screen')!;
        homeScreen.style.display = 'block';
        gsap.fromTo(homeScreen, 
            { opacity: 0 },
            { opacity: 1, duration: 1 }
        );
    }

    private hideLoadingScreen() {
        const loadingScreen = document.getElementById('loading-screen');
        if (loadingScreen) {
            gsap.to(loadingScreen, {
                opacity: 0,
                duration: 1,
                onComplete: () => {
                    loadingScreen.style.display = 'none';
                }
            });
        }
    }

    private animate = () => {
        requestAnimationFrame(this.animate);
        
        if (this.isInitialized) {
            this.sceneManager.update();
            this.sceneManager.render();
        }
    };
}

// 启动应用
new InfiniteGlimpse(); 