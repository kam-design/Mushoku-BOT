import fs from 'fs';
import path from 'path';

export function getRandomSurname() {
    try {
        const filePath = path.join(process.cwd(), 'names.txt');
        const data = fs.readFileSync(filePath, 'utf8');
        const surnames = data.split(/\r?\n/).map(s => s.trim()).filter(Boolean);
        if (surnames.length === 0) return 'Greyrat';
        return surnames[Math.floor(Math.random() * surnames.length)];
    } catch (err) {
        return 'Greyrat';
    }
}

export function getProgressBar(current, max, size = 10) {
    const filled = Math.min(size, Math.max(0, Math.ceil((current / max) * size)));
    return '■'.repeat(filled) + '□'.repeat(size - filled);
}