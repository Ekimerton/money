import path from 'path';

// Using a mutable variable prevents Next.js / Turbopack from statically
// analyzing and tracing the 'data' directory as a static asset, which
// avoids build-time errors when traversing the virtual environment.
let dataDirName = 'data';

/**
 * Returns a path resolved against the project's data directory.
 */
export function getDataPath(...subPaths: string[]): string {
    return path.join(process.cwd(), dataDirName, ...subPaths);
}
