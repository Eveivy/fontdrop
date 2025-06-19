import fs from 'fs';

export function readPackageJson() {
    try {
        const content = fs.readFileSync('package.json', 'utf8');
        return JSON.parse(content);
    } catch (err) {
        return null;
    }
}
