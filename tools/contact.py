# contact sheet: python3 tools/contact.py out.png img1 img2 ... (3 per row, 640 wide each)
import sys
from PIL import Image, ImageDraw
out, files = sys.argv[1], sys.argv[2:]
W, H = 640, 360; cols = 3; rows = (len(files) + cols - 1) // cols
sheet = Image.new('RGB', (W * cols, (H + 22) * rows), (20, 20, 20))
d = ImageDraw.Draw(sheet)
for i, f in enumerate(files):
    im = Image.open(f).convert('RGB').resize((W, H))
    x, y = (i % cols) * W, (i // cols) * (H + 22)
    sheet.paste(im, (x, y + 22)); d.text((x + 6, y + 4), f.split('/')[-1], fill=(230, 230, 230))
sheet.save(out)
