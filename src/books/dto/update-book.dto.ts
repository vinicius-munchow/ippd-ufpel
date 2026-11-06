import { CreateBookDto } from './create-book.dto.js';

export class UpdateBookDto extends CreateBookDto {
  lido: boolean;
}
