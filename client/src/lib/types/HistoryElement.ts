import type { INode } from './INode';
import type { RenderElement } from './RenderElementVariants';

export type BaseAction = {
	command: string;
};

export type ClearAction = BaseAction & {
	type: 'clear';
};

export type NodeAction = BaseAction;

export type CreateNodeAction = NodeAction & {
	type: 'createNode';
	node: INode;
};

export type DeleteNodeAction = NodeAction;

export type ChangeNodeAction = NodeAction;

export type DisplayNodeAction = NodeAction & {
	type: 'displayNode';
};

export type Action = DisplayNodeAction | ClearAction | CreateNodeAction | undefined;

export type HistoryElement = {
	timestamp: string;
	command: string;
	username: string;
	hostname: string;
	render: RenderElement[][];
};

export type Message = {
	historyElement: HistoryElement;
	action: Action;
};

export type NewHistoryElement = Omit<HistoryElement, 'timestamp' | 'render'>;
