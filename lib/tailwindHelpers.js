import fs from 'fs';
import { execSync } from 'child_process';
import readline from 'readline-sync';


// export function ensureTailwindConfigExists() {
//     if (!fs.existsSync('tailwind.config.js')) {
//         console.warn('⚠️  No tailwind.config.js found.');

//         try {
//             require.resolve('tailwindcss');
//         } catch {
//             console.error('❌ Tailwind is not installed. Please install it first.');
//             return false;
//         }

//         const answer = readline.question('🛠  Do you want to create one now? (Y/n) ');
//         if (answer.toLowerCase() === 'y') {
//             try {
//                 execSync('npx tailwindcss init', { stdio: 'inherit' });
//                 console.log('✅ tailwind.config.js created.');
//             } catch (err) {
//                 console.error('❌ Failed to initialize tailwind.config.js');
//                 console.error(err.message);
//                 return false;
//             }
//         } else {
//             return false;
//         }
//     }

//     return true;
// }

export function ensureTailwindConfigExists() {
    const configExists = fs.existsSync('tailwind.config.js');

    if (configExists) return true;

    console.warn('⚠️  No tailwind.config.js found.');

    let tailwindInstalled = true;

    try {
        require.resolve('tailwindcss');
    } catch {
        tailwindInstalled = false;
        console.error('❌ Tailwind is not installed. Please install it first.');
    }

    if (!tailwindInstalled) return false;

    const answer = readline.question('🛠  Do you want to create one now? (Y/n) ');
    if (answer.toLowerCase() === 'y') {
        try {
            execSync('npx tailwindcss init', { stdio: 'inherit' });
            console.log('✅ tailwind.config.js created.');
            return true;
        } catch (err) {
            console.error('❌ Failed to initialize tailwind.config.js');
            console.error(err.message);
            return false;
        }
    }

    return false;
}

