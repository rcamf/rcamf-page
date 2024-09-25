<script lang="ts">
	import type { RenderElement as RenderElementType } from '$types';
	import RenderElement from './render-element.svelte';

	const {
		elements,
	}: {
		elements: RenderElementType[];
	} = $props();
</script>

<div class="flex">
	{#each elements as el}
		<RenderElement {...el} />
	{/each}
</div>
