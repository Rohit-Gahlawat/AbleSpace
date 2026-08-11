import { IsEnum, IsInt, IsOptional, Min } from 'class-validator';

import { TaskStatus } from '../../generated/prisma/enums';

export class MoveTaskDto {
  @IsEnum(TaskStatus)
  status!: TaskStatus;

  @IsOptional()
  @IsInt()
  @Min(0)
  position?: number;
}
