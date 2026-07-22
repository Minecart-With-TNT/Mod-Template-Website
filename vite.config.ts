import { defineConfig } from 'vite'
import solid from 'vite-plugin-solid'

export default defineConfig({
  base: process.env.BASE_PATH,
  plugins: [
    solid(),
    {
      name: 'md-raw',
      transform(src, id) {
        if (id.endsWith('.md')) {
          return { code: `export default ${JSON.stringify(src)}`, map: null }
        }
      },
    },
  ],
})
