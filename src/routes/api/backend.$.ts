import { createFileRoute } from "@tanstack/react-router";

/**
 * Server-side proxy to the research backend (FastAPI).
 *
 * The API key never reaches the browser: it is read from the server
 * environment here and attached as `X-API-Key` on the outgoing request.
 * The client calls `/api/backend/<path>` same-origin.
 */
export const Route = createFileRoute("/api/backend/$")({
  server: {
    handlers: {
      GET: async ({ request, params }) => {
        const base = process.env["RESEARCH_API_BASE_URL"];
        const key = process.env["RESEARCH_API_KEY"];
        if (!base || !key) {
          return Response.json(
            { error: "backend_not_configured", detail: "RESEARCH_API_BASE_URL / RESEARCH_API_KEY are not set." },
            { status: 503 },
          );
        }

        const splat = (params as { _splat?: string })._splat ?? "";
        // Only allow simple forward paths — no traversal, no absolute URLs.
        if (splat.includes("..") || splat.includes("//")) {
          return Response.json({ error: "invalid_path" }, { status: 400 });
        }

        const incoming = new URL(request.url);
        const target = `${base.replace(/\/+$/, "")}/${splat}${incoming.search}`;

        try {
          const res = await fetch(target, {
            method: "GET",
            headers: { "X-API-Key": key, Accept: "application/json" },
            signal: AbortSignal.timeout(30_000),
          });
          const body = await res.text();
          return new Response(body, {
            status: res.status,
            headers: {
              "Content-Type": res.headers.get("content-type") ?? "application/json",
              "Cache-Control": "no-store",
            },
          });
        } catch (err) {
          console.error("[backend proxy] request failed", target, err);
          return Response.json(
            { error: "upstream_unreachable", detail: err instanceof Error ? err.message : String(err) },
            { status: 502 },
          );
        }
      },
    },
  },
});
