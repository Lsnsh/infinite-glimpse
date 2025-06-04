import * as THREE from 'three';
import { SceneConfig, OrbitMovement, FlythroughMovement } from '../types/scene';

export class CameraController {
    private camera: THREE.PerspectiveCamera;
    private isActive = false;
    private animationId?: number;
    private currentMovement?: OrbitMovement | FlythroughMovement;
    private movementTime = 0;

    constructor(camera: THREE.PerspectiveCamera) {
        this.camera = camera;
    }

    startMovement(config: SceneConfig) {
        this.stopMovement();
        this.isActive = true;
        this.movementTime = 0;

        // 设置初始相机位置
        this.camera.position.copy(config.camera.initialPosition);
        this.camera.lookAt(config.camera.lookAt);

        this.currentMovement = config.camera.movement;
    }

    stopMovement() {
        this.isActive = false;
        this.currentMovement = undefined;
        if (this.animationId) {
            cancelAnimationFrame(this.animationId);
            this.animationId = undefined;
        }
    }

    update(deltaTime: number) {
        if (!this.isActive || !this.currentMovement) return;

        this.movementTime += deltaTime;

        if (this.currentMovement.type === 'orbit') {
            this.updateOrbitMovement(this.currentMovement);
        } else if (this.currentMovement.type === 'flythrough') {
            this.updateFlythroughMovement(this.currentMovement);
        }
    }

    private updateOrbitMovement(movement: OrbitMovement) {
        const angle = this.movementTime * movement.speed;

        this.camera.position.x = Math.sin(angle) * movement.radius;
        this.camera.position.z = Math.cos(angle) * movement.radius;
        this.camera.position.y = Math.sin(angle * movement.verticalFrequency) * movement.verticalAmplitude;

        this.camera.lookAt(0, 0, 0);
    }

    private updateFlythroughMovement(movement: FlythroughMovement) {
        // 向前飞行
        this.camera.position.z += movement.forwardSpeed;

        // 侧向运动
        this.camera.position.x = Math.sin(this.movementTime * movement.lateralFrequency) * movement.lateralAmplitude;
        this.camera.position.y = Math.cos(this.movementTime * movement.verticalFrequency) * movement.verticalAmplitude;

        // 相机看向前方稍微偏移的点
        const lookTarget = new THREE.Vector3(
            Math.sin(this.movementTime * 0.1) * 5,
            Math.cos(this.movementTime * 0.15) * 3,
            this.camera.position.z - 10
        );
        this.camera.lookAt(lookTarget);

        // 重置位置
        if (this.camera.position.z < movement.resetDistance) {
            this.camera.position.z = movement.resetPosition;
        }
    }

    private startOrbitMovement(movement: OrbitMovement) {
        let angle = 0;

        const animate = () => {
            if (!this.isActive) return;

            angle += movement.speed;

            this.camera.position.x = Math.sin(angle) * movement.radius;
            this.camera.position.z = Math.cos(angle) * movement.radius;
            this.camera.position.y = Math.sin(angle * movement.verticalFrequency) * movement.verticalAmplitude;

            this.camera.lookAt(0, 0, 0);

            this.animationId = requestAnimationFrame(animate);
        };

        animate();
    }

    private startFlythroughMovement(movement: FlythroughMovement) {
        let time = 0;

        const animate = () => {
            if (!this.isActive) return;

            time += 0.01;

            // 向前飞行
            this.camera.position.z += movement.forwardSpeed;

            // 侧向运动
            this.camera.position.x = Math.sin(time * movement.lateralFrequency) * movement.lateralAmplitude;
            this.camera.position.y = Math.cos(time * movement.verticalFrequency) * movement.verticalAmplitude;

            // 相机看向前方稍微偏移的点
            const lookTarget = new THREE.Vector3(
                Math.sin(time * 0.1) * 5,
                Math.cos(time * 0.15) * 3,
                this.camera.position.z - 10
            );
            this.camera.lookAt(lookTarget);

            // 重置位置
            if (this.camera.position.z < movement.resetDistance) {
                this.camera.position.z = movement.resetPosition;
            }

            this.animationId = requestAnimationFrame(animate);
        };

        animate();
    }
} 