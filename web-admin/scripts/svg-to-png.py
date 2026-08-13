#!/usr/bin/env python3
"""
Convert SVG to PNG using cairosvg
Install: pip install cairosvg
"""

import sys
import os
from pathlib import Path

try:
    import cairosvg
except ImportError:
    print("❌ cairosvg not installed!")
    print("📦 Install with: pip install cairosvg")
    sys.exit(1)

def svg_to_png(svg_path, png_path, scale=2):
    """Convert SVG to PNG with scaling"""
    try:
        print(f"📄 Reading SVG: {svg_path}")
        
        if not os.path.exists(svg_path):
            print(f"❌ SVG file not found: {svg_path}")
            sys.exit(1)
        
        print(f"🎨 Converting to PNG (scale: {scale}x)...")
        cairosvg.svg2png(
            url=svg_path,
            write_to=png_path,
            scale=scale
        )
        
        file_size = os.path.getsize(png_path) / 1024
        print(f"✅ PNG generated successfully!")
        print(f"📍 File: {png_path}")
        print(f"📊 Size: {file_size:.1f} KB")
        
    except Exception as e:
        print(f"❌ Error: {e}")
        sys.exit(1)

if __name__ == "__main__":
    script_dir = Path(__file__).parent
    project_root = script_dir.parent
    
    svg_file = project_root / "public" / "flow-card-incident.svg"
    png_file = project_root / "public" / "flow-card-incident.png"
    
    svg_to_png(str(svg_file), str(png_file), scale=2)
