# Route 53 DNS not resolving – checklist

If the A record is set in Route 53 but the domain "can't be resolved", work through this.

## 1. **Delegation: registrar must use Route 53 nameservers**

Route 53 only answers queries when the **domain’s nameservers** (set at the **registrar** where you bought the domain) point to Route 53.

- In **Route 53** → **Hosted zones** → your domain → note the **NS** record (e.g. `ns-123.awsdns-45.com`, etc.).
- At your **domain registrar** (GoDaddy, Namecheap, Google Domains, etc.) open the domain’s **nameserver** / **DNS** settings.
- Set the domain’s nameservers to **exactly** the 4 NS values from the hosted zone. Remove any old ones.

Until this is done, the rest of the internet will not ask Route 53 for your domain, so your A record will never be used.

## 2. **Check what the world sees**

From your machine (or any server):

```bash
# What IP does your domain resolve to?
dig +short YOUR_DOMAIN.com

# Which nameservers are used for your domain? (should be Route 53 NS)
dig NS YOUR_DOMAIN.com +short
```

- If `dig NS` does **not** show the Route 53 nameservers, the registrar is still pointing elsewhere → fix step 1.
- If `dig NS` shows Route 53 but `dig +short` is empty or wrong, then it’s a record/typo issue (step 3).

## 3. **A record in Route 53**

- **Hosted zone**: the zone must be for the same domain (e.g. `example.com`). For a subdomain like `www.example.com`, the A record lives in the `example.com` zone.
- **Record name**:
  - For `www.example.com` use `www.example.com` or `www` (Route 53 adds the zone name).
  - For the apex `example.com` use `example.com` or `@` / leave name blank depending on UI.
- **Value**: the Lightsail **static IP** (same as in the workflow / Route 53 step).
- **Type**: **A**.

## 4. **Propagation**

After changing nameservers at the registrar, wait **up to 24–48 hours** (often 5–30 minutes). Use `dig NS` and `dig +short` from step 2 to confirm when it’s updated.

## Quick verification from the repo (optional)

With `ROUTE53_HOSTED_ZONE_ID` and `ROUTE53_RECORD_NAME` set, you can list the record:

```bash
aws route53 list-resource-record-sets \
  --hosted-zone-id YOUR_ZONE_ID \
  --query "ResourceRecordSets[?Name=='YOUR_RECORD_NAME.']" \
  --output table
```

Replace `YOUR_ZONE_ID` and `YOUR_RECORD_NAME` (include trailing dot for the name, e.g. `www.example.com.`).
