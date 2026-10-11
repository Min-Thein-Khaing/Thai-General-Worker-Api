import { Throttle } from '@nestjs/throttler';

//for payment rate limit
export const StrictThrottle = () =>
  Throttle({
    default: {
      limit: 1,
      ttl: 60000,//1 min
    },
  });

//for order rate limit
export const ModerateThrottle = () =>
  Throttle({
    default: {
      limit: 5,
      ttl: 60000,//1 min
    },
  });

export const RelaxedThrottle = () =>
  Throttle({
    default: {
      limit: 20,
      ttl: 60000,//1 min
    },
  });