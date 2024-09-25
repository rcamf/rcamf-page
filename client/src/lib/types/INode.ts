export type INode = {
	parent?: INode | string;
	isFolder: boolean;
	children?: INode[];
	name: string;
	alias?: string;
	owner: string;
	group: 'sudo' | 'user' | 'root' | 'visitor';
	executable?: boolean;
};
