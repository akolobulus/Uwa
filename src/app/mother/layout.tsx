import React from 'react';

export default function MotherLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0, viewport-fit=cover" />
        <link href="https://fonts.googleapis.com/css2?family=Fraunces:opsz,wght@9..144,700&family=Outfit:wght@300;400;500;600;700&family=Plus+Jakarta+Sans:wght@400;500;600;700;800&display=swap" rel="stylesheet" />
        <link href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:wght,FILL@100..700,0..1&display=swap" rel="stylesheet" />
        <script src="https://cdn.tailwindcss.com?plugins=forms,container-queries"></script>
        <script id="tailwind-config">{`
          tailwind.config = {
            darkMode: "class",
            theme: {
              extend: {
                colors: {
                  primary: "#8E0B36",
                  secondary: "#E91E63",
                  background: "#FFF5F7",
                  surface: "#ffffff",
                  "on-surface": "#2D0411",
                  "on-primary": "#FFF5F7",
                  "on-secondary": "#ffffff",
                  "surface-variant": "#F8E1E7",
                  outline: "#A67B88",
                  success: "#2E7D32",
                  warning: "#ED6C02"
                },
                borderRadius: {
                  DEFAULT: "0.5rem",
                  lg: "1rem",
                  xl: "1.5rem",
                  full: "9999px",
                  organic: "40px 12px 40px 12px"
                },
                fontFamily: {
                  brand: ["Fraunces", "serif"],
                  sans: ["Outfit", "sans-serif"],
                  body: ["Plus Jakarta Sans", "sans-serif"]
                }
              }
            }
          }
        `}</script>
        <style>{`
          body {
            font-family: 'Outfit', sans-serif;
            background-color: #FFF5F7;
            color: #8E0B36;
            background-image: radial-gradient(circle at 20% 20%, rgba(233, 30, 99, 0.05) 0%, transparent 40%),
                              radial-gradient(circle at 80% 80%, rgba(142, 11, 54, 0.05) 0%, transparent 40%);
          }
          .font-brand { font-family: 'Fraunces', serif; }
          .material-symbols-outlined {
            font-variation-settings: 'FILL' 0, 'wght' 400, 'GRAD' 0, 'opsz' 24;
            display: inline-block;
            line-height: 1;
          }
          .organic-card {
            border-radius: 40px 12px 40px 12px;
            box-shadow: 0 10px 40px -10px rgba(142, 11, 54, 0.08);
            transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
          }
          .organic-card:active {
            transform: scale(0.98);
          }
          .organic-thumb {
            border-radius: 2rem 0.5rem 2rem 0.5rem;
          }
          .blob-bg {
            background: linear-gradient(135deg, #8E0B36 0%, #5E0724 100%);
            position: relative;
            overflow: hidden;
          }
          .blob-bg::after {
            content: '';
            position: absolute;
            width: 150px;
            height: 150px;
            background: rgba(233, 30, 99, 0.15);
            border-radius: 45% 55% 70% 30% / 30% 60% 40% 70%;
            top: -50px;
            right: -50px;
            filter: blur(20px);
          }
          .hand-drawn-circle {
            position: relative;
            width: 96px;
            height: 96px;
          }
          .hand-drawn-circle svg {
            transform: rotate(-90deg);
          }
          .hand-drawn-circle .outline-path {
            fill: none;
            stroke: #F8E1E7;
            stroke-width: 4;
            stroke-linecap: round;
          }
          .hand-drawn-circle .progress-path {
            fill: none;
            stroke: #E91E63;
            stroke-width: 6;
            stroke-linecap: round;
            stroke-dasharray: 251.2;
            stroke-dashoffset: 75.36;
            filter: drop-shadow(0 0 4px rgba(233, 30, 99, 0.3));
          }
          .check-item {
            transition: background 0.2s ease;
          }
          .check-item:hover {
            background-color: rgba(142, 11, 54, 0.02);
          }
          .pattern-overlay {
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            pointer-events: none;
            opacity: 0.05;
            background-image: url("data:image/svg+xml,%3Csvg width='100' height='100' viewBox='0 0 100 100' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M11 18c3.866 0 7-3.134 7-7s-3.134-7-7-7-7 3.134-7 7 3.134 7 7 7zm48 25c3.866 0 7-3.134 7-7s-3.134-7-7-7-7 3.134-7 7 3.134 7 7 7zm-43-7c1.657 0 3-1.343 3-3s-1.343-3-3-3-3 1.343-3 3 1.343 3 3 3zm63 31c1.657 0 3-1.343 3-3s-1.343-3-3-3-3 1.343-3 3 1.343 3 3 3zM34 90c1.105 0 2-.895 2-2s-.895-2-2-2-2 .895-2 2 .895 2 2 2zm56-76c1.105 0 2-.895 2-2s-.895-2-2-2-2 .895-2 2 .895 2 2 2zM12 86c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm28-65c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm23-11c2.76 0 5-2.24 5-5s-2.24-5-5-5-5 2.24-5 5 2.24 5 5 5zm-6 60c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm29 22c2.76 0 5-2.24 5-5s-2.24-5-5-5-5 2.24-5 5 2.24 5 5 5zM32 35c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm60-21c1.105 0 2-.895 2-2s-.895-2-2-2-2 .895-2 2 .895 2 2 2zM35 126c1.105 0 2-.895 2-2s-.895-2-2-2-2 .895-2 2 .895 2 2 2zM12 12c1.105 0 2-.895 2-2s-.895-2-2-2-2 .895-2 2 .895 2 2 2z' fill='%238e0b36' fill-opacity='1' fill-rule='evenodd'/%3E%3C/svg%3E");
            z-index: 0;
          }
          ::-webkit-scrollbar {
            width: 0px;
            height: 0px;
            background: transparent;
          }
        `}</style>
      </head>
      <body className="bg-background min-h-screen pb-28">
        <div className="pattern-overlay"></div>
        {children}
      </body>
    </html>
  );
}
