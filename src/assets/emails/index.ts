import { readFileSync } from 'node:fs';
import { join } from 'node:path';

const parseHtml = (name: string): string => readFileSync(join(__dirname, `${name}.html`), 'utf-8');

const passwordResetHtmlTemplate = parseHtml('password-reset');

export const passwordResetEmail = (url: string) => passwordResetHtmlTemplate.replace(/\$url/g, url);
