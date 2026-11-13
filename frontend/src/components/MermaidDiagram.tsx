import React, { useEffect, useRef, useState } from 'react';
import mermaid from 'mermaid';
import { GitBranch, AlertTriangle, Code2, Eye } from 'lucide-react';

interface MermaidDiagramProps {
  chart: string;
}

export const MermaidDiagram: React.FC<MermaidDiagramProps> = ({ chart }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [svgContent, setSvgContent] = useState<string>('');
  const [error, setError] = useState<string | null>(null);
  const [showSource, setShowSource] = useState(false);
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

  useEffect(() => {
    let isMounted = true;
    const isDark = themeMode === 'dark';
    const uniqueId = `mermaid-${Math.random().toString(36).substring(2, 9)}`;

    mermaid.initialize({
      startOnLoad: false,
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

    async function renderDiagram() {
      if (!chart.trim()) return;

      try {
        setError(null);
        const cleanChart = chart
          .replace(/^```mermaid\s*/i, '')
          .replace(/```$/, '')
          .trim();

        const { svg } = await mermaid.render(uniqueId, cleanChart);
        if (isMounted) {
          setSvgContent(svg);
        }
      } catch (err: unknown) {
        console.warn('Mermaid rendering error:', err);
        if (isMounted) {
          const errMsg = err instanceof Error ? err.message : 'Invalid diagram syntax';
          setError(errMsg);
        }
      }
    }

    renderDiagram();

    return () => {
      isMounted = false;
      const tempElem = document.getElementById(uniqueId);
      if (tempElem) tempElem.remove();
    };
  }, [chart, themeMode]);

  return (
    <div className="mermaid-wrapper">
      <div className="mermaid-header">
        <div className="mermaid-title">
          <GitBranch size={14} className="mermaid-icon" />
          <span>Visual Diagram</span>
        </div>
        <button
          type="button"
          className="mermaid-toggle-btn"
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
  );
};
