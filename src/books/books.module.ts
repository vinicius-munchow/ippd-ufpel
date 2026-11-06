import { Module } from '@nestjs/common';
import { BooksService } from './books.service.js';
import { BooksController } from './books.controller.js';

@Module({
  controllers: [BooksController],
  providers: [BooksService],
})
export class BooksModule {}
