export class UI {
    private startBtn!: HTMLButtonElement;
    private homeScreen!: HTMLElement;
    private sceneControls!: HTMLElement;
    private prevBtn!: HTMLButtonElement;
    private nextBtn!: HTMLButtonElement;
    private homeBtn!: HTMLButtonElement;

    private onStartCallback?: () => void;
    private onSceneChangeCallback?: (direction: 'next' | 'prev') => void;
    private onBackToHomeCallback?: () => void;

    constructor() {
        this.initElements();
        this.setupEventListeners();
    }

    private initElements() {
        this.startBtn = document.getElementById('start-btn') as HTMLButtonElement;
        this.homeScreen = document.getElementById('home-screen') as HTMLElement;
        this.sceneControls = document.getElementById('scene-controls') as HTMLElement;
        this.prevBtn = document.getElementById('prev-scene') as HTMLButtonElement;
        this.nextBtn = document.getElementById('next-scene') as HTMLButtonElement;
        this.homeBtn = document.getElementById('home-btn') as HTMLButtonElement;
    }

    private setupEventListeners() {
        this.startBtn.addEventListener('click', () => {
            if (this.onStartCallback) {
                this.onStartCallback();
            }
        });

        this.prevBtn.addEventListener('click', () => {
            if (this.onSceneChangeCallback) {
                this.onSceneChangeCallback('prev');
            }
        });

        this.nextBtn.addEventListener('click', () => {
            if (this.onSceneChangeCallback) {
                this.onSceneChangeCallback('next');
            }
        });

        this.homeBtn.addEventListener('click', () => {
            if (this.onBackToHomeCallback) {
                this.onBackToHomeCallback();
            }
        });

        // 键盘快捷键
        document.addEventListener('keydown', (event) => {
            switch (event.key) {
                case 'ArrowLeft':
                    if (this.onSceneChangeCallback) {
                        this.onSceneChangeCallback('prev');
                    }
                    break;
                case 'ArrowRight':
                    if (this.onSceneChangeCallback) {
                        this.onSceneChangeCallback('next');
                    }
                    break;
                case 'Escape':
                    if (this.onBackToHomeCallback) {
                        this.onBackToHomeCallback();
                    }
                    break;
                case ' ':
                case 'Enter':
                    if (this.homeScreen.style.display !== 'none' && this.onStartCallback) {
                        this.onStartCallback();
                    }
                    event.preventDefault();
                    break;
            }
        });
    }

    onStartExperience(callback: () => void) {
        this.onStartCallback = callback;
    }

    onSceneChange(callback: (direction: 'next' | 'prev') => void) {
        this.onSceneChangeCallback = callback;
    }

    onBackToHome(callback: () => void) {
        this.onBackToHomeCallback = callback;
    }

    showSceneControls() {
        this.sceneControls.style.display = 'block';
    }

    hideSceneControls() {
        this.sceneControls.style.display = 'none';
    }

    showHomeScreen() {
        this.hideSceneControls();
    }

    updateSceneInfo(title: string, description: string) {
        const titleElement = document.getElementById('scene-title');
        const descElement = document.getElementById('scene-description');
        
        if (titleElement) titleElement.textContent = title;
        if (descElement) descElement.textContent = description;
    }
} 