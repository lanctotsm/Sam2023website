import { readFileSync } from "fs";
import path from "path";
import { describe, expect, it } from "vitest";

const repoRoot = path.resolve(__dirname, "../..");

function read(relativePath: string): string {
  return readFileSync(path.join(repoRoot, relativePath), "utf8");
}

describe("Apache compression", () => {
  it("enables mod_deflate on Ubuntu and Bitnami", () => {
    const runtime = read("heron/scripts/deploy-runtime.sh");
    expect(runtime).toContain("deploy_runtime_enable_deflate");
    expect(runtime).toContain("a2enmod deflate");
    expect(runtime).toContain("LoadModule deflate_module");

    const configure = read("heron/scripts/deploy-configure-apache.sh");
    expect(configure).toContain("deploy_runtime_enable_deflate");
    expect(configure).toContain("a2enmod proxy proxy_http ssl rewrite headers deflate");
  });

  it("compresses text responses in the TLS vhost", () => {
    const configure = read("heron/scripts/deploy-configure-apache.sh");
    const vhost = configure.slice(configure.indexOf("<VirtualHost *:443>"), configure.indexOf("</VirtualHost>", configure.indexOf("<VirtualHost *:443>")));
    expect(vhost).toContain("<IfModule mod_deflate.c>");
    for (const type of [
      "text/html",
      "text/css",
      "text/javascript",
      "application/javascript",
      "application/json",
      "application/xml",
      "application/rss+xml",
      "image/svg+xml"
    ]) {
      expect(vhost).toContain(type);
    }
  });

  it("enables deflate in the runtime image", () => {
    const provision = read("infra/lightsail-image/provision.sh");
    expect(provision).toMatch(/a2enmod proxy proxy_http ssl rewrite headers deflate/);
  });
});
