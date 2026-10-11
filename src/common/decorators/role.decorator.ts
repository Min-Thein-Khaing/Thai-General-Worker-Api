import { SetMetadata } from '@nestjs/common';
import { userRole } from '../interface/userEnum.interface.js';


export const ROLE_KEY = 'roleGuard';
export const Roles = (...roles: userRole[]) => SetMetadata(ROLE_KEY, roles);