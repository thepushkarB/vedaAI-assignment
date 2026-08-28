'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import { HugeiconsIcon } from '@hugeicons/react';
import {
  Add01Icon,
  Remove01Icon,
  ArrowLeft01Icon,
  ArrowRight01Icon,
} from '@hugeicons/core-free-icons';

/**
 * PdfViewer — renders PDF pages using pdfjs-dist with dark toolbar and Figma green pin highlights.
 */
export default function PdfViewer({
  fileUrl,
  highlights = [],
  currentPage = 1,
  onPageChange,
  className = '',
}) {
  const containerRef = useRef(null);
  const [pages, setPages] = useState([]);
  const [totalPages, setTotalPages] = useState(0);
  const [zoom, setZoom] = useState(1.1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const pdfDocRef = useRef(null);

  // Load PDF when fileUrl changes
  useEffect(() => {
    if (!fileUrl) return;

    let cancelled = false;

    async function loadPdf() {
      setLoading(true);
      setError(null);
      setPages([]);

      try {
        const pdfjsLib = await import('pdfjs-dist');
        pdfjsLib.GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.mjs`;

        const loadingTask = pdfjsLib.getDocument(fileUrl);
        const pdfDoc = await loadingTask.promise;

        if (cancelled) return;

        pdfDocRef.current = pdfDoc;
        setTotalPages(pdfDoc.numPages);

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

  const handleZoom = useCallback(
    (direction) => {
      setZoom((prev) => {
        const next = direction === 'in' ? prev + 0.15 : prev - 0.15;
        return Math.max(0.5, Math.min(2.5, next));
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

  const handlePrevPage = () => {
    const next = Math.max(1, currentPage - 1);
    onPageChange?.(next);
  };

  const handleNextPage = () => {
    const next = Math.min(totalPages, currentPage + 1);
    onPageChange?.(next);
  };

  function getPageHighlights(pageNum) {
    return highlights.filter((h) => h.page === pageNum);
  }

  if (!fileUrl) {
    return (
      <div className={`viewer-panel ${className}`}>
        <div className="pdf-no-file">
          <span>No document loaded</span>
        </div>
      </div>
    );
  }

  return (
    <div className={`viewer-panel ${className}`}>
      {/* Dark Toolbar */}
      <div className="viewer-toolbar">
        <span className="viewer-toolbar-title desktop-only">Answer Sheet</span>
        <div className="viewer-toolbar-spacer" />

        {/* Zoom controls pill */}
        <div className="viewer-pill-control">
          <button
            type="button"
            onClick={() => handleZoom('out')}
            title="Zoom out"
            aria-label="Zoom out"
          >
            <HugeiconsIcon icon={Remove01Icon} size={13} />
          </button>
          <span style={{ minWidth: '42px', textAlign: 'center', fontSize: 11, fontWeight: 600 }}>
            {Math.round(zoom * 100)}%
          </span>
          <button
            type="button"
            onClick={() => handleZoom('in')}
            title="Zoom in"
            aria-label="Zoom in"
          >
            <HugeiconsIcon icon={Add01Icon} size={13} />
          </button>
        </div>

        {/* Page navigation pill */}
        {totalPages > 0 && (
          <div className="viewer-pill-control">
            <button
              type="button"
              onClick={handlePrevPage}
              disabled={currentPage <= 1}
              aria-label="Previous page"
            >
              <HugeiconsIcon icon={ArrowLeft01Icon} size={13} />
            </button>
            <span style={{ fontSize: 11, fontWeight: 500, padding: '0 4px' }}>
              Page {currentPage} of {totalPages}
            </span>
            <button
              type="button"
              onClick={handleNextPage}
              disabled={currentPage >= totalPages}
              aria-label="Next page"
            >
              <HugeiconsIcon icon={ArrowRight01Icon} size={13} />
            </button>
          </div>
        )}
      </div>

      {/* Page scroll area */}
      <div className="viewer-scroll" ref={containerRef}>
        {loading && pages.length === 0 && (
          <div style={{ color: '#A1A1AA', fontSize: 13, marginTop: 40 }}>
            Loading Answer Sheet...
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

              {/* Highlight overlays with green tag pin */}
              {pageHighlights.map((hl, idx) => {
                const { x, y, w, h } = hl.bbox;
                const label = hl.questionLabel
                  ? String(hl.questionLabel).startsWith('Q')
                    ? hl.questionLabel
                    : `Q${hl.questionLabel}`
                  : 'Q';

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
                  >
                    <div className="pdf-highlight-pin">
                      {label}
                    </div>
                  </div>
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
