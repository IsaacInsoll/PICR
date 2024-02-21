import crypto from "crypto";
import fs from "fs";

const fileHash = (filePath: string): string => {
    const fileBuffer = fs.readFileSync(filePath);
    const hashSum = crypto.createHash('sha256');
    hashSum.update(fileBuffer);
    return hashSum.digest('hex');
}