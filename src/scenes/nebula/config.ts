import * as THREE from 'three';

export const NebulaConfig = {
    id: 'nebula',
    name: '宇宙星云',
    description: '穿越星际空间，掠过精致的三角面星云，感受宇宙的浩瀚',
    camera: {
        initialPosition: new THREE.Vector3(0, 5, 10),
        lookAt: new THREE.Vector3(0, 0, -20),
        movement: {
            type: 'flythrough' as const,
            forwardSpeed: -0.08,
            lateralAmplitude: 3,
            verticalAmplitude: 2,
            lateralFrequency: 0.2,
            verticalFrequency: 0.15,
            resetDistance: -150,
            resetPosition: 50
        }
    }
}; 