const crypto = require("crypto");
const fs = require("fs");

const decryptFile = (inputFile, outputFile, password) => {
    const input = fs.readFileSync(inputFile);
    const iv = input.slice(0, 16);
    const encryptedContent = input.slice(16);

    const key = crypto.createHash("sha256").update(password).digest();
    const decipher = crypto.createDecipheriv("aes-256-cbc", key, iv);

    const decrypted = Buffer.concat([
        decipher.update(encryptedContent),
        decipher.final(),
    ]);

    fs.writeFileSync(outputFile, decrypted);
};

decryptFile("character.enc", "character.glb", "Character3D#@");
console.log("Decryption complete: character.glb restored.");
