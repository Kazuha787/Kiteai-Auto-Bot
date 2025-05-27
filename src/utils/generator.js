const crypto = require("crypto");

function hexToBuffer(hexString) {
  let bytes = [];
  for (let i = 0; i < hexString.length; i += 2) {
    bytes.push(parseInt(hexString.substr(i, 2), 16));
  }
  return Buffer.from(bytes);
}

function bytesToHex(bytes) {
  let hexChars = [];
  for (let i = 0; i < bytes.length; i++) {
    let value = bytes[i] < 0 ? bytes[i] + 256 : bytes[i];
    hexChars.push((value >>> 4).toString(16));
    hexChars.push((15 & value).toString(16));
  }
  return hexChars.join("");
}

async function encrypt(
  address,
  keyHex = "6a1c35292b7c5b769ff47d89a17e7bc4f0adfe1b462981d28e0e9f7ff20b8f8a"
) {
  const keyBuffer = hexToBuffer(keyHex);
  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv("aes-256-gcm", keyBuffer, iv);
  let encrypted = cipher.update(address, "utf8");
  encrypted = Buffer.concat([encrypted, cipher.final()]);
  const authTag = cipher.getAuthTag();
  const result = Buffer.concat([iv, encrypted, authTag]);
  return bytesToHex(result);
}

async function generateAuthToken(
  address,
  keyHex = "6a1c35292b7c5b769ff47d89a17e7bc4f0adfe1b462981d28e0e9f7ff20b8f8a"
) {
  return await encrypt(address, keyHex);
}

module.exports = {
  encrypt,
  generateAuthToken,
  hexToBuffer,
  bytesToHex,
};
