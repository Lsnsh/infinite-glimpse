import * as THREE from 'three';
import { BaseScene } from '../core/BaseScene';

export class WaterfallScene extends BaseScene {
    private waterfallMesh!: THREE.Mesh;
    private particleSystem!: THREE.Points;
    private time = 0;
    private uniforms: any;

    async init(): Promise<void> {
        await this.createEnvironment();
        await this.createWaterfall();
        await this.createParticles();
        this.setupLighting();
        this.isInitialized = true;
    }

    private async createEnvironment() {
        // 创建背景
        const skyGeometry = new THREE.SphereGeometry(100, 32, 16);
        const skyMaterial = new THREE.ShaderMaterial({
            side: THREE.BackSide,
            uniforms: {
                time: { value: 0 }
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
                    
                    // 基于参考图片的深蓝紫色调
                    vec3 color1 = vec3(0.05, 0.1, 0.3);  // 深蓝
                    vec3 color2 = vec3(0.1, 0.05, 0.4);  // 深紫
                    vec3 color3 = vec3(0.2, 0.1, 0.5);   // 亮紫
                    
                    float noise = sin(uv.x * 10.0 + time) * sin(uv.y * 8.0 + time * 0.5) * 0.1;
                    float gradient = uv.y + noise;
                    
                    vec3 finalColor = mix(color1, color2, gradient);
                    finalColor = mix(finalColor, color3, sin(time * 0.3) * 0.3 + 0.3);
                    
                    gl_FragColor = vec4(finalColor, 1.0);
                }
            `
        });
        
        const skyMesh = new THREE.Mesh(skyGeometry, skyMaterial);
        this.scene.add(skyMesh);

        // 添加3D地形和岩石
        await this.createTerrain();
        await this.createRocks();
    }

    private async createTerrain() {
        // 创建地面
        const groundGeometry = new THREE.PlaneGeometry(50, 50, 64, 64);
        const groundMaterial = new THREE.ShaderMaterial({
            uniforms: {
                time: { value: 0 }
            },
            vertexShader: `
                uniform float time;
                varying vec2 vUv;
                varying float vElevation;
                
                void main() {
                    vUv = uv;
                    
                    vec3 pos = position;
                    float elevation = sin(pos.x * 0.3 + time * 0.5) * sin(pos.y * 0.2 + time * 0.3) * 2.0;
                    pos.z += elevation;
                    vElevation = elevation;
                    
                    gl_Position = projectionMatrix * modelViewMatrix * vec4(pos, 1.0);
                }
            `,
            fragmentShader: `
                uniform float time;
                varying vec2 vUv;
                varying float vElevation;
                
                void main() {
                    vec3 color1 = vec3(0.1, 0.15, 0.2);  // 深色
                    vec3 color2 = vec3(0.2, 0.25, 0.4);  // 中色
                    vec3 color3 = vec3(0.3, 0.35, 0.5);  // 亮色
                    
                    float mixFactor = (vElevation + 2.0) / 4.0;
                    vec3 color = mix(color1, color2, mixFactor);
                    color = mix(color, color3, sin(time * 0.2) * 0.3 + 0.3);
                    
                    gl_FragColor = vec4(color, 1.0);
                }
            `
        });
        
        const groundMesh = new THREE.Mesh(groundGeometry, groundMaterial);
        groundMesh.rotation.x = -Math.PI / 2;
        groundMesh.position.y = -8;
        this.scene.add(groundMesh);
    }

    private async createRocks() {
        // 创建随机分布的岩石
        for (let i = 0; i < 15; i++) {
            const rockGeometry = new THREE.DodecahedronGeometry(
                Math.random() * 2 + 0.5,
                Math.floor(Math.random() * 2)
            );
            
            const rockMaterial = new THREE.MeshStandardMaterial({
                color: new THREE.Color(0.2 + Math.random() * 0.2, 0.15 + Math.random() * 0.15, 0.3 + Math.random() * 0.2),
                roughness: 0.8,
                metalness: 0.1
            });
            
            const rock = new THREE.Mesh(rockGeometry, rockMaterial);
            rock.position.set(
                (Math.random() - 0.5) * 30,
                Math.random() * 4 - 6,
                (Math.random() - 0.5) * 30
            );
            rock.rotation.set(
                Math.random() * Math.PI,
                Math.random() * Math.PI,
                Math.random() * Math.PI
            );
            
            this.scene.add(rock);
        }
    }

    private async createWaterfall() {
        // 创建瀑布几何体
        const geometry = new THREE.PlaneGeometry(6, 12, 64, 128);
        
        this.uniforms = {
            time: { value: 0 },
            resolution: { value: new THREE.Vector2(512, 1024) }
        };

        const material = new THREE.ShaderMaterial({
            uniforms: this.uniforms,
            transparent: true,
            side: THREE.DoubleSide,
            vertexShader: `
                uniform float time;
                varying vec2 vUv;
                varying vec3 vPosition;
                
                // 简化的噪声函数
                float noise(vec2 p) {
                    return sin(p.x * 6.28318) * sin(p.y * 6.28318);
                }
                
                void main() {
                    vUv = uv;
                    vPosition = position;
                    
                    vec3 pos = position;
                    
                    // 添加波动效果
                    float wave1 = sin(pos.y * 0.5 + time * 2.0) * 0.1;
                    float wave2 = sin(pos.y * 0.8 + time * 1.5) * 0.05;
                    
                    pos.x += wave1 + wave2;
                    pos.z += wave2 * 0.5;
                    
                    gl_Position = projectionMatrix * modelViewMatrix * vec4(pos, 1.0);
                }
            `,
            fragmentShader: `
                uniform float time;
                uniform vec2 resolution;
                varying vec2 vUv;
                varying vec3 vPosition;
                
                // 更好的噪声函数
                float hash(vec2 p) {
                    return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453);
                }
                
                float noise(vec2 p) {
                    vec2 i = floor(p);
                    vec2 f = fract(p);
                    f = f * f * (3.0 - 2.0 * f);
                    
                    float a = hash(i);
                    float b = hash(i + vec2(1.0, 0.0));
                    float c = hash(i + vec2(0.0, 1.0));
                    float d = hash(i + vec2(1.0, 1.0));
                    
                    return mix(mix(a, b, f.x), mix(c, d, f.x), f.y);
                }
                
                float fbm(vec2 p) {
                    float value = 0.0;
                    float amplitude = 0.5;
                    float frequency = 1.0;
                    
                    for(int i = 0; i < 4; i++) {
                        value += amplitude * noise(p * frequency);
                        amplitude *= 0.5;
                        frequency *= 2.0;
                    }
                    
                    return value;
                }
                
                void main() {
                    vec2 uv = vUv;
                    
                    // 创建流动效果
                    vec2 flowUv = uv;
                    flowUv.y -= time * 0.3;
                    
                    // 多层噪声创建复杂的流动图案
                    float flow1 = fbm(flowUv * 4.0);
                    float flow2 = fbm(flowUv * 8.0 + vec2(time * 0.1, 0.0));
                    float flow3 = fbm(flowUv * 16.0 - vec2(0.0, time * 0.5));
                    
                    // 组合流动图案
                    float combined = flow1 * 0.5 + flow2 * 0.3 + flow3 * 0.2;
                    
                    // 创建瀑布的垂直流动感
                    float verticalFlow = sin(uv.x * 6.0 + time) * 0.1 + 0.9;
                    combined *= verticalFlow;
                    
                    // 参考图片的颜色调色板
                    vec3 deepBlue = vec3(0.1, 0.15, 0.4);
                    vec3 brightBlue = vec3(0.3, 0.5, 0.8);
                    vec3 purple = vec3(0.4, 0.2, 0.6);
                    vec3 lightBlue = vec3(0.6, 0.8, 1.0);
                    
                    // 根据噪声值混合颜色
                    vec3 color = mix(deepBlue, brightBlue, combined);
                    color = mix(color, purple, sin(combined * 3.14159 + time) * 0.5 + 0.5);
                    color = mix(color, lightBlue, pow(combined, 2.0) * 0.3);
                    
                    // 添加发光效果
                    float glow = pow(combined, 1.5) * 0.8;
                    color += glow * vec3(0.2, 0.4, 0.8);
                    
                    // 透明度基于流动强度
                    float alpha = combined * 0.8 + 0.2;
                    alpha *= (1.0 - abs(uv.x - 0.5) * 1.5); // 边缘淡化
                    
                    gl_FragColor = vec4(color, alpha);
                }
            `
        });

        this.waterfallMesh = new THREE.Mesh(geometry, material);
        this.waterfallMesh.position.set(0, 0, 0);
        this.scene.add(this.waterfallMesh);
    }

    private async createParticles() {
        // 创建粒子系统增强效果
        const particleCount = 1000;
        const geometry = new THREE.BufferGeometry();
        const positions = new Float32Array(particleCount * 3);
        const velocities = new Float32Array(particleCount * 3);
        const sizes = new Float32Array(particleCount);
        
        for (let i = 0; i < particleCount; i++) {
            const i3 = i * 3;
            
            // 在瀑布范围内随机分布
            positions[i3] = (Math.random() - 0.5) * 6;
            positions[i3 + 1] = Math.random() * 12 - 6;
            positions[i3 + 2] = (Math.random() - 0.5) * 2;
            
            velocities[i3] = (Math.random() - 0.5) * 0.02;
            velocities[i3 + 1] = -Math.random() * 0.1 - 0.05;
            velocities[i3 + 2] = (Math.random() - 0.5) * 0.02;
            
            sizes[i] = Math.random() * 0.05 + 0.02;
        }
        
        geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
        geometry.setAttribute('velocity', new THREE.BufferAttribute(velocities, 3));
        geometry.setAttribute('size', new THREE.BufferAttribute(sizes, 1));
        
        const material = new THREE.ShaderMaterial({
            uniforms: {
                time: { value: 0 },
                pointTexture: { value: this.createParticleTexture() }
            },
            transparent: true,
            blending: THREE.AdditiveBlending,
            depthWrite: false,
            vertexShader: `
                attribute float size;
                attribute vec3 velocity;
                uniform float time;
                varying float vAlpha;
                
                void main() {
                    vec3 pos = position + velocity * time * 100.0;
                    
                    // 重置超出边界的粒子
                    if (pos.y < -6.0) {
                        pos.y = 6.0;
                    }
                    
                    vec4 mvPosition = modelViewMatrix * vec4(pos, 1.0);
                    gl_Position = projectionMatrix * mvPosition;
                    gl_PointSize = size * (300.0 / -mvPosition.z);
                    
                    vAlpha = 1.0 - (pos.y + 6.0) / 12.0;
                }
            `,
            fragmentShader: `
                uniform sampler2D pointTexture;
                varying float vAlpha;
                
                void main() {
                    vec4 color = texture2D(pointTexture, gl_PointCoord);
                    color.rgb = vec3(0.5, 0.8, 1.0);
                    color.a *= vAlpha * 0.6;
                    gl_FragColor = color;
                }
            `
        });
        
        this.particleSystem = new THREE.Points(geometry, material);
        this.scene.add(this.particleSystem);
    }

    private createParticleTexture(): THREE.Texture {
        const canvas = document.createElement('canvas');
        canvas.width = 64;
        canvas.height = 64;
        
        const context = canvas.getContext('2d')!;
        const gradient = context.createRadialGradient(32, 32, 0, 32, 32, 32);
        gradient.addColorStop(0, 'rgba(255,255,255,1)');
        gradient.addColorStop(0.5, 'rgba(255,255,255,0.5)');
        gradient.addColorStop(1, 'rgba(255,255,255,0)');
        
        context.fillStyle = gradient;
        context.fillRect(0, 0, 64, 64);
        
        const texture = new THREE.CanvasTexture(canvas);
        return texture;
    }

    private setupLighting() {
        // 环境光
        const ambientLight = new THREE.AmbientLight(0x404080, 0.3);
        this.scene.add(ambientLight);
        
        // 主光源
        const directionalLight = new THREE.DirectionalLight(0x8080ff, 0.8);
        directionalLight.position.set(-5, 10, 5);
        this.scene.add(directionalLight);
        
        // 补光
        const fillLight = new THREE.DirectionalLight(0xff8080, 0.3);
        fillLight.position.set(5, -5, -5);
        this.scene.add(fillLight);
    }

    update(deltaTime: number): void {
        if (!this.isInitialized) return;
        
        this.time += deltaTime;
        
        // 更新瀑布着色器
        if (this.uniforms) {
            this.uniforms.time.value = this.time;
        }
        
        // 更新天空
        this.scene.traverse((object) => {
            if (object instanceof THREE.Mesh && object.material instanceof THREE.ShaderMaterial) {
                if (object.material.uniforms.time) {
                    object.material.uniforms.time.value = this.time;
                }
            }
        });
        
        // 更新粒子系统
        if (this.particleSystem && this.particleSystem.material instanceof THREE.ShaderMaterial) {
            this.particleSystem.material.uniforms.time.value = this.time;
        }
        
        // 轻微的摄像机摆动模拟观看效果
        if (this.camera) {
            this.camera.position.x = Math.sin(this.time * 0.1) * 0.05;
            this.camera.position.y = Math.sin(this.time * 0.15) * 0.03;
        }
    }
} 