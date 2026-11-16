const decoder = new TextDecoder();

export class BoundedBodyError extends Error {
    constructor(message: string) {
        super(message);
        this.name = "BoundedBodyError";
    }
}

/** Reads a JSON body and stops once it passes `maxBytes`, before parsing. */
export async function readBoundedJson(request: Request, maxBytes: number): Promise<unknown> {
    const declared = request.headers.get("content-length");
    if (declared !== null) {
        if (!/^\d+$/.test(declared) || Number(declared) > maxBytes) {
            throw new BoundedBodyError("Request is too large.");
        }
    }

    if (!request.body) {
        throw new BoundedBodyError("Invalid request.");
    }

    const reader = request.body.getReader();
    const chunks: Uint8Array[] = [];
    let total = 0;
    try {
        while (true) {
            const { done, value } = await reader.read();
            if (done) break;
            total += value.byteLength;
            if (total > maxBytes) {
                await reader.cancel();
                throw new BoundedBodyError("Request is too large.");
            }
            chunks.push(value);
        }
    } finally {
        reader.releaseLock();
    }

    const bytes = new Uint8Array(total);
    let offset = 0;
    for (const chunk of chunks) {
        bytes.set(chunk, offset);
        offset += chunk.byteLength;
    }

    try {
        return JSON.parse(decoder.decode(bytes));
    } catch {
        throw new BoundedBodyError("Invalid request.");
    }
}
