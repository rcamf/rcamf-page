import { System, promptRender } from '$lib/utils';
import type {
	Action,
	ClearAction,
	CreateNodeAction,
	DisplayNodeAction,
	INode,
	RenderElement,
} from '$types';
import type { Actions } from '@sveltejs/kit';
import { fail, message, superValidate } from 'sveltekit-superforms';
import { zod } from 'sveltekit-superforms/adapters';
import { executeSchema } from './execute-command-schema';

const error = (
	message: string,
): {
	executeRender: RenderElement[][];
	action: undefined;
} => {
	return {
		executeRender: [
			[
				{
					text: message,
					color: 'white',
				},
			],
		],
		action: undefined,
	};
};

const createNode = (
	command: string,
	params: string[],
	node: INode,
	username: string,
	isFolder: boolean,
): {
	executeRender: RenderElement[][];
	action: CreateNodeAction | undefined;
} => {
	if (params.length === 0) {
		return error(`${command}: missing name`);
	}
	if (!/(\w|\d)*/.test(params[0])) {
		return error(`${command}: invalid directory name`);
	}
	if (node.group !== 'user') {
		return error(`${command}: permission denied`);
	}
	if (!node.isFolder) {
		return error(`${command}: not a directory  '${params[0]}':`);
	}
	if (node.children?.some((child) => child.name === params[0])) {
		return error(`${command}: directory or file exists: '${params[0]}'`);
	}

	return {
		executeRender: [],
		action: {
			type: 'createNode',
			command: `${command} ${params[0]}`,
			node: {
				parent: node.name,
				isFolder,
				children: [],
				name: params[0],
				owner: username,
				group: 'user',
			},
		},
	};
};

const clear = (): {
	executeRender: RenderElement[][];
	action: ClearAction;
} => {
	return {
		executeRender: [],
		action: {
			command: 'clear',
			type: 'clear',
		},
	};
};

const mkdir = (
	params: string[],
	node: INode,
	username: string,
): {
	executeRender: RenderElement[][];
	action: CreateNodeAction | undefined;
} => {
	return createNode('mkdir', params, node, username, true);
};

const ls = (
	params: string[],
	system: ReturnType<typeof System>,
): {
	executeRender: RenderElement[][];
	action: DisplayNodeAction | undefined;
} => {
	if (params.length > 1) {
		return error('ls: too many arguments');
	}
	const target = system.getTargetNode(params[0] ?? '');
	if (typeof target === 'string') {
		return error(`ls: ${params[0]}: no such file or directory`);
	}
	if (!target.isFolder) {
		return {
			executeRender: [
				[
					{
						text: params[0],
						color: 'white',
					},
				],
			],
			action: {
				type: 'displayNode',
				command: `ls ${params[0]}`,
			},
		};
	}
	return {
		executeRender: [
			target.children
				?.sort((a, b) => a.name.localeCompare(b.name))
				.flatMap((child) => [
					{
						text: child.name,
						color: child.isFolder ? 'teal' : 'white',
					},
					{
						text: '\t',
					},
				]) ?? [],
		],
		action: {
			type: 'displayNode',
			command: `ls ${params[0]}`,
		},
	};
};

const touch = (
	params: string[],
	node: INode,
	username: string,
): {
	executeRender: RenderElement[][];
	action: CreateNodeAction | undefined;
} => {
	return createNode('touch', params, node, username, false);
};

const executeCommand = (
	command: string,
	params: string[],
	system: ReturnType<typeof System>,
	username: string,
): {
	executeRender: RenderElement[][];
	action: Action;
} => {
	switch (command) {
		case 'clear':
			return clear();
		case 'mkdir':
			return mkdir(params, system.currentNode, username);
		case 'ls':
			return ls(params, system);
		case 'touch':
			return touch(params, system.currentNode, username);
		default:
			return error(`zsh: command not found: ${command}`);
	}
};

export const actions: Actions = {
	execute: async ({ request }) => {
		const executeForm = await superValidate(request, zod(executeSchema));

		if (!executeForm.valid) {
			return fail(400, { executeForm });
		}

		const hostname = executeForm.data.hostname;
		const system = System();
		const errors = system.loadJSON(executeForm.data.system);
		const username = system.currentUser.username;
		const node = system.currentNode;
		const input = executeForm.data.command.trimEnd();

		console.log(username, hostname, errors, executeForm.data.system);

		if (errors) {
			return message(executeForm, {
				historyElement: {
					command: executeForm.data.command,
					username,
					hostname,
					timestamp: new Date().toISOString(),
					render: errors.flatMap((err) => error(err.toLowerCase()).executeRender),
				},
				action: undefined,
			});
		}

		const [command, ...params] = input.split(' ');
		const render = [promptRender(username, hostname, node, input)];
		const { executeRender, action } = await executeCommand(command, params, system, username);
		render.push(...executeRender);

		return message(executeForm, {
			historyElement: {
				command: executeForm.data.command,
				username,
				hostname: executeForm.data.hostname,
				timestamp: new Date().toISOString(),
				render,
			},
			action,
		});
	},
};
