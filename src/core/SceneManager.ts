import * as THREE from 'three';
import { BaseScene } from './BaseScene';
import { CameraController } from './CameraController';
import { SceneConfig } from '../types/scene';

export class SceneManager {
    private renderer: THREE.WebGLRenderer;
    private scenes: Map<string, BaseScene> = new Map();
    private sceneConfigs: Map<string, SceneConfig> = new Map();
    private activeScene: BaseScene | null = null;
    private activeSceneId: string | null = null;
    private camera!: THREE.PerspectiveCamera;
    private cameraController!: CameraController;
    private clock: THREE.Clock;
    private homeTime = 0;

    constructor(renderer: THREE.WebGLRenderer) {
        this.renderer = renderer;
        this.clock = new THREE.Clock();
        this.initCamera();
        this.cameraController = new CameraController(this.camera);
    }

    private initCamera() {
        this.camera = new THREE.PerspectiveCamera(
            75,
            window.innerWidth / window.innerHeight,
            0.1,
            1000
        );
        this.camera.position.set(0, 0, 5);
    }

    addScene(id: string, scene: BaseScene, config: SceneConfig) {
        this.scenes.set(id, scene);
        this.sceneConfigs.set(id, config);
        scene.setCamera(this.camera);
    }

    setActiveScene(id: string | null) {
        // 停止当前相机运动
        this.cameraController.stopMovement();
        
        if (id === null) {
            this.activeScene = null;
            this.activeSceneId = null;
            this.homeTime = 0; // 重置主页时间
            return;
        }

        const scene = this.scenes.get(id);
        const config = this.sceneConfigs.get(id);
        
        if (scene && config) {
            // 停用当前场景
            if (this.activeScene) {
                this.activeScene.onDeactivate();
            }
            
            // 激活新场景
            this.activeScene = scene;
            this.activeSceneId = id;
            scene.onActivate();
            
            // 启动相机运动
            this.cameraController.startMovement(config);
        }
    }

    getCurrentSceneConfig(): SceneConfig | null {
        if (!this.activeSceneId) return null;
        return this.sceneConfigs.get(this.activeSceneId) || null;
    }

    getSceneIds(): string[] {
        return Array.from(this.scenes.keys());
    }

    update() {
        const deltaTime = this.clock.getDelta();
        
        if (this.activeScene) {
            // 更新相机控制器
            this.cameraController.update(deltaTime);
            this.activeScene.update(deltaTime);
        } else {
            // 主页相机动画
            this.homeTime += deltaTime;
            const angle = this.homeTime * 0.2;
            this.camera.position.x = Math.sin(angle) * 3;
            this.camera.position.z = Math.cos(angle) * 3 + 2;
            this.camera.position.y = Math.sin(angle * 0.5) * 1;
            this.camera.lookAt(0, 0, 0);
        }
    }

    render() {
        if (this.activeScene) {
            this.renderer.render(this.activeScene.getScene(), this.camera);
        } else {
            // 渲染默认的空场景或主页背景
            this.renderHomeBackground();
        }
    }

    private renderHomeBackground() {
        // 创建一个简单的渐变背景
        const scene = new THREE.Scene();
        
        // 添加渐变背景
        const geometry = new THREE.PlaneGeometry(20, 20);
        const material = new THREE.ShaderMaterial({
            uniforms: {
                time: { value: this.clock.getElapsedTime() }
            },
            vertexShader: `
                varying vec2 vUv;
                void main() {
                    vUv = uv;
                    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
                }
            `,
            fragmentShader: `
                uniform float time;
                varying vec2 vUv;
                
                void main() {
                    vec2 uv = vUv;
                    
                    // 创建动态渐变
                    float gradient = length(uv - 0.5);
                    vec3 color1 = vec3(0.1, 0.1, 0.3);
                    vec3 color2 = vec3(0.3, 0.1, 0.5);
                    vec3 color3 = vec3(0.1, 0.3, 0.6);
                    
                    vec3 finalColor = mix(color1, color2, gradient);
                    finalColor = mix(finalColor, color3, sin(time * 0.5) * 0.5 + 0.5);
                    
                    gl_FragColor = vec4(finalColor, 1.0);
                }
            `
        });
        
        const mesh = new THREE.Mesh(geometry, material);
        mesh.position.z = -10;
        scene.add(mesh);
        
        this.renderer.render(scene, this.camera);
    }

    onResize(width: number, height: number) {
        this.camera.aspect = width / height;
        this.camera.updateProjectionMatrix();
        
        if (this.activeScene) {
            this.activeScene.onResize(width, height);
        }
    }

    getCamera(): THREE.PerspectiveCamera {
        return this.camera;
    }
} 