<template>
	<!-- 粒子画布 -->
	<div class="pointer-events-none fixed inset-0 z-0 overflow-hidden" ref="container" />
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue';

/* ---------- 可调参数 ---------- */
const CONFIG = {
	amount: 300, // 同时存在的粒子数
	life: 5000, // 生命周期 ms
	speed: 0.4, // px / frame（约 60 fps）
	size: '0.2rem', // px
	color: 'var(--accent)', // 任意合法 css 色值
};

/* ---------- 逻辑 ---------- */
const container = ref<HTMLDivElement>();
let timer = 0;

function spawn() {
	const el = document.createElement('div');
	el.className = 'absolute rounded-full';
	Object.assign(el.style, {
		width: CONFIG.size,
		height: CONFIG.size,
		background: CONFIG.color,
		opacity: 0.3,
		left: `${Math.random() * 100}%`,
		top: `${Math.random() * 100}%`,
	});

	container.value!.appendChild(el);

	let x = el.offsetLeft;
	let y = el.offsetTop;
	const angle = Math.random() * Math.PI * 2;
	const vx = Math.cos(angle) * CONFIG.speed;
	const vy = Math.sin(angle) * CONFIG.speed;

	let frame = () => {
		x += vx;
		y += vy;
		el.style.transform = `translate(${x - el.offsetLeft}px, ${y - el.offsetTop}px)`;
		// 出界或到点自动销毁
		if (x < 0 || y < 0 || x > innerWidth || y > innerHeight) return el.remove();
		requestAnimationFrame(frame);
	};
	requestAnimationFrame(frame);

	setTimeout(() => el.remove(), CONFIG.life);
}

onMounted(() => {
	// 初始一批
	for (let i = 0; i < CONFIG.amount; i++) spawn();
	// 持续补货
	timer = window.setInterval(spawn, CONFIG.life / CONFIG.amount);
});

onUnmounted(() => clearInterval(timer));
</script>
