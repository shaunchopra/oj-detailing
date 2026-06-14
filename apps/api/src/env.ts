import dotenv from 'dotenv';
import path from 'path';

// Lambda reads env vars from the runtime; load .env only for local development.
if (!process.env['AWS_LAMBDA_FUNCTION_NAME']) {
  dotenv.config({ path: path.resolve(__dirname, '../.env') });
}
