import { NestFactory } from '@nestjs/core';
import { MicroserviceOptions, Transport } from '@nestjs/microservices';
import { AppModule } from './app.module';
import { RpcExceptionFilter } from './common/filters/rpc-exception.filter';

async function bootstrap() {
  const app = await NestFactory.createMicroservice<MicroserviceOptions>(
    AppModule,
    {
      transport: Transport.RMQ,
      options: {
        urls: [process.env.RABBITMQ_URL || 'amqp://localhost:5672'],
        queue: 'budget_queue',
        queueOptions: {
          durable: true,
        },
      },
    },
  );

  // Global exception filter for RPC
  app.useGlobalFilters(new RpcExceptionFilter());

  await app.listen();
  console.log(`🚀 Budget Microservice is listening on RabbitMQ queue: budget_queue`);
}
bootstrap();
