import type { APIGatewayProxyHandlerV2 } from 'aws-lambda';
import serverless from 'serverless-http';
import { app } from './app.js';

export const handler: APIGatewayProxyHandlerV2 = serverless(app);
