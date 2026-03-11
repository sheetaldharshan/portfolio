import os
import re
import base64

svg_path = 'public/all.svg'
output_dir = 'public/members'

if not os.path.exists(output_dir):
    os.makedirs(output_dir)

print(f"Reading {svg_path}...")
with open(svg_path, 'r', encoding='utf-8') as f:
    content = f.read()

# Pattern to find <image id="imageX_..." ... xlink:href="data:image/png;base64,..."
# Captures: 1. Index (number) 2. Base64 data
image_pattern = re.compile(r'<image id="image(\d+)_[^"]*"[^>]*xlink:href="data:image/png;base64,([^"]*)"')

matches = image_pattern.findall(content)

print(f"Found {len(matches)} potential images.")

# To handle cases where IDs might not be sequential or uniquely named in the match
saved_count = 0
for idx_str, b64_data in matches:
    idx = int(idx_str)
    filename = f"member_{idx}.png"
    filepath = os.path.join(output_dir, filename)
    
    try:
        img_data = base64.b64decode(b64_data)
        with open(filepath, 'wb') as f:
            f.write(img_data)
        saved_count += 1
    except Exception as e:
        print(f"Error saving {filename}: {e}")

print(f"Extraction complete. Saved {saved_count} images to {output_dir}.")
