import type { Message } from '$types';
import type { PageLoad } from './$types';
import { executeSchema } from './execute-command-schema';
import { superValidate, type Infer } from 'sveltekit-superforms';
import { zod } from 'sveltekit-superforms/adapters';

export const load: PageLoad = async () => {
	const [executeForm] = await Promise.all([
		superValidate<Infer<typeof executeSchema>, Message>(zod(executeSchema)),
	]);

	return {
		executeForm,
	};
};
