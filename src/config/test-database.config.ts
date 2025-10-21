import { TypeOrmModuleOptions } from '@nestjs/typeorm';
import { join } from 'path';
import * as dotenv from 'dotenv';

dotenv.config({ path: '.env.test' });

export const testDatabaseConfig: TypeOrmModuleOptions = {
    type: 'postgres',
    host: process.env.DB_HOST,
    port: Number(process.env.DB_PORT),
    username: process.env.DB_USER,
    password: process.env.DB_PASS,
    database: process.env.DB_NAME,
    entities: [join(__dirname, '../**/*.entity.{ts,js}')],
    synchronize: true, // ✅ auto sync for test env
    dropSchema: true, // ✅ clean DB between runs
    logging: false,
};
