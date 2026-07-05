/* values.h shim — modern libcs dropped this ancient SysV header.
   Provides only what the DOOM source uses. */
#ifndef _VALUES_H_SHIM
#define _VALUES_H_SHIM
#include <limits.h>
#ifndef MAXINT
#define MAXINT INT_MAX
#endif
#ifndef MININT
#define MININT INT_MIN
#endif
#ifndef MAXSHORT
#define MAXSHORT SHRT_MAX
#endif
#ifndef MINSHORT
#define MINSHORT SHRT_MIN
#endif
#ifndef MAXLONG
#define MAXLONG LONG_MAX
#endif
#ifndef MINLONG
#define MINLONG LONG_MIN
#endif
#ifndef MAXCHAR
#define MAXCHAR CHAR_MAX
#endif
#ifndef MINCHAR
#define MINCHAR CHAR_MIN
#endif
#endif
