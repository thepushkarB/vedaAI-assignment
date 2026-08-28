'use client';

import { useEffect, useRef, useState, useCallback } from 'react';

/**
 * PdfViewer — renders PDF pages using pdfjs-dist and overlays answer highlights.
 *
 * Props:
 *   fileUrl      - object URL (string) for the PDF file
 *   highlights   - array of { page, bbox: {x,y,w,h} } in normalized 0-1 coords
 *   currentPage  - page to scroll to when selected question changes
 *   onPageChange - callback(pageNum)
 */
export default function PdfViewer({
  fileUrl,
  highlights = [],
  currentPage = 1,
  onPageChange,
}) {
  const containerRef = useRef(null);
  const [pages, setPages] = useState([]); // array of { pageNum, canvas, width, height }
  const [totalPages, setTotalPages] = useState(0);
  const [zoom, setZoom] = useState(1.2);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const pdfDocRef = useRef(null);
  const renderingRef = useRef(false);

  // Load PDF when fileUrl changes
  useEffect(() => {
    if (!fileUrl) return;

    let cancelled = false;

    async function loadPdf() {
      setLoading(true);
      setError(null);
      setPages([]);

      try {
        // Dynamic import of pdfjs-dist (client-side only)
        const pdfjsLib = await import('pdfjs-dist');

        // Set worker source
        pdfjsLib.GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.mjs`;

        const loadingTask = pdfjsLib.getDocument(fileUrl);
        const pdfDoc = await loadingTask.promise;

        if (cancelled) return;

        pdfDocRef.current = pdfDoc;
        setTotalPages(pdfDoc.numPages);

        // Render all pages
        const renderedPages = [];
        for (let pageNum = 1; pageNum <= pdfDoc.numPages; pageNum++) {
          if (cancelled) break;

          const page = await pdfDoc.getPage(pageNum);
          const viewport = page.getViewport({ scale: zoom });

          const canvas = document.createElement('canvas');
          canvas.width = viewport.width;
          canvas.height = viewport.height;

          const ctx = canvas.getContext('2d');
          await page.render({ canvasContext: ctx, viewport }).promise;

          if (cancelled) break;

          renderedPages.push({
            pageNum,
            canvas,
            width: viewport.width,
            height: viewport.height,
          });

          // Update state incrementally so pages appear as they render
          setPages([...renderedPages]);
        }
      } catch (err) {
        if (!cancelled) {
          console.error('[PdfViewer] Error loading PDF:', err);
          setError('Failed to render PDF. Please try a different file.');
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    loadPdf();

    return () => {
      cancelled = true;
    };
  }, [fileUrl, zoom]);

  // Re-render when zoom changes
  const handleZoom = useCallback(
    (direction) => {
      setZoom((prev) => {
        const next = direction === 'in' ? prev + 0.2 : prev - 0.2;
        return Math.max(0.5, Math.min(3.0, next));
      });
    },
    []
  );

  // Scroll to currentPage when it changes
  useEffect(() => {
    if (!containerRef.current || currentPage < 1) return;
    const pageEl = containerRef.current.querySelector(
      `[data-page="${currentPage}"]`
    );
    if (pageEl) {
      pageEl.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }, [currentPage, pages]);

  // Get highlights for a specific page
  function getPageHighlights(pageNum) {
    return highlights.filter((h) => h.page === pageNum);
  }

  if (!fileUrl) {
    return (
      <div className="pdf-no-file">
        <span>No document loaded</span>
      </div>
    );
  }

  return (
    <div className="viewer-panel">
      {/* Toolbar */}
      <div className="viewer-toolbar">
        <span className="viewer-toolbar-title">Answer Sheet</span>
        <div className="viewer-toolbar-spacer" />

        {/* Zoom controls */}
        <div className="viewer-zoom">
          <button onClick={() => handleZoom('out')} title="Zoom out">−</button>
          <span>{Math.round(zoom * 100)}%</span>
          <button onClick={() => handleZoom('in')} title="Zoom in">+</button>
        </div>

        {/* Page info */}
        {totalPages > 0 && (
          <div className="viewer-page-nav">
            <span>
              Page {currentPage} of {totalPages}
            </span>
          </div>
        )}
      </div>

      {/* Page scroll area */}
      <div className="viewer-scroll" ref={containerRef}>
        {loading && pages.length === 0 && (
          <div style={{ color: 'var(--color-text-muted)', fontSize: 14 }}>
            Loading PDF...
          </div>
        )}

        {error && (
          <div className="error-message">{error}</div>
        )}

        {pages.map(({ pageNum, canvas, width, height }) => {
          const pageHighlights = getPageHighlights(pageNum);

          return (
            <div
              key={pageNum}
              data-page={pageNum}
              className="pdf-page-wrapper"
              style={{ width, height }}
            >
              {/* Canvas */}
              <CanvasDisplay canvas={canvas} width={width} height={height} />

              {/* Highlight overlays */}
              {pageHighlights.map((hl, idx) => {
                const { x, y, w, h } = hl.bbox;
                return (
                  <div
                    key={idx}
                    className="pdf-highlight"
                    style={{
                      left: `${x * 100}%`,
                      top: `${y * 100}%`,
                      width: `${w * 100}%`,
                      height: `${h * 100}%`,
                    }}
                  />
                );
              })}
            </div>
          );
        })}
      </div>
    </div>
  );
}

/**
 * CanvasDisplay — renders an existing canvas element into the DOM.
 * We need to use a ref to append the canvas because React doesn't
 * manage actual <canvas> elements with pixel data.
 */
function CanvasDisplay({ canvas, width, height }) {
  const ref = useRef(null);

  useEffect(() => {
    if (ref.current && canvas) {
      ref.current.innerHTML = '';
      canvas.className = 'pdf-page-canvas';
      ref.current.appendChild(canvas);
    }
  }, [canvas]);

  return <div ref={ref} style={{ width, height }} />;
}
