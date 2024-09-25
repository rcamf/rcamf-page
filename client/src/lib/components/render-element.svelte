<script lang="ts">
	import { tv, type VariantProps } from 'tailwind-variants';
	import { cn, renderElementVariants } from '$lib/utils';
	import type { RenderElementColor, RenderElementHighlight } from '../types';

	const {
		text,
		color,
		highlight,
	}: {
		text: string;
		color?: RenderElementColor;
		highlight?: RenderElementHighlight;
	} = $props();
</script>

<span class={cn(renderElementVariants({ color, highlight }))}>{text}</span>
