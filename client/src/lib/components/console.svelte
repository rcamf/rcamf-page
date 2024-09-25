<script lang="ts">
	import { page } from '$app/stores';
	import { cn, System, getPath, promptRender } from '$lib/utils';
	import { type HistoryElement, type Message } from '$types';
	import { superForm, type Infer, type SuperValidated } from 'sveltekit-superforms';
	import type { executeSchema } from '../../routes/os/execute-command-schema';
	import Line from './line.svelte';
	import RenderElement from './render-element.svelte';
	import SuperDebug from 'sveltekit-superforms';
	import type { SystemType } from '$types/System';

	let {
		fullscreen,
		executeForm,
		debug = $bindable(),
		system,
	}: {
		fullscreen: boolean;
		debug: boolean;
		executeForm: SuperValidated<Infer<typeof executeSchema>, Message>;
		system: SystemType;
	} = $props();

	let history: HistoryElement[] = $state([]);
	let renderIndex = $state(0);
	let renderedHistory = $derived(history.slice(renderIndex));
	let historyIndex = $state(history.length);
	let historyElement = $derived(history.at(historyIndex));

	let cliInput: HTMLInputElement;
	let hostname = $page.url.searchParams.get('hostname') ?? $page.url.hostname;

	let promptRendered = promptRender(system.currentUser.username, hostname, system.currentNode);

	const { form: formData, enhance } = superForm(executeForm, {
		onSubmit: () => {
			$formData.hostname = hostname;
			$formData.system = system.toJSON();
			$formData.currentPath = getPath(system.currentNode);
		},
		dataType: 'json',
		onUpdated: (event) => {
			if (event.form.message) {
				history.push(event.form.message.historyElement);
				historyIndex = history.length;
				if (event.form.message.action?.type === 'clear') {
					renderIndex = history.length;
				} else if (event.form.message.action?.type === 'createNode') {
					const node = event.form.message.action.node;
					system.addChildNode(node);
				}
			}
		},
	});

	function previousHistEl() {
		if (historyIndex === 0) return;
		historyElement && (historyElement.command = $formData.command);
		historyIndex = Math.max(0, history.length - 1);
		setTimeout(() => {
			cliInput.selectionStart = cliInput.selectionEnd = historyElement?.command.length ?? 0;
		}, 0);
		$formData.command = historyElement?.command ?? '';
	}

	function nextHistEl() {
		if (historyIndex === history.length) return;
		historyElement && (historyElement.command = $formData.command);
		historyIndex = Math.min(history.length, historyIndex + 1);
		setTimeout(() => {
			cliInput.selectionStart = cliInput.selectionEnd = historyElement?.command.length ?? 0;
		}, 0);
		$formData.command = historyElement?.command ?? '';
	}
</script>

<div
	class={cn(
		'font-mono w-full h-full bg-slate-800 grow flex flex-col',
		fullscreen ? '' : 'rounded-b-lg',
	)}
>
	{#each renderedHistory as hisEl}
		{#each hisEl.render as line}
			<Line elements={line} />
		{/each}
	{/each}
	<form method="POST" use:enhance action="?/execute">
		<div class="flex">
			{#each promptRendered as el}
				<RenderElement {...el} />
			{/each}
			<!-- svelte-ignore a11y_autofocus -->
			<input
				id="command"
				autofocus
				class=" focus:outline-none text-white leading-none grow bg-slate-700/5"
				bind:this={cliInput}
				bind:value={$formData.command}
				type="text"
				name="command"
				onkeydown={(e) => {
					if (e.key === 'ArrowUp') {
						previousHistEl();
					} else if (e.key === 'ArrowDown') {
						nextHistEl();
					}
				}}
				onchange={() => {
					historyElement && (historyElement.command = $formData.command);
				}}
			/>
		</div>
		<button type="submit" hidden aria-label="Execute Command"></button>
	</form>
	{#if debug}
		<hr class="mt-auto" />
		<SuperDebug data={$formData} />
	{/if}
</div>
