import type { Metadata } from "next";
import type { ReactNode } from "react";
import HelpLink from "./components/HelpLink";
import FeedbackLink from "./components/FeedbackLink";
import "./globals.css";

export const metadata: Metadata = {
  title: "HOVEL EDITOR",
  description:
    "A rough-edged writing diagnostics workshop for The Council, SPHINX, Projects, and Re-Read reports.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body suppressHydrationWarning>
        <nav className="hovel-global-nav" aria-label="Hovel Editor navigation">
          <a href="/" className="hovel-global-nav-mark" aria-label="Hovel Editor home">
            5C
          </a>

          <a href="/dashboard" className="hovel-global-nav-link">
            DASHBOARD
          </a>

          <a href="/sphinx" className="hovel-global-nav-link hovel-global-nav-primary">
            SPHINX
          </a>

          <a href="/projects" className="hovel-global-nav-link">
            PROJECTS
          </a>

          <a href="/reread" className="hovel-global-nav-link">
            RE-READ
          </a>
        </nav>

        {children}

        <a href="/beta-terms" className="hovel-beta-terms-link">
          Beta Terms
        </a>

        <HelpLink />
        <FeedbackLink />

        <style>{`
          body {
            padding-top: 92px;
          }
          .hovel-global-nav {
            position: fixed;
            top: 14px;
            right: 18px;
            z-index: 10000;
            display: flex;
            align-items: center;
            gap: 7px;
            padding: 7px;
            border: 1px solid rgba(255, 255, 255, 0.16);
            border-radius: 999px;
            background: rgba(14, 13, 11, 0.88);
            box-shadow: 0 20px 50px rgba(0, 0, 0, 0.55);
            backdrop-filter: blur(14px);
          }

          .hovel-global-nav-mark {
            display: inline-flex;
            align-items: center;
            justify-content: center;
            width: 36px;
            height: 36px;
            border-radius: 14px;
            background: #c8935a;
            color: #0e0d0b;
            font-family: monospace;
            font-size: 11px;
            font-weight: 900;
            letter-spacing: 0.02em;
            text-decoration: none;
            box-shadow: inset 0 0 0 1px rgba(0, 0, 0, 0.18);
            flex: 0 0 auto;
          }

          .hovel-global-nav-mark:hover {
            filter: brightness(1.08);
          }

          .hovel-global-nav-link {
            display: inline-flex;
            align-items: center;
            justify-content: center;
            min-height: 36px;
            border: 1px solid rgba(200, 147, 90, 0.38);
            background: #17120d;
            color: #f0ece4;
            border-radius: 999px;
            padding: 0 13px;
            font-family: monospace;
            font-size: 11px;
            font-weight: 900;
            letter-spacing: 0.13em;
            text-transform: uppercase;
            text-decoration: none;
            white-space: nowrap;
            transition:
              filter 140ms ease,
              border-color 140ms ease,
              color 140ms ease,
              background 140ms ease;
          }

          .hovel-global-nav-link:hover {
            filter: brightness(1.08);
            border-color: #facc15;
            color: #facc15;
          }

          .hovel-global-nav-primary {
            background: #facc15;
            color: #000000;
            border-color: rgba(255, 255, 255, 0.35);
          }

          .hovel-global-nav-primary:hover {
            color: #000000;
            border-color: #f0ece4;
          }

          .hovel-beta-terms-link {
            position: fixed;
            left: 50%;
            bottom: 28px;
            transform: translateX(-50%);
            z-index: 9998;
            color: rgba(240, 236, 228, 0.52);
            font-family: monospace;
            font-size: 10px;
            font-weight: 800;
            letter-spacing: 0.12em;
            text-transform: uppercase;
            text-decoration: none;
          }

          .hovel-beta-terms-link:hover {
            color: #c8935a;
            text-decoration: underline;
          }

          .hovel-feedback-link {
            position: fixed;
            right: 22px;
            bottom: 22px;
            z-index: 9999;
            border: 1px solid #4b3a1f;
            background: #c8935a;
            color: #0e0d0b;
            border-radius: 999px;
            padding: 12px 16px;
            font-family: monospace;
            font-size: 11px;
            font-weight: 900;
            letter-spacing: 0.14em;
            text-transform: uppercase;
            text-decoration: none;
            box-shadow: 0 18px 55px rgba(0, 0, 0, 0.35);
          }

          .hovel-feedback-link:hover {
            filter: brightness(1.08);
          }

          .hovel-help-link {
            position: fixed;
            left: 22px;
            bottom: 84px;
            z-index: 9999;
            border: 1px solid #c8935a;
            background: #c8935a;
            color: #0e0d0b;
            border-radius: 999px;
            padding: 14px 22px;
            font-family: monospace;
            font-size: 12px;
            font-weight: 900;
            letter-spacing: 0.16em;
            text-transform: uppercase;
            text-decoration: none;
            box-shadow: 0 18px 55px rgba(0, 0, 0, 0.45);
          }

          .hovel-help-link:hover {
            filter: brightness(1.08);
          }

          @media (max-width: 860px) {
            body {
              padding-top: 86px;
            }
            .hovel-global-nav {
              top: 10px;
              right: 10px;
              left: 10px;
              justify-content: center;
              gap: 6px;
              padding: 7px;
              border-radius: 22px;
            }

            .hovel-global-nav-mark {
              width: 34px;
              height: 34px;
              border-radius: 12px;
              font-size: 10px;
            }

            .hovel-global-nav-link {
              min-height: 34px;
              padding: 0 9px;
              font-size: 9px;
              letter-spacing: 0.06em;
            }

            .hovel-feedback-link {
              right: 14px;
              bottom: 14px;
              padding: 10px 13px;
              font-size: 10px;
            }

            .hovel-help-link {
              left: 14px;
              bottom: 74px;
              padding: 10px 15px;
              font-size: 10px;
              letter-spacing: 0.12em;
            }

            .hovel-beta-terms-link {
              bottom: 18px;
              font-size: 9px;
            }
          }

          @media (max-width: 460px) {
            .hovel-global-nav-link {
              padding: 0 7px;
              font-size: 8px;
              letter-spacing: 0.04em;
            }
          }

          /* HOVEL MOBILE POLISH PASS */
          @media (max-width: 520px) {
            body {
              padding-top: 124px;
              padding-bottom: 84px;
            }

            .hovel-global-nav {
              top: 8px;
              left: 8px;
              right: 8px;
              display: grid;
              grid-template-columns: 38px minmax(0, 1fr) minmax(0, 1fr);
              grid-auto-rows: 40px;
              align-items: stretch;
              justify-content: stretch;
              gap: 6px;
              padding: 6px;
              border-radius: 18px;
            }

            .hovel-global-nav-mark {
              width: 100%;
              height: 40px;
              border-radius: 12px;
              font-size: 10px;
              grid-column: 1;
              grid-row: 1 / span 2;
            }

            .hovel-global-nav-link {
              width: 100%;
              min-height: 40px;
              padding: 0 6px;
              font-size: 9px;
              letter-spacing: 0.04em;
              border-radius: 13px;
            }

            .hovel-global-nav-link:nth-of-type(2) {
              grid-column: 2;
              grid-row: 1;
            }

            .hovel-global-nav-link:nth-of-type(3) {
              grid-column: 3;
              grid-row: 1;
            }

            .hovel-global-nav-link:nth-of-type(4) {
              grid-column: 2;
              grid-row: 2;
            }

            .hovel-global-nav-link:nth-of-type(5) {
              grid-column: 3;
              grid-row: 2;
            }

            .hovel-beta-terms-link {
              display: none;
            }

            .hovel-help-link {
              left: 12px;
              bottom: 12px;
              padding: 10px 13px;
              font-size: 9px;
              letter-spacing: 0.08em;
            }

            .hovel-feedback-link {
              right: 12px;
              bottom: 12px;
              padding: 10px 13px;
              font-size: 9px;
              letter-spacing: 0.08em;
            }

            .home-shell .page-wrap,
            .dashboard-shell .page-wrap,
            .submit-shell .app-wrap,
            .projects-shell,
            .reread-shell,
            .report-shell .page-wrap,
            .help-shell,
            .terms-shell .wrap,
            .sphinx-shell {
              padding-left: 12px !important;
              padding-right: 12px !important;
              padding-bottom: 110px !important;
            }

            .home-shell .page-wrap,
            .dashboard-shell .page-wrap,
            .submit-shell .app-wrap,
            .report-shell .page-wrap {
              padding-top: 18px !important;
            }

            .projects-shell,
            .reread-shell,
            .sphinx-shell,
            .help-shell {
              padding-top: 18px !important;
            }

            .topbar,
            .top-nav,
            .reports-head,
            .results-head,
            .panel-head {
              gap: 12px !important;
              margin-bottom: 18px !important;
            }

            .masthead,
            .hero-card,
            .side-card,
            .status-card,
            .tool-card,
            .how-card,
            .privacy-card,
            .cta-card,
            .panel,
            .report-card,
            .reports-panel,
            .hero,
            .card,
            .section-card,
            .manage-card,
            .upload-box,
            .meter-card,
            .item {
              border-radius: 18px !important;
              padding: 18px !important;
            }

            .heading,
            .title {
              font-size: clamp(36px, 13vw, 52px) !important;
              line-height: 0.98 !important;
            }

            .section-title,
            .panel-title,
            .card-title,
            .tool-title,
            .status-big,
            .side-title,
            .cta-title,
            .report-title,
            .item-title,
            .project-title {
              font-size: clamp(25px, 9vw, 34px) !important;
              line-height: 1.05 !important;
            }

            .subtitle,
            .subheading,
            .panel-note,
            .card-text,
            .tool-text,
            .how-text,
            .side-text,
            .status-muted,
            .section-note,
            .tiny-note,
            .step-text,
            .meter-help {
              font-size: 14px !important;
              line-height: 1.58 !important;
            }

            .hero-actions,
            .button-row,
            .top-actions,
            .top-nav-actions,
            .nav-actions,
            .user-row,
            .manage-actions,
            .item-actions,
            .upload-actions {
              width: 100% !important;
              display: flex !important;
              flex-direction: column !important;
              align-items: stretch !important;
              gap: 10px !important;
            }

            .nav-link,
            .nav-link-gold,
            .back-link,
            .primary-btn,
            .secondary-btn,
            .run-btn,
            .reset-btn,
            .dashboard-btn,
            .tool-link,
            .view-link,
            .action-btn,
            .small-btn,
            .file-label,
            .button,
            .button-dark,
            .library-btn,
            .show-more-btn,
            .admin-btn,
            .signout-btn,
            .danger-btn {
              width: 100% !important;
              min-height: 48px !important;
              text-align: center !important;
              justify-content: center !important;
            }

            .library-controls,
            .manage-grid,
            .form-grid,
            .grid,
            .hero-grid,
            .tool-grid,
            .how-grid,
            .section-grid,
            .wide-grid,
            .workflow-grid {
              grid-template-columns: 1fr !important;
            }

            .textarea,
            .concern-input,
            .sphinx-shell textarea {
              min-height: 260px !important;
            }

            .draft-textarea {
              min-height: 320px !important;
            }

            .title-input,
            .select-input,
            .input,
            .textarea,
            .select,
            .library-input,
            .library-select,
            .concern-input {
              font-size: 16px !important;
            }

            .tabs-wrap {
              overflow-x: auto !important;
              padding-bottom: 10px !important;
            }

            .tab-btn {
              min-height: 44px !important;
              font-size: 9px !important;
              padding: 10px 12px !important;
            }
          }

          @media (max-width: 370px) {
            body {
              padding-top: 128px;
            }

            .hovel-global-nav-link {
              font-size: 8px;
              letter-spacing: 0.02em;
              padding: 0 4px;
            }

            .hovel-global-nav-mark {
              font-size: 9px;
            }

            .heading,
            .title {
              font-size: clamp(34px, 13vw, 46px) !important;
            }
          }

        `}</style>
      </body>
    </html>
  );
}



