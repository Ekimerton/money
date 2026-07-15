import { revalidateTag as nextRevalidateTag } from 'next/cache';

/**
 * Custom wrapper for revalidateTag to ensure compatibility between Next.js 15 (local)
 * and Next.js 16 (deployment), where Next.js 16 requires a second profile argument.
 */
export function revalidateTag(tag: string): void {
    try {
        (nextRevalidateTag as any)(tag, 'max');
    } catch (e) {
        console.error(`Failed to revalidate tag ${tag}:`, e);
    }
}
