import type { VariantProps } from 'tailwind-variants';
import type { renderElementVariants } from '../utils';

export type RenderElementColor = VariantProps<typeof renderElementVariants>['color'];
export type RenderElementHighlight = VariantProps<typeof renderElementVariants>['highlight'];

export type RenderElement = {
	color?: RenderElementColor;
	text: string;
	highlight?: RenderElementHighlight;
};
