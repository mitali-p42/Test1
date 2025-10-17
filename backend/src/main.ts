import { webcrypto } from 'crypto';
if (!(globalThis as any).crypto) (globalThis as any).crypto = webcrypto;

import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';

// 👇 ADD THESE
import { DataSource } from 'typeorm';
import { User } from './users/user.entity';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // Built-in CORS (no cors package needed)
  app.enableCors({
    origin: ['http://localhost:5173'],
    credentials: true,
  });

  app.useGlobalPipes(new ValidationPipe({ whitelist: true }));

  // 👇 RUNTIME CHECK: what does TypeORM think the columns are?
  const dataSource = app.get(DataSource);
  const usersMeta = dataSource.getMetadata(User);
  console.log(
    'users columns (runtime):',
    usersMeta.columns.map(c => c.databaseName)
  );


  const port = process.env.PORT || 4000;
  await app.listen(port);
  console.log(`API listening on http://localhost:${port}`);
}
bootstrap();
