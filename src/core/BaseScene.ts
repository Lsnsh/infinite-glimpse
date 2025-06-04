import * as THREE from 'three';

export abstract class BaseScene {
    protected scene: THREE.Scene;
    protected camera: THREE.PerspectiveCamera | null = null;
    protected isInitialized = false;

    constructor() {
        this.scene = new THREE.Scene();
    }

    abstract init(): Promise<void>;
    abstract update(deltaTime: number): void;

    setCamera(camera: THREE.PerspectiveCamera) {
        this.camera = camera;
    }

    getScene(): THREE.Scene {
        return this.scene;
    }

    onActivate() {
        // 场景激活时的回调
    }

    onDeactivate() {
        // 场景停用时的回调
    }

    onResize(width: number, height: number) {
        // 窗口大小改变时的回调
    }

    dispose() {
        // 清理资源
        this.scene.traverse((object) => {
            if (object instanceof THREE.Mesh) {
                object.geometry.dispose();
                if (object.material instanceof THREE.Material) {
                    object.material.dispose();
                } else if (Array.isArray(object.material)) {
                    object.material.forEach(material => material.dispose());
                }
            }
        });
    }
} 