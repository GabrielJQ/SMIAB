import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // ==========================================
  // CONFIGURACIÓN CORS (SMIAB <-> SAI)
  // ==========================================
  app.enableCors({
    origin: [
      'http://127.0.0.1:3001',
      'http://localhost:3001',
      'http://127.0.0.1:8000',
      'http://localhost:8000',
    ],
    // VITAL: Agregamos OPTIONS para las peticiones preflight del navegador
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS',
    credentials: true,
    // VITAL: Permitimos explícitamente el token JWT
    allowedHeaders: ['Content-Type', 'Authorization', 'Accept'],
  });

  // ==========================================
  // PIPES DE VALIDACIÓN GLOBAL
  // ==========================================
  app.useGlobalPipes(
    new ValidationPipe({
      transform: true,
      whitelist: true,
      forbidNonWhitelisted: true,
    }),
  );

  // ==========================================
  // CONFIGURACIÓN DE SWAGGER (DOCUMENTACIÓN)
  // ==========================================
  const config = new DocumentBuilder()
    .setTitle('Bienestar Printers API')
    .setDescription('API para gestión de impresoras y estadísticas')
    .setVersion('1.0')
    .addTag('Printers')
    .build();
  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api', app, document);

  // ==========================================
  // PUERTO E IPV4 (Evita el conflicto ERR_CONNECTION_REFUSED)
  // ==========================================
  await app.listen(process.env.PORT ?? 3000, '0.0.0.0');
}
bootstrap();
