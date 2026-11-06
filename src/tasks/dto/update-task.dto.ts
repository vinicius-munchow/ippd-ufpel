import { CreateTaskDto } from './create-task.dto.js';

export class UpdateTaskDto extends CreateTaskDto {
  status: string;
  resultado: number[] | null;
}
