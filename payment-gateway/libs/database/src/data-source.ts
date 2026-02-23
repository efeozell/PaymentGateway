import { DataSource, DataSourceOptions } from 'typeorm';
import * as dotenv from 'dotenv';
import { join } from 'path';

const rootDir = process.cwd();

dotenv.config();

export const dataSourceOptions: DataSourceOptions = {
  type: 'postgres',
  host: process.env['DB_HOST'],
  port: parseInt(process.env['DB_PORT']!, 10),
  username: process.env['DB_USERNAME'],
  password: process.env['DB_PASSWORD'],
  database: process.env['DB_NAME'],
  entities: [
    join(rootDir, 'libs', 'database', 'src', 'entities', '*.entity.{ts,js}'),
  ],
  migrations: [
    join(rootDir, 'libs', 'database', 'src', 'migrations', '*{.ts,.js}'),
  ],
  synchronize: false,
  logging: true,
  extra: {
    max: 20,
    min: 5,
    idleTimeoutMillis: 3000,
  },
};

const dataSource = new DataSource(dataSourceOptions);

export default dataSource;
