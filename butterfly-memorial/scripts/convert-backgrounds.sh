#!/bin/bash
# Convert background GIFs to optimized MP4 videos

cd "$(dirname "$0")/src/assets/backgrounds"

echo "Converting background GIFs to MP4..."

# Convert mountain background
if [ -f "background_mountain__HD.gif" ]; then
  echo "Converting mountain background..."
  ffmpeg -i background_mountain__HD.gif \
    -movflags faststart \
    -pix_fmt yuv420p \
    -vf "scale=trunc(iw/2)*2:trunc(ih/2)*2" \
    -c:v libx264 \
    -crf 23 \
    -preset medium \
    background_mountain__HD.mp4
fi

# Convert tropical background
if [ -f "background_tropical__HD.gif" ]; then
  echo "Converting tropical background..."
  ffmpeg -i background_tropical__HD.gif \
    -movflags faststart \
    -pix_fmt yuv420p \
    -vf "scale=trunc(iw/2)*2:trunc(ih/2)*2" \
    -c:v libx264 \
    -crf 23 \
    -preset medium \
    background_tropical__HD.mp4
fi

# Convert lake background
if [ -f "background_lake__HD.gif" ]; then
  echo "Converting lake background..."
  ffmpeg -i background_lake__HD.gif \
    -movflags faststart \
    -pix_fmt yuv420p \
    -vf "scale=trunc(iw/2)*2:trunc(ih/2)*2" \
    -c:v libx264 \
    -crf 23 \
    -preset medium \
    background_lake__HD.mp4
fi

echo "Conversion complete!"
echo ""
echo "File size comparison:"
du -h background_*__HD.gif background_*__HD.mp4 2>/dev/null | sort
