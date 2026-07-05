// i_net.c — single-player-only stub for the browser build.
// The original spoke UDP for multiplayer; d_net.c only touches the
// network when a -net game is requested, so a single-player doomcom
// is all that is needed.

#include <stdlib.h>
#include <string.h>

#include "i_system.h"
#include "d_event.h"
#include "d_net.h"
#include "m_argv.h"
#include "doomstat.h"

void I_InitNetwork(void)
{
    doomcom = malloc(sizeof(*doomcom));
    memset(doomcom, 0, sizeof(*doomcom));

    netgame = false;
    doomcom->id = DOOMCOM_ID;
    doomcom->ticdup = 1;
    doomcom->extratics = 0;
    doomcom->numplayers = doomcom->numnodes = 1;
    doomcom->deathmatch = false;
    doomcom->consoleplayer = 0;
}

void I_NetCmd(void)
{
    I_Error("I_NetCmd: network play is not supported in the browser build");
}
