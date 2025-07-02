import 'reflect-metadata';
import 'module-alias/register';
import 'express-async-errors';
import { injectable } from 'tsyringe';
import bodyParser from 'body-parser';
import express from 'express';
import http from 'http';
import cors from 'cors';

import bootstrap from './bootstrap';
import entrypoint from '@shared/routes/entrypoint';
import { Server } from '@shared/types/http.type';
import { errorHandler, notFoundHandler } from '@shared/routes/defaults';

@injectable()
export default class Application {
  public server: Server;
  public httpServer: http.Server;

  constructor() {
    bootstrap();
    this.configure();
    this.setMiddlewares();
  }

  public async close() {
    this.httpServer.close();
  }

  public async listen(port: number) {
    this.httpServer = await this.server.listen(port);
  }

  private configure() {
    this.server = express();
  }

  private setMiddlewares() {
    this.server.use(
      cors({
        origin: ['https://www.pylott.io', 'https://pylott.io', 'https://staging.pylott.io', 'http://localhost:3000', 'https://pylot-tkrh.vercel.app'],
        credentials: true,
        methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'],
        allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'X-Api-key', 'Api-Reference-Id', 'x-api-key'],
      }),
    );

    this.server.use(bodyParser.json({ limit: '10mb' }));
    this.server.use(bodyParser.urlencoded({ limit: '10mb', extended: false }));

    entrypoint(this.server);
    this.server.use(notFoundHandler);
    this.server.use(errorHandler);
  }
}
