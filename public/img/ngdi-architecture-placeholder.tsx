"use client"

import React from "react"
import {
  LandPlot,
  Share2,
  Database,
  Layers,
  Users,
  ShieldCheck,
  Settings,
  Search
} from "lucide-react"

interface NgdiArchitecturePlaceholderProps {
  className?: string
}

export default function NgdiArchitecturePlaceholder({
  className
}: NgdiArchitecturePlaceholderProps) {
  return (
    <svg
      viewBox="0 0 800 500"
      className={`w-full h-full bg-slate-700 rounded-lg shadow-inner ${className || ""}`}
      aria-labelledby="title desc"
      role="img"
    >
      <style>
        {`
          @keyframes fadeIn {
            from { opacity: 0; }
            to { opacity: 1; }
          }
          .block-fade-in {
            animation: fadeIn 0.8s ease-out forwards;
          }

          @keyframes pulseArrow {
            0% { stroke-opacity: 0.5; }
            50% { stroke-opacity: 1; }
            100% { stroke-opacity: 0.5; }
          }
          .arrow-pulse {
            animation: pulseArrow 2s infinite ease-in-out;
          }
        `}
      </style>
      <title id="title">NGDI Technical Framework Placeholder</title>
      <desc id="desc">
        A conceptual placeholder diagram illustrating the Nigerian NGDI
        Technical Framework, showcasing components like data sources, sharing
        platform, applications, and governance.
      </desc>

      {/* Background Grid */}
      <defs>
        <pattern id="grid" width="20" height="20" patternUnits="userSpaceOnUse">
          <path
            d="M 20 0 L 0 0 0 20"
            fill="none"
            stroke="rgba(100,116,139,0.2)"
            strokeWidth="0.5"
          />
        </pattern>
      </defs>
      <rect width="100%" height="100%" fill="url(#grid)" />

      {/* Main Title */}
      <text
        x="50%"
        y="40"
        textAnchor="middle"
        fontSize="24"
        fill="rgba(226, 232, 240, 0.8)"
        fontFamily="Arial, sans-serif"
        fontWeight="bold"
      >
        Nigerian NGDI Technical Framework (Conceptual)
      </text>
      <text
        x="50%"
        y="65"
        textAnchor="middle"
        fontSize="14"
        fill="rgba(148, 163, 184, 0.7)"
        fontFamily="Arial, sans-serif"
      >
        Architecture for Geospatial Data Sharing & Management
      </text>

      {/* Core Platform Block */}
      <rect
        x="250"
        y="180"
        width="300"
        height="140"
        rx="10"
        ry="10"
        fill="rgba(51, 65, 85, 0.7)"
        stroke="rgba(71, 85, 105, 1)"
        strokeWidth="1.5"
        className="block-fade-in"
        style={{ animationDelay: "0.2s" }}
      />
      <text
        x="400"
        y="205"
        textAnchor="middle"
        fontSize="16"
        fill="rgba(165, 243, 252, 1)"
        fontWeight="bold"
      >
        Geospatial Platform
      </text>
      <foreignObject x="260" y="220" width="80" height="80">
        <div className="flex flex-col items-center justify-center h-full text-center">
          <Share2 className="text-sky-300 w-10 h-10" />
          <p className="text-xs text-sky-200 mt-1">Data Sharing & Access</p>
        </div>
      </foreignObject>
      <foreignObject x="360" y="220" width="80" height="80">
        <div className="flex flex-col items-center justify-center h-full text-center">
          <Database className="text-sky-300 w-10 h-10" />
          <p className="text-xs text-sky-200 mt-1">Central Repository</p>
        </div>
      </foreignObject>
      <foreignObject x="460" y="220" width="80" height="80">
        <div className="flex flex-col items-center justify-center h-full text-center">
          <Search className="text-sky-300 w-10 h-10" />
          <p className="text-xs text-sky-200 mt-1">Discovery /Catalogue</p>
        </div>
      </foreignObject>

      {/* Data Sources Layer */}
      <rect
        x="50"
        y="100"
        width="150"
        height="300"
        rx="10"
        ry="10"
        fill="rgba(51, 65, 85, 0.5)"
        stroke="rgba(71, 85, 105, 1)"
        strokeWidth="1"
        className="block-fade-in"
      />
      <text
        x="125"
        y="125"
        textAnchor="middle"
        fontSize="14"
        fill="rgba(165, 243, 252, 0.9)"
        fontWeight="medium"
      >
        Data Sources / Providers
      </text>
      <foreignObject x="60" y="150" width="130" height="50">
        <div className="flex items-center text-xs text-slate-300 p-1 bg-slate-600/50 rounded">
          <Layers className="w-5 h-5 mr-2 text-emerald-400" /> Federal Agencies
        </div>
      </foreignObject>
      <foreignObject x="60" y="210" width="130" height="50">
        <div className="flex items-center text-xs text-slate-300 p-1 bg-slate-600/50 rounded">
          <LandPlot className="w-5 h-5 mr-2 text-emerald-400" /> State/Local
          Gov.
        </div>
      </foreignObject>
      <foreignObject x="60" y="270" width="130" height="50">
        <div className="flex items-center text-xs text-slate-300 p-1 bg-slate-600/50 rounded">
          <Users className="w-5 h-5 mr-2 text-emerald-400" /> Private Sector
        </div>
      </foreignObject>
      <foreignObject x="60" y="330" width="130" height="50">
        <div className="flex items-center text-xs text-slate-300 p-1 bg-slate-600/50 rounded">
          <Users className="w-5 h-5 mr-2 text-emerald-400" /> Academia
        </div>
      </foreignObject>

      {/* Applications Layer */}
      <rect
        x="600"
        y="100"
        width="150"
        height="300"
        rx="10"
        ry="10"
        fill="rgba(51, 65, 85, 0.5)"
        stroke="rgba(71, 85, 105, 1)"
        strokeWidth="1"
        className="block-fade-in"
        style={{ animationDelay: "0.4s" }}
      />
      <text
        x="675"
        y="125"
        textAnchor="middle"
        fontSize="14"
        fill="rgba(165, 243, 252, 0.9)"
        fontWeight="medium"
      >
        Applications / Users
      </text>
      <foreignObject x="610" y="150" width="130" height="50">
        <div className="flex items-center text-xs text-slate-300 p-1 bg-slate-600/50 rounded">
          <Users className="w-5 h-5 mr-2 text-amber-400" /> Public Users
        </div>
      </foreignObject>
      <foreignObject x="610" y="210" width="130" height="50">
        <div className="flex items-center text-xs text-slate-300 p-1 bg-slate-600/50 rounded">
          <Settings className="w-5 h-5 mr-2 text-amber-400" /> Decision Makers
        </div>
      </foreignObject>
      <foreignObject x="610" y="270" width="130" height="50">
        <div className="flex items-center text-xs text-slate-300 p-1 bg-slate-600/50 rounded">
          <Layers className="w-5 h-5 mr-2 text-amber-400" /> Value-Added
          Services
        </div>
      </foreignObject>

      {/* Governance & Standards Layer */}
      <rect
        x="250"
        y="350"
        width="300"
        height="80"
        rx="10"
        ry="10"
        fill="rgba(51, 65, 85, 0.5)"
        stroke="rgba(71, 85, 105, 1)"
        strokeWidth="1"
        className="block-fade-in"
        style={{ animationDelay: "0.6s" }}
      />
      <text
        x="400"
        y="375"
        textAnchor="middle"
        fontSize="14"
        fill="rgba(165, 243, 252, 0.9)"
        fontWeight="medium"
      >
        Governance & Standards
      </text>
      <foreignObject x="260" y="390" width="130" height="30">
        <div className="flex items-center text-xs text-slate-300 p-1">
          <ShieldCheck className="w-5 h-5 mr-2 text-rose-400" /> Policy & Legal
        </div>
      </foreignObject>
      <foreignObject x="410" y="390" width="130" height="30">
        <div className="flex items-center text-xs text-slate-300 p-1">
          <Settings className="w-5 h-5 mr-2 text-rose-400" /> Technical
          Standards
        </div>
      </foreignObject>

      {/* Arrows / Connections */}
      {/* Data Sources to Platform */}
      <line
        x1="200"
        y1="250"
        x2="250"
        y2="250"
        stroke="rgba(100,116,139,0.8)"
        strokeWidth="1.5"
        markerEnd="url(#arrowhead)"
        className="arrow-pulse"
        style={{ animationDelay: "0.8s" }}
      />
      {/* Platform to Applications */}
      <line
        x1="550"
        y1="250"
        x2="600"
        y2="250"
        stroke="rgba(100,116,139,0.8)"
        strokeWidth="1.5"
        markerEnd="url(#arrowhead)"
        className="arrow-pulse"
        style={{ animationDelay: "1s" }}
      />
      {/* Governance to Platform */}
      <line
        x1="400"
        y1="350"
        x2="400"
        y2="320"
        stroke="rgba(100,116,139,0.8)"
        strokeWidth="1.5"
        markerEnd="url(#arrowhead)"
        className="arrow-pulse"
        style={{ animationDelay: "1.2s" }}
      />

      <defs>
        <marker
          id="arrowhead"
          markerWidth="10"
          markerHeight="7"
          refX="0"
          refY="3.5"
          orient="auto"
        >
          <polygon points="0 0, 10 3.5, 0 7" fill="rgba(100,116,139,0.8)" />
        </marker>
      </defs>
    </svg>
  )
}
