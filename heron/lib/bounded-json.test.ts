import { describe, expect, it } from "vitest";
import { BoundedBodyError, readBoundedJson } from "./bounded-json";

describe("readBoundedJson", () => {
    it("stops reading once the byte cap is passed", async () => {
        const chunk = new Uint8Array(1000);
        let sent = 0;
        const stream = new ReadableStream<Uint8Array>({
            pull(controller) {
                if (sent >= 5000) {
                    controller.close();
                    return;
                }
                controller.enqueue(chunk);
                sent += chunk.byteLength;
            }
        });
        const request = new Request("http://localhost/api/contact", {
            method: "POST",
            body: stream,
            duplex: "half"
        });
        await expect(readBoundedJson(request, 2000)).rejects.toBeInstanceOf(BoundedBodyError);
    });
});
