// i_video.c — Emscripten/browser video + input backend.
// Replaces the original X11 implementation; same interface (i_video.h).
// The 320x200 8-bit framebuffer in screens[0] is palette-expanded to RGBA
// and blitted to a <canvas> each frame. Keyboard input arrives via
// emscripten/html5.h callbacks and is posted straight into the DOOM
// event queue.

#include <stdlib.h>
#include <string.h>

#include "doomstat.h"
#include "i_system.h"
#include "v_video.h"
#include "m_argv.h"
#include "d_main.h"
#include "d_event.h"
#include "doomdef.h"

// include after the DOOM headers: em_js.h defines true/false macros that
// collide with doomtype.h's boolean enum
#include <emscripten.h>
#include <emscripten/html5.h>

static unsigned char rgba[SCREENWIDTH * SCREENHEIGHT * 4];
static unsigned char pal[256][3];

// gamma correction table lives in v_video.c, level picked in the menu
extern byte gammatable[5][256];
extern int usegamma;

EM_JS(void, js_init_canvas, (int w, int h), {
    var c = document.getElementById('canvas');
    if (!c) {
        c = document.createElement('canvas');
        c.id = 'canvas';
        document.body.appendChild(c);
    }
    c.width = w;
    c.height = h;
    Module.doomCtx = c.getContext('2d');
    Module.doomImg = Module.doomCtx.createImageData(w, h);
});

EM_JS(void, js_blit, (const unsigned char* ptr, int len), {
    Module.doomImg.data.set(HEAPU8.subarray(ptr, ptr + len));
    Module.doomCtx.putImageData(Module.doomImg, 0, 0);
});

//
// Keyboard: translate DOM keyCodes to DOOM key numbers.
//
static int xlate_key(int code)
{
    static const int fkeys[12] = {
        KEY_F1, KEY_F2, KEY_F3, KEY_F4, KEY_F5, KEY_F6,
        KEY_F7, KEY_F8, KEY_F9, KEY_F10, KEY_F11, KEY_F12
    };

    if (code >= 112 && code <= 123)          // F1..F12
        return fkeys[code - 112];
    if (code >= 65 && code <= 90)            // A..Z -> lowercase ascii
        return code + 32;
    if (code >= 48 && code <= 57)            // 0..9
        return code;

    switch (code)
    {
      case 37: return KEY_LEFTARROW;
      case 39: return KEY_RIGHTARROW;
      case 38: return KEY_UPARROW;
      case 40: return KEY_DOWNARROW;
      case 27: return KEY_ESCAPE;
      case 13: return KEY_ENTER;
      case 9:  return KEY_TAB;
      case 8:  return KEY_BACKSPACE;
      case 16: return KEY_RSHIFT;
      case 17: return KEY_RCTRL;
      case 18: return KEY_RALT;
      case 32: return ' ';
      case 189: return KEY_MINUS;
      case 187: return KEY_EQUALS;
      case 19: return KEY_PAUSE;
      case 188: return ',';
      case 190: return '.';
      case 191: return '/';
      case 186: return ';';
      case 222: return '\'';
      case 219: return '[';
      case 221: return ']';
      case 220: return '\\';
      case 192: return '`';
      default: return -1;
    }
}

static EM_BOOL key_cb(int type, const EmscriptenKeyboardEvent* e, void* ud)
{
    event_t ev;
    int k = xlate_key((int)e->keyCode);

    if (k < 0)
        return EM_FALSE;

    ev.type = (type == EMSCRIPTEN_EVENT_KEYDOWN) ? ev_keydown : ev_keyup;
    ev.data1 = k;
    D_PostEvent(&ev);
    return EM_TRUE;   // preventDefault: keep arrows/space from scrolling
}

void I_InitGraphics(void)
{
    static int done = 0;
    if (done) return;
    done = 1;

    js_init_canvas(SCREENWIDTH, SCREENHEIGHT);
    emscripten_set_keydown_callback(EMSCRIPTEN_EVENT_TARGET_WINDOW, 0, 1, key_cb);
    emscripten_set_keyup_callback(EMSCRIPTEN_EVENT_TARGET_WINDOW, 0, 1, key_cb);
}

void I_ShutdownGraphics(void)
{
}

void I_SetPalette(byte* palette)
{
    int i;
    for (i = 0; i < 256; i++)
    {
        pal[i][0] = gammatable[usegamma][*palette++];
        pal[i][1] = gammatable[usegamma][*palette++];
        pal[i][2] = gammatable[usegamma][*palette++];
    }
}

void I_UpdateNoBlit(void)
{
}

void I_FinishUpdate(void)
{
    int i;
    byte* src = screens[0];
    unsigned char* dst = rgba;

    for (i = 0; i < SCREENWIDTH * SCREENHEIGHT; i++)
    {
        byte c = *src++;
        *dst++ = pal[c][0];
        *dst++ = pal[c][1];
        *dst++ = pal[c][2];
        *dst++ = 0xff;
    }
    js_blit(rgba, sizeof(rgba));
}

void I_ReadScreen(byte* scr)
{
    memcpy(scr, screens[0], SCREENWIDTH * SCREENHEIGHT);
}

void I_StartFrame(void)
{
}

void I_StartTic(void)
{
    // events are posted asynchronously from the key callbacks
}
