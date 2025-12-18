import { Injectable, Inject, NotFoundException } from '@nestjs/common';
import { ClientProxy } from '@nestjs/microservices';
import { firstValueFrom } from 'rxjs';
import { CreateBudgetDto } from './dto/create-budget.dto';
import { UpdateBudgetDto } from './dto/update-budget.dto';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class BudgetsService {
  constructor(
    private readonly prisma: PrismaService,
    @Inject('EXPENSE_SERVICE') private readonly expenseClient: ClientProxy,
  ) { }

  async create(createBudgetDto: CreateBudgetDto, userId: string) {
    return this.prisma.budget.create({
      data: {
        ...createBudgetDto,
        userId,
      },
    });
  }

  async findAll(userId: string) {
    return this.prisma.budget.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findOne(id: string, userId: string) {
    const budget = await this.prisma.budget.findUnique({
      where: { id, userId },
    });
    if (!budget) {
      throw new NotFoundException(`Budget with ID ${id} not found`);
    }
    return budget;
  }

  async update(id: string, updateBudgetDto: UpdateBudgetDto, userId: string) {
    const budget = await this.findOne(id, userId);
    return this.prisma.budget.update({
      where: { id: budget.id },
      data: updateBudgetDto,
    });
  }

  async remove(id: string, userId: string) {
    const budget = await this.findOne(id, userId);
    return this.prisma.budget.delete({
      where: { id: budget.id },
    });
  }

  async progress(id: string, userId: string) {
    const budget = await this.findOne(id, userId);

    // Call Expense Service to get summary
    // expense-service expects: { userId, from, to, category }
    // Based on budget.startDate, budget.endDate, budget.category

    const query = {
      userId,
      from: budget.startDate ? budget.startDate.toISOString() : undefined,
      to: budget.endDate ? budget.endDate.toISOString() : undefined,
      category: budget.category,
    };

    // expense.summary usually returns { totalAmount: number, ... }
    const expenseSummary = await firstValueFrom(
      this.expenseClient.send('expense.summary', query),
    );

    const totalSpent = Number(expenseSummary?.totalAmount || 0);
    const limit = Number(budget.limitAmount);
    const remaining = limit - totalSpent;
    const percentage = limit > 0 ? (totalSpent / limit) * 100 : 0;

    return {
      ...budget,
      progress: {
        totalSpent,
        remaining,
        percentage: parseFloat(percentage.toFixed(2)),
        status: totalSpent > limit ? 'EXCEEDED' : 'SAFE',
      },
    };
  }
}
