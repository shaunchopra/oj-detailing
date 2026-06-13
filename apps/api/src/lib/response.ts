import { APIGatewayProxyResult } from 'aws-lambda';

export const CORS_HEADERS = {
  'Access-Control-Allow-Origin':  '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
} as const;

const JSON_HEADERS = { ...CORS_HEADERS, 'Content-Type': 'application/json' } as const;

export function ok(body: object): APIGatewayProxyResult {
  return {
    statusCode: 200,
    headers: JSON_HEADERS,
    body: JSON.stringify(body),
  };
}

export function err(statusCode: number, message: string): APIGatewayProxyResult {
  return {
    statusCode,
    headers: JSON_HEADERS,
    body: JSON.stringify({ success: false, error: message }),
  };
}

export function preflight(): APIGatewayProxyResult {
  return { statusCode: 204, headers: CORS_HEADERS, body: '' };
}
