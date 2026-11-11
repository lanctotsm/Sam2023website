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

describe("www host", () => {
  function vhostAt(configure: string, opening: string): string {
    const start = configure.indexOf(opening);
    return configure.slice(start, configure.indexOf("</VirtualHost>", start));
  }

  it("only adds the www name when it resolves in DNS", () => {
    const configure = read("heron/scripts/deploy-configure-apache.sh");
    expect(configure).toContain('getent hosts "www.${SITE_DOMAIN}"');
  });

  it("adds the ServerAlias to both the port 80 and port 443 vhosts", () => {
    const configure = read("heron/scripts/deploy-configure-apache.sh");
    const vhost80 = vhostAt(configure, "<VirtualHost *:80>");
    const vhost443 = vhostAt(configure, "<VirtualHost *:443>");
    expect(vhost80).toContain("ServerName ${SITE_DOMAIN}\n  ${SERVER_ALIAS_LINE}");
    expect(vhost443).toContain("ServerName ${SITE_DOMAIN}\n  ${SERVER_ALIAS_LINE}");
  });

  it("adds the www redirect block to the 443 vhost before ProxyPass", () => {
    const configure = read("heron/scripts/deploy-configure-apache.sh");
    const vhost443 = vhostAt(configure, "<VirtualHost *:443>");
    expect(vhost443).toContain("${WWW_REDIRECT_BLOCK}");
    expect(vhost443.indexOf("${WWW_REDIRECT_BLOCK}")).toBeLessThan(vhost443.indexOf("ProxyPass /"));
  });

  it("redirects port 80 to the bare domain, not to the request host", () => {
    const configure = read("heron/scripts/deploy-configure-apache.sh");
    const vhost80 = vhostAt(configure, "<VirtualHost *:80>");
    expect(vhost80).toContain("RewriteRule ^(.*)$ https://${SITE_DOMAIN}\\$1 [R=301,L]");
    expect(vhost80).not.toContain("https://%{HTTP_HOST}");
  });

  it("requests the certificate for both names under the bare-domain cert name", () => {
    const configure = read("heron/scripts/deploy-configure-apache.sh");
    expect(configure).toContain('--cert-name "$SITE_DOMAIN"');
    expect(configure).toContain("--expand");
    expect(configure).toContain("--renew-with-new-domains");
    expect(configure).toContain('"${CERTBOT_DOMAINS[@]}"');
  });
});
