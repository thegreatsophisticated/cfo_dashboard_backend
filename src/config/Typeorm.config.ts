import { DataSource } from 'typeorm';
import { config } from 'dotenv';
import * as path from 'path';

config();

export const AppDataSource = new DataSource({
  type: 'postgres',
  host: process.env.DB_HOST,
  port: parseInt(process.env.DB_PORT || '5432'),
  username: process.env.DB_USERNAME,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_DATABASE,
  // Use relative paths from the config directory
  entities: [
    path.join(__dirname, '..', '**', '*.entity{.ts,.js}')
  ],
  migrations: [
    path.join(__dirname, '..', 'migrations', '*{.ts,.js}')
  ],
  synchronize: false,
  logging: true,
});

// Initialize the data source for migration CLI
AppDataSource.initialize()
  .then(() => {
    console.log('Data Source has been initialized!');
  })
  .catch((err) => {
    console.error('Error during Data Source initialization:', err);
  });