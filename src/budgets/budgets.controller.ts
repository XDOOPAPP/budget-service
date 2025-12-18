import { Controller } from '@nestjs/common';
import { MessagePattern, Payload } from '@nestjs/microservices';
import { BudgetsService } from './budgets.service';
import { CreateBudgetDto } from './dto/create-budget.dto';
import { UpdateBudgetDto } from './dto/update-budget.dto';

@Controller()
export class BudgetsController {
  constructor(private readonly budgetsService: BudgetsService) { }

  @MessagePattern('budget.create')
  create(@Payload() payload: CreateBudgetDto & { userId: string }) {
    const { userId, ...dto } = payload;
    return this.budgetsService.create(dto, userId);
  }

  @MessagePattern('budget.find_all')
  findAll(@Payload() payload: { userId: string }) {
    return this.budgetsService.findAll(payload.userId);
  }

  @MessagePattern('budget.find_one')
  findOne(@Payload() payload: { id: string; userId: string }) {
    return this.budgetsService.findOne(payload.id, payload.userId);
  }

  @MessagePattern('budget.update')
  update(@Payload() payload: UpdateBudgetDto & { id: string; userId: string }) {
    const { id, userId, ...dto } = payload;
    return this.budgetsService.update(id, dto, userId);
  }

  @MessagePattern('budget.delete')
  remove(@Payload() payload: { id: string; userId: string }) {
    return this.budgetsService.remove(payload.id, payload.userId);
  }

  @MessagePattern('budget.progress')
  progress(@Payload() payload: { id: string; userId: string }) {
    return this.budgetsService.progress(payload.id, payload.userId);
  }
}
