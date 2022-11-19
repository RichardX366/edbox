import { Storage } from '@google-cloud/storage';

const credentials = JSON.parse(process.env.GCS_CREDENTIALS as string);

export const bucket = new Storage({
  credentials,
  projectId: credentials.project_id,
}).bucket(process.env.GCS_BUCKET as string);
