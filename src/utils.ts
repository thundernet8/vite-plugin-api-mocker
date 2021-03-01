import clearModule from 'clear-module';

export function wait(ms: number) {
    return new Promise((resolve) => {
        setTimeout(resolve, Math.max(0, ms))
    })
}

export function slash(p: string) {
    return /^\//.test(p) || !p ? p : '/' + p;
}

export function cleanCache(modulePath: string) {
    try {
      modulePath = require.resolve(modulePath);
    } catch (e) { }
    var module = require.cache[modulePath];
    if (!module) return;
    if (module.parent) {
      module.parent.children.splice(module.parent.children.indexOf(module), 1);
    }
    clearModule(modulePath);
  }