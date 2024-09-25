import { z } from 'zod';

export const executeSchema = z.object({
	command: z.string(),
	system: z.string(),
	currentPath: z.string(),
	hostname: z.string(),
});
