import { encode } from "punycode";
import bcrypt from "bcryptjs";
import {
	JwtAlgorithmNotImplemented,
	JwtTokenExpired,
	JwtTokenInvalid,
	JwtTokenIssuedAt,
	JwtTokenNotBefore,
	JwtTokenSignatureMismatched,
} from "hono/utils/jwt/types";
export const hashPassword = async (password: string) => {
	return await bcrypt.hash(password, 10);
};

export const checkPassword = async (
	password: string,
	hashedPassword: string,
) => {
	return await bcrypt.compare(password, hashedPassword);
};

const encodeJwtPart = (part: unknown) => {
	const utf8Encoder = new TextEncoder();
	return encodeBase64Url(utf8Encoder.encode(JSON.stringify(part))).replace(
		/=/g,
		"",
	);
};

const encodeBase64Url = (buf: ArrayBuffer) => {
	return encodeBase64(buf).replace(
		/\/|\+/g,
		(m) => ({ "/": "_", "+": "-" })[m] ?? m,
	);
};
const encodeBase64 = (buf: ArrayBuffer) => {
	let binary = "";
	const bytes = new Uint8Array(buf);
	for (let i = 0, len = bytes.length; i < len; i++) {
		binary += String.fromCharCode(bytes[i]);
	}
	return btoa(binary);
};

const decodeBase64Url = (str: string) => {
	return decodeBase64(
		str.replace(/_|-/g, (m) => ({ _: "/", "-": "+" })[m] ?? m),
	);
};

const decodeBase64 = (str: string) => {
	const binary = atob(str);
	const bytes = new Uint8Array(new ArrayBuffer(binary.length));
	const half = binary.length / 2;
	for (let i = 0, j = binary.length - 1; i <= half; i++, j--) {
		bytes[i] = binary.charCodeAt(i);
		bytes[j] = binary.charCodeAt(j);
	}
	return bytes;
};

const encodeSignaturePart = (buf: ArrayBuffer) => {
	return encodeBase64Url(buf).replace(/=/g, "");
};

const decodeJwtPart = (part: string) => {
	const utf8Decoder = new TextDecoder();
	return JSON.parse(utf8Decoder.decode(decodeBase64Url(part)));
};

export const sign = async (payload: unknown, secret: string, alg = "HS256") => {
	const encodedPayload = encodeJwtPart(payload);
	const encodedHeader = encodeJwtPart({ alg, typ: "JWT" });
	const partialToken = `${encodedHeader}.${encodedPayload}`;
	const signaturePart = await signing(partialToken, secret, alg);
	const signature = encodeSignaturePart(signaturePart);
	return `${partialToken}.${signature}`;
};

const param = (name: string) => {
	switch (name.toUpperCase()) {
		case "HS256":
			return {
				name: "HMAC",
				hash: {
					name: "SHA-256",
				},
			};
		case "HS384":
			return {
				name: "HMAC",
				hash: {
					name: "SHA-384",
				},
			};
		case "HS512":
			return {
				name: "HMAC",
				hash: {
					name: "SHA-512",
				},
			};
		default:
			throw new JwtAlgorithmNotImplemented(name);
	}
};

const signing = async (data: string, secret: string, alg = "HS256") => {
	if (!crypto.subtle || !crypto.subtle.importKey) {
		throw new Error(
			"`crypto.subtle.importKey` is undefined. JWT auth middleware requires it.",
		);
	}
	const utf8Encoder2 = new TextEncoder();
	const cryptoKey = await crypto.subtle.importKey(
		"raw" /* RAW */,
		utf8Encoder2.encode(secret),
		param(alg),
		false,
		["sign" /* Sign */],
	);
	return await crypto.subtle.sign(
		param(alg),
		cryptoKey,
		utf8Encoder2.encode(data),
	);
};

export const verify = async (token: string, secret: string, alg = "HS256") => {
	const tokenParts = token.split(".");
	if (tokenParts.length !== 3) {
		throw new JwtTokenInvalid(token);
	}
	const { payload } = decode(token);
	const now = Math.floor(Date.now() / 1e3);
	if (payload.nbf && payload.nbf > now) {
		throw new JwtTokenNotBefore(token);
	}
	if (payload.exp && payload.exp <= now) {
		throw new JwtTokenExpired(token);
	}
	if (payload.iat && now < payload.iat) {
		throw new JwtTokenIssuedAt(now, payload.iat);
	}
	const signaturePart = tokenParts.slice(0, 2).join(".");
	const signature = await signing(signaturePart, secret, alg);
	const encodedSignature = encodeSignaturePart(signature);
	if (encodedSignature !== tokenParts[2]) {
		throw new JwtTokenSignatureMismatched(token);
	}
	return payload;
};

export const decode = (token: string) => {
	try {
		const [h, p] = token.split(".");
		const header = decodeJwtPart(h);
		const payload = decodeJwtPart(p);
		return {
			header,
			payload,
		};
	} catch (e) {
		throw new JwtTokenInvalid(token);
	}
};
