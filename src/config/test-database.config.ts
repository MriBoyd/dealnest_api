import { join } from "path";
import * as dotenv from 'dotenv';
 
dotenv.config({ path: '.env.test' });

export const testDatabaseConfig = {
    type: 'postgres',
    host: process.env.DB_HOST,
    port: Number(process.env.DB_PORT),
    username: process.env.DB_USER,
    password: process.env.DB_PASS,
    database: process.env.DB_NAME,
    entities: [join(process.cwd(), 'src/**/*.entity.{ts,js}')],
    synchronize: true,
    dropSchema: true,
    logging: false,
};
