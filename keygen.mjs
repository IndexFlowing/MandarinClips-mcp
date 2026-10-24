// keygen.mjs
import crypto from 'crypto';

const { privateKey, publicKey } = crypto.generateKeyPairSync('ed25519');

// 1. 公钥 (32 字节 = 64 Hex 字符)
const rawPub = publicKey.export({ type: 'spki', format: 'der' }).subarray(12).toString('hex');

// 2. 原始私钥种子 (32 字节 = 64 Hex 字符)
const rawPrivSeed = privateKey.export({ type: 'pkcs8', format: 'der' }).subarray(16).toString('hex');

// 3. 全长扩展私钥 (64 字节 = 128 Hex 字符 = 种子 + 公钥)
const rawPrivFull = rawPrivSeed + rawPub;

console.log("\n=======================================================");
console.log("🔑 [Public Key / 公钥] (填入 Cloudflare TXT 记录):");
console.log(rawPub);
console.log("-------------------------------------------------------");
console.log("🔐 [64位 原始私钥种子 (32字节)]:");
console.log(rawPrivSeed);
console.log("-------------------------------------------------------");
console.log("🔐 [128位 全长扩展私钥 (64字节)] (如果 64 位报错请试这个):");
console.log(rawPrivFull);
console.log("=======================================================\n");