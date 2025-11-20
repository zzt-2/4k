<template>
	<!--
    Sci-Fi Button Component
    Uses app-no-drag to allow clicking
  -->
	<div class="app-no-drag relative z-10 inline-flex">
		<button
			class="group relative flex h-10 cursor-pointer items-center justify-center overflow-hidden px-6 transition-all duration-300 outline-none"
			style="
				background-color: color-mix(in srgb, var(--bg-primary) 20%, transparent);
				border: 1px solid var(--border);
				color: var(--text-secondary);
			"
			@click="emit('click')"
		>
			<!-- Tech Corner Accents (Top-Left & Bottom-Right) -->
			<div
				class="absolute top-0 left-0 h-4 w-4 border-t-2 border-l-2 transition-colors duration-300"
				style="border-color: var(--accent)"
			></div>
			<div
				class="absolute right-0 bottom-0 h-4 w-4 border-r-2 border-b-2 transition-colors duration-300"
				style="border-color: var(--accent)"
			></div>

			<!-- Hover Scanline Effect -->
			<div
				class="absolute inset-0 -translate-x-full transition-transform duration-1000 group-hover:translate-x-full"
				style="
					background: linear-gradient(
						90deg,
						transparent,
						color-mix(in srgb, var(--accent) 20%, transparent),
						transparent
					);
				"
			></div>

			<!-- Content -->
			<div class="relative z-10 flex items-center gap-2">
				<q-icon
					v-if="icon"
					:name="icon"
					size="xs"
					class="transition-colors duration-300 group-hover:text-[var(--accent)]"
				/>
				<span
					class="font-bold tracking-[2px] uppercase transition-colors duration-300 group-hover:text-[var(--accent)]"
					style="font-size: 0.85rem"
				>
					{{ label }}
				</span>
			</div>
		</button>
	</div>
</template>

<script setup lang="ts">
import { defineEmits, defineProps } from 'vue';

defineProps({
	label: { type: String, default: '' },
	icon: { type: String, default: '' },
});

const emit = defineEmits(['click']);
</script>

<style scoped>
/*
  Most styles moved to template using UnoCSS and inline styles for dynamic variables.
  Kept scoped style minimal.
*/
</style>
