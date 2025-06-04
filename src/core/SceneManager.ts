import * as THREE from 'three';
import { BaseScene } from './BaseScene';

export class SceneManager {
    private renderer: THREE.WebGLRenderer;
    private scenes: Map<string, BaseScene> = new Map();
    private activeScene: BaseScene | null = null;
    private camera!: THREE.PerspectiveCamera;
    private clock: THREE.Clock;

    constructor(renderer: THREE.WebGLRenderer) {
        this.renderer = renderer;
        this.clock = new THREE.Clock();
        this.initCamera();
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

    addScene(name: string, scene: BaseScene) {
        this.scenes.set(name, scene);
        scene.setCamera(this.camera);
    }

    setActiveScene(name: string | null) {
        if (name === null) {
            this.activeScene = null;
            return;
        }

        const scene = this.scenes.get(name);
        if (scene) {
            this.activeScene = scene;
            scene.onActivate();
        }
    }

    update() {
        const deltaTime = this.clock.getDelta();
        
        if (this.activeScene) {
            this.activeScene.update(deltaTime);
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