import dotenv from 'dotenv';
import dotenvExpand from 'dotenv-expand';
import fs from 'fs';

const NODE_ENV = process.env.NODE_ENV || 'development'

var dotenvFiles = [
  `../.env.local`,
  `../.env.${NODE_ENV}`,
  NODE_ENV !== 'test' && '../.env.local',
  '../.env',
].filter(Boolean);

dotenvFiles.forEach(dotenvFile => {
  if (fs.existsSync(dotenvFile)) {
    dotenvExpand(dotenv.config({
      path: dotenvFile,
    }));
  }
});