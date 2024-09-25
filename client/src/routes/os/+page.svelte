<script lang="ts">
	import { cn, System } from '$lib/utils';
	import { draggable } from '@neodrag/svelte';
	import { DotIcon, SquareTerminalIcon } from 'lucide-svelte';
	import Console from '$lib/components/console.svelte';
	import { XIcon, MinusIcon, MaximizeIcon, MinimizeIcon, WrenchIcon } from 'lucide-svelte';

	const { data } = $props();

	const { executeForm } = $derived(data);

	let system = System();

	function* xGen(bound: number) {
		yield Math.round(Math.random() * bound) * 10;
	}
	function* yGen(bound: number) {
		yield Math.round(Math.random() * bound) * 10;
	}

	let clientWidth: number | undefined = $state();
	let clientHeight: number | undefined = $state();

	let startX = $derived(xGen(((clientWidth ?? 800) - 800) / 10));
	let startY = $derived(yGen(((clientHeight ?? 600) - 600) / 10));

	let position: {
		x: number;
		y: number;
	};

	let requireFullscreen = $derived(clientWidth !== undefined && clientWidth < 800);
	let shouldFullscreen = $state(false);
	let fullscreen = $derived(requireFullscreen || shouldFullscreen);
	let minimized = $state(false);
	let debug = $state(false);

	function draggableWrapper(
		node: any,
		[isDraggable, startX, startY]: [
			boolean,
			Generator<number, void, unknown>,
			Generator<number, void, unknown>,
		],
	) {
		if (!isDraggable) return;
		position = {
			x: startX.next().value ?? 0,
			y: startY.next().value ?? 0,
		};
		console.log(position);
		draggable(node, {
			bounds: 'parent',
			position,
			onDrag: ({ offsetX, offsetY }) => {
				position = { x: offsetX, y: offsetY };
			},
		});
	}
</script>

<div class="w-full h-full flex flex-col items-center" bind:clientHeight bind:clientWidth>
	{#if clientWidth}
		{#snippet draggableSnippet(draggable: boolean)}
			<div
				use:draggableWrapper={[draggable, startX, startY]}
				class={cn('flex flex-col', fullscreen ? 'h-full w-full' : 'h-[600px] w-[800px] rounded-lg')}
			>
				<div class={cn('bg-slate-500 w-full flex', fullscreen ? '' : 'rounded-t-lg')}>
					<div class="flex p-2 gap-2">
						<button
							class="bg-red-500 rounded-xl w-4 p-0.5 group"
							onclick={() => console.log('X Clicked')}
							><XIcon class="invisible group-hover:visible" strokeWidth={3} size={12} />
						</button>
						<button
							disabled={fullscreen}
							onclick={() => (minimized = true)}
							class={cn(
								'rounded-xl w-4 p-0.5 group',
								fullscreen ? 'bg-slate-400' : 'bg-yellow-300 ',
							)}
						>
							{#if !fullscreen}
								<MinusIcon class="invisible group-hover:visible" strokeWidth={3} size={12} />
							{/if}
						</button>
						<button
							disabled={requireFullscreen}
							class="bg-green-400 rounded-xl flex justify-center items-center w-4 p-0.5 group"
							onclick={() => (shouldFullscreen = !shouldFullscreen)}
						>
							{#if !requireFullscreen}
								{#if !fullscreen && !requireFullscreen}
									<MaximizeIcon class="invisible group-hover:visible" strokeWidth={3} size={10} />
								{:else}
									<MinimizeIcon class="invisible group-hover:visible" strokeWidth={3} size={12} />
								{/if}
							{/if}
						</button>
					</div>
				</div>
				<Console bind:debug {system} {fullscreen} {executeForm} />
			</div>
		{/snippet}
		{#if fullscreen}
			{@render draggableSnippet(false)}
		{:else}
			<div class="grow w-full">
				{#if !minimized}
					{@render draggableSnippet(true)}
				{/if}
			</div>
		{/if}
		{#if minimized || !fullscreen}
			<div class="border rounded-md m-2 p-1 w-fit bg-gray-300 flex gap-2 pl-2 pr-2 items-center">
				<button class="flex flex-col items-center" onclick={() => (minimized = !minimized)}
					><SquareTerminalIcon /><DotIcon strokeWidth={3} size={12} /></button
				>
				<div class="border-l border-white h-4/5"></div>
				<button onclick={() => (debug = !debug)}
					><WrenchIcon color={debug ? 'yellow' : 'black'} /></button
				>
			</div>
		{/if}
	{/if}
</div>
