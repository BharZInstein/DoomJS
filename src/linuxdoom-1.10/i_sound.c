// i_sound.c — silent stub backend for the browser build.
// The original mixed 8-bit DMX sound effects into /dev/dsp, which has no
// browser equivalent. These stubs keep the game logic (s_sound.c) fully
// functional; only actual audio output is omitted.

#include <stdio.h>

#include "z_zone.h"
#include "i_system.h"
#include "i_sound.h"
#include "m_argv.h"
#include "w_wad.h"
#include "doomdef.h"

// referenced by the config defaults in m_misc.c
char* sndserver_filename = "sndserver";

void I_InitSound()
{
    fprintf(stderr, "I_InitSound: silent browser stub.\n");
}

void I_UpdateSound(void)
{
}

void I_SubmitSound(void)
{
}

void I_ShutdownSound(void)
{
}

void I_SetChannels()
{
}

int I_GetSfxLumpNum(sfxinfo_t* sfx)
{
    char namebuf[9];
    sprintf(namebuf, "ds%s", sfx->name);
    return W_GetNumForName(namebuf);
}

int I_StartSound
( int		id,
  int		vol,
  int		sep,
  int		pitch,
  int		priority )
{
    static int handle = 0;
    return handle++;
}

void I_StopSound(int handle)
{
}

int I_SoundIsPlaying(int handle)
{
    return 0;
}

void I_UpdateSoundParams
( int	handle,
  int	vol,
  int	sep,
  int	pitch )
{
}

//
// MUSIC API — same story, quiet.
//
void I_InitMusic(void)
{
}

void I_ShutdownMusic(void)
{
}

void I_SetMusicVolume(int volume)
{
}

void I_PauseSong(int handle)
{
}

void I_ResumeSong(int handle)
{
}

int I_RegisterSong(void* data)
{
    return 1;
}

void I_PlaySong
( int	handle,
  int	looping )
{
}

void I_StopSong(int handle)
{
}

void I_UnRegisterSong(int handle)
{
}
