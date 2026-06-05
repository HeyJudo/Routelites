const BASE_URL = process.env.EXPO_PUBLIC_API_BASE_URL || "http://127.0.0.1:8000";

 export class ApiError extends Error {
   status: number;
   body: unknown;
   constructor(status: number, body: unknown) {
 	super(`API error ${status}`);
 	this.status = status;
 	this.body = body;
   }
 }

 export async function apiFetch<T>(path: string, options?: RequestInit): Promise<T> {
   const url = `${BASE_URL}${path}`;
   const res = await fetch(url, {
 	...options,
 	headers: {
   	"Content-Type": "application/json",
   	...options?.headers,
 	},
   });
   if (!res.ok) {
 	const body = await res.json().catch(() => null);
 	throw new ApiError(res.status, body);
   }
   return res.json() as Promise<T>;
 }
