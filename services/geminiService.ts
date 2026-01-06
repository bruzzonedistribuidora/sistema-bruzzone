Run npm install && npm run build
npm warn deprecated node-domexception@1.0.0: Use your platform's native DOMException instead

added 174 packages, and audited 175 packages in 17s

28 packages are looking for funding
  run `npm fund` for details

found 0 vulnerabilities

> ferrecloud-arca@1.0.2 build
> vite build

vite v6.4.1 building for production...
transforming...
✓ 41 modules transformed.
✗ Build failed in 336ms
error during build:
[vite:esbuild] Transform failed with 1 error:
/home/runner/work/sistema-bruzzone/sistema-bruzzone/services/geminiService.ts:63:13: ERROR: Expected ">" but found "className"
file: /home/runner/work/sistema-bruzzone/sistema-bruzzone/services/geminiService.ts:63:13

Expected ">" but found "className"
61 |  
62 |      return (
63 |          <div className="p-6 h-full flex flex-col space-y-6 animate-fade-in bg-slate-50 overflow-hidden font-sans">
   |               ^
64 |              ***/* CABECERA CON KPIs */***
65 |              <div className="bg-white p-8 rounded-[2.5rem] border border-slate-200 shadow-sm flex flex-col md:flex-row justify-between items-center gap-8 shrink-0">

    at failureErrorWithLog (/home/runner/work/sistema-bruzzone/sistema-bruzzone/node_modules/esbuild/lib/main.js:1467:15)
    at /home/runner/work/sistema-bruzzone/sistema-bruzzone/node_modules/esbuild/lib/main.js:736:50
    at responseCallbacks.<computed> (/home/runner/work/sistema-bruzzone/sistema-bruzzone/node_modules/esbuild/lib/main.js:603:9)
    at handleIncomingPacket (/home/runner/work/sistema-bruzzone/sistema-bruzzone/node_modules/esbuild/lib/main.js:658:12)
    at Socket.readFromStdout (/home/runner/work/sistema-bruzzone/sistema-bruzzone/node_modules/esbuild/lib/main.js:581:7)
    at Socket.emit (node:events:524:28)
    at addChunk (node:internal/streams/readable:561:12)
    at readableAddChunkPushByteMode (node:internal/streams/readable:512:3)
    at Readable.push (node:internal/streams/readable:392:5)
    at Pipe.onStreamRead (node:internal/stream_base_commons:191:23)
Error: Process completed with exit code 1.
