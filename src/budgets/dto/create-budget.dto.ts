export class CreateBudgetDto {
    name: string;
    limitAmount: number;
    category: string;
    startDate: Date;
    endDate: Date;
}
