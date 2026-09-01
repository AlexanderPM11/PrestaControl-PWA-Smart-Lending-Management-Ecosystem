using System;

namespace Prestacontrol.Application.Common
{
    public static class DRTimeProvider
    {
        // Dominican Republic does not observe Daylight Saving Time. It is always UTC-4.
        public static DateTime Now
        {
            get
            {
                return DateTime.UtcNow.AddHours(-4);
            }
        }
    }
}
