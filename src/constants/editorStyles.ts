// Mobile-optimized typography CSS for TipTap editor/viewer
// Matches native iOS Notes appearance for consistent UX
// This CSS is injected into the WebView to provide native-feeling typography

export const MOBILE_TYPOGRAPHY_CSS = `
  /* CRITICAL: Force iOS system font on ALL elements */
  * {
    font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif !important;
  }

  /* Base body styles - match iOS system font */
  body {
    font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif !important;
    color: #1f2937 !important;
    -webkit-text-size-adjust: none;
    text-size-adjust: none;
    -webkit-font-smoothing: antialiased;
    -moz-osx-font-smoothing: grayscale;
  }

  /* Disable internal scrolling in read-only mode */
  .ProseMirror {
    overflow: visible !important;
    height: auto !important;
    font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif !important;
  }

  /* Ensure font applies to all TipTap elements */
  .ProseMirror *,
  .ProseMirror p,
  .ProseMirror div,
  .ProseMirror span,
  .ProseMirror li,
  .ProseMirror h1,
  .ProseMirror h2,
  .ProseMirror h3,
  .ProseMirror h4,
  .ProseMirror h5,
  .ProseMirror h6 {
    font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif !important;
    color: #1f2937 !important;
  }

  /* Mobile-optimized heading sizes - match native exactly */
  h1, h1 * {
    font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif !important;
    font-size: 24px !important;
    font-weight: 700 !important;
    line-height: 1.4 !important;
    margin-top: 16px !important;
    margin-bottom: 12px !important;
    color: #1f2937 !important;
  }

  h2, h2 * {
    font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif !important;
    font-size: 20px !important;
    font-weight: 700 !important;
    line-height: 1.4 !important;
    margin-top: 14px !important;
    margin-bottom: 10px !important;
    color: #1f2937 !important;
  }

  h3, h3 * {
    font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif !important;
    font-size: 18px !important;
    font-weight: 700 !important;
    line-height: 1.4 !important;
    margin-top: 12px !important;
    margin-bottom: 8px !important;
    color: #1f2937 !important;
  }

  h4 {
    font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif !important;
    font-size: 17px !important;
    font-weight: 600 !important;
    line-height: 1.4 !important;
    margin-top: 10px !important;
    margin-bottom: 6px !important;
    color: #1f2937 !important;
  }

  h5, h6 {
    font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif !important;
    font-size: 16px !important;
    font-weight: 600 !important;
    line-height: 1.4 !important;
    margin-top: 8px !important;
    margin-bottom: 6px !important;
    color: #1f2937 !important;
  }

  /* Body text - optimal for mobile reading */
  p {
    font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif !important;
    font-size: 16px !important;
    line-height: 1.5 !important;
    margin-bottom: 12px !important;
    color: #1f2937 !important;
  }

  /* Lists - tighter spacing for mobile */
  ul, ol {
    margin-top: 8px !important;
    margin-bottom: 12px !important;
    padding-left: 24px !important;
  }

  li {
    font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif !important;
    font-size: 16px !important;
    line-height: 1.5 !important;
    margin-bottom: 4px !important;
    color: #1f2937 !important;
  }

  /* Blockquotes */
  blockquote {
    font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif !important;
    font-size: 16px !important;
    line-height: 1.5 !important;
    margin: 12px 0 !important;
    padding-left: 12px !important;
    color: #6b7280 !important;
    font-style: italic !important;
    border-left: 3px solid #d1d5db !important;
  }

  /* Code blocks */
  pre {
    font-family: "Courier New", Courier, monospace !important;
    font-size: 14px !important;
    line-height: 1.4 !important;
    padding: 12px !important;
    margin: 12px 0 !important;
    background-color: #f3f4f6 !important;
    border-radius: 6px !important;
    color: #1f2937 !important;
  }

  code {
    font-family: "Courier New", Courier, monospace !important;
    font-size: 14px !important;
    color: #1f2937 !important;
  }

  /* Inline code */
  p code, li code {
    background-color: #f3f4f6 !important;
    padding: 2px 4px !important;
    border-radius: 3px !important;
  }

  /* Bold, italic, etc - ensure they inherit font family */
  strong, b {
    font-weight: 700 !important;
  }

  em, i {
    font-style: italic !important;
  }
`;
