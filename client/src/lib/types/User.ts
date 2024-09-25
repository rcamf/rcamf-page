export type User = {
	username: string;
	group: 'sudo' | 'root' | 'user' | 'visitor';
	active: boolean;
};
