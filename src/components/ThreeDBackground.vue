<template>
    <div class="canvas-background-container" ref="container">
        <canvas ref="canvasEl"></canvas>
        <!-- Overlay Gradient to Ensure Readability -->
        <div class="vignette"></div>
    </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted } from 'vue'

const container = ref(null)
const canvasEl = ref(null)

let ctx = null
let animationFrameId = null
let particles = []
const particleCount = 120
const connectionDistance = 150
const mouse = { x: null, y: null, radius: 150 }

class Particle {
    constructor(w, h) {
        this.x = Math.random() * w
        this.y = Math.random() * h
        this.size = Math.random() * 2 + 1
        this.baseX = this.x
        this.baseY = this.y
        this.density = (Math.random() * 30) + 1
        this.vx = (Math.random() - 0.5) * 1.5
        this.vy = (Math.random() - 0.5) * 1.5
        this.color = '#3b82f6'
    }

    draw() {
        ctx.fillStyle = this.color
        ctx.beginPath()
        ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2)
        ctx.fill()
    }

    update(w, h) {
        // Mouse Interaction
        if (mouse.x !== null) {
            let dx = mouse.x - this.x
            let dy = mouse.y - this.y
            let distance = Math.sqrt(dx * dx + dy * dy)
            let forceDirectionX = dx / distance
            let forceDirectionY = dy / distance
            let maxDistance = mouse.radius
            let force = (maxDistance - distance) / maxDistance
            let directionX = forceDirectionX * force * this.density
            let directionY = forceDirectionY * force * this.density

            if (distance < mouse.radius) {
                this.x -= directionX
                this.y -= directionY
            } else {
                if (this.x !== this.baseX) {
                    let dx = this.x - this.baseX
                    this.x -= dx / 10
                }
                if (this.y !== this.baseY) {
                    let dy = this.y - this.baseY
                    this.y -= dy / 10
                }
            }
        }

        // Floating movement
        this.x += this.vx
        this.y += this.vy

        // Boundary check
        if (this.x < 0 || this.x > w) this.vx *= -1
        if (this.y < 0 || this.y > h) this.vy *= -1
    }
}

const initParticles = () => {
    particles = []
    const w = canvasEl.value.width
    const h = canvasEl.value.height
    for (let i = 0; i < particleCount; i++) {
        particles.push(new Particle(w, h))
    }
}

const connectParticles = () => {
    for (let a = 0; a < particles.length; a++) {
        for (let b = a; b < particles.length; b++) {
            let dx = particles[a].x - particles[b].x
            let dy = particles[a].y - particles[b].y
            let distance = Math.sqrt(dx * dx + dy * dy)

            if (distance < connectionDistance) {
                let opacity = 1 - (distance / connectionDistance)
                ctx.strokeStyle = `rgba(59, 130, 246, ${opacity * 0.2})`
                ctx.lineWidth = 1
                ctx.beginPath()
                ctx.moveTo(particles[a].x, particles[a].y)
                ctx.lineTo(particles[b].x, particles[b].y)
                ctx.stroke()
            }
        }
    }
}

const animate = () => {
    ctx.clearRect(0, 0, canvasEl.value.width, canvasEl.value.height)
    const w = canvasEl.value.width
    const h = canvasEl.value.height

    particles.forEach(p => {
        p.update(w, h)
        p.draw()
    })
    connectParticles()
    animationFrameId = requestAnimationFrame(animate)
}

const handleResize = () => {
    if (!canvasEl.value) return
    canvasEl.value.width = window.innerWidth
    canvasEl.value.height = window.innerHeight
    initParticles()
}

const handleMouseMove = (e) => {
    mouse.x = e.clientX
    mouse.y = e.clientY
}

const handleMouseLeave = () => {
    mouse.x = null
    mouse.y = null
}

onMounted(() => {
    ctx = canvasEl.value.getContext('2d')
    handleResize()
    window.addEventListener('resize', handleResize)
    window.addEventListener('mousemove', handleMouseMove)
    window.addEventListener('mouseleave', handleMouseLeave)
    animate()
})

onUnmounted(() => {
    window.removeEventListener('resize', handleResize)
    window.removeEventListener('mousemove', handleMouseMove)
    window.removeEventListener('mouseleave', handleMouseLeave)
    cancelAnimationFrame(animationFrameId)
})
</script>

<style scoped>
.canvas-background-container {
    position: fixed;
    inset: 0;
    z-index: -1;
    background: #020617;
    /* Very deep dark */
    overflow: hidden;
}

canvas {
    display: block;
}

.vignette {
    position: absolute;
    inset: 0;
    background: radial-gradient(circle at center, transparent 30%, rgba(2, 6, 23, 0.7) 100%);
    pointer-events: none;
}
</style>
