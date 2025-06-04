import * as THREE from 'three';
import { BaseScene } from '../../core/BaseScene';

export class NebulaScene extends BaseScene {
    private nebulaMeshes: THREE.Mesh[] = [];
    private starField!: THREE.Points;
    private time = 0;
    private nebulaUniforms: any[] = [];

    async init(): Promise<void> {
        console.log('星云场景开始初始化...');
        
        await this.createSpaceEnvironment();
        console.log('深空环境创建完成');
        await this.createStarField();
        console.log('星空创建完成');
        await this.createNebulae();
        console.log('星云创建完成，共创建了', this.nebulaMeshes.length, '个星云对象');
        this.setupLighting();
        console.log('光照设置完成');
        this.isInitialized = true;
        console.log('星云场景初始化完成');
    }

    onActivate() {
        console.log('星云场景激活');
        if (this.camera) {
            console.log('相机位置:', this.camera.position);
            console.log('场景对象数量:', this.scene.children.length);
        }
    }

    private async createSpaceEnvironment() {
        // 创建深空背景
        const skyGeometry = new THREE.SphereGeometry(200, 64, 32);
        const skyMaterial = new THREE.ShaderMaterial({
            side: THREE.BackSide,
            uniforms: {
                time: { value: 0 }
            },
            vertexShader: `
                varying vec2 vUv;
                varying vec3 vWorldPosition;
                void main() {
                    vUv = uv;
                    vWorldPosition = (modelMatrix * vec4(position, 1.0)).xyz;
                    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
                }
            `,
            fragmentShader: `
                uniform float time;
                varying vec2 vUv;
                varying vec3 vWorldPosition;
                
                // 简化的噪声函数
                float hash(vec3 p) {
                    return fract(sin(dot(p, vec3(127.1, 311.7, 74.7))) * 43758.5453);
                }
                
                float noise(vec3 p) {
                    vec3 i = floor(p);
                    vec3 f = fract(p);
                    f = f * f * (3.0 - 2.0 * f);
                    
                    return mix(
                        mix(mix(hash(i + vec3(0,0,0)), hash(i + vec3(1,0,0)), f.x),
                            mix(hash(i + vec3(0,1,0)), hash(i + vec3(1,1,0)), f.x), f.y),
                        mix(mix(hash(i + vec3(0,0,1)), hash(i + vec3(1,0,1)), f.x),
                            mix(hash(i + vec3(0,1,1)), hash(i + vec3(1,1,1)), f.x), f.y), f.z);
                }
                
                void main() {
                    vec3 pos = normalize(vWorldPosition) * 2.0;
                    
                    // 深空基色
                    vec3 deepSpace = vec3(0.01, 0.01, 0.05);
                    vec3 darkBlue = vec3(0.02, 0.05, 0.15);
                    vec3 purple = vec3(0.1, 0.02, 0.2);
                    
                    // 添加细微的宇宙尘埃效果
                    float dust = noise(pos * 8.0 + time * 0.1) * 0.1;
                    float stars = noise(pos * 50.0) * 0.05;
                    
                    vec3 color = mix(deepSpace, darkBlue, dust);
                    color = mix(color, purple, stars);
                    
                    // 添加远处星云的微光
                    float distantGlow = noise(pos * 3.0 + time * 0.05) * 0.3;
                    color += distantGlow * vec3(0.1, 0.05, 0.3);
                    
                    gl_FragColor = vec4(color, 1.0);
                }
            `
        });
        
        const skyMesh = new THREE.Mesh(skyGeometry, skyMaterial);
        this.scene.add(skyMesh);
    }

    private async createStarField() {
        // 创建星星粒子系统
        const starCount = 5000;
        const positions = new Float32Array(starCount * 3);
        const colors = new Float32Array(starCount * 3);
        const sizes = new Float32Array(starCount);

        for (let i = 0; i < starCount; i++) {
            const i3 = i * 3;
            
            // 在球形空间中随机分布星星
            const radius = Math.random() * 150 + 50;
            const theta = Math.random() * Math.PI * 2;
            const phi = Math.acos(2 * Math.random() - 1);
            
            positions[i3] = radius * Math.sin(phi) * Math.cos(theta);
            positions[i3 + 1] = radius * Math.sin(phi) * Math.sin(theta);
            positions[i3 + 2] = radius * Math.cos(phi);
            
            // 星星颜色变化（白色到蓝色到淡紫色）
            const colorVariation = Math.random();
            if (colorVariation < 0.7) {
                // 白色星星
                colors[i3] = 1.0;
                colors[i3 + 1] = 1.0;
                colors[i3 + 2] = 1.0;
            } else if (colorVariation < 0.9) {
                // 蓝色星星
                colors[i3] = 0.8;
                colors[i3 + 1] = 0.9;
                colors[i3 + 2] = 1.0;
            } else {
                // 淡紫色星星
                colors[i3] = 1.0;
                colors[i3 + 1] = 0.8;
                colors[i3 + 2] = 1.0;
            }
            
            sizes[i] = Math.random() * 2 + 0.5;
        }

        const starGeometry = new THREE.BufferGeometry();
        starGeometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
        starGeometry.setAttribute('customColor', new THREE.BufferAttribute(colors, 3));
        starGeometry.setAttribute('size', new THREE.BufferAttribute(sizes, 1));

        const starMaterial = new THREE.ShaderMaterial({
            uniforms: {
                time: { value: 0 }
            },
            vertexShader: `
                attribute float size;
                attribute vec3 customColor;
                varying vec3 vColor;
                uniform float time;
                
                void main() {
                    vColor = customColor;
                    vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
                    
                    // 添加闪烁效果
                    float twinkle = sin(time * 2.0 + position.x * 0.01) * 0.3 + 0.7;
                    gl_PointSize = size * twinkle * (300.0 / -mvPosition.z);
                    gl_Position = projectionMatrix * mvPosition;
                }
            `,
            fragmentShader: `
                varying vec3 vColor;
                
                void main() {
                    float distance = length(gl_PointCoord - vec2(0.5));
                    if (distance > 0.5) discard;
                    
                    float alpha = 1.0 - (distance * 2.0);
                    alpha = pow(alpha, 2.0);
                    
                    gl_FragColor = vec4(vColor, alpha);
                }
            `,
            transparent: true,
            blending: THREE.AdditiveBlending
        });

        this.starField = new THREE.Points(starGeometry, starMaterial);
        this.scene.add(this.starField);
    }

    private async createNebulae() {
        // 创建多个不同的星云
        await this.createMainNebula();
        await this.createSecondaryNebulae();
    }

    private async createMainNebula() {
        // 创建多个薄的平面作为星云丝带
        for (let i = 0; i < 8; i++) {
            const geometry = new THREE.PlaneGeometry(15, 8, 32, 16);
            
            const uniforms = {
                time: { value: 0 },
                uCameraPosition: { value: new THREE.Vector3() },
                offset: { value: i * 0.5 }
            };
            this.nebulaUniforms.push(uniforms);

            const material = new THREE.ShaderMaterial({
                uniforms: uniforms,
                transparent: true,
                side: THREE.DoubleSide,
                blending: THREE.AdditiveBlending,
                depthWrite: false,
                depthTest: true,
                vertexShader: `
                    uniform float time;
                    uniform vec3 uCameraPosition;
                    uniform float offset;
                    varying vec2 vUv;
                    varying vec3 vWorldPosition;
                    varying float vDistanceToCamera;
                    
                    // 噪声函数
                    float hash(vec3 p) {
                        return fract(sin(dot(p, vec3(127.1, 311.7, 74.7))) * 43758.5453);
                    }
                    
                    float noise(vec3 p) {
                        vec3 i = floor(p);
                        vec3 f = fract(p);
                        f = f * f * (3.0 - 2.0 * f);
                        
                        return mix(
                            mix(mix(hash(i + vec3(0,0,0)), hash(i + vec3(1,0,0)), f.x),
                                mix(hash(i + vec3(0,1,0)), hash(i + vec3(1,1,0)), f.x), f.y),
                            mix(mix(hash(i + vec3(0,0,1)), hash(i + vec3(1,0,1)), f.x),
                                mix(hash(i + vec3(0,1,1)), hash(i + vec3(1,1,1)), f.x), f.y), f.z);
                    }
                    
                    void main() {
                        vUv = uv;
                        
                        vec3 pos = position;
                        
                        // 添加丝带状波动
                        float wave1 = sin(pos.x * 2.0 + time * 0.5 + offset) * 0.3;
                        float wave2 = sin(pos.y * 3.0 + time * 0.3 + offset) * 0.2;
                        pos.z += wave1 + wave2;
                        
                        // 添加细微的噪声变形
                        float noiseDisp = noise(pos * 2.0 + time * 0.1) * 0.1;
                        pos += normal * noiseDisp;
                        
                        vec4 worldPosition = modelMatrix * vec4(pos, 1.0);
                        vWorldPosition = worldPosition.xyz;
                        vDistanceToCamera = distance(worldPosition.xyz, uCameraPosition);
                        
                        gl_Position = projectionMatrix * modelViewMatrix * vec4(pos, 1.0);
                    }
                `,
                fragmentShader: `
                    uniform float time;
                    uniform float offset;
                    varying vec2 vUv;
                    varying vec3 vWorldPosition;
                    varying float vDistanceToCamera;
                    
                    float hash(vec3 p) {
                        return fract(sin(dot(p, vec3(127.1, 311.7, 74.7))) * 43758.5453);
                    }
                    
                    float noise(vec3 p) {
                        vec3 i = floor(p);
                        vec3 f = fract(p);
                        f = f * f * (3.0 - 2.0 * f);
                        
                        return mix(
                            mix(mix(hash(i + vec3(0,0,0)), hash(i + vec3(1,0,0)), f.x),
                                mix(hash(i + vec3(0,1,0)), hash(i + vec3(1,1,0)), f.x), f.y),
                            mix(mix(hash(i + vec3(0,0,1)), hash(i + vec3(1,0,1)), f.x),
                                mix(hash(i + vec3(0,1,1)), hash(i + vec3(1,1,1)), f.x), f.y), f.z);
                    }
                    
                    void main() {
                        vec2 uv = vUv;
                        
                        // 创建丝带状的透明度分布
                        float centerDistance = abs(uv.y - 0.5) * 2.0;
                        float ribbonMask = 1.0 - smoothstep(0.3, 1.0, centerDistance);
                        
                        // 添加流动的噪声纹理
                        vec3 noisePos = vWorldPosition * 3.0;
                        float flowNoise = noise(noisePos + vec3(time * 0.2, time * 0.1, 0.0));
                        flowNoise += noise(noisePos * 2.0 + vec3(-time * 0.15, time * 0.25, 0.0)) * 0.5;
                        
                        // 根据位置创建颜色变化
                        float hue = offset + flowNoise * 0.3 + time * 0.1;
                        vec3 color1 = vec3(0.8, 0.4, 1.0); // 紫色
                        vec3 color2 = vec3(0.4, 0.8, 1.0); // 蓝色
                        vec3 color3 = vec3(1.0, 0.6, 0.8); // 粉色
                        
                        vec3 color = mix(color1, color2, sin(hue) * 0.5 + 0.5);
                        color = mix(color, color3, cos(hue * 1.3) * 0.5 + 0.5);
                        
                        // 计算最终透明度
                        float alpha = ribbonMask * flowNoise * 0.4;
                        alpha *= smoothstep(80.0, 20.0, vDistanceToCamera);
                        alpha = max(alpha, 0.0);
                        
                        gl_FragColor = vec4(color, alpha);
                    }
                `
            });

            const nebulaMesh = new THREE.Mesh(geometry, material);
            
            // 随机放置每个丝带
            nebulaMesh.position.set(
                (Math.random() - 0.5) * 30,
                (Math.random() - 0.5) * 20,
                -15 - Math.random() * 30
            );
            
            // 随机旋转
            nebulaMesh.rotation.set(
                Math.random() * Math.PI,
                Math.random() * Math.PI,
                Math.random() * Math.PI
            );
            
            this.nebulaMeshes.push(nebulaMesh);
            this.scene.add(nebulaMesh);
        }
    }

    private async createSecondaryNebulae() {
        // 创建更多薄的丝带状星云
        for (let i = 0; i < 6; i++) {
            const geometry = new THREE.PlaneGeometry(8, 3, 16, 8);
            
            const uniforms = {
                time: { value: 0 },
                uCameraPosition: { value: new THREE.Vector3() },
                baseHue: { value: Math.random() },
                ribbonOffset: { value: Math.random() * 10 }
            };
            this.nebulaUniforms.push(uniforms);

            const material = new THREE.ShaderMaterial({
                uniforms: uniforms,
                transparent: true,
                side: THREE.DoubleSide,
                blending: THREE.AdditiveBlending,
                depthWrite: false,
                depthTest: true,
                vertexShader: `
                    uniform float time;
                    uniform vec3 uCameraPosition;
                    uniform float ribbonOffset;
                    varying vec2 vUv;
                    varying vec3 vWorldPosition;
                    varying float vDistanceToCamera;
                    
                    float hash(vec3 p) {
                        return fract(sin(dot(p, vec3(127.1, 311.7, 74.7))) * 43758.5453);
                    }
                    
                    float noise(vec3 p) {
                        vec3 i = floor(p);
                        vec3 f = fract(p);
                        f = f * f * (3.0 - 2.0 * f);
                        
                        return mix(
                            mix(mix(hash(i + vec3(0,0,0)), hash(i + vec3(1,0,0)), f.x),
                                mix(hash(i + vec3(0,1,0)), hash(i + vec3(1,1,0)), f.x), f.y),
                            mix(mix(hash(i + vec3(0,0,1)), hash(i + vec3(1,0,1)), f.x),
                                mix(hash(i + vec3(0,1,1)), hash(i + vec3(1,1,1)), f.x), f.y), f.z);
                    }
                    
                    void main() {
                        vUv = uv;
                        
                        vec3 pos = position;
                        
                        // 丝带扭曲
                        float twist = sin(pos.x * 4.0 + time * 0.3 + ribbonOffset) * 0.2;
                        pos.y += twist;
                        pos.z += sin(pos.x * 3.0 + time * 0.4) * 0.1;
                        
                        vec4 worldPosition = modelMatrix * vec4(pos, 1.0);
                        vWorldPosition = worldPosition.xyz;
                        vDistanceToCamera = distance(worldPosition.xyz, uCameraPosition);
                        
                        gl_Position = projectionMatrix * modelViewMatrix * vec4(pos, 1.0);
                    }
                `,
                fragmentShader: `
                    uniform float time;
                    uniform float baseHue;
                    varying vec2 vUv;
                    varying vec3 vWorldPosition;
                    varying float vDistanceToCamera;
                    
                    float hash(vec3 p) {
                        return fract(sin(dot(p, vec3(127.1, 311.7, 74.7))) * 43758.5453);
                    }
                    
                    float noise(vec3 p) {
                        vec3 i = floor(p);
                        vec3 f = fract(p);
                        f = f * f * (3.0 - 2.0 * f);
                        
                        return mix(
                            mix(mix(hash(i + vec3(0,0,0)), hash(i + vec3(1,0,0)), f.x),
                                mix(hash(i + vec3(0,1,0)), hash(i + vec3(1,1,0)), f.x), f.y),
                            mix(mix(hash(i + vec3(0,0,1)), hash(i + vec3(1,0,1)), f.x),
                                mix(hash(i + vec3(0,1,1)), hash(i + vec3(1,1,1)), f.x), f.y), f.z);
                    }
                    
                    vec3 hsl2rgb(vec3 c) {
                        vec3 rgb = clamp(abs(mod(c.x*6.0+vec3(0.0,4.0,2.0), 6.0)-3.0)-1.0, 0.0, 1.0);
                        return c.z + c.y * (rgb - 0.5) * (1.0 - abs(2.0 * c.z - 1.0));
                    }
                    
                    void main() {
                        vec2 uv = vUv;
                        
                        // 丝带状边缘衰减
                        float edge = smoothstep(0.0, 0.2, uv.y) * smoothstep(1.0, 0.8, uv.y);
                        
                        // 流动噪声
                        vec3 pos = vWorldPosition * 4.0;
                        float flowPattern = noise(pos + vec3(time * 0.3, 0.0, 0.0));
                        flowPattern *= edge;
                        
                        // 颜色
                        vec3 color = hsl2rgb(vec3(baseHue + sin(time * 0.2) * 0.2, 0.8, 0.7));
                        
                        float alpha = flowPattern * 0.3;
                        alpha *= smoothstep(60.0, 20.0, vDistanceToCamera);
                        
                        gl_FragColor = vec4(color, alpha);
                    }
                `
            });

            const nebulaMesh = new THREE.Mesh(geometry, material);
            
            // 分布在不同区域
            nebulaMesh.position.set(
                (Math.random() - 0.5) * 50,
                (Math.random() - 0.5) * 30,
                -20 - Math.random() * 50
            );
            
            // 随机旋转，让一些丝带是垂直的
            nebulaMesh.rotation.set(
                Math.random() * Math.PI * 2,
                Math.random() * Math.PI * 2,
                Math.random() * Math.PI * 2
            );
            
            this.nebulaMeshes.push(nebulaMesh);
            this.scene.add(nebulaMesh);
        }
    }

    private setupLighting() {
        // 环境光
        const ambientLight = new THREE.AmbientLight(0x404080, 0.1);
        this.scene.add(ambientLight);

        // 主光源 - 模拟远处的恒星光
        const starLight = new THREE.DirectionalLight(0xffffff, 0.3);
        starLight.position.set(50, 30, 20);
        this.scene.add(starLight);

        // 添加一些彩色点光源增强星云效果
        const lights = [
            { color: 0xff4080, pos: new THREE.Vector3(-20, 10, -15) },
            { color: 0x4080ff, pos: new THREE.Vector3(15, -5, -25) },
            { color: 0x80ff40, pos: new THREE.Vector3(5, 20, -35) }
        ];

        lights.forEach(lightConfig => {
            const light = new THREE.PointLight(lightConfig.color, 2, 50);
            light.position.copy(lightConfig.pos);
            this.scene.add(light);
        });
    }

    update(deltaTime: number): void {
        if (!this.isInitialized) return;

        this.time += deltaTime;

        // 更新所有uniforms
        this.nebulaUniforms.forEach(uniforms => {
            uniforms.time.value = this.time;
            if (this.camera) {
                uniforms.uCameraPosition.value.copy(this.camera.position);
            }
        });

        // 更新星空
        if (this.starField.material instanceof THREE.ShaderMaterial) {
            this.starField.material.uniforms.time.value = this.time;
        }

        // 更新天空盒
        this.scene.traverse((object) => {
            if (object instanceof THREE.Mesh && object.material instanceof THREE.ShaderMaterial) {
                if (object.material.uniforms.time) {
                    object.material.uniforms.time.value = this.time;
                }
            }
        });

        // 星云的缓慢旋转
        this.nebulaMeshes.forEach((mesh, index) => {
            mesh.rotation.x += deltaTime * 0.1 * (index % 2 === 0 ? 1 : -1);
            mesh.rotation.y += deltaTime * 0.05 * (index % 3 === 0 ? 1 : -1);
            mesh.rotation.z += deltaTime * 0.08 * (index % 4 === 0 ? 1 : -1);
        });
    }
} 