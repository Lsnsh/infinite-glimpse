import { WaterfallConfig, WaterfallScene } from './waterfall';
import { NebulaConfig, NebulaScene } from './nebula';
import { BaseScene } from '../core/BaseScene';
import { SceneConfig } from '../types/scene';

export interface SceneEntry {
    config: SceneConfig;
    sceneClass: new () => BaseScene;
}

export const SceneRegistry: Record<string, SceneEntry> = {
    waterfall: {
        config: WaterfallConfig,
        sceneClass: WaterfallScene
    },
    nebula: {
        config: NebulaConfig,
        sceneClass: NebulaScene
    }
};

export const getSceneConfigs = (): SceneConfig[] => {
    return Object.values(SceneRegistry).map(entry => entry.config);
};

export const getSceneConfig = (id: string): SceneConfig | undefined => {
    return SceneRegistry[id]?.config;
};

export const createScene = async (id: string): Promise<BaseScene | null> => {
    const entry = SceneRegistry[id];
    if (!entry) return null;
    
    const scene = new entry.sceneClass();
    await scene.init();
    return scene;
}; 