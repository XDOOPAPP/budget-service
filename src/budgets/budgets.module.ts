import { Module } from '@nestjs/common';
import { ClientsModule, Transport } from '@nestjs/microservices';
import { ConfigService } from '@nestjs/config';
import { BudgetsService } from './budgets.service';
import { BudgetsController } from './budgets.controller';
import { PrismaService } from '../prisma/prisma.service';

@Module({
  imports: [
    ClientsModule.registerAsync([
      {
        name: 'EXPENSE_SERVICE',
        useFactory: (configService: ConfigService) => ({
          transport: Transport.RMQ,
          options: {
            urls: [configService.get<string>('rabbitmq.url') || 'amqp://localhost:5672'],
            queue: 'expense_queue',
            queueOptions: {
              durable: true,
            },
          },
        }),
        inject: [ConfigService],
      },
    ]),
  ],
  controllers: [BudgetsController],
  providers: [BudgetsService, PrismaService],
})
export class BudgetsModule { }
