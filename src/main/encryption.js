// Work in progress, do not use in production yet

const crypto = require('node:crypto');

function deriveKey(password, salt) {
    return crypto.scryptSync(password, salt, 32);
}

function encrypt(data, password) {
    const salt = crypto.randomBytes(16);

    const key = deriveKey(password, salt);

    const iv = crypto.randomBytes(12); // 96 bits

    const cipher = crypto.createCipheriv("aes-256-gcm", key, iv);

    let encrypted = cipher.update(data, 'utf8', 'base64');
    encrypted += cipher.final('base64');

    const authTag = cipher.getAuthTag();

    return {
        salt: salt.toString('base64'),
        iv: iv.toString('base64'),
        authTag: authTag.toString('base64'),
        encrypted: encrypted
    };
}

function decrypt(encryptedData, password) {
    try {
        const { salt, iv, authTag, encrypted } = encryptedData;

        const key = deriveKey(password, Buffer.from(salt, 'base64'))

        const decipher = crypto.createDecipheriv('aes-256-gcm', key, Buffer.from(iv, 'base64'));

        decipher.setAuthTag(Buffer.from(authTag, 'base64'));

        let decrypted = decipher.update(encrypted, 'base64', 'utf8');
        decrypted += decipher.final('utf8');

        return decrypted
    } catch (error) {
        return null;
    }
}

module.exports = { encrypt, decrypt };