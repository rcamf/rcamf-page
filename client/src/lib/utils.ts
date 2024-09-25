import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { tv } from 'tailwind-variants';
import type { RenderElement } from './types';
import type { INode } from './types/INode';
import { Validator } from '@cfworker/json-schema';
import { INODE_SCHEMA } from './constants';
import type { User } from './types/User';

const validator = new Validator(INODE_SCHEMA);

export function cn(...inputs: ClassValue[]) {
	return twMerge(clsx(inputs));
}

export const renderElementVariants = tv({
	base: 'text-base leading-none whitespace-pre pt-0.5',
	variants: {
		color: {
			blue: 'text-blue-500 font-semibold',
			teal: 'text-teal-300 font-semibold',
			red: 'text-red-500 font-semibold',
			green: 'text-green-500 font-semibold',
			yellow: 'text-yellow-500 font-semibold',
			white: 'text-white',
			grey: 'text-gray-500',
		},
		highlight: {
			'no-highlight': '',
			highlight: 'hover:text-italic',
			'bracket-start': 'font-thin',
			'bracket-end': 'font-thin ml-auto',
		},
	},
	defaultVariants: {
		color: 'white',
		highlight: 'no-highlight',
	},
});

export const promptRender = (
	username: string,
	hostname: string,
	node: INode,
	input?: string,
): RenderElement[] => {
	const prompt: RenderElement[] = [
		{
			text: '[',
			color: 'grey',
			highlight: 'bracket-start',
		},
		{
			text: `${username}@${hostname}:`,
			color: 'teal',
		},
		{
			text: ` ${getPath(node) || '/'} `,
		},
		{
			text: '$ ',
			color: 'teal',
		},
	];

	return input
		? [
				...prompt,
				{ text: input },
				{
					text: ']',
					color: 'grey',
					highlight: 'bracket-end',
				},
			]
		: prompt;
};

export const getPath = (node: INode): string => {
	if (node.alias) return node.alias;
	if (!node.parent) return '';
	return `${getPath(node.parent as INode)}/${node.name}`;
};

export function System() {
	const VISITOR_HOME: INode = {
		name: 'visitor',
		isFolder: true,
		owner: 'visitor',
		group: 'root',
		alias: '~',
		children: [],
	};
	let users: User[] = [
		{
			username: 'visitor',
			group: 'visitor',
			active: false,
		},
	];
	let root: INode = {
		name: '/',
		isFolder: true,
		owner: 'root',
		group: 'root',
		children: [
			{
				name: 'home',
				isFolder: true,
				owner: 'root',
				group: 'root',
				children: [VISITOR_HOME],
			},
			{
				name: 'bin',
				isFolder: true,
				owner: 'root',
				group: 'root',
				children: [],
			},
		],
	};
	let currentNode: INode = VISITOR_HOME;
	let currentUser = users[0];

	function loadJSON(json: string) {
		let parsed: {
			users: User[];
			explorer: INode;
			currentPath: string;
			currentUser: string;
		};
		try {
			parsed = JSON.parse(json);
			const valid = validator.validate(parsed).valid;
			if (!valid) throw new Error('Invalid JSON');
		} catch {
			return ['Invalid JSON. Default Loaded'];
		}
		const errors: string[] = [];
		const { users: parsedUsers, explorer, currentPath, currentUser: parsedCurrentUser } = parsed;
		const unseen = [['home', 'bin'], ['visitor']];
		function traverse(node: INode, parent?: INode, depth = 0): boolean {
			node.parent = parent;
			if (depth === 0 && node.name !== '/') {
				return true;
			}
			if (depth === 1) {
				unseen[0] = unseen[0].filter((name) => name !== node.name);
			}
			if (depth === 2 && parent?.name === 'home') {
				unseen[1] = unseen[1].filter((name) => node.name !== name);
				if (node?.alias !== '~') {
					return true;
				}
			}
			if (node.children && node.children.length) {
				return node.children
					.map((child) => traverse(child, node, depth + 1))
					.some((result) => result);
			}
			return false;
		}
		const result = traverse(explorer);
		if (result || unseen.some((lvl) => lvl.length)) return ['Invalid Explorer. Default Loaded'];
		root = explorer;
		if (!parsedUsers.find((user) => user.username === 'visitor')) {
			errors.push('Invalid User List. Default Loaded');
		} else {
			users = parsedUsers;
		}
		const user = users.find((user) => user.username === parsedCurrentUser);
		if (!user) {
			currentUser = users.find((user) => user.username === 'visitor')!;
			errors.push('Invalid current User. Default Loaded');
		} else {
			currentUser = user;
		}
		const target = getTargetNode(currentPath);
		if (typeof target === 'string') {
			errors.push('Invalid current Path. Default Loaded');
			currentNode = getTargetNode('~') as INode;
		} else {
			currentNode = target;
		}
	}

	function toJSON() {
		return JSON.stringify(
			{
				users,
				explorer: root,
				currentPath: getPath(currentNode),
				currentUser: currentUser.username,
			},
			(key, value: INode) => {
				if (key === 'parent') return value.name;
				return value;
			},
		);
	}

	function getAliasedTarget(alias: string, userSpecific = false) {
		const que = [root];
		while (que.length) {
			const current = que.shift();
			if (
				current &&
				current.alias === alias &&
				(!userSpecific || current.owner === currentUser.username)
			)
				return current;
			if (current?.children) que.push(...current.children);
		}
	}

	function changeNode(path: string): string | undefined {
		const target = getTargetNode(path);
		if (typeof target === 'string') return target;
		currentNode = target;
	}

	function getTargetNode(path: string): INode | string {
		let node = currentNode;
		if (path.startsWith('/')) {
			node = root;
			path = path.slice(1);
		}
		const steps = path.split('/').filter((step) => step !== '');
		const aliasedNode = getAliasedTarget(steps[0] ?? '');
		if (aliasedNode) {
			node = aliasedNode;
			steps.shift();
		}
		for (const step of steps) {
			if (step === '..') {
				node = (node.parent as INode) ?? node;
			} else if (step !== '.') {
				const child = node.children?.find((child) => child.name === step);
				if (!child?.isFolder) {
					return `cd: no such file or directory: ${step}`;
				}
				node = child;
			}
		}
		return node;
	}

	function addChildNode(node: INode) {
		node.parent = currentNode;
		currentNode.children?.push(node);
	}

	return {
		get currentNode() {
			return currentNode;
		},
		get currentPath() {
			return getPath(currentNode);
		},
		get currentUser() {
			return currentUser;
		},
		changeNode,
		addChildNode,
		getTargetNode,
		toJSON,
		loadJSON,
	};
}
