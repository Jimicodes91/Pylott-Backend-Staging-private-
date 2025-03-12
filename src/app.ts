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

// const mainPath = '/api/v1';
// app.use(`${mainPath}/auth`, authRoutes);
// app.use(`${mainPath}/company`, companyRoutes);
// app.use(`${mainPath}/user`, userRoutes);

@injectable()
export default class Application {
	public server: Server;
	public httpServer: http.Server;
	public corsConfig = this._corsConfig();

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
		this.server.use(cors(this.corsConfig));
		this.server.use(bodyParser.json({ limit: '10mb' }));
		this.server.use(bodyParser.urlencoded({ limit: '10mb', extended: false }));

		entrypoint(this.server);
		this.server.use(notFoundHandler);
		this.server.use(errorHandler);
	}

	private _corsConfig() {
		const allowAll = '*';
		return { origin: allowAll };
	}
}
