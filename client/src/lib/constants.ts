import type { Schema } from '@cfworker/json-schema';

export const INODE_SCHEMA = {
	type: 'object',
	properties: {
		users: {
			type: 'array',
			items: {
				$ref: '#/definitions/User',
			},
		},
		explorer: {
			$ref: '#/definitions/INode',
		},
		currentPath: {
			type: 'string',
		},
		currentUser: {
			type: 'string',
		},
	},
	definitions: {
		Groups: {
			enum: ['sudo', 'root', 'user', 'visitor'],
		},
		User: {
			type: 'object',
			properties: {
				username: {
					type: 'string',
				},
				group: {
					$ref: '#/definitions/Groups',
				},
				active: {
					type: 'boolean',
				},
			},
			required: ['username', 'group', 'active'],
		},
		INode: {
			description: 'A representation of an INode',
			type: 'object',
			properties: {
				isFolder: {
					type: 'boolean',
					description: 'Whether the INode is a folder or not',
				},
				name: {
					type: 'string',
					description: 'The name of the INode',
				},
				alias: {
					type: 'string',
					description: 'The alias of the INode',
				},
				owner: {
					type: 'string',
					description: 'The owner of the INode',
				},
				group: {
					$ref: '#/definitions/Groups',
					description: 'The group of the INode',
				},
				executable: {
					type: 'boolean',
					description: 'Whether the INode is executable or not',
				},
				children: {
					type: 'array',
					description: 'The children of the INode',
					items: {
						$ref: '#/definitions/INode',
					},
				},
				parent: {
					type: 'string',
					description: 'The parent of the INode',
				},
			},
			required: ['isFolder', 'name', 'owner', 'group'],
		},
	},
} satisfies Schema;
