import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseIntPipe,
  Post,
  Put,
  Patch,
} from '@nestjs/common';

import { CreateBookDto } from './dto/create-book.dto.js';
import { UpdateBookDto } from './dto/update-book.dto.js';
import { BooksService } from './books.service.js';
import type { Book } from './books.service.js';

@Controller('books')
export class BooksController {
  constructor(private readonly booksService: BooksService) {}

  @Get()
  findAll(): Promise<Book[]> {
    return this.booksService.findAll();
  }

  @Get(':id')
  findOne(@Param('id', ParseIntPipe) id: number): Promise<Book> {
    return this.booksService.findOne(id);
  }

  @Post()
  create(@Body() dto: CreateBookDto): Promise<Book> {
    return this.booksService.create(dto);
  }

  @Put(':id')
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateBookDto,
  ): Promise<Book> {
    return this.booksService.update(id, dto);
  }

  @Patch(':id')
  patch(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: Partial<UpdateBookDto>,
  ): Promise<Book> {
    return this.booksService.patch(id, dto);
  }

  @Delete(':id')
  remove(@Param('id', ParseIntPipe) id: number): Promise<void> {
    return this.booksService.remove(id);
  }
}
