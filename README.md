# DoomJS

The original id Software DOOM engine (linuxdoom-1.10, released as open source),
compiled to WebAssembly with Emscripten and running the shareware episode in
the browser.

![DOOM in the browser](screenshots/shot_wasm.png)

## Play

Any static server works — there's nothing to build:

```sh
python3 -m http.server
# http://localhost:8000/
```

### Controls

| Action | Key |
|---|---|
| Move / turn | Arrow keys |
| Fire | Ctrl |
| Use / open | Space |
| Run | Shift |
| Weapons | 1–4 |
| Automap | Tab |
| Menu | Esc |

## How it works

id released the DOOM engine source in 1997 (later under the GPL).
`src/linuxdoom-1.10` is that source with only the machine-specific layer
swapped for browser equivalents — the renderer, game logic, and WAD loading
are untouched:

- `i_video.c` — X11 → HTML canvas + browser keyboard events
- `i_sound.c` — silent stub (the original wrote to `/dev/dsp`)
- `i_net.c` — single-player stub
- `d_main.c` — game loop driven by the browser at the native 35 fps
- small fixes for modern compilers (`values.h` shim, a `strupr` clash)

The compiled output is `index.wasm` (the engine), `index.js` (Emscripten's
loader), and `index.data` (the freely-distributable shareware `doom1.wad`,
Episode 1: Knee-Deep in the Dead).

## Rebuild from source

```sh
git clone https://github.com/emscripten-core/emsdk && cd emsdk
./emsdk install latest && ./emsdk activate latest && source emsdk_env.sh
cd ../src/linuxdoom-1.10
emcc *.c -o ../../index.html -std=gnu89 -O2 -I. -DNORMALUNIX -DLINUX \
  -Wno-everything -sINITIAL_MEMORY=134217728 -sNO_EXIT_RUNTIME=1 \
  --preload-file doom1.wad --shell-file ../shell.html
```

(drop a `doom1.wad` into `src/linuxdoom-1.10` first — the shareware WAD is easy to find)

## License

`src/` is id Software's open-sourced DOOM engine — see `src/LICENSE.TXT`
(id later re-released it under the GPL). `doom1.wad` is the freely-distributable
shareware episode.
