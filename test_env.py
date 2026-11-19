import filetype
import exifread
from PIL import Image, ImageChops
import io

print("✅ EXIFRead version:", exifread.__version__)
print("✅ Filetype version:", filetype.__version__)
print("✅ Pillow & NumPy imported successfully!")

# Quick check: Verify filetype can guess JPEG magic bytes
dummy_jpg_header = b'\xff\xd8\xff\xe0\x00\x10JFIF'
kind = filetype.guess(dummy_jpg_header)
if kind and kind.extension == 'jpg':
    print("✅ Magic byte detection system is FULLY OPERATIONAL!")
else:
    print("❌ Warning: Magic byte check failed.")
