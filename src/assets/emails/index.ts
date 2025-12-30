import { readFileSync } from 'fs';
import { join } from 'path';

const parseHtml = (name: string): string => readFileSync(join(__dirname, `${name}.html`), 'utf-8');

const passwordResetHtmlTemplate = parseHtml('password-reset');

export const passwordResetEmail = (url: string) => passwordResetHtmlTemplate.replace(/\$\{url\}/g, url);
