import { IsOptional, IsString, MaxLength, MinLength } from 'class-validator';

export class CreateCommentDto {
  @IsString()
  @MinLength(1, { message: 'Comment cannot be empty' })
  @MaxLength(5000)
  body!: string;

  @IsOptional()
  @IsString()
  parentId?: string;
}
