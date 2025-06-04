import * as THREE from 'three';

export interface SceneConfig {
    id: string;
    name: string;
    description: string;
    camera: {
        initialPosition: THREE.Vector3;
        lookAt: THREE.Vector3;
        movement: OrbitMovement | FlythroughMovement;
    };
}

export interface OrbitMovement {
    type: 'orbit';
    radius: number;
    speed: number;
    verticalAmplitude: number;
    verticalFrequency: number;
}

export interface FlythroughMovement {
    type: 'flythrough';
    forwardSpeed: number;
    lateralAmplitude: number;
    verticalAmplitude: number;
    lateralFrequency: number;
    verticalFrequency: number;
    resetDistance: number;
    resetPosition: number;
} 