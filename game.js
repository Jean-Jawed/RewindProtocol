// Configuration
const CONFIG = {
    CANVAS_WIDTH: 1280,
    CANVAS_HEIGHT: 720,
    TILE_SIZE: 40,
    PLAYER_SIZE: 55,
    ROBOT_SIZE: 68,
    TV_SIZE: 35,
    BULLET_SIZE: 8,
    PLAYER_SPEED: 200,
    BULLET_SPEED: 400,
    MAX_LIVES: 5,
    TVS_PER_LEVEL: 7,
    INITIAL_ROBOTS: 25,
    ROBOT_SPEEDS: [80, 120, 160],
    ROBOT_DETECTION_RANGE: 250,
    PARTICLE_COUNT: 15,
    CAMERA_SPEED: 400,
    CAMERA_LERP_SPEED: 0.15,
    TV_DISABLE_TIME: 3000 // AJOUTÉ: Temps en ms pour éteindre une TV
};

// Utility Functions
const getControlKeys = (scheme) => {
    const schemes = {
        qsdz: { up: 'z', down: 's', left: 'q', right: 'd' },
        zqsd: { up: 'z', down: 's', left: 'q', right: 'd' },
        wasd: { up: 'w', down: 's', left: 'a', right: 'd' },
        arrows: { up: 'ArrowUp', down: 'ArrowDown', left: 'ArrowLeft', right: 'ArrowRight' }
    };
    return schemes[scheme] || schemes.qsdz;
};

const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);

// Image Loader
class ImageLoader {
    constructor() {
        this.images = {};
        this.loaded = 0;
        this.total = 0;
    }

    loadImage(key, src) {
        return new Promise((resolve, reject) => {
            const img = new Image();
            img.onload = () => {
                this.images[key] = img;
                this.loaded++;
                resolve();
            };
            img.onerror = reject;
            img.src = src;
        });
    }

    async loadAll() {
        const imagesToLoad = [
            { key: 'scientist_right', src: 'assets/scientist_right.png' },
            { key: 'scientist_left', src: 'assets/scientist_left.png' },
            { key: 'nazi_robot_right_1', src: 'assets/nazi_robot_right_1.png' },
            { key: 'nazi_robot_left_1', src: 'assets/nazi_robot_left_1.png' },
            { key: 'nazi_robot_right_2', src: 'assets/nazi_robot_right_2.png' },
            { key: 'nazi_robot_left_2', src: 'assets/nazi_robot_left_2.png' },
            { key: 'nazi_robot_right_3', src: 'assets/nazi_robot_right_3.png' },
            { key: 'nazi_robot_left_3', src: 'assets/nazi_robot_left_3.png' },
            { key: 'nazi_robot_right_4', src: 'assets/nazi_robot_right_4.png' },
            { key: 'nazi_robot_left_4', src: 'assets/nazi_robot_left_4.png' },
            { key: 'explosion_1', src: 'assets/explosion_1.png' },
            { key: 'explosion_2', src: 'assets/explosion_2.png' },
            { key: 'explosion_3', src: 'assets/explosion_3.png' },
            { key: 'explosion_4', src: 'assets/explosion_4.png' },
            { key: 'explosion_5', src: 'assets/explosion_5.png' },
            { key: 'tv_screen_1', src: 'assets/TV1.png' },
            { key: 'tv_screen_2', src: 'assets/TV2.png' },
            { key: 'tv_screen_3', src: 'assets/TV3.png' }
        ];

        this.total = imagesToLoad.length;

        const promises = imagesToLoad.map(img => this.loadImage(img.key, img.src));
        await Promise.all(promises);
    }

    get(key) {
        return this.images[key];
    }

    getProgress() {
        return this.loaded / this.total;
    }
}

// Vector2D Class
class Vector2D {
    constructor(x = 0, y = 0) {
        this.x = x;
        this.y = y;
    }

    add(v) {
        return new Vector2D(this.x + v.x, this.y + v.y);
    }

    subtract(v) {
        return new Vector2D(this.x - v.x, this.y - v.y);
    }

    multiply(scalar) {
        return new Vector2D(this.x * scalar, this.y * scalar);
    }

    length() {
        return Math.sqrt(this.x * this.x + this.y * this.y);
    }

    normalize() {
        const len = this.length();
        return len > 0 ? new Vector2D(this.x / len, this.y / len) : new Vector2D(0, 0);
    }

    distance(v) {
        return Math.sqrt((this.x - v.x) ** 2 + (this.y - v.y) ** 2);
    }
}

// Particle System
class Particle {
    constructor(x, y, vx, vy, color, life) {
        this.pos = new Vector2D(x, y);
        this.vel = new Vector2D(vx, vy);
        this.color = color;
        this.life = life;
        this.maxLife = life;
    }

    update(dt) {
        this.pos = this.pos.add(this.vel.multiply(dt));
        this.life -= dt;
        this.vel = this.vel.multiply(0.95);
    }

    draw(ctx) {
        const alpha = this.life / this.maxLife;
        ctx.fillStyle = this.color.replace(')', `, ${alpha})`).replace('rgb', 'rgba');
        ctx.fillRect(this.pos.x, this.pos.y, 3, 3);
    }
}

class ParticleSystem {
    constructor() {
        this.particles = [];
    }

    emit(x, y, count, color) {
        for (let i = 0; i < count; i++) {
            const angle = (Math.PI * 2 * i) / count;
            const speed = 100 + Math.random() * 100;
            const vx = Math.cos(angle) * speed;
            const vy = Math.sin(angle) * speed;
            this.particles.push(new Particle(x, y, vx, vy, color, 0.5 + Math.random() * 0.5));
        }
    }

    update(dt) {
        this.particles = this.particles.filter(p => {
            p.update(dt);
            return p.life > 0;
        });
    }

    draw(ctx) {
        this.particles.forEach(p => p.draw(ctx));
    }
}

// Explosion Animation
class Explosion {
    constructor(x, y, imageLoader) {
        this.pos = new Vector2D(x, y);
        this.frame = 0;
        this.frameTime = 0;
        this.frameDuration = 0.1;
        this.imageLoader = imageLoader;
        this.dead = false;
        this.size = 60;
    }

    update(dt) {
        this.frameTime += dt;
        if (this.frameTime >= this.frameDuration) {
            this.frameTime = 0;
            this.frame++;
            if (this.frame >= 5) {
                this.dead = true;
            }
        }
    }

    draw(ctx, camera) {
        if (this.dead) return;
        
        const img = this.imageLoader.get(`explosion_${this.frame + 1}`);
        if (img) {
            const screenX = this.pos.x - camera.x - this.size / 2;
            const screenY = this.pos.y - camera.y - this.size / 2;
            ctx.drawImage(img, screenX, screenY, this.size, this.size);
        }
    }
}

// Maze Generator
class Maze {
    constructor(width, height, tileSize) {
        this.width = Math.floor(width / tileSize);
        this.height = Math.floor(height / tileSize);
        this.tileSize = tileSize;
        this.grid = [];
        this.generate();
    }

    generate() {
        for (let y = 0; y < this.height; y++) {
            this.grid[y] = [];
            for (let x = 0; x < this.width; x++) {
                this.grid[y][x] = 1;
            }
        }

        const stack = [];
        const startX = 2;
        const startY = 2;
        
        this.grid[startY][startX] = 0;
        this.grid[startY][startX + 1] = 0;
        this.grid[startY + 1][startX] = 0;
        this.grid[startY + 1][startX + 1] = 0;
        
        stack.push([startX, startY]);

        const directions = [
            [0, -3],
            [3, 0],
            [0, 3],
            [-3, 0]
        ];

        while (stack.length > 0) {
            const [x, y] = stack[stack.length - 1];
            const neighbors = [];

            for (const [dx, dy] of directions) {
                const nx = x + dx;
                const ny = y + dy;
                
                if (nx > 1 && nx < this.width - 2 && ny > 1 && ny < this.height - 2 && this.grid[ny][nx] === 1) {
                    neighbors.push([nx, ny, dx, dy]);
                }
            }

            if (neighbors.length > 0) {
                const [nx, ny, dx, dy] = neighbors[Math.floor(Math.random() * neighbors.length)];
                
                if (dx !== 0) {
                    const step = dx > 0 ? 1 : -1;
                    for (let i = 0; i <= Math.abs(dx); i++) {
                        const cx = x + i * step;
                        this.grid[y][cx] = 0;
                        this.grid[y + 1][cx] = 0;
                    }
                } else {
                    const step = dy > 0 ? 1 : -1;
                    for (let i = 0; i <= Math.abs(dy); i++) {
                        const cy = y + i * step;
                        this.grid[cy][x] = 0;
                        this.grid[cy][x + 1] = 0;
                    }
                }
                
                this.grid[ny][nx] = 0;
                this.grid[ny][nx + 1] = 0;
                this.grid[ny + 1][nx] = 0;
                this.grid[ny + 1][nx + 1] = 0;
                
                stack.push([nx, ny]);
            } else {
                stack.pop();
            }
        }

        for (let i = 0; i < 30; i++) {
            const x = Math.floor(Math.random() * (this.width - 3)) + 2;
            const y = Math.floor(Math.random() * (this.height - 3)) + 2;
            this.grid[y][x] = 0;
            this.grid[y][x + 1] = 0;
            this.grid[y + 1][x] = 0;
            this.grid[y + 1][x + 1] = 0;
        }

        for (let x = 0; x < this.width; x++) {
            if (this.height >= 2) this.grid[this.height - 2][x] = 0;
            if (this.height >= 1) this.grid[this.height - 1][x] = 0;
        }
    }

    isWall(x, y) {
        const tileX = Math.floor(x / this.tileSize);
        const tileY = Math.floor(y / this.tileSize);
        if (tileX < 0 || tileX >= this.width || tileY < 0 || tileY >= this.height) return true;
        return this.grid[tileY][tileX] === 1;
    }

    getRandomFloorPosition() {
        let attempts = 0;
        while (attempts < 1000) {
            const x = Math.floor(Math.random() * (this.width - 4)) + 2;
            const y = Math.floor(Math.random() * (this.height - 4)) + 2;
            
            if (this.grid[y][x] === 0 && this.grid[y][x + 1] === 0 && 
                this.grid[y + 1][x] === 0 && this.grid[y + 1][x + 1] === 0) {
                return new Vector2D(
                    (x + 0.5) * this.tileSize + this.tileSize / 2, 
                    (y + 0.5) * this.tileSize + this.tileSize / 2
                );
            }
            attempts++;
        }
        return new Vector2D(this.tileSize * 3, this.tileSize * 3);
    }

    draw(ctx, camera) {
        for (let y = 0; y < this.height; y++) {
            for (let x = 0; x < this.width; x++) {
                const screenX = x * this.tileSize - camera.x;
                const screenY = y * this.tileSize - camera.y;

                if (this.grid[y][x] === 1) {
                    ctx.fillStyle = '#1a1a1a';
                    ctx.fillRect(screenX, screenY, this.tileSize, this.tileSize);
                    ctx.strokeStyle = '#00ffff';
                    ctx.lineWidth = 1;
                    ctx.strokeRect(screenX, screenY, this.tileSize, this.tileSize);
                } else {
                    ctx.fillStyle = '#0a0a0a';
                    ctx.fillRect(screenX, screenY, this.tileSize, this.tileSize);
                }
            }
        }
    }
}

// Bullet Class
class Bullet {
    constructor(x, y, angle) {
        this.pos = new Vector2D(x, y);
        this.vel = new Vector2D(Math.cos(angle) * CONFIG.BULLET_SPEED, Math.sin(angle) * CONFIG.BULLET_SPEED);
        this.size = CONFIG.BULLET_SIZE;
        this.dead = false;
    }

    update(dt, maze) {
        this.pos = this.pos.add(this.vel.multiply(dt));
        
        if (maze.isWall(this.pos.x, this.pos.y)) {
            this.dead = true;
        }

        if (this.pos.x < 0 || this.pos.x > maze.width * maze.tileSize || 
            this.pos.y < 0 || this.pos.y > maze.height * maze.tileSize) {
            this.dead = true;
        }
    }

    draw(ctx, camera) {
        ctx.fillStyle = '#00ffff';
        ctx.shadowBlur = 10;
        ctx.shadowColor = '#00ffff';
        ctx.fillRect(this.pos.x - camera.x - this.size / 2, this.pos.y - camera.y - this.size / 2, this.size, this.size);
        ctx.shadowBlur = 0;
    }

    collidesWith(entity) {
        return this.pos.distance(entity.pos) < this.size + entity.size / 2;
    }
}

// TV Class - MODIFIÉ: Ajout de imageLoader et level
class TV {
    constructor(x, y, imageLoader, level) {
        this.pos = new Vector2D(x, y);
        this.size = CONFIG.TV_SIZE;
        this.active = true;
        this.disableProgress = 0;
        this.imageLoader = imageLoader;
        this.level = level;
    }

    update(dt, playerPos, playerMoving) {
        if (!this.active) return false;

        const dist = this.pos.distance(playerPos);
        
        if (dist < 50) {
            this.disableProgress += dt;
            if (this.disableProgress >= CONFIG.TV_DISABLE_TIME / 1000) {
                this.active = false;
                return true;
            }
        } else {
            this.disableProgress = 0;
        }
        return false;
    }

    draw(ctx, camera) {
        const screenX = this.pos.x - camera.x;
        const screenY = this.pos.y - camera.y;

        if (this.active) {
            ctx.fillStyle = '#333';
            ctx.fillRect(screenX - this.size / 2, screenY - this.size / 2, this.size, this.size * 0.8);
            
            // MODIFIÉ: Remplacer le rectangle vert par l'image
            const img = this.imageLoader.get(`tv_screen_${this.level}`);
            if (img) {
                ctx.drawImage(img, 
                    screenX - this.size / 2 + 3, 
                    screenY - this.size / 2 + 3, 
                    this.size - 6, 
                    this.size * 0.6
                );
                
                // Effet lumineux
                ctx.shadowBlur = 10;
                ctx.shadowColor = '#00ff00';
                ctx.drawImage(img, 
                    screenX - this.size / 2 + 3, 
                    screenY - this.size / 2 + 3, 
                    this.size - 6, 
                    this.size * 0.6
                );
                ctx.shadowBlur = 0;
            } else {
                // Fallback si l'image ne charge pas
                ctx.fillStyle = '#00ff00';
                ctx.fillRect(screenX - this.size / 2 + 3, screenY - this.size / 2 + 3, this.size - 6, this.size * 0.6);
                ctx.shadowBlur = 15;
                ctx.shadowColor = '#00ff00';
                ctx.fillRect(screenX - this.size / 2 + 3, screenY - this.size / 2 + 3, this.size - 6, this.size * 0.6);
                ctx.shadowBlur = 0;
            }

            ctx.strokeStyle = '#666';
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.moveTo(screenX - this.size / 4, screenY - this.size / 2);
            ctx.lineTo(screenX - this.size / 3, screenY - this.size);
            ctx.moveTo(screenX + this.size / 4, screenY - this.size / 2);
            ctx.lineTo(screenX + this.size / 3, screenY - this.size);
            ctx.stroke();

            ctx.fillStyle = '#444';
            ctx.fillRect(screenX - this.size / 4, screenY + this.size * 0.3, this.size / 2, 5);

            if (this.disableProgress > 0) {
                const progress = this.disableProgress / (CONFIG.TV_DISABLE_TIME / 1000);
                ctx.strokeStyle = '#ff00ff';
                ctx.lineWidth = 3;
                ctx.beginPath();
                ctx.arc(screenX, screenY, this.size * 0.7, -Math.PI / 2, -Math.PI / 2 + Math.PI * 2 * progress);
                ctx.stroke();
            }
        } else {
            ctx.fillStyle = '#111';
            ctx.fillRect(screenX - this.size / 2, screenY - this.size / 2, this.size, this.size * 0.8);
            ctx.strokeStyle = '#333';
            ctx.strokeRect(screenX - this.size / 2, screenY - this.size / 2, this.size, this.size * 0.8);
        }
    }
}

// Robot Class
class Robot {
    constructor(x, y, speed, imageLoader) {
        this.pos = new Vector2D(x, y);
        this.size = CONFIG.ROBOT_SIZE;
        this.speed = speed;
        this.vel = new Vector2D(0, 0);
        this.dead = false;
        this.patrolAngle = Math.random() * Math.PI * 2;
        this.patrolTimer = 0;
        this.state = 'patrol';
        this.imageLoader = imageLoader;
        this.type = Math.floor(Math.random() * 4) + 1;
        this.facingRight = true;
    }

    update(dt, playerPos, maze) {
        const distToPlayer = this.pos.distance(playerPos);

        if (distToPlayer < CONFIG.ROBOT_DETECTION_RANGE) {
            this.state = 'chase';
            const dir = playerPos.subtract(this.pos).normalize();
            this.vel = dir.multiply(this.speed);
            
            this.facingRight = dir.x >= 0;
        } else {
            this.state = 'patrol';
            this.patrolTimer += dt;
            if (this.patrolTimer > 2) {
                this.patrolAngle = Math.random() * Math.PI * 2;
                this.patrolTimer = 0;
            }
            this.vel = new Vector2D(Math.cos(this.patrolAngle) * this.speed * 0.5, Math.sin(this.patrolAngle) * this.speed * 0.5);
            
            this.facingRight = Math.cos(this.patrolAngle) >= 0;
        }

        const newPos = this.pos.add(this.vel.multiply(dt));
        
        if (!maze.isWall(newPos.x, this.pos.y)) {
            this.pos.x = newPos.x;
        } else {
            this.patrolAngle = Math.random() * Math.PI * 2;
        }
        
        if (!maze.isWall(this.pos.x, newPos.y)) {
            this.pos.y = newPos.y;
        } else {
            this.patrolAngle = Math.random() * Math.PI * 2;
        }

        if (this.pos.x < 0 || this.pos.x > maze.width * maze.tileSize || 
            this.pos.y < 0 || this.pos.y > maze.height * maze.tileSize) {
            this.patrolAngle = Math.random() * Math.PI * 2;
        }
    }

    draw(ctx, camera) {
        const screenX = this.pos.x - camera.x;
        const screenY = this.pos.y - camera.y;

        const direction = this.facingRight ? 'right' : 'left';
        const imgKey = `nazi_robot_${direction}_${this.type}`;
        const img = this.imageLoader.get(imgKey);

        if (img) {
            ctx.drawImage(img, screenX - this.size / 2, screenY - this.size / 2, this.size, this.size);
        } else {
            ctx.fillStyle = '#666';
            ctx.fillRect(screenX - this.size / 2, screenY - this.size / 2, this.size, this.size);
        }

        if (this.state === 'chase') {
            ctx.strokeStyle = '#ff00ff';
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.arc(screenX, screenY, this.size * 0.8, 0, Math.PI * 2);
            ctx.stroke();
        }
    }

    collidesWith(entity) {
        return this.pos.distance(entity.pos) < this.size / 2 + entity.size / 2;
    }
}

// Player Class
class Player {
    constructor(x, y, imageLoader) {
        this.pos = new Vector2D(x, y);
        this.size = CONFIG.PLAYER_SIZE;
        this.lives = CONFIG.MAX_LIVES;
        this.vel = new Vector2D(0, 0);
        this.angle = 0;
        this.invulnerable = false;
        this.invulnerableTimer = 0;
        this.moving = false;
        this.imageLoader = imageLoader;
        this.facingRight = true;
        this.hasMoved = false;
    }

    update(dt, input, maze, camera) {
        this.moving = false;
        this.vel = new Vector2D(0, 0);

        if (input.up) { this.vel.y -= 1; this.moving = true; }
        if (input.down) { this.vel.y += 1; this.moving = true; }
        if (input.left) { 
            this.vel.x -= 1; 
            this.moving = true;
            this.facingRight = false;
        }
        if (input.right) { 
            this.vel.x += 1; 
            this.moving = true;
            this.facingRight = true;
        }

        if (this.moving) {
            this.hasMoved = true;
        }

        if (this.vel.length() > 0) {
            this.vel = this.vel.normalize().multiply(CONFIG.PLAYER_SPEED);
        }

        const newPos = this.pos.add(this.vel.multiply(dt));
        
        if (!maze.isWall(newPos.x, this.pos.y)) {
            this.pos.x = newPos.x;
        }
        
        if (!maze.isWall(this.pos.x, newPos.y)) {
            this.pos.y = newPos.y;
        }

        if (input.mousePos && !isMobile) {
            const worldMouseX = input.mousePos.x + camera.x;
            const worldMouseY = input.mousePos.y + camera.y;
            
            const dx = worldMouseX - this.pos.x;
            const dy = worldMouseY - this.pos.y;
            this.angle = Math.atan2(dy, dx);
        } else if (isMobile) {
            if (input.joyAngle !== undefined) {
                this.angle = input.joyAngle;
            }
        }

        if (this.invulnerable) {
            this.invulnerableTimer -= dt;
            if (this.invulnerableTimer <= 0) {
                this.invulnerable = false;
            }
        }
    }

    takeDamage() {
        if (!this.invulnerable && this.lives > 0) {
            this.lives--;
            this.invulnerable = true;
            this.invulnerableTimer = 2;
            return true;
        }
        return false;
    }

    draw(ctx, camera) {
        const screenX = this.pos.x - camera.x;
        const screenY = this.pos.y - camera.y;

        if (this.invulnerable && Math.floor(Date.now() / 100) % 2 === 0) {
            return;
        }

        const direction = this.facingRight ? 'right' : 'left';
        const imgKey = `scientist_${direction}`;
        const img = this.imageLoader.get(imgKey);

        if (img) {
            ctx.save();
            ctx.translate(screenX, screenY);
            ctx.drawImage(img, -this.size / 2, -this.size / 2, this.size, this.size);
            ctx.restore();
        } else {
            ctx.fillStyle = '#ffffff';
            ctx.fillRect(screenX - this.size / 2, screenY - this.size / 2, this.size, this.size);
        }
    }
}

// Audio Manager for Game
class GameAudioManager {
    constructor() {
        this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
        this.masterGain = this.audioContext.createGain();
        this.masterGain.connect(this.audioContext.destination);
        this.settings = this.loadSettings();
        this.updateVolume();
        this.musicOscillators = [];
    }

    loadSettings() {
        const saved = localStorage.getItem('rewindSettings');
        return saved ? JSON.parse(saved) : { volume: 50, sfxVolume: 70, controls: 'qsdz' };
    }

    updateVolume() {
        this.masterGain.gain.value = this.settings.volume / 100;
    }

    playSound(type) {
        if (this.audioContext.state === 'suspended') {
            this.audioContext.resume();
        }

        const osc = this.audioContext.createOscillator();
        const gain = this.audioContext.createGain();
        const now = this.audioContext.currentTime;
        
        gain.gain.value = (this.settings.sfxVolume / 100) * 0.2;

        switch(type) {
            case 'shoot':
                osc.frequency.value = 1000;
                osc.type = 'square';
                gain.gain.exponentialRampToValueAtTime(0.001, now + 0.05);
                break;
            case 'explosion':
                osc.frequency.value = 100;
                osc.type = 'sawtooth';
                gain.gain.exponentialRampToValueAtTime(0.001, now + 0.3);
                break;
            case 'tv_off':
                osc.frequency.value = 400;
                osc.frequency.exponentialRampToValueAtTime(100, now + 0.2);
                osc.type = 'sine';
                gain.gain.exponentialRampToValueAtTime(0.001, now + 0.2);
                break;
            case 'damage':
                osc.frequency.value = 200;
                osc.type = 'sawtooth';
                gain.gain.exponentialRampToValueAtTime(0.001, now + 0.2);
                break;
            case 'wave':
                osc.frequency.value = 600;
                osc.frequency.exponentialRampToValueAtTime(1200, now + 0.5);
                osc.type = 'sine';
                gain.gain.exponentialRampToValueAtTime(0.001, now + 0.5);
                break;
            case 'victory':
                osc.frequency.value = 523.25;
                osc.type = 'sine';
                gain.gain.exponentialRampToValueAtTime(0.001, now + 0.8);
                setTimeout(() => {
                    const osc2 = this.audioContext.createOscillator();
                    const gain2 = this.audioContext.createGain();
                    osc2.frequency.value = 659.25;
                    osc2.type = 'sine';
                    gain2.gain.value = (this.settings.sfxVolume / 100) * 0.2;
                    gain2.gain.exponentialRampToValueAtTime(0.001, this.audioContext.currentTime + 0.8);
                    osc2.connect(gain2);
                    gain2.connect(this.masterGain);
                    osc2.start();
                    osc2.stop(this.audioContext.currentTime + 0.8);
                }, 200);
                break;
            case 'gameover':
                osc.frequency.value = 440;
                osc.frequency.exponentialRampToValueAtTime(110, now + 1);
                osc.type = 'sine';
                gain.gain.exponentialRampToValueAtTime(0.001, now + 1);
                break;
        }

        osc.connect(gain);
        gain.connect(this.masterGain);
        osc.start(now);
        osc.stop(now + (type === 'victory' ? 0.8 : type === 'gameover' ? 1 : 0.3));
    }

    startGameMusic() {
        this.stopMusic();

        const bass = this.audioContext.createOscillator();
        bass.type = 'sine';
        bass.frequency.value = 65.41;
        const bassGain = this.audioContext.createGain();
        bassGain.gain.value = 0.1;
        bass.connect(bassGain);
        bassGain.connect(this.masterGain);
        bass.start();
        this.musicOscillators.push(bass);

        const pad = this.audioContext.createOscillator();
        pad.type = 'sawtooth';
        pad.frequency.value = 261.63;
        const padGain = this.audioContext.createGain();
        padGain.gain.value = 0.06;
        const filter = this.audioContext.createBiquadFilter();
        filter.type = 'lowpass';
        filter.frequency.value = 600;
        pad.connect(filter);
        filter.connect(padGain);
        padGain.connect(this.masterGain);
        pad.start();
        this.musicOscillators.push(pad);

        this.startMelody();
    }

    startMelody() {
        const notes = [523.25, 587.33, 659.25, 783.99];
        let index = 0;
        
        const playNote = () => {
            const osc = this.audioContext.createOscillator();
            osc.type = 'square';
            osc.frequency.value = notes[index];
            const gain = this.audioContext.createGain();
            gain.gain.value = 0.03;
            gain.gain.exponentialRampToValueAtTime(0.001, this.audioContext.currentTime + 0.4);
            osc.connect(gain);
            gain.connect(this.masterGain);
            osc.start();
            osc.stop(this.audioContext.currentTime + 0.4);
            
            index = (index + 1) % notes.length;
        };
        
        this.melodyInterval = setInterval(playNote, 500);
    }

    stopMusic() {
        this.musicOscillators.forEach(osc => {
            try { osc.stop(); } catch(e) {}
        });
        this.musicOscillators = [];
        if (this.melodyInterval) {
            clearInterval(this.melodyInterval);
        }
    }
}

// Input Manager
class InputManager {
    constructor(controlScheme) {
        this.keys = {};
        this.mousePos = null;
        this.mouseDown = false;
        this.spaceDown = false;
        this.controlScheme = controlScheme;
        this.controlKeys = getControlKeys(controlScheme);
        this.joystickActive = false;
        this.joystickPos = { x: 0, y: 0 };
        this.fireActive = false;
        
        this.cameraKeys = {
            up: false,
            down: false,
            left: false,
            right: false
        };

        this.touchPanning = false;
        this.lastTouchPos = { x: 0, y: 0 };
        this.touchPanDelta = { x: 0, y: 0 };
        this.pinching = false;
        this.lastPinchDistance = 0;
        this.zoomLevel = 1.0;
        
        this.initListeners();
    }

    initListeners() {
        document.addEventListener('keydown', (e) => {
            this.keys[e.key.toLowerCase()] = true;
            
            if (e.key === ' ') {
                e.preventDefault();
                this.spaceDown = true;
            }
            
            if (e.key === 'ArrowUp') this.cameraKeys.up = true;
            if (e.key === 'ArrowDown') this.cameraKeys.down = true;
            if (e.key === 'ArrowLeft') this.cameraKeys.left = true;
            if (e.key === 'ArrowRight') this.cameraKeys.right = true;
            
            if (e.key === 'Escape' || e.key === 'p') {
                if (window.game) window.game.togglePause();
            }
        });

        document.addEventListener('keyup', (e) => {
            this.keys[e.key.toLowerCase()] = false;
            
            if (e.key === ' ') {
                this.spaceDown = false;
            }
            
            if (e.key === 'ArrowUp') this.cameraKeys.up = false;
            if (e.key === 'ArrowDown') this.cameraKeys.down = false;
            if (e.key === 'ArrowLeft') this.cameraKeys.left = false;
            if (e.key === 'ArrowRight') this.cameraKeys.right = false;
        });

        const canvas = document.getElementById('game-canvas');
        canvas.addEventListener('mousemove', (e) => {
            const rect = canvas.getBoundingClientRect();
            this.mousePos = {
                x: e.clientX - rect.left,
                y: e.clientY - rect.top
            };
        });

        canvas.addEventListener('mousedown', () => {
            this.mouseDown = true;
        });

        canvas.addEventListener('mouseup', () => {
            this.mouseDown = false;
        });

        if (isMobile) {
            this.initMobileControls();
        }
    }

    initMobileControls() {
        const joystick = document.getElementById('joystick');
        const joystickStick = joystick.querySelector('.joystick-stick');
        const fireBtn = document.getElementById('fire-btn');
        const canvas = document.getElementById('game-canvas');

        const handleJoystickStart = (e) => {
            e.preventDefault();
            this.joystickActive = true;
        };

        const handleJoystickMove = (e) => {
            if (!this.joystickActive) return;
            e.preventDefault();
            
            const touch = e.touches ? e.touches[0] : e;
            const rect = joystick.getBoundingClientRect();
            const centerX = rect.left + rect.width / 2;
            const centerY = rect.top + rect.height / 2;
            
            let deltaX = touch.clientX - centerX;
            let deltaY = touch.clientY - centerY;
            
            const distance = Math.sqrt(deltaX * deltaX + deltaY * deltaY);
            const maxDistance = 35;
            
            if (distance > maxDistance) {
                deltaX = (deltaX / distance) * maxDistance;
                deltaY = (deltaY / distance) * maxDistance;
            }
            
            this.joystickPos = {
                x: deltaX / maxDistance,
                y: deltaY / maxDistance
            };
            
            joystickStick.style.transform = `translate(-50%, -50%) translate(${deltaX}px, ${deltaY}px)`;
        };

        const handleJoystickEnd = () => {
            this.joystickActive = false;
            this.joystickPos = { x: 0, y: 0 };
            joystickStick.style.transform = 'translate(-50%, -50%)';
        };

        joystick.addEventListener('touchstart', handleJoystickStart);
        joystick.addEventListener('touchmove', handleJoystickMove);
        joystick.addEventListener('touchend', handleJoystickEnd);

        fireBtn.addEventListener('touchstart', (e) => {
            e.preventDefault();
            this.fireActive = true;
        });

        fireBtn.addEventListener('touchend', (e) => {
            e.preventDefault();
            this.fireActive = false;
        });

        canvas.addEventListener('touchstart', (e) => {
            if (e.touches.length === 1) {
                const touch = e.touches[0];
                const joystickRect = joystick.getBoundingClientRect();
                const fireRect = fireBtn.getBoundingClientRect();
                
                const inJoystick = touch.clientX >= joystickRect.left && touch.clientX <= joystickRect.right &&
                                   touch.clientY >= joystickRect.top && touch.clientY <= joystickRect.bottom;
                const inFire = touch.clientX >= fireRect.left && touch.clientX <= fireRect.right &&
                              touch.clientY >= fireRect.top && touch.clientY <= fireRect.bottom;
                
                if (!inJoystick && !inFire) {
                    this.touchPanning = true;
                    this.lastTouchPos = { x: touch.clientX, y: touch.clientY };
                }
            } else if (e.touches.length === 2) {
                this.pinching = true;
                const dx = e.touches[0].clientX - e.touches[1].clientX;
                const dy = e.touches[0].clientY - e.touches[1].clientY;
                this.lastPinchDistance = Math.sqrt(dx * dx + dy * dy);
            }
        });

        canvas.addEventListener('touchmove', (e) => {
            e.preventDefault();
            
            if (this.touchPanning && e.touches.length === 1) {
                const touch = e.touches[0];
                
                this.touchPanDelta = {
                    x: -(touch.clientX - this.lastTouchPos.x),
                    y: -(touch.clientY - this.lastTouchPos.y)
                };
                
                this.lastTouchPos = { x: touch.clientX, y: touch.clientY };
            } else if (this.pinching && e.touches.length === 2) {
                const dx = e.touches[0].clientX - e.touches[1].clientX;
                const dy = e.touches[0].clientY - e.touches[1].clientY;
                const distance = Math.sqrt(dx * dx + dy * dy);
                const delta = distance - this.lastPinchDistance;
                
                this.zoomLevel += delta * 0.01;
                this.zoomLevel = Math.max(0.5, Math.min(2.0, this.zoomLevel));
                
                canvas.style.transform = `scale(${this.zoomLevel})`;
                
                this.lastPinchDistance = distance;
            }
        });

        canvas.addEventListener('touchend', (e) => {
            if (e.touches.length === 0) {
                this.touchPanning = false;
                this.pinching = false;
                this.touchPanDelta = { x: 0, y: 0 };
            } else if (e.touches.length === 1) {
                this.pinching = false;
            }
        });
    }

    getInput() {
        const ck = this.controlKeys;
        
        if (isMobile && this.joystickActive) {
            let joyAngle = undefined;
            if (this.joystickPos.x !== 0 || this.joystickPos.y !== 0) {
                joyAngle = Math.atan2(this.joystickPos.y, this.joystickPos.x);
            }
            
            return {
                up: this.joystickPos.y < -0.3,
                down: this.joystickPos.y > 0.3,
                left: this.joystickPos.x < -0.3,
                right: this.joystickPos.x > 0.3,
                shoot: this.fireActive,
                mousePos: null,
                cameraKeys: this.cameraKeys,
                joyAngle: joyAngle,
                touchPanDelta: this.touchPanDelta
            };
        }

        return {
            up: this.keys[ck.up],
            down: this.keys[ck.down],
            left: this.keys[ck.left],
            right: this.keys[ck.right],
            shoot: this.mouseDown || this.spaceDown || this.fireActive,
            mousePos: this.mousePos,
            cameraKeys: this.cameraKeys,
            joyAngle: undefined,
            touchPanDelta: this.touchPanDelta
        };
    }

    updateControlScheme(scheme) {
        this.controlScheme = scheme;
        this.controlKeys = getControlKeys(scheme);
    }
}

// Score Manager
class ScoreManager {
    constructor() {
        this.score = 0;
        this.robotsKilled = 0;
        this.tvsDestroyed = 0;
    }

    addRobotKill() {
        this.robotsKilled++;
        this.score += 100;
        this.update();
    }

    addTVDestroyed() {
        this.tvsDestroyed++;
        this.score += 500;
        this.update();
    }

    update() {
        document.getElementById('score-display').textContent = this.score;
    }

    reset() {
        this.score = 0;
        this.robotsKilled = 0;
        this.tvsDestroyed = 0;
        this.update();
    }
}

// UI Manager
class UIManager {
    showTutorial() {
        const tutorial = document.getElementById('tutorial');
        tutorial.classList.remove('hidden');
        setTimeout(() => {
            tutorial.classList.add('hidden');
        }, 5000);
    }

    updateHUD(level, lives, tvsLeft, tvsTotal) {
        document.getElementById('level-display').textContent = level;
        document.getElementById('lives-display').textContent = '♥'.repeat(Math.max(0, lives));
        document.getElementById('tvs-display').textContent = `${tvsTotal - tvsLeft}/${tvsTotal}`;
    }

    showLevelComplete(robotsKilled, tvsDestroyed, score) {
        document.getElementById('robots-killed').textContent = robotsKilled;
        document.getElementById('tvs-destroyed').textContent = tvsDestroyed;
        document.getElementById('level-score').textContent = score;
        document.getElementById('level-complete').classList.remove('hidden');
    }

    hideLevelComplete() {
        document.getElementById('level-complete').classList.add('hidden');
    }

    showGameOver(score, level, deathCount) {
        document.getElementById('final-score').textContent = score;
        document.getElementById('final-level').textContent = level;
        
        const loopMessage = document.getElementById('loop-message');
        if (deathCount >= 5) {
            loopMessage.textContent = 'Encore une fois...';
        } else {
            loopMessage.textContent = 'La boucle continue...';
        }
        
        document.getElementById('game-over').classList.add('glitch-effect');
        document.getElementById('game-over').classList.remove('hidden');
    }

    hideGameOver() {
        document.getElementById('game-over').classList.add('hidden');
    }

    showVictory(score) {
        document.getElementById('victory-score').textContent = score;
        document.getElementById('victory').classList.remove('hidden');
    }

    showPause() {
        document.getElementById('pause-menu').classList.remove('hidden');
    }

    hidePause() {
        document.getElementById('pause-menu').classList.add('hidden');
    }

    showToast(message) {
        const toast = document.getElementById('toast');
        toast.textContent = message;
        toast.classList.remove('hidden');
        setTimeout(() => {
            toast.classList.add('hidden');
        }, 3000);
    }

    showSettingsModal() {
        const settings = JSON.parse(localStorage.getItem('rewindSettings')) || { volume: 50, sfxVolume: 70, controls: 'qsdz' };
        document.getElementById('volume-slider-game').value = settings.volume;
        document.getElementById('volume-value-game').textContent = settings.volume + '%';
        document.getElementById('sfx-slider-game').value = settings.sfxVolume;
        document.getElementById('sfx-value-game').textContent = settings.sfxVolume + '%';
        document.getElementById('controls-select-game').value = settings.controls;
        document.getElementById('settings-game-modal').classList.remove('hidden');
    }

    hideSettingsModal() {
        document.getElementById('settings-game-modal').classList.add('hidden');
    }
}

// Game Class - CORRIGÉ: maxCameraY augmenté pour permettre de voir tout le bas
class Game {
    constructor() {
        this.canvas = document.getElementById('game-canvas');
        this.ctx = this.canvas.getContext('2d');
        this.canvas.width = CONFIG.CANVAS_WIDTH;
        this.canvas.height = CONFIG.CANVAS_HEIGHT;
        
        this.imageLoader = new ImageLoader();
        this.explosions = [];
        
        this.audio = new GameAudioManager();
        this.input = new InputManager(this.audio.settings.controls);
        this.ui = new UIManager();
        this.scoreManager = new ScoreManager();
        this.particles = new ParticleSystem();
        
        this.state = 'loading';
        this.level = 1;
        this.deathCount = parseInt(localStorage.getItem('rewindDeathCount')) || 0;
        
        this.lastTime = 0;
        this.shootCooldown = 0;
        this.glitchTimer = 0;
        
        this.gameStartTimer = 0;
        this.initialSpawnDone = false;
        
        this.showLoadingScreen();
        this.loadAssets();
    }

    async loadAssets() {
        try {
            await this.imageLoader.loadAll();
            this.hideLoadingScreen();
            this.initLevel();
            this.initEventListeners();
            this.ui.showTutorial();
            this.audio.startGameMusic();
            
            if (isMobile) {
                document.getElementById('mobile-controls').classList.remove('hidden');
            }
            
            this.state = 'playing';
            window.game = this;
            requestAnimationFrame(this.gameLoop.bind(this));
        } catch (error) {
            console.error('Erreur de chargement des images:', error);
            alert('Erreur lors du chargement des ressources. Vérifiez que les images sont présentes dans le dossier assets/');
        }
    }

    showLoadingScreen() {
        const loadingDiv = document.createElement('div');
        loadingDiv.id = 'loading-screen';
        loadingDiv.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: #000;
            display: flex;
            align-items: center;
            justify-content: center;
            z-index: 10000;
            font-family: 'Share Tech Mono', monospace;
            color: #00ffff;
            font-size: 1.5rem;
        `;
        loadingDiv.innerHTML = `
            <div>
                <p>CHARGEMENT DES ASSETS...</p>
                <div style="width: 300px; height: 20px; border: 2px solid #00ffff; margin-top: 20px;">
                    <div id="loading-bar" style="width: 0%; height: 100%; background: #00ffff; transition: width 0.3s;"></div>
                </div>
            </div>
        `;
        document.body.appendChild(loadingDiv);
        
        const checkProgress = setInterval(() => {
            const progress = this.imageLoader.getProgress() * 100;
            const bar = document.getElementById('loading-bar');
            if (bar) bar.style.width = progress + '%';
            if (progress >= 100) clearInterval(checkProgress);
        }, 100);
    }

    hideLoadingScreen() {
        const loadingScreen = document.getElementById('loading-screen');
        if (loadingScreen) {
            loadingScreen.style.animation = 'fadeOut 0.5s';
            setTimeout(() => loadingScreen.remove(), 500);
        }
    }

    initLevel() {
        this.maze = new Maze(CONFIG.CANVAS_WIDTH * 3, CONFIG.CANVAS_HEIGHT * 3, CONFIG.TILE_SIZE);
        this.player = new Player(CONFIG.TILE_SIZE * 3, CONFIG.TILE_SIZE * 3, this.imageLoader);
        this.bullets = [];
        this.robots = [];
        this.tvs = [];
        this.camera = { x: 0, y: 0 };
        this.scoreManager.tvsDestroyed = 0;
        this.scoreManager.robotsKilled = 0;
        this.explosions = [];
        
        this.gameStartTimer = 0;
        this.initialSpawnDone = false;
        
        // MODIFIÉ: Passer imageLoader et level aux TVs
        for (let i = 0; i < CONFIG.TVS_PER_LEVEL; i++) {
            const pos = this.maze.getRandomFloorPosition();
            this.tvs.push(new TV(pos.x, pos.y, this.imageLoader, this.level));
        }
        
        this.ui.updateHUD(this.level, this.player.lives, this.getActiveTVs(), CONFIG.TVS_PER_LEVEL);
    }

    initEventListeners() {
        document.getElementById('next-level-btn').addEventListener('click', () => {
            this.level++;
            if (this.level > 3) {
                this.ui.hideLevelComplete();
                this.ui.showVictory(this.scoreManager.score);
                this.audio.playSound('victory');
                this.state = 'victory';
            } else {
                this.ui.hideLevelComplete();
                this.initLevel();
                this.state = 'playing';
            }
        });

        document.getElementById('resume-btn').addEventListener('click', () => {
            this.togglePause();
        });

        document.getElementById('restart-btn').addEventListener('click', () => {
            this.restart();
        });

        document.getElementById('menu-btn').addEventListener('click', () => {
            window.location.href = 'index.html';
        });

        document.getElementById('restart-game-btn').addEventListener('click', () => {
            this.restart();
        });

        document.getElementById('menu-game-over-btn').addEventListener('click', () => {
            window.location.href = 'index.html';
        });

        document.getElementById('share-score-btn').addEventListener('click', () => {
            this.shareScore();
        });

        document.getElementById('menu-victory-btn').addEventListener('click', () => {
            window.location.href = 'index.html';
        });

        document.getElementById('share-victory-btn').addEventListener('click', () => {
            this.shareScore();
        });

        document.getElementById('settings-game-btn').addEventListener('click', () => {
            this.ui.showSettingsModal();
        });

        document.getElementById('close-settings-game').addEventListener('click', () => {
            this.ui.hideSettingsModal();
        });

        document.getElementById('pause-btn-mobile').addEventListener('click', () => {
            this.togglePause();
        });

        document.getElementById('volume-slider-game').addEventListener('input', (e) => {
            this.audio.settings.volume = parseInt(e.target.value);
            document.getElementById('volume-value-game').textContent = e.target.value + '%';
            this.audio.updateVolume();
            localStorage.setItem('rewindSettings', JSON.stringify(this.audio.settings));
        });

        document.getElementById('sfx-slider-game').addEventListener('input', (e) => {
            this.audio.settings.sfxVolume = parseInt(e.target.value);
            document.getElementById('sfx-value-game').textContent = e.target.value + '%';
            localStorage.setItem('rewindSettings', JSON.stringify(this.audio.settings));
        });

        document.getElementById('controls-select-game').addEventListener('change', (e) => {
            this.audio.settings.controls = e.target.value;
            this.input.updateControlScheme(e.target.value);
            localStorage.setItem('rewindSettings', JSON.stringify(this.audio.settings));
        });
    }

    togglePause() {
        if (this.state === 'playing') {
            this.state = 'paused';
            this.ui.showPause();
        } else if (this.state === 'paused') {
            this.state = 'playing';
            this.ui.hidePause();
        }
    }

    restart() {
        this.ui.hideGameOver();
        this.ui.hidePause();
        this.ui.hideLevelComplete();
        this.level = 1;
        this.scoreManager.reset();
        this.initLevel();
        this.state = 'playing';
    }

    shareScore() {
        const playerName = document.getElementById('player-name').value || document.getElementById('player-name-victory').value || 'Anonymous';
        const text = `🎮 J'ai scoré ${this.scoreManager.score} points sur Rewind Protocol !\nPeux-tu briser la boucle ?\n👉 ${window.location.href.replace('game.html', 'index.html')}`;
        
        navigator.clipboard.writeText(text).then(() => {
            this.ui.showToast('Score copié dans le presse-papier !');
            
            const leaderboard = JSON.parse(localStorage.getItem('rewindLeaderboard')) || [];
            leaderboard.push({
                name: playerName,
                score: this.scoreManager.score,
                level: this.level,
                date: new Date().toLocaleDateString()
            });
            leaderboard.sort((a, b) => b.score - a.score);
            localStorage.setItem('rewindLeaderboard', JSON.stringify(leaderboard.slice(0, 10)));
        }).catch(() => {
            this.ui.showToast('Erreur lors de la copie');
        });
    }

    spawnInitialWave() {
        if (this.initialSpawnDone) return;
        
        this.initialSpawnDone = true;
        this.audio.playSound('wave');
        const speed = CONFIG.ROBOT_SPEEDS[this.level - 1];
        
        const robotTypes = [];
        for (let type = 1; type <= 4; type++) {
            for (let i = 0; i < 6; i++) {
                robotTypes.push(type);
            }
        }
        robotTypes.push(Math.floor(Math.random() * 4) + 1);
        
        for (let i = 0; i < CONFIG.INITIAL_ROBOTS; i++) {
            const pos = this.maze.getRandomFloorPosition();
            const robot = new Robot(pos.x, pos.y, speed, this.imageLoader);
            robot.type = robotTypes[i];
            this.robots.push(robot);
        }
    }

    getActiveTVs() {
        return this.tvs.filter(tv => tv.active).length;
    }

    update(dt) {
        if (this.state !== 'playing') return;

        const input = this.input.getInput();
        
        this.gameStartTimer += dt;
        if (this.gameStartTimer >= 2 && !this.initialSpawnDone) {
            this.spawnInitialWave();
        }
        
        this.player.update(dt, input, this.maze, this.camera);
        
        const targetCameraX = this.player.pos.x - CONFIG.CANVAS_WIDTH / 2;
        const targetCameraY = this.player.pos.y - CONFIG.CANVAS_HEIGHT / 2;
        
        // Contrôles manuels caméra (desktop flèches)
        if (input.cameraKeys.left) this.camera.x -= CONFIG.CAMERA_SPEED * dt;
        if (input.cameraKeys.right) this.camera.x += CONFIG.CAMERA_SPEED * dt;
        if (input.cameraKeys.up) this.camera.y -= CONFIG.CAMERA_SPEED * dt;
        if (input.cameraKeys.down) this.camera.y += CONFIG.CAMERA_SPEED * dt;

        // Pan tactile mobile (avec delta inversé)
        if (isMobile && input.touchPanDelta) {
            this.camera.x += input.touchPanDelta.x;
            this.camera.y += input.touchPanDelta.y;
        }

        // CORRIGÉ: maxCameraY augmenté de 300 pixels pour permettre de voir tout le bas
        const maxCameraX = Math.max(0, this.maze.width * this.maze.tileSize - CONFIG.CANVAS_WIDTH);
        const maxCameraY = Math.max(0, this.maze.height * this.maze.tileSize - CONFIG.CANVAS_HEIGHT + 300);

        // Système de suivi automatique avec lerp smooth
        const playerScreenX = this.player.pos.x - this.camera.x;
        const playerScreenY = this.player.pos.y - this.camera.y;

        const margin = 100;
        const marginBottom = 100;

        let shouldFollowX = false;
        let shouldFollowY = false;

        if (playerScreenX < margin) {
            shouldFollowX = true;
        }
        if (playerScreenX > CONFIG.CANVAS_WIDTH - margin) {
            shouldFollowX = true;
        }
        if (playerScreenY < margin) {
            shouldFollowY = true;
        }
        if (playerScreenY > CONFIG.CANVAS_HEIGHT - marginBottom) {
            shouldFollowY = true;
        }

        // Appliquer lerp uniquement si nécessaire
        if (shouldFollowX) {
            this.camera.x += (targetCameraX - this.camera.x) * CONFIG.CAMERA_LERP_SPEED;
        }
        if (shouldFollowY) {
            this.camera.y += (targetCameraY - this.camera.y) * CONFIG.CAMERA_LERP_SPEED;
        }

        // Appliquer les limites finales
        this.camera.x = Math.max(0, Math.min(maxCameraX, this.camera.x));
        this.camera.y = Math.max(0, Math.min(maxCameraY, this.camera.y));
        
        if (input.shoot && this.shootCooldown <= 0) {
            this.bullets.push(new Bullet(this.player.pos.x, this.player.pos.y, this.player.angle));
            this.audio.playSound('shoot');
            this.shootCooldown = 0.2;
        }
        this.shootCooldown = Math.max(0, this.shootCooldown - dt);
        
        this.bullets.forEach(bullet => bullet.update(dt, this.maze));
        this.bullets = this.bullets.filter(b => !b.dead);
        
        this.robots.forEach(robot => robot.update(dt, this.player.pos, this.maze));
        
        this.bullets.forEach(bullet => {
            this.robots.forEach(robot => {
                if (!bullet.dead && !robot.dead && bullet.collidesWith(robot)) {
                    robot.dead = true;
                    bullet.dead = true;
                    
                    this.explosions.push(new Explosion(robot.pos.x, robot.pos.y, this.imageLoader));
                    
                    this.audio.playSound('explosion');
                    this.scoreManager.addRobotKill();
                }
            });
        });
        this.robots = this.robots.filter(r => !r.dead);
        
        this.robots.forEach(robot => {
            if (robot.collidesWith(this.player)) {
                if (this.player.takeDamage()) {
                    this.audio.playSound('damage');
                    this.ui.updateHUD(this.level, this.player.lives, this.getActiveTVs(), CONFIG.TVS_PER_LEVEL);
                    this.canvas.style.animation = 'shake 0.3s';
                    setTimeout(() => { this.canvas.style.animation = ''; }, 300);
                    
                    if (this.player.lives <= 0) {
                        this.deathCount++;
                        localStorage.setItem('rewindDeathCount', this.deathCount);
                        this.audio.playSound('gameover');
                        this.ui.showGameOver(this.scoreManager.score, this.level, this.deathCount);
                        this.state = 'gameover';
                    }
                }
            }
        });
        
        this.tvs.forEach(tv => {
            if (tv.update(dt, this.player.pos, this.player.moving)) {
                this.audio.playSound('tv_off');
                this.particles.emit(tv.pos.x, tv.pos.y, 10, 'rgb(0, 255, 0)');
                this.scoreManager.addTVDestroyed();
                this.ui.updateHUD(this.level, this.player.lives, this.getActiveTVs(), CONFIG.TVS_PER_LEVEL);
            }
        });
        
        if (this.getActiveTVs() === 0 && this.state === 'playing') {
            this.state = 'levelComplete';
            this.ui.showLevelComplete(this.scoreManager.robotsKilled, CONFIG.TVS_PER_LEVEL, this.scoreManager.score);
            this.audio.playSound('victory');
        }
        
        this.particles.update(dt);
        
        this.explosions.forEach(exp => exp.update(dt));
        this.explosions = this.explosions.filter(exp => !exp.dead);
        
        this.glitchTimer += dt;
        if (this.glitchTimer > 100 && Math.random() < 0.01) {
            this.glitchTimer = 0;
            const glitchDiv = document.createElement('div');
            glitchDiv.textContent = 'LOOP';
            glitchDiv.style.position = 'fixed';
            glitchDiv.style.top = Math.random() * window.innerHeight + 'px';
            glitchDiv.style.left = Math.random() * window.innerWidth + 'px';
            glitchDiv.style.color = '#ff00ff';
            glitchDiv.style.fontSize = '2rem';
            glitchDiv.style.zIndex = '9999';
            glitchDiv.style.pointerEvents = 'none';
            document.body.appendChild(glitchDiv);
            setTimeout(() => glitchDiv.remove(), 100);
        }
    }

    draw() {
        this.ctx.fillStyle = '#000';
        this.ctx.fillRect(0, 0, CONFIG.CANVAS_WIDTH, CONFIG.CANVAS_HEIGHT);
        
        this.maze.draw(this.ctx, this.camera);
        this.tvs.forEach(tv => tv.draw(this.ctx, this.camera));
        this.robots.forEach(robot => robot.draw(this.ctx, this.camera));
        this.player.draw(this.ctx, this.camera);
        this.bullets.forEach(bullet => bullet.draw(this.ctx, this.camera));
        this.particles.draw(this.ctx);
        this.explosions.forEach(exp => exp.draw(this.ctx, this.camera));
        
        const gradient = this.ctx.createRadialGradient(
            CONFIG.CANVAS_WIDTH / 2, CONFIG.CANVAS_HEIGHT / 2, 0,
            CONFIG.CANVAS_WIDTH / 2, CONFIG.CANVAS_HEIGHT / 2, 200
        );
        gradient.addColorStop(0, 'rgba(0, 255, 255, 0.1)');
        gradient.addColorStop(1, 'rgba(0, 255, 255, 0)');
        this.ctx.fillStyle = gradient;
        this.ctx.fillRect(0, 0, CONFIG.CANVAS_WIDTH, CONFIG.CANVAS_HEIGHT);
    }

    gameLoop(timestamp) {
        const dt = Math.min((timestamp - this.lastTime) / 1000, 0.1);
        this.lastTime = timestamp;
        
        this.update(dt);
        this.draw();
        
        requestAnimationFrame(this.gameLoop.bind(this));
    }
}

// Initialize game
document.addEventListener('DOMContentLoaded', () => {
    new Game();
});

// Animations CSS
const style = document.createElement('style');
style.textContent = `
    @keyframes shake {
        0%, 100% { transform: translate(0, 0); }
        10%, 30%, 50%, 70%, 90% { transform: translate(-5px, 0); }
        20%, 40%, 60%, 80% { transform: translate(5px, 0); }
    }
    @keyframes fadeOut {
        from { opacity: 1; }
        to { opacity: 0; }
    }
`;
document.head.appendChild(style);