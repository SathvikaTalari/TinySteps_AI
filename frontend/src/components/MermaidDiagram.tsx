import React, { useEffect, useRef, useState } from 'react';
import mermaid from 'mermaid';
import {
  GitBranch,
  AlertTriangle,
  Code2,
  Eye,
  Maximize2,
  Minimize2,
  ZoomIn,
  ZoomOut,
  RotateCcw,
  Download
} from 'lucide-react';
import { sanitizeMermaid, aggressiveRepairMermaid } from '../utils/mermaidSanitizer';

interface MermaidDiagramProps {
  chart: string;
}

export const MermaidDiagram: React.FC<MermaidDiagramProps> = ({ chart }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [svgContent, setSvgContent] = useState<string>('');
  const [error, setError] = useState<string | null>(null);
  const [showSource, setShowSource] = useState(false);
  const [isFullScreen, setIsFullScreen] = useState(false);
  const [zoom, setZoom] = useState(1.0);
  const [themeMode, setThemeMode] = useState<string>(
    () => document.documentElement.getAttribute('data-theme') || 'light'
  );

  // Detect theme changes to re-render diagram with matching colors
  useEffect(() => {
    const observer = new MutationObserver(() => {
      const activeTheme = document.documentElement.getAttribute('data-theme') || 'light';
      setThemeMode(activeTheme);
    });

    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ['data-theme'],
    });

    return () => observer.disconnect();
  }, []);

  // Handle Escape key to close fullscreen
  useEffect(() => {
    if (!isFullScreen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setIsFullScreen(false);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isFullScreen]);

  // Reset zoom when opening fullscreen
  useEffect(() => {
    if (isFullScreen) {
      setZoom(1.0);
    }
  }, [isFullScreen]);

  useEffect(() => {
    let isMounted = true;
    const isDark = themeMode === 'dark';
    const uniqueId = `mermaid-${Math.random().toString(36).substring(2, 9)}`;

    mermaid.initialize({
      startOnLoad: false,
      suppressErrorRendering: true,
      theme: isDark ? 'dark' : 'base',
      themeVariables: isDark
        ? {
            darkMode: true,
            background: '#1A0D32',
            primaryColor: '#2E1955',
            primaryTextColor: '#FAF8FF',
            primaryBorderColor: '#8B5CF6',
            lineColor: '#C4B5FD',
            secondaryColor: '#221340',
            tertiaryColor: '#180D2E',
            fontFamily: '-apple-system, BlinkMacSystemFont, Segoe UI, Roboto, sans-serif',
          }
        : {
            darkMode: false,
            primaryColor: '#EDE9FE',
            primaryTextColor: '#200E3A',
            primaryBorderColor: '#7C3AED',
            lineColor: '#5B21B6',
            secondaryColor: '#FAF5FF',
            tertiaryColor: '#FFFFFF',
            fontFamily: '-apple-system, BlinkMacSystemFont, Segoe UI, Roboto, sans-serif',
          },
      securityLevel: 'loose',
    });

    function cleanDanglingMermaidElements(id: string) {
      const tempElem = document.getElementById(id);
      if (tempElem) tempElem.remove();
      const danglingError = document.getElementById(`d${id}`);
      if (danglingError) danglingError.remove();
      document.querySelectorAll(`[id^="d${id}"], svg#d${id}, div#d${id}`).forEach((el) => el.remove());
    }

    async function renderDiagram() {
      if (!chart || !chart.trim()) return;

      try {
        setError(null);

        // Pass 1: Standard sanitization
        const sanitized = sanitizeMermaid(chart);
        if (!sanitized) return;

        try {
          const { svg } = await mermaid.render(uniqueId, sanitized);
          if (isMounted) {
            setSvgContent(svg);
          }
          return;
        } catch (firstErr) {
          console.warn('Initial Mermaid render failed, attempting aggressive repair pass...', firstErr);
          cleanDanglingMermaidElements(uniqueId);

          // Pass 2: Aggressive repair
          const retryId = `${uniqueId}-retry`;
          const repaired = aggressiveRepairMermaid(chart);
          const { svg } = await mermaid.render(retryId, repaired);
          if (isMounted) {
            setSvgContent(svg);
          }
        }
      } catch (err: unknown) {
        console.warn('Mermaid rendering failed after repair:', err);
        cleanDanglingMermaidElements(uniqueId);
        cleanDanglingMermaidElements(`${uniqueId}-retry`);

        if (isMounted) {
          const errMsg = err instanceof Error ? err.message : 'Invalid diagram syntax';
          setError(errMsg);
        }
      }
    }

    renderDiagram();

    return () => {
      isMounted = false;
      cleanDanglingMermaidElements(uniqueId);
      cleanDanglingMermaidElements(`${uniqueId}-retry`);
    };
  }, [chart, themeMode]);

  const handleDownloadSvg = () => {
    if (!svgContent) return;
    const blob = new Blob([svgContent], { type: 'image/svg+xml;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `tinysteps-flowchart-${Date.now()}.svg`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  return (
    <>
      <div className="mermaid-wrapper">
        <div className="mermaid-header">
          <div className="mermaid-title">
            <GitBranch size={14} className="mermaid-icon" />
            <span>Visual Diagram</span>
          </div>

          <div className="mermaid-header-actions">
            {/* Extend / Fullscreen Button */}
            <button
              type="button"
              className="mermaid-action-btn"
              onClick={() => setIsFullScreen(true)}
              title="Expand to Full Screen"
              disabled={!svgContent || Boolean(error)}
            >
              <Maximize2 size={12} className="mermaid-expand-icon" />
              <span>Full Screen</span>
            </button>

            {/* Source Code Toggle */}
            <button
              type="button"
              className="mermaid-action-btn"
              onClick={() => setShowSource(!showSource)}
              title={showSource ? 'Show rendered diagram' : 'Show diagram source code'}
            >
              {showSource ? (
                <>
                  <Eye size={12} />
                  <span>View Diagram</span>
                </>
              ) : (
                <>
                  <Code2 size={12} />
                  <span>Source</span>
                </>
              )}
            </button>
          </div>
        </div>

        {showSource ? (
          <pre className="mermaid-source-pre">
            <code>{chart.trim()}</code>
          </pre>
        ) : error ? (
          <div className="mermaid-fallback-container">
            <div className="mermaid-fallback-header">
              <AlertTriangle size={14} className="fallback-warning-icon" />
              <span>Diagram could not be rendered visually. Raw flow below:</span>
            </div>
            <pre className="mermaid-source-pre">
              <code>{chart.trim()}</code>
            </pre>
          </div>
        ) : (
          <div
            ref={containerRef}
            className="mermaid-svg-container"
            dangerouslySetInnerHTML={{ __html: svgContent }}
          />
        )}
      </div>

      {/* FULLSCREEN LIGHTBOX MODAL */}
      {isFullScreen && (
        <div
          className="mermaid-fullscreen-overlay"
          onClick={() => setIsFullScreen(false)}
          role="dialog"
          aria-modal="true"
          aria-label="Full screen visual diagram"
        >
          <div className="mermaid-fullscreen-modal" onClick={(e) => e.stopPropagation()}>
            <div className="mermaid-fullscreen-header">
              <div className="fullscreen-header-left">
                <GitBranch size={16} className="fullscreen-icon" />
                <span className="fullscreen-title">Visual Diagram • Full Screen</span>
              </div>

              <div className="fullscreen-controls">
                {/* Zoom Controls */}
                <div className="fullscreen-zoom-group">
                  <button
                    type="button"
                    className="zoom-btn"
                    onClick={() => setZoom((z) => Math.max(0.4, Number((z - 0.2).toFixed(1))))}
                    title="Zoom Out (-)"
                  >
                    <ZoomOut size={13} />
                  </button>
                  <span className="zoom-badge">{Math.round(zoom * 100)}%</span>
                  <button
                    type="button"
                    className="zoom-btn"
                    onClick={() => setZoom((z) => Math.min(3.0, Number((z + 0.2).toFixed(1))))}
                    title="Zoom In (+)"
                  >
                    <ZoomIn size={13} />
                  </button>
                  <button
                    type="button"
                    className="zoom-btn"
                    onClick={() => setZoom(1.0)}
                    title="Reset Zoom to 100%"
                  >
                    <RotateCcw size={13} />
                  </button>
                </div>

                {/* Download Button */}
                <button
                  type="button"
                  className="fullscreen-btn"
                  onClick={handleDownloadSvg}
                  title="Download SVG file"
                >
                  <Download size={13} />
                  <span>Download SVG</span>
                </button>

                {/* Exit Fullscreen Button */}
                <button
                  type="button"
                  className="fullscreen-close-btn"
                  onClick={() => setIsFullScreen(false)}
                  title="Close Full Screen (Esc)"
                >
                  <Minimize2 size={13} />
                  <span>Exit Full Screen</span>
                </button>
              </div>
            </div>

            <div className="mermaid-fullscreen-body">
              <div
                className="fullscreen-svg-canvas"
                style={{
                  transform: `scale(${zoom})`,
                  transformOrigin: 'center center',
                }}
                dangerouslySetInnerHTML={{ __html: svgContent }}
              />
            </div>
          </div>
        </div>
      )}
    </>
  );
};
