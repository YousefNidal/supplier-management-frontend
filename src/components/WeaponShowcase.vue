<template>
    <div class="lost-light-hero" ref="container" v-3d-tilt="{ max: 5, perspective: 1500 }">
        <!-- Background Video -->
        <div class="video-background-wrap">
            <video autoplay muted loop playsinline class="bg-video">
                <source :src="videoBg" type="video/mp4" />
            </video>
            <div class="video-overlay"></div>
        </div>

        <div class="scanline-effect"></div>

        <!-- Game Header Overlay -->
        <div class="game-header">
            <div class="level-indicator">LV.4 <span>MAX</span></div>
            <div class="header-title">ОРУЖЕЙНЫЙ СТОЛ</div>
        </div>

        <!-- Main Weapon and Background -->
        <div class="weapon-stage">
            <!-- Background Table Design -->
            <div class="table-surface"></div>

            <!-- Floating 3D Depth Elements -->
            <div class="depth-layer layer-back">
                <div class="glow-orb"></div>
            </div>

            <!-- The Weapon Asset -->
            <div class="weapon-model-wrap">
                <img :src="weaponImg" alt="KC556 Blue Crystal" class="weapon-asset crystal-pulse" />
                <div class="weapon-glow"></div>
            </div>

            <div class="depth-layer layer-front">
                <!-- Additional cosmetic shards could go here -->
            </div>

            <!-- Interactive UI Nodes -->
            <div v-for="node in nodes" :key="node.id" class="mod-node node-float"
                :style="{ top: node.y + '%', left: node.x + '%' }">
                <div class="node-circle">
                    <div class="node-inner"></div>
                </div>
                <div class="node-label">{{ node.label }}</div>
                <svg class="node-line">
                    <line x1="0" y1="0" :x2="node.lineX" :y2="node.lineY" stroke="var(--accent)" stroke-width="1.5"
                        stroke-dasharray="4" />
                </svg>
            </div>
        </div>

        <!-- Right Side Sidebar Lookalike (Decorative) -->
        <div class="tactical-sidebar">
            <div class="ts-item active">Модификация</div>
            <div class="ts-item">Персонализация</div>
            <div class="ts-item">Облик</div>
            <div class="ts-item">Окраска</div>
        </div>

        <!-- Stats Bottom -->
        <div class="stats-panel-lost">
            <div class="sp-model">KC556 <span>▼</span></div>
            <div class="sp-btn-group">
                <div class="sp-btn">ПОЛНАЯ ОКРАСКА ОРУЖИЯ</div>
            </div>
        </div>

        <!-- Corner Playerok Logo -->
        <div class="bottom-branding">
            <span class="branded-text">Playerok</span>
        </div>

        <div class="inner-grid"></div>
    </div>
</template>

<script setup>
import { ref } from 'vue'
import weaponImg from '@/assets/weapon_hero.png'
import videoBg from '@/assets/video.mp4'

const container = ref(null)

const nodes = [
    { id: 1, label: 'Тактическое устройство', x: 30, y: 25, lineX: 50, lineY: 40 },
    { id: 2, label: 'Оптика (прицел)', x: 75, y: 20, lineX: -50, lineY: 50 },
    { id: 3, label: 'Дуло', x: 15, y: 65, lineX: 40, lineY: -20 },
    { id: 4, label: 'Цевье', x: 35, y: 80, lineX: 10, lineY: -60 },
    { id: 5, label: 'Ствольная коробка', x: 80, y: 70, lineX: -40, lineY: -40 },
]

// Custom 3D Tilt Directive
const v3dTilt = {
    mounted(el, binding) {
        const settings = {
            max: binding.value?.max || 10,
            perspective: binding.value?.perspective || 1000,
            speed: binding.value?.speed || 300
        }

        el.style.transition = `transform ${settings.speed}ms cubic-bezier(.23,1,.32,1)`
        el.style.transformStyle = 'preserve-3d'

        el.addEventListener('mousemove', (e) => {
            const rect = el.getBoundingClientRect()
            const x = e.clientX - rect.left
            const y = e.clientY - rect.top
            const centerX = rect.width / 2
            const centerY = rect.height / 2

            const rotateX = ((y - centerY) / centerY) * -settings.max
            const rotateY = ((x - centerX) / centerX) * settings.max

            el.style.transform = `perspective(${settings.perspective}px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) scale3d(1.02, 1.02, 1.02)`
        })

        el.addEventListener('mouseleave', () => {
            el.style.transform = `perspective(${settings.perspective}px) rotateX(0deg) rotateY(0deg) scale3d(1, 1, 1)`
        })
    }
}
</script>

<style scoped>
.lost-light-hero {
    position: relative;
    width: 100%;
    height: 520px;
    background: var(--bg-deep);
    border-radius: var(--r-lg);
    overflow: hidden;
    margin-bottom: 24px;
    border: 1px solid var(--border-bright);
    color: var(--text-primary);
    font-family: var(--font);
    box-shadow: 0 20px 50px rgba(0, 0, 0, 0.4);
    transform-style: preserve-3d;
}

/* ── VIDEO BACKGROUND ───────────────────── */
.video-background-wrap {
    position: absolute;
    inset: 0;
    z-index: 0;
    overflow: hidden;
}

.bg-video {
    width: 100%;
    height: 100%;
    object-fit: cover;
    opacity: 0.6;
    filter: saturate(1.2) contrast(1.1) brightness(0.8);
}

.video-overlay {
    position: absolute;
    inset: 0;
    background: radial-gradient(circle at center, transparent 20%, var(--bg-deep) 100%);
    opacity: 0.8;
}

/* ── GAME HEADER ────────────────────────── */
.game-header {
    position: absolute;
    top: 24px;
    left: 24px;
    z-index: 10;
    display: flex;
    align-items: center;
    gap: 12px;
}

.level-indicator {
    background: rgba(255, 255, 255, 0.1);
    backdrop-filter: blur(8px);
    padding: 4px 10px;
    border-radius: 4px;
    font-size: 14px;
    font-weight: 800;
    border: 1px solid rgba(255, 255, 255, 0.2);
    color: #fff;
}

.level-indicator span {
    color: #fbbf24;
    font-size: 10px;
    margin-left: 4px;
}

.header-title {
    font-size: 20px;
    font-weight: 900;
    letter-spacing: 1px;
    color: #fff;
    text-shadow: 0 0 20px rgba(59, 130, 246, 0.5);
}

/* ── WEAPON STAGE ───────────────────────── */
.weapon-stage {
    position: absolute;
    inset: 0;
    display: flex;
    align-items: center;
    justify-content: center;
    perspective: 1500px;
    transform-style: preserve-3d;
}

.table-surface {
    position: absolute;
    bottom: 0;
    width: 120%;
    height: 35%;
    background: radial-gradient(ellipse at center, var(--accent-glow) 0%, transparent 70%);
    transform: rotateX(75deg) translateZ(-50px);
    z-index: 0;
}

.weapon-model-wrap {
    position: relative;
    z-index: 3;
    width: 75%;
    transform-style: preserve-3d;
    transform: translateZ(150px);
}

.weapon-asset {
    width: 100%;
    height: auto;
    filter: drop-shadow(0 0 40px var(--accent-glow));
}

.weapon-glow {
    position: absolute;
    top: 50%;
    left: 50%;
    width: 100%;
    height: 100%;
    background: radial-gradient(circle at center, var(--accent-glow), transparent 70%);
    transform: translate(-50%, -50%) translateZ(-10px);
    filter: blur(40px);
    opacity: 0.5;
    pointer-events: none;
}

/* ── DEPTH LAYERS ───────────────────────── */
.depth-layer {
    position: absolute;
    inset: 0;
    pointer-events: none;
    transform-style: preserve-3d;
}

.layer-back {
    transform: translateZ(-200px);
}

.layer-front {
    transform: translateZ(300px);
}

.glow-orb {
    position: absolute;
    top: 20%;
    right: 20%;
    width: 300px;
    height: 300px;
    background: radial-gradient(circle, var(--purple-glow), transparent 70%);
    border-radius: 50%;
    filter: blur(60px);
}

/* ── MOD NODES ──────────────────────────── */
.mod-node {
    position: absolute;
    z-index: 10;
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 8px;
    transform: translateZ(200px);
}

.node-circle {
    width: 32px;
    height: 32px;
    border: 2px solid var(--accent);
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    background: rgba(var(--bg-deep), 0.6);
    backdrop-filter: blur(10px);
    box-shadow: 0 0 20px var(--accent-glow);
    transition: all 0.3s ease;
    cursor: pointer;
}

.node-circle:hover {
    transform: scale(1.2);
    box-shadow: 0 0 30px var(--accent);
}

.node-inner {
    width: 10px;
    height: 10px;
    background: var(--accent);
    border-radius: 50%;
    box-shadow: 0 0 10px var(--accent);
}

.node-label {
    font-size: 11px;
    color: var(--text-primary);
    background: rgba(0, 0, 0, 0.4);
    padding: 2px 8px;
    border-radius: 4px;
    backdrop-filter: blur(4px);
    white-space: nowrap;
    letter-spacing: 0.5px;
    font-weight: 600;
}

.node-line {
    position: absolute;
    width: 150px;
    height: 150px;
    pointer-events: none;
    z-index: -1;
    overflow: visible;
}

/* ── SIDEBAR ────────────────────────────── */
.tactical-sidebar {
    position: absolute;
    left: 24px;
    top: 100px;
    z-index: 10;
    display: flex;
    flex-direction: column;
    gap: 20px;
}

.ts-item {
    font-size: 14px;
    color: var(--text-muted);
    font-weight: 700;
    cursor: pointer;
    transition: all 0.3s;
    position: relative;
    padding-left: 16px;
    text-transform: uppercase;
    letter-spacing: 1px;
}

.ts-item.active {
    color: var(--text-primary);
}

.ts-item.active::before {
    content: '';
    position: absolute;
    left: 0;
    top: 0;
    bottom: 0;
    width: 4px;
    background: var(--accent);
    box-shadow: 0 0 15px var(--accent);
    border-radius: 2px;
}

.ts-item:hover {
    color: var(--accent-light);
}

/* ── BOTTOM STATS ───────────────────────── */
.stats-panel-lost {
    position: absolute;
    left: 24px;
    bottom: 24px;
    z-index: 10;
    display: flex;
    align-items: flex-end;
    gap: 24px;
}

.sp-model {
    background: var(--glass-bg);
    backdrop-filter: blur(10px);
    padding: 10px 20px;
    border-radius: var(--r-md);
    font-weight: 800;
    font-size: 16px;
    border: 1px solid var(--glass-border);
    border-bottom: 3px solid var(--accent);
    color: var(--text-primary);
}

.sp-btn {
    background: linear-gradient(135deg, var(--accent), var(--purple));
    padding: 12px 24px;
    font-size: 12px;
    font-weight: 800;
    border-radius: var(--r-md);
    cursor: pointer;
    color: #fff;
    box-shadow: 0 10px 20px rgba(0, 0, 0, 0.2);
    transition: all 0.3s ease;
}

.sp-btn:hover {
    transform: translateY(-2px);
    box-shadow: 0 15px 30px var(--accent-glow);
}

.bottom-branding {
    position: absolute;
    right: 32px;
    bottom: 32px;
    z-index: 10;
}

.branded-text {
    font-size: 32px;
    font-weight: 950;
    color: var(--text-primary);
    opacity: 0.15;
    letter-spacing: -2px;
    font-style: italic;
}

.inner-grid {
    position: absolute;
    inset: 0;
    background-image:
        linear-gradient(var(--border) 1px, transparent 1px),
        linear-gradient(90deg, var(--border) 1px, transparent 1px);
    background-size: 50px 50px;
    pointer-events: none;
    opacity: 0.5;
}

.scanline-effect {
    opacity: 0.2;
}
</style>
