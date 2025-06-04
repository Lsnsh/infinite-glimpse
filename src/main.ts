import * as THREE from 'three';
import { gsap } from 'gsap';
import { SceneManager } from './core/SceneManager';
import { WaterfallScene } from './scenes/WaterfallScene';
import { UI } from './ui/UI';

class InfiniteGlimpse {
    private renderer!: THREE.WebGLRenderer;
    private sceneManager!: SceneManager;
    private ui!: UI;
    private isInitialized = false;
    private cameraAutoMove = true;
    private cameraMoveTween?: gsap.core.Tween;

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
            alpha: true
        });
        
        this.renderer.setSize(container!.clientWidth, container!.clientHeight);
        this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
        this.renderer.outputColorSpace = THREE.SRGBColorSpace;
        this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
        this.renderer.toneMappingExposure = 1.2;
        
        // 启用阴影
        this.renderer.shadowMap.enabled = true;
        this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    }

    private async addScenes() {
        // 添加瀑布场景
        const waterfallScene = new WaterfallScene();
        await waterfallScene.init();
        this.sceneManager.addScene('waterfall', waterfallScene);
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
        this.sceneManager.setActiveScene('waterfall');
        this.startCameraAutoMovement();
        
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
        // 这里可以实现场景切换逻辑
        console.log('切换场景:', direction);
    }

    private backToHome() {
        this.ui.showHomeScreen();
        this.sceneManager.setActiveScene(null);
        this.stopCameraAutoMovement();
        
        const homeScreen = document.getElementById('home-screen')!;
        homeScreen.style.display = 'block';
        gsap.fromTo(homeScreen, 
            { opacity: 0 },
            { opacity: 1, duration: 1 }
        );
    }

    private startCameraAutoMovement() {
        if (!this.cameraAutoMove) return;
        
        const camera = this.sceneManager.getCamera();
        
        // 设置初始位置
        camera.position.set(0, 2, 8);
        camera.lookAt(0, 0, 0);
        
        // 创建一个简单的环绕运动动画
        const radius = 8;
        let angle = 0;
        
        const animateCamera = () => {
            if (!this.cameraAutoMove) return;
            
            angle += 0.005; // 控制旋转速度
            
            // 计算新位置
            camera.position.x = Math.sin(angle) * radius;
            camera.position.z = Math.cos(angle) * radius;
            camera.position.y = 2 + Math.sin(angle * 0.5) * 1; // 添加一些垂直运动
            
            // 让摄像机始终看向场景中心
            camera.lookAt(0, 0, 0);
            
            requestAnimationFrame(animateCamera);
        };
        
        animateCamera();
    }

    private stopCameraAutoMovement() {
        if (this.cameraMoveTween) {
            this.cameraMoveTween.kill();
        }
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