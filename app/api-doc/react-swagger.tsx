"use client";

import { useEffect, useRef } from "react";
import "swagger-ui-dist/swagger-ui.css";

type Props = {
  spec: Record<string, unknown>;
};

export default function ReactSwagger({ spec }: Props) {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    async function init() {
      const { SwaggerUIBundle } = await import("swagger-ui-dist");
      if (!containerRef.current) return;

      containerRef.current.innerHTML = "";

      SwaggerUIBundle({
        spec,
        domNode: containerRef.current,
        presets: [SwaggerUIBundle.presets.apis, SwaggerUIBundle.SwaggerUIStandalonePreset],
        layout: "BaseLayout",
        docExpansion: "list",
        defaultModelsExpandDepth: 1,
        tryItOutEnabled: false,
      });
    }

    init();
  }, [spec]);

  return <div ref={containerRef} />;
}
