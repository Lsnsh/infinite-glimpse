import * as THREE from 'three';

export const WaterfallConfig = {
    id: 'waterfall',
    name: '梦幻瀑布',
    description: '流动的光影与色彩交织，宛如梦境中的瀑布奇观',
    camera: {
        initialPosition: new THREE.Vector3(0, 2, 8),
        lookAt: new THREE.Vector3(0, 0, 0),
        movement: {
            type: 'orbit' as const,
            radius: 8,
            speed: 0.005,
            verticalAmplitude: 1,
            verticalFrequency: 0.5
        }
    }
}; 