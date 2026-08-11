import { Transform } from 'class-transformer';
import { IsArray, IsEnum, IsOptional, IsString } from 'class-validator';

import { Priority, TaskStatus } from '../../generated/prisma/enums';

const toArray = ({ value }: { value: unknown }): unknown => {
  if (typeof value === 'string') {
    return value.split(',').map((entry) => entry.trim()).filter(Boolean);
  }
  return value;
};

export class QueryTasksDto {
  @IsOptional()
  @IsString()
  search?: string;

  @IsOptional()
  @IsString()
  projectId?: string;

  @IsOptional()
  @Transform(toArray)
  @IsArray()
  @IsEnum(TaskStatus, { each: true })
  status?: TaskStatus[];

  @IsOptional()
  @Transform(toArray)
  @IsArray()
  @IsEnum(Priority, { each: true })
  priority?: Priority[];

  @IsOptional()
  @Transform(toArray)
  @IsArray()
  @IsString({ each: true })
  assigneeIds?: string[];

  @IsOptional()
  @Transform(toArray)
  @IsArray()
  @IsString({ each: true })
  labelIds?: string[];
}
