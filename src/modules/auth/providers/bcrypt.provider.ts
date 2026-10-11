import { Injectable } from '@nestjs/common';
import { HashProvider } from './hash.provider.js';
import * as bcrypt from 'bcrypt';

@Injectable()
export class BcryptProvider extends HashProvider {
    async hash(password: string): Promise<string> {
        const salt = await bcrypt.genSalt(10);
        return bcrypt.hash(password, salt);
    }

    async compare(password: string, hashedPassword: string): Promise<boolean> {
        return await bcrypt.compare(password, hashedPassword);
    }
}