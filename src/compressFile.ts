import * as fs from 'fs';
import * as zlib from 'zlib';

function compressFile(filename: string): Promise<void> {
    const tempFilename = `${filename}.temp`;

    return new Promise((resolve, reject) => {
        // Rename the original file to a temporary file
        fs.rename(filename, tempFilename, (renameErr) => {
            if (renameErr) {
                return reject(renameErr);
            }

            // Create a readable stream from the temporary file
            const readStream = fs.createReadStream(tempFilename);
            const zipStream = zlib.createGzip();
            const writeStream = fs.createWriteStream(filename);

            // Pipe the streams
            readStream.pipe(zipStream).pipe(writeStream);

            // Handle errors
            writeStream.on('error', (writeErr) => {
                // Try to clean up by deleting the temporary file
                fs.unlink(filename, () => {
                    reject(writeErr);
                });
            });

            // Handle the end of the stream
            writeStream.on('finish', () => {
                // Delete the temporary file
                fs.unlink(tempFilename, (unlinkErr) => {
                    if (unlinkErr) {
                        reject(unlinkErr);
                    }
                    resolve();
                });
            });

            // Handle errors
            readStream.on('error', (readErr) => {
                reject(readErr);
            });

            zipStream.on('error', (zipErr) => {
                reject(zipErr);
            });
        });
    });
}

export { compressFile };
