import React, { useState, useRef, useEffect } from 'react';

interface PUPLogoProps {
  className?: string;
  size?: number;
}

export default function PUPLogo({ className = '', size = 40 }: PUPLogoProps) {
  const [hasError, setHasError] = useState(false);
  const imgRef = useRef<HTMLImageElement>(null);

  useEffect(() => {
    if (imgRef.current) {
      imgRef.current.style.width = `${size}px`;
      imgRef.current.style.height = `${size}px`;
    }
  }, [size]);

  if (hasError) {
    // Fallback: A beautifully rendered, stylized vector-style SVG of the PUP official seal
    return (
      <svg
        width={size}
        height={size}
        viewBox="0 0 100 100"
        className={`shrink-0 ${className}`}
        aria-label="PUP Official Seal"
      >
        {/* Outer Circular Maroon Border */}
        <circle cx="50" cy="50" r="48" fill="#800000" stroke="#FCD34D" strokeWidth="2.5" />
        
        {/* Gold Star */}
        <polygon
          points="50,15 61,38 85,38 66,53 72,77 50,62 28,77 34,53 15,38 39,38"
          fill="#FCD34D"
        />

        {/* Concentric Circles over Star */}
        <circle cx="50" cy="50" r="16" fill="none" stroke="white" strokeWidth="1" opacity="0.8" />
        <circle cx="50" cy="50" r="12" fill="none" stroke="white" strokeWidth="1" opacity="0.8" />
        <circle cx="50" cy="50" r="8" fill="none" stroke="white" strokeWidth="1" opacity="0.8" />
        <circle cx="50" cy="50" r="4" fill="none" stroke="white" strokeWidth="1" opacity="0.8" />

        {/* Text curve simulation (Upper and Lower text placeholders) */}
        <path id="textPathTop" d="M 15,50 A 35,35 0 0,1 85,50" fill="none" />
        <path id="textPathBottom" d="M 85,50 A 35,35 0 0,1 15,50" fill="none" />

        {/* Curved Text: "PUP" */}
        <text className="text-[7.5px] font-sans font-black fill-white tracking-widest uppercase">
          <textPath href="#textPathTop" startOffset="50%" textAnchor="middle">
            P.U.P.
          </textPath>
        </text>

        {/* Curved Text: "1904" */}
        <text className="text-[6.5px] font-mono font-bold fill-[#FCD34D] tracking-widest uppercase">
          <textPath href="#textPathBottom" startOffset="50%" textAnchor="middle">
            1904
          </textPath>
        </text>

        {/* Bottom laurel wreath vector representation */}
        <path
          d="M 25,75 C 32,84 43,87 50,87 C 57,87 68,84 75,75"
          fill="none"
          stroke="#FCD34D"
          strokeWidth="1.5"
          strokeDasharray="2,2"
        />
      </svg>
    );
  }
return (
    <img
      ref={imgRef}
      src="/assets/pup-official-seal.png"
      alt="PUP Official Seal"
      className={`rounded-full bg-white border border-[#FCD34D] shadow-inner shrink-0 object-contain ${className}`}
      onError={() => {
        setHasError(true);
      }}
    />
  );
}