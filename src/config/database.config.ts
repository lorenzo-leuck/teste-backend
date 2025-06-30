import { TypeOrmModuleOptions } from '@nestjs/typeorm';
import { User, Url, Click } from '../entities';

export const databaseConfig: TypeOrmModuleOptions = {
  type: 'postgres',
  host: process.env.DATABASE_HOST || 'localhost',
  port: parseInt(process.env.DATABASE_PORT || '5433', 10),
  username: process.env.DATABASE_USER || 'postgres',
  password: process.env.DATABASE_PASSWORD || 'postgres',
  database: process.env.DATABASE_NAME || 'url_shortener',
  entities: [User, Url, Click],
  synchronize: process.env.NODE_ENV !== 'production',
};
