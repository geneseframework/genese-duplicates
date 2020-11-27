import * as path from 'path';

const fs = require('fs-extra');

function findInDir (dir, filter, fileList = []) {
    const files = fs.readdirSync(dir);

    files.forEach((file) => {
        const filePath = path.join(dir, file);
        const fileStat = fs.lstatSync(filePath);

        if (fileStat.isDirectory()) {
            findInDir(filePath, filter, fileList);
        } else if (filter.test(filePath)) {
            fileList.push(filePath);
        }
    });

    return fileList;
}

const files = findInDir('/home/akueny/Dev/@genese/genese-duplicates/tests/src', /(?<!\.mock|\.spec)\.ts$/);

const processedFiles = files.map(processFiles);

function ignoreComments(code: string): string {
    return code.replace(/\/\*[\s\S]*?\*\/|([^\\:]|^)\/\/.*$/gm, '');
}

function processFiles(text: string): { name: string, lines: string[] } {
    const fileContent = fs.readFileSync(text, 'utf-8');
    return {
        name: text.split('/').reverse()[0],
        lines: ignoreComments(fileContent.toLowerCase()).replace(/\n+/g, '\n').split('\n')
    };
}

const processedFileNames = [];

processedFiles.forEach(({lines, name}, i) => {
    processedFiles.filter((e, index) => index !== i).forEach(({lines: otherLines, name: otherName}) => {
        if (processedFileNames.filter(([a, b]) => a === name && b === otherName || a === otherName && b === name).length > 0) return;
        processedFileNames.push([name, otherName]);

        const matrix = Array.from(Array(lines.length + 1), _ => Array(otherLines.length + 1).fill(0));

        for (let i = lines.length - 1; i > -1; i--) {
            for (let j = otherLines.length - 1; j > -1; j--) {
                if (lines[i] === otherLines[j]) {
                    matrix[i][j] = matrix[i + 1][j + 1] + 1;
                }
            }
        }

        const processed = [];
        let duplicates = [];
        let i = 0;
        while (i < lines.length) {
            let j = 0;
            while (j < otherLines.length) {
                const v = matrix[i][j];
                if (v > 0 && processed.filter(([a, b]) => a === i && b == j).length === 0) {
                    duplicates.push({v, i, j, text: lines.slice(i, i + v).join('\n')});

                    let ii = i, jj = j;
                    while (matrix[ii][jj] > 0 && ii < lines.length && jj < otherLines.length) {
                        processed.push([ii, jj]);
                        ii++;
                        jj++;
                    }
                }
                j++;
            }
            i++;
        }

        duplicates = duplicates.filter(({v, text}) => {
            return v >= 2 &&
                text.replace(/\s/g, '').length >= 10 &&
                /[\w\d]+/.test(text)
        });

        if (duplicates.length > 0) {
            console.log(`${name} and ${otherName} have duplicated lines`);
            duplicates.forEach(({v, i, j, text}) => {
                console.log(`${name} ${i + 1}:${i + v}`);
                console.log(`${otherName} ${j + 1}:${j + v}`);
                console.log('---CODE---')
                console.log(text);
                console.log('---END CODE---')
                console.log();
            });
        }
    });
});


// function areEqual(S1, S2) {
//     if (S1 !== S2) {
//         return false;
//     }
//     for (let i = 0; i < S1.length; i++) {
//         if (S1[i] !== S2[i]) {
//             return false;
//         }
//     }
//     return true;
// }
//
// function polyHash(S, p, x) {
//     var hash = 0;
//     for (let i = 0; i <= S.length - 1; i++) {
//         hash = (hash * x + S.charCodeAt(i)) % p;
//     }
//     return hash;
// }
//
// function rabinKarp(T, P) {
//     var p = 1019;
//     const x = 34;
//     var positions = [];
//     const pHash = polyHash(P, p, x);
//     var text;
//     var tHash;
//
//     // Loop through text
//     for (let k = 0; k <= (T.length - P.length); k++) {
//         text = T.slice(k, (k + P.length));
//
//         tHash = polyHash(text, p, x);
//
//         // If hashes don't match, continue to next loop
//         if (pHash !== tHash) {
//             continue;
//         }
//
//         // If hashes do match, push locations to positions list
//         if (areEqual(text, P)) {
//             positions.push(k);
//         }
//     }
//     return positions;
// }
