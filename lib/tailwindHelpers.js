// // // lib/tailwindHelpers.js
// // import fs from 'fs';

// // export function updateTailwindConfig(fonts) {
// //   const configPath = 'tailwind.config.js';
// //   if (!fs.existsSync(configPath)) {
// //     console.warn('⚠️ tailwind.config.js not found');
// //     return;
// //   }

// //   let config = fs.readFileSync(configPath, 'utf8');

// //   fonts.forEach(({ name }) => {
// //     const key = name.toLowerCase();
// //     const line = `${key}: ['${name}'],`;

// //     if (!config.includes(line)) {
// //       config = config.replace(/fontFamily:\s*{/, `fontFamily: {\n      ${line}`);
// //     }
// //   });

// //   fs.writeFileSync(configPath, config);
// //   console.log('✅ Updated tailwind.config.js');
// // }


// // lib/tailwindHelpers.js
// import fs from 'fs';
// import readline from 'readline';
// import { execSync } from 'child_process';

// export async function updateTailwindConfig(fonts) {
//     const configPath = 'tailwind.config.js';

//     if (!fs.existsSync(configPath)) {
//         const rl = readline.createInterface({
//             input: process.stdin,
//             output: process.stdout,
//         });

//         await new Promise((resolve) => {
//             rl.question(
//                 '⚠️  No tailwind.config.js found.\n🛠  Do you want to create one now? (Y/n) ',
//                 (answer) => {
//                     rl.close();
//                     if (answer.toLowerCase() === 'n') {
//                         console.log('❌ Font injection skipped.');
//                         resolve();
//                     } else {
//                         execSync('npx tailwindcss init', { stdio: 'inherit' });
//                         resolve();
//                     }
//                 }
//             );
//         });
//     }

//     if (!fs.existsSync(configPath)) return;

//     let config = fs.readFileSync(configPath, 'utf8');

//     fonts.forEach(({ name }) => {
//         const key = name.toLowerCase();
//         const line = `${key}: ['${name}'],`;

//         if (!config.includes(line)) {
//             config = config.replace(/fontFamily:\s*{/, `fontFamily: {\n      ${line}`);
//         }
//     });

//     fs.writeFileSync(configPath, config);
//     console.log('✅ Updated tailwind.config.js');
// }


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
//             return;
//         }

//         const answer = readline.question('🛠  Do you want to create one now? (Y/n) ');
//         if (answer.toLowerCase() === 'y') {
//             try {
//                 execSync('npx tailwindcss init', { stdio: 'inherit' });
//                 console.log('✅ tailwind.config.js created.');
//             } catch (err) {
//                 console.error('❌ Failed to initialize tailwind.config.js');
//                 console.error(err.message);
//             }
//         }
//     }
// }


export function ensureTailwindConfigExists() {
    if (!fs.existsSync('tailwind.config.js')) {
        console.warn('⚠️  No tailwind.config.js found.');

        try {
            require.resolve('tailwindcss');
        } catch {
            console.error('❌ Tailwind is not installed. Please install it first.');
            return false;
        }

        const answer = readline.question('🛠  Do you want to create one now? (Y/n) ');
        if (answer.toLowerCase() === 'y') {
            try {
                execSync('npx tailwindcss init', { stdio: 'inherit' });
                console.log('✅ tailwind.config.js created.');
            } catch (err) {
                console.error('❌ Failed to initialize tailwind.config.js');
                console.error(err.message);
                return false;
            }
        } else {
            return false;
        }
    }

    return true;
}
