import { NextRequest, NextResponse } from "next/server";

const HOP_BY_HOP_HEADERS = new Set([
    "connection",
    "keep-alive",
    "proxy-authenticate",
    "proxy-authorization",
    "te",
    "trailer",
    "transfer-encoding",
    "upgrade",
]);

const DEFAULT_ALLOWED_HOST_PATTERNS = [
    "hexoran.com",
    "*.hexoran.com",
];

const getAllowedHostPatterns = () => {
    const fromEnv = (process.env.BROWSER_PROXY_ALLOWED_HOSTS || "")
        .split(",")
        .map((item) => item.trim().toLowerCase())
        .filter(Boolean);

    return [...DEFAULT_ALLOWED_HOST_PATTERNS, ...fromEnv];
};

const hostMatchesPattern = (hostname: string, pattern: string) => {
    const host = hostname.toLowerCase();
    const normalized = pattern.toLowerCase();

    if (normalized.startsWith("*.")) {
        const base = normalized.slice(2);
        return host === base || host.endsWith(`.${base}`);
    }

    return host === normalized || host.endsWith(`.${normalized}`);
};

const isAllowedShowcaseHost = (hostname: string) => {
    return getAllowedHostPatterns().some((pattern) => hostMatchesPattern(hostname, pattern));
};

const isPrivateOrLocalHost = (hostname: string) => {
    const host = hostname.toLowerCase();
    if (host === "localhost" || host === "127.0.0.1" || host === "::1") return true;

    if (/^\d+\.\d+\.\d+\.\d+$/.test(host)) {
        const [a, b] = host.split(".").map(Number);
        if (a === 10) return true;
        if (a === 127) return true;
        if (a === 192 && b === 168) return true;
        if (a === 172 && b >= 16 && b <= 31) return true;
        if (a === 169 && b === 254) return true;
    }

    return false;
};

const escapeHtml = (value: string) =>
    value
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/\"/g, "&quot;")
        .replace(/'/g, "&#39;");

const toProxyUrl = (absoluteUrl: string) => `/api/browser-proxy?url=${encodeURIComponent(absoluteUrl)}`;

const shouldSkipRewriteValue = (value: string) => {
    return !value || value.startsWith("#") || /^(mailto:|tel:|javascript:|data:)/i.test(value);
};

const rewriteHtmlLinksToProxy = (html: string, currentUrl: string) => {
    return html.replace(/(href|src|action|poster)=("|')([^"']+)("|')/gi, (full, attribute, quoteStart, rawValue, quoteEnd) => {
        const value = String(rawValue || "").trim();

        if (shouldSkipRewriteValue(value)) {
            return full;
        }

        let resolved: URL;
        try {
            resolved = new URL(value, currentUrl);
        } catch {
            return full;
        }

        const proxied = toProxyUrl(resolved.toString());
        return `${attribute}=${quoteStart}${proxied}${quoteEnd}`;
    });
};

const rewriteCssLinksToProxy = (css: string, currentUrl: string) => {
    return css.replace(/url\(([^)]+)\)/gi, (full, rawValue) => {
        const value = String(rawValue || "").trim().replace(/^['"]|['"]$/g, "");
        if (shouldSkipRewriteValue(value)) return full;

        try {
            const resolved = new URL(value, currentUrl).toString();
            return `url(${toProxyUrl(resolved)})`;
        } catch {
            return full;
        }
    });
};

const injectBrowserBridge = (html: string) => {
    const bridgeScript = `
<script>
(() => {
  try {
    const send = () => {
      window.parent.postMessage({ type: "proxy-navigation", proxyUrl: window.location.href }, window.location.origin);
    };
    window.addEventListener("load", send);
    window.addEventListener("popstate", send);
    window.addEventListener("hashchange", send);
  } catch {}
})();
</script>`;

    if (html.includes("</body>")) return html.replace("</body>", `${bridgeScript}</body>`);
    return `${html}${bridgeScript}`;
};

const makeErrorPage = (title: string, description: string) => {
    const page = `<!doctype html>
<html>
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>${escapeHtml(title)}</title>
    <style>
      * { margin: 0; padding: 0; box-sizing: border-box; }
      
      html, body { 
        width: 100%; 
        height: 100%; 
      }
      
      body { 
        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', 'Helvetica Neue', sans-serif;
        background: linear-gradient(135deg, #ffffff 0%, #f8f8f8 100%);
        color: #1a1a1a;
        line-height: 1.6;
        -webkit-font-smoothing: antialiased;
        -moz-osx-font-smoothing: grayscale;
      }
      
      .container {
        display: flex;
        align-items: center;
        justify-content: center;
        min-height: 100vh;
        padding: 24px;
      }
      
      .content {
        width: 100%;
        max-width: 640px;
        display: flex;
        flex-direction: column;
        align-items: center;
        text-align: center;
        gap: 0;
      }
      
      /* Error Code */
      .error-code {
        font-size: 140px;
        font-weight: 900;
        background: linear-gradient(135deg, #000000 0%, #2a2a2a 100%);
        -webkit-background-clip: text;
        -webkit-text-fill-color: transparent;
        background-clip: text;
        line-height: 0.9;
        letter-spacing: -4px;
        margin: 0;
        padding: 20px 0 10px 0;
        display: flex;
        justify-content: center;
        gap: 4px;
      }
      
      .error-code span {
        display: inline-block;
        animation: float 3s ease-in-out infinite;
      }
      
      .error-code span:nth-child(2) {
        animation-delay: 0.1s;
      }
      
      .error-code span:nth-child(3) {
        animation-delay: 0.2s;
      }
      
      @keyframes float {
        0%, 100% { transform: translateY(0px); }
        50% { transform: translateY(-12px); }
      }
      
      @media (max-width: 640px) {
        .error-code {
          font-size: 100px;
          letter-spacing: -3px;
          padding: 10px 0 5px 0;
        }
      }
      
      @media (max-width: 480px) {
        .error-code {
          font-size: 80px;
          letter-spacing: -2px;
        }
      }
      
      /* Text section */
      .text-section {
        display: flex;
        flex-direction: column;
        gap: 0;
        padding: 32px 0 20px 0;
      }
      
      h1 {
        font-size: 48px;
        font-weight: 800;
        line-height: 1.1;
        margin: 0 0 12px 0;
        letter-spacing: -1px;
      }
      
      @media (max-width: 640px) {
        h1 {
          font-size: 36px;
        }
      }
      
      .subtitle {
        font-size: 20px;
        font-weight: 600;
        color: #333;
        margin: 0 0 16px 0;
        line-height: 1.4;
      }
      
      @media (max-width: 640px) {
        .subtitle {
          font-size: 18px;
        }
      }
      
      .description {
        font-size: 15px;
        color: #666;
        line-height: 1.7;
        max-width: 420px;
        margin: 0 auto;
      }
      
      @media (max-width: 640px) {
        .description {
          font-size: 14px;
          max-width: 100%;
        }
      }
      
      /* Divider */
      .divider {
        width: 48px;
        height: 2px;
        background: linear-gradient(90deg, transparent, #000, transparent);
        margin: 28px 0 28px 0;
      }
      
      /* Actions */
      .actions {
        display: flex;
        flex-direction: row;
        gap: 12px;
        justify-content: center;
        width: 100%;
        margin-bottom: 24px;
      }
      
      @media (max-width: 480px) {
        .actions {
          flex-direction: column;
          gap: 10px;
        }
      }
      
      .btn {
        padding: 12px 36px;
        font-size: 15px;
        font-weight: 600;
        border-radius: 8px;
        cursor: pointer;
        transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
        border: none;
        text-decoration: none;
        display: inline-flex;
        align-items: center;
        justify-content: center;
        font-family: inherit;
        white-space: nowrap;
        min-height: 44px;
      }
      
      .btn:focus {
        outline: 2px solid #000;
        outline-offset: 2px;
      }
      
      .btn:active {
        transform: scale(0.98);
      }
      
      .btn-primary {
        background-color: #000;
        color: #fff;
        min-width: 140px;
      }
      
      .btn-primary:hover {
        background-color: #1a1a1a;
        transform: translateY(-2px);
        box-shadow: 0 8px 24px rgba(0, 0, 0, 0.15);
      }
      
      .btn-secondary {
        background-color: transparent;
        color: #000;
        border: 2px solid #000;
        min-width: 140px;
      }
      
      .btn-secondary:hover {
        background-color: #f5f5f5;
        transform: translateY(-2px);
        box-shadow: 0 8px 24px rgba(0, 0, 0, 0.1);
      }
      
      /* Footer */
      .footer {
        text-align: center;
        font-size: 13px;
        color: #999;
        padding-top: 16px;
        border-top: 1px solid #e5e5e5;
        width: 100%;
      }
      
      /* Decorative dots */
      .dot {
        width: 3px;
        height: 3px;
        background: #000;
        border-radius: 50%;
        opacity: 0.08;
        position: fixed;
        pointer-events: none;
      }
    </style>
  </head>
  <body>
    <!-- Decorative dots -->
    <div class="dot" style="top: 8%; left: 4%;"></div>
    <div class="dot" style="top: 15%; right: 6%;"></div>
    <div class="dot" style="bottom: 20%; left: 8%;"></div>
    <div class="dot" style="bottom: 10%; right: 4%;"></div>
    
    <div class="container">
      <div class="content">
        <!-- Error Code -->
        <div class="error-code">
          <span>4</span>
          <span>0</span>
          <span>4</span>
        </div>
        
        <!-- Text -->
        <div class="text-section">
          <h1>Oops!</h1>
          <p class="subtitle">${escapeHtml(title)}</p>
          <p class="description">${escapeHtml(description)}</p>
        </div>
        
        <!-- Divider -->
        <div class="divider"></div>
        
        <!-- Actions -->
        <div class="actions">
          <button class="btn btn-primary" onclick="handleGoBack()">Go Back</button>
          <button class="btn btn-secondary" onclick="handleHome()">Home</button>
        </div>
        
        <!-- Footer -->
        <div class="footer">
          <p>Need help? Check the navigation menu or try another link.</p>
        </div>
      </div>
    </div>
    
    <script>
      function handleGoBack() {
        try {
          if (window.parent !== window) {
            window.parent.postMessage({ type: 'error-page-action', action: 'go-back' }, '*');
          } else {
            history.back();
          }
        } catch (e) {
          history.back();
        }
      }
      
      function handleHome() {
        try {
          if (window.parent !== window) {
            window.parent.postMessage({ type: 'error-page-action', action: 'home' }, '*');
          } else {
            window.location.href = '/';
          }
        } catch (e) {
          window.location.href = '/';
        }
      }
    </script>
  </body>
</html>`;

    return new NextResponse(page, {
        status: 200,
        headers: {
            "Content-Type": "text/html; charset=utf-8",
            "Cache-Control": "no-store",
        },
    });
};

export async function GET(request: NextRequest) {
    const mode = request.nextUrl.searchParams.get("mode")?.trim();
    if (mode === "error") {
        const title = request.nextUrl.searchParams.get("title")?.trim() || "Unable to load page";
        const description = request.nextUrl.searchParams.get("description")?.trim() || "Sorry for the inconvenience.";
        return makeErrorPage(title, description);
    }

    const rawUrl = request.nextUrl.searchParams.get("url")?.trim();

    if (!rawUrl) {
        return makeErrorPage("Missing URL", "No target URL was provided to the proxy.");
    }

    let target: URL;
    try {
        target = new URL(rawUrl);
    } catch {
        return makeErrorPage("Invalid URL", "The provided URL is not valid.");
    }

    if (!["http:", "https:"].includes(target.protocol)) {
        return makeErrorPage("Unsupported protocol", "Only HTTP and HTTPS URLs are supported.");
    }

    if (isPrivateOrLocalHost(target.hostname)) {
        return makeErrorPage("Blocked host", "Private or local network hosts are not allowed in browser proxy mode.");
    }

    if (!isAllowedShowcaseHost(target.hostname)) {
        return makeErrorPage(
            "Host not allowed",
            "This URL is outside showcase mode. Add its host to BROWSER_PROXY_ALLOWED_HOSTS to allow in-panel rendering."
        );
    }

    try {
        const upstream = await fetch(target.toString(), {
            redirect: "follow",
            headers: {
                "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36",
                Accept: "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
                "Accept-Language": "en-US,en;q=0.9",
                Referer: target.origin,
            },
        });

        const finalUrl = upstream.url || target.toString();
        const contentType = upstream.headers.get("content-type") || "application/octet-stream";
        const lowerType = contentType.toLowerCase();

        const passHeaders = new Headers();
        upstream.headers.forEach((value, key) => {
            const lowerKey = key.toLowerCase();
            if (HOP_BY_HOP_HEADERS.has(lowerKey)) return;
            if (lowerKey === "content-security-policy") return;
            if (lowerKey === "x-frame-options") return;
            if (lowerKey === "frame-options") return;
            if (lowerKey === "content-length") return;
            if (lowerKey === "content-encoding") return;
            passHeaders.set(key, value);
        });
        passHeaders.set("Cache-Control", "no-store");
        passHeaders.set("X-Browser-Proxy", "1");
        passHeaders.set("X-Browser-Proxy-Target", finalUrl);

        if (lowerType.includes("text/html") || lowerType.includes("application/xhtml+xml")) {
            const bodyText = await upstream.text();

            const cleaned = bodyText
                .replace(/<meta[^>]+http-equiv=["']Content-Security-Policy["'][^>]*>/gi, "")
                .replace(/<meta[^>]+http-equiv=["']X-Frame-Options["'][^>]*>/gi, "");

            const withBase = cleaned.includes("</head>")
                ? cleaned.replace("</head>", `<base href="${escapeHtml(finalUrl)}"></head>`)
                : `<base href="${escapeHtml(finalUrl)}">` + cleaned;

            const rewritten = rewriteHtmlLinksToProxy(withBase, finalUrl);
            const bridged = injectBrowserBridge(rewritten);
            passHeaders.set("Content-Type", "text/html; charset=utf-8");
            return new NextResponse(bridged, { status: upstream.status, headers: passHeaders });
        }

        if (lowerType.includes("text/css")) {
            const cssText = await upstream.text();
            const rewrittenCss = rewriteCssLinksToProxy(cssText, finalUrl);
            passHeaders.set("Content-Type", "text/css; charset=utf-8");
            return new NextResponse(rewrittenCss, { status: upstream.status, headers: passHeaders });
        }

        const rawBytes = await upstream.arrayBuffer();
        return new NextResponse(rawBytes, {
            status: upstream.status,
            headers: passHeaders,
        });
    } catch {
        return makeErrorPage(
            "Compatibility mode failed",
            "This site could not be loaded in embedded proxy mode. Try another URL or open it in a new tab."
        );
    }
}
