import { Injectable, NotFoundException } from '@nestjs/common';
import { writeFile, readFile } from 'node:fs/promises';
import { CreateBookDto } from './dto/create-book.dto.js';
import { join } from 'node:path';
import { UpdateBookDto } from './dto/update-book.dto.js';

export interface Book {
  id: number;
  titulo: string;
  autor: string;
  paginas: number;
  lido: boolean;
}

@Injectable()
export class BooksService {
  private readonly filePath = join(process.cwd(), 'data', 'books.json');

  private writeQueue: Promise<void> = Promise.resolve();

  private async readBooks(): Promise<Book[]> {
    const content = await readFile(this.filePath, 'utf-8');
    return JSON.parse(content) as Book[];
  }

  private async saveBooks(books: Book[]): Promise<void> {
    const content = JSON.stringify(books, null, 2);

    this.writeQueue = this.writeQueue.then(() =>
      writeFile(this.filePath, content, 'utf-8'),
    );

    await this.writeQueue;
  }

  async findAll(): Promise<Book[]> {
    return this.readBooks();
  }

  async findOne(id: number): Promise<Book> {
    const books = await this.readBooks();
    const book = books.find((item) => item.id === id);

    if (!book) {
      throw new NotFoundException('Livro não encontrado');
    }

    return book;
  }

  async create(dto: CreateBookDto): Promise<Book> {
    const books = await this.readBooks();

    const book: Book = {
      id: books.length > 0 ? Math.max(...books.map((item) => item.id)) + 1 : 1,
      titulo: dto.titulo,
      autor: dto.autor,
      paginas: dto.paginas,
      lido: false,
    };

    books.push(book);
    await this.saveBooks(books);

    return book;
  }

  async update(id: number, dto: UpdateBookDto): Promise<Book> {
    const books = await this.readBooks();
    const index = books.findIndex((item) => item.id === id);

    if (index === -1) {
      throw new NotFoundException('Livro não encontrado');
    }

    books[index] = {
      id,
      titulo: dto.titulo,
      autor: dto.autor,
      paginas: dto.paginas,
      lido: dto.lido,
    };

    await this.saveBooks(books);

    return books[index];
  }

  async patch(id: number, dto: Partial<UpdateBookDto>): Promise<Book> {
    const books = await this.readBooks();
    const index = books.findIndex((item) => item.id === id);

    if (index === -1) {
      throw new NotFoundException('Livro não encontrado');
    }

    books[index] = {
      ...books[index],
      ...dto,
      id,
    };

    await this.saveBooks(books);

    return books[index];
  }

  async remove(id: number): Promise<void> {
    const books = await this.readBooks();
    const filteredBooks = books.filter((item) => item.id !== id);

    if (filteredBooks.length === books.length) {
      throw new NotFoundException('Livro não encontrado');
    }

    await this.saveBooks(filteredBooks);
  }
}
