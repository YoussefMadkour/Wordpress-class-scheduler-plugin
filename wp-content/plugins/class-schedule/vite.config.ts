import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
	plugins: [react()],
	root: '.',
	build: {
		outDir: 'build',
		emptyOutDir: false,
		rollupOptions: {
			input: {
				admin: path.resolve(__dirname, 'src/admin/index.tsx'),
				public: path.resolve(__dirname, 'src/public/index.tsx'),
				block: path.resolve(__dirname, 'src/block/index.ts'),
			},
			output: {
				entryFileNames: (chunk) => `${chunk.name}.js`,
				assetFileNames: (asset) => `${asset.name}`,
			},
		},
	},
});


