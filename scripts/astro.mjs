// WebAssembly avoids native esbuild directory-read failures on restricted Windows hosts.
// Linux CI uses the standard native bundler.
import {registerHooks} from 'node:module';
if(process.platform==='win32'){
 const wasm=new URL('../node_modules/esbuild-wasm/lib/main.js',import.meta.url).href;
 registerHooks({resolve(specifier,context,nextResolve){return nextResolve(specifier==='esbuild'?wasm:specifier,context);}});
}
process.env.ASTRO_TELEMETRY_DISABLED='1';
await import('../node_modules/astro/astro.js');
