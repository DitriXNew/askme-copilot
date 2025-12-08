// esbuild configuration for VS Code extension bundling
const esbuild = require('esbuild');

const production = process.argv.includes('--production');
const watch = process.argv.includes('--watch');

/** @type {import('esbuild').BuildOptions} */
const buildOptions = {
    entryPoints: ['src/extension.ts'],
    bundle: true,
    format: 'cjs',
    platform: 'node',
    outfile: 'dist/extension.js',
    external: ['vscode'], // Only exclude vscode - it's provided by runtime
    sourcemap: !production,
    minify: production,
    target: 'node18',
    logLevel: 'info',
};

async function main() {
    if (watch) {
        // Watch mode for development
        const ctx = await esbuild.context(buildOptions);
        await ctx.watch();
        console.log('Watching for changes...');
    } else {
        // Single build
        await esbuild.build(buildOptions);
        console.log(production ? 'Production build complete!' : 'Development build complete!');
    }
}

main().catch((err) => {
    console.error(err);
    process.exit(1);
});
