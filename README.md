# vite-plugin-api-mocker

A local api mocker plugin for vite，with delay response and auto-added api path prefix following file system supports

## install

```bash
yarn add vite-plugin-api-mocker -D
```

## usage

```ts
// vite.config.ts
import { defineConfig } from 'vite';
import mockerPlugin from 'vite-plugin-api-mocker';

export default defineConfig({
  // ... other config
  plugins: [
    mockerPlugin({
      dir: Path.join(process.cwd(), 'mock'), // mock files root folder
      delay: 1000, // delay 1000ms before response
    }),
  ],
});
```

## mock file

```js
// /mockroot/index.js -> GET /hello
exports['GET /hello'] = {
  msg: 'hello world',
};

// /mockroot/api/example.js -> GET /api/example/:id
exports['GET /:id(\\d+)'] = {
  foo: 'bar',
};

// /mockroot/api/example.js -> POST /api/example/users
exports['POST /users'] = (req, res) => {
    res.writeHead(200, {
        'content-type': 'application/json'
    });
    res.end({
        code: 0,
        msg: '',
        data: [{
            // ...
        }]
    })
};
```
