import 'reflect-metadata';
import 'module-alias/register';
import 'express-async-errors';
import { injectable } from 'tsyringe';
import bodyParser from 'body-parser';
import express, { NextFunction, Request, Response } from 'express';
import http from 'http';
// import cors from 'cors';

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
    this.server.use(this._corsConfig);
    this.server.use(bodyParser.json({ limit: '10mb' }));
    this.server.use(bodyParser.urlencoded({ limit: '10mb', extended: false }));

    entrypoint(this.server);
    this.server.use(notFoundHandler);
    this.server.use(errorHandler);
  }

  private _corsConfig(req: Request, res: Response, next: NextFunction) {
    const origin = req.headers.origin; // Get the origin from the request header

    // IF YOU NEED Access-Control-Allow-Credentials: true
    // THEN Access-Control-Allow-Origin MUST REFLECT THE REQUESTING ORIGIN
    // It CANNOT be '*'.
    if (origin) {
      res.setHeader('Access-Control-Allow-Origin', origin);
    } else {
      res.setHeader('Access-Control-Allow-Origin', '*');
    }

    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS, PATCH');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With, X-Api-key, Api-Reference-Id, x-api-key');
    res.setHeader('Access-Control-Allow-Credentials', 'true'); // Keep this if your app uses credentials

    if (req.method === 'OPTIONS') {
      res.statusCode = 204;
      res.end();
    } else {
      next();
    }
  }
}
