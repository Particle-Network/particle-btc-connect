import { build } from 'esbuild';
import { replace } from 'esbuild-plugin-replace';
import { ScssModulesPlugin } from 'esbuild-scss-modules-plugin';

const isWatching = process.argv.includes('--watch');

const buildConfig = {
  banner: {
    js: '"use client";',
  },
  bundle: true,
  platform: 'browser',
  target: 'es2015',
  loader: {
    '.png': 'dataurl',
    '.svg': 'dataurl',
    '.woff2': 'file',
    '.ttf': 'file',
  },
  drop: process.env.NODE_ENV !== 'development' ? ['console', 'debugger'] : [],
  plugins: [
    replace({
      include: /src\/index.ts$/,
      values: {
        __buildVersion: process.env.npm_package_version,
      },
    }),
    {
      name: 'external',
      setup(build) {
        let filter = /^[^./]|^\.[^./]|^\.\.[^/]/;
        build.onResolve({ filter }, (args) => ({
          external: true,
          path: args.path,
        }));
      },
    },
    ScssModulesPlugin({
      inject: true,
      minify: true,
    }),
  ],
  entryPoints: ['src/index.ts'],
  tsconfig: './tsconfig.json',
  watch: isWatching
    ? {
        onRebuild(error, result) {
          if (error) console.error('main build failed:', error);
          else console.log('main build succeeded:', result);
        },
      }
    : undefined,
  minify: false,
  sourcemap: true,
  define: {
    'process.env.NODE_ENV': 'production',
  },
  external: ['react', 'react-dom'],
};

const buildESM = build({
  ...buildConfig,
  format: 'esm',
  outdir: 'esm',
  splitting: true,
});

const buildCJS = build({
  ...buildConfig,
  format: 'cjs',
  outdir: 'dist',
  splitting: false,
});

Promise.all([buildESM, buildCJS])
  .then(() => {
    if (isWatching) {
      console.log('watching...');
    } else {
      console.log('build success...');
    }
  })
  .catch(() => process.exit(1));
