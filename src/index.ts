import { Plugin, ViteDevServer } from 'vite';
import { NextHandleFunction } from 'connect';
import Router from 'router';
import Path from 'path';
import glob from 'glob';
import chokidar from 'chokidar';
import color from 'colors-cli/safe';
import { wait, slash, cleanCache } from './utils';

interface VitePluginMockerOption {
  dir: string;
  delay?: number;
}

const mocksMap = new Map<string, any>();
let router = new Router();

async function updateMocks(file: string, { root, delay }) {
  const files = file
    ? [file]
    : glob.sync('**/*.js', {
        cwd: root,
      });
  for (const file of files) {
    const formattedFile = file
      .replace(/\/?index\.js$/, '')
      .replace(/\.js$/, '');
    const basePath = Path.isAbsolute(formattedFile)
      ? Path.relative(root, formattedFile)
      : formattedFile;
      const modulePath = Path.resolve(root, file)
      if (file) {
        cleanCache(modulePath)
      }
    const fileItem = require(modulePath);
    const fileExports = fileItem.default || fileItem;
    Object.keys(fileExports).forEach((key) => {
      const [method, shortPath = ''] = key.split(' ');
      const value = fileExports[key];
      if (value) {
        const newKey = `${method} ${basePath ? '/' + basePath : ''}${slash(shortPath)}`;
        // console.log(color.yellow_b.black(' + '), color.yellow(newKey));
        mocksMap.set(newKey, value);
      }
    });
  }

  router = new Router();
  mocksMap.forEach((value, key) => {
    const [method, path] = key.split(' ');
    router[method.toLowerCase()](path, async (req, res, next) => {
        if (delay) {
            await wait(delay);
        }
        return next();
    }, async (req, res) => {
      let result;
      if (typeof value === 'function') {
        result = await value(req, res);
      } else {
        result = value;
      }
      res.writeHead(200, {
        'content-type': 'application/json',
      });
      res.end(JSON.stringify(result));
    });
  })
}

function watchFiles(opts: VitePluginMockerOption) {
  const dir = Path.resolve(process.cwd(), opts.dir || 'mock');
  const watcher = chokidar.watch(dir);
  watcher.on('all', (event, path) => {
    if (event === 'change' || event === 'add') {
      try {
        updateMocks(path, { root: dir, delay: opts.delay });
        console.log(
          `${color.green_b.black(' Done: ')} Hot Mocker ${color.green(
            path.replace(process.cwd(), ''),
          )} file replacement success!`,
        );
      } catch (ex) {
        console.error(
          `${color.red_b.black(' Failed: ')} Hot Mocker ${color.red(
            path.replace(process.cwd(), ''),
          )} file replacement failed!!`,
        );
      }
    }
  });
  updateMocks('', { root: dir, delay: opts.delay });
}

function getMockMiddleware(opts: VitePluginMockerOption): NextHandleFunction {
  return async (req, res, next) => {
    router(req, res, next);
  };
}

export default function mockerPlugin(opts: VitePluginMockerOption): Plugin {
  let isDev = false;
  return {
    name: 'vite-plugin-mocker',
    enforce: 'pre',
    configureServer: (server: ViteDevServer) => {
      watchFiles(opts);
      server.middlewares.use(getMockMiddleware(opts));
    },
  };
}
