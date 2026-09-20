"""Generate ResumeCraft's 1200x630 social preview (og:image)."""
from PIL import Image, ImageDraw, ImageFont
import math

W, H = 1200, 630
TEAL = (0, 104, 95)      # #00685f brand primary
INDIGO = (75, 65, 225)   # #4b41e1 brand secondary
WHITE = (255, 255, 255)

FONT_DIR = "C:/Windows/Fonts/"

def lerp(a, b, t):
    return tuple(int(a[i] + (b[i] - a[i]) * t) for i in range(3))

# --- Background: diagonal gradient teal -> indigo ---
img = Image.new("RGB", (W, H))
d = ImageDraw.Draw(img)
for x in range(W):
    t = x / (W - 1)
    d.line([(x, 0), (x, H)], fill=lerp(TEAL, INDIGO, t))

# Subtle decorative rings
for (cx, cy, r, alpha) in [(1050, 90, 220, 14), (120, 570, 260, 12), (950, 560, 150, 10)]:
    overlay = Image.new("RGBA", (W, H), (0, 0, 0, 0))
    od = ImageDraw.Draw(overlay)
    od.ellipse([cx - r, cy - r, cx + r, cy + r], outline=(*WHITE, alpha), width=60)
    img = Image.alpha_composite(img.convert("RGBA"), overlay).convert("RGB")
d = ImageDraw.Draw(img)

# --- Resume card mockup (right side) ---
card_x, card_y, card_w, card_h = 720, 95, 360, 440
card = Image.new("RGBA", (card_w, card_h), (0, 0, 0, 0))
cd = ImageDraw.Draw(card)
cd.rounded_rectangle([0, 0, card_w - 1, card_h - 1], radius=18, fill=(*WHITE, 255))
# soft shadow
shadow = Image.new("RGBA", (W, H), (0, 0, 0, 0))
sd = ImageDraw.Draw(shadow)
sd.rounded_rectangle([card_x + 10, card_y + 14, card_x + card_w + 10, card_y + card_h + 14],
                     radius=18, fill=(9, 14, 30, 70))
img = Image.alpha_composite(img.convert("RGBA"), shadow).convert("RGB")
img.paste(card, (card_x, card_y), card)
d = ImageDraw.Draw(img)

# Card content: name bar, title bar, section lines, ATS ring
d.rounded_rectangle([card_x + 110, card_y + 34, card_x + 250, card_y + 52], radius=9, fill=(15, 23, 42))
d.rounded_rectangle([card_x + 140, card_y + 62, card_x + 220, card_y + 72], radius=5, fill=(148, 163, 184))
line_y = card_y + 108
for i in range(6):
    w_full = 280 - (i % 3) * 40
    d.rounded_rectangle([card_x + 40, line_y, card_x + 40 + w_full, line_y + 8], radius=4, fill=(226, 232, 240))
    line_y += 22
    if i == 2:
        line_y += 14
# ATS score ring on card
ring_cx, ring_cy, ring_r = card_x + 285, card_y + 320, 46
d.arc([ring_cx - ring_r, ring_cy - ring_r, ring_cx + ring_r, ring_cy + ring_r],
      start=0, end=360, fill=(226, 232, 240), width=12)
d.arc([ring_cx - ring_r, ring_cy - ring_r, ring_cx + ring_r, ring_cy + ring_r],
      start=-90, end=-90 + int(360 * 0.82), fill=TEAL, width=12)
try:
    score_font = ImageFont.truetype(FONT_DIR + "seguisb.ttf", 38)
except OSError:
    score_font = ImageFont.truetype(FONT_DIR + "arialbd.ttf", 38)
d.text((ring_cx, ring_cy - 4), "82", font=score_font, fill=TEAL, anchor="mm")

# --- Left column text ---
try:
    brand_font = ImageFont.truetype(FONT_DIR + "seguisb.ttf", 84)   # Segoe UI Semibold
    tag_font = ImageFont.truetype(FONT_DIR + "segoeuib.ttf", 36)
    sub_font = ImageFont.truetype(FONT_DIR + "segoeui.ttf", 27)
    url_font = ImageFont.truetype(FONT_DIR + "segoeui.ttf", 24)
except OSError:
    brand_font = ImageFont.truetype(FONT_DIR + "arialbd.ttf", 84)
    tag_font = ImageFont.truetype(FONT_DIR + "arialbd.ttf", 36)
    sub_font = ImageFont.truetype(FONT_DIR + "arial.ttf", 27)
    url_font = ImageFont.truetype(FONT_DIR + "arial.ttf", 24)

lx = 80
# Checkmark badge
badge_cx, badge_cy, badge_r = lx + 34, 148, 34
d.ellipse([badge_cx - badge_r, badge_cy - badge_r, badge_cx + badge_r, badge_cy + badge_r], fill=WHITE)
d.line([(badge_cx - 14, badge_cy + 1), (badge_cx - 4, badge_cy + 12)], fill=TEAL, width=8)
d.line([(badge_cx - 4, badge_cy + 12), (badge_cx + 16, badge_cy - 12)], fill=TEAL, width=8)

d.text((lx + 92, 148), "ResumeCraft", font=brand_font, fill=WHITE, anchor="lm")
d.text((lx, 268), "Build a resume that beats the ATS.", font=tag_font, fill=WHITE, anchor="lm")

# Feature pills (outline only — RGB draw has no alpha)
try:
    pill_font = ImageFont.truetype(FONT_DIR + "segoeuib.ttf", 22)
except OSError:
    pill_font = ImageFont.truetype(FONT_DIR + "arialbd.ttf", 22)
pills = ["AI Parsing", "Live ATS Score", "PDF Export"]
px = lx
for label in pills:
    try:
        tw = d.textlength(label, font=pill_font)
    except Exception:
        tw = 160
    pw = int(tw) + 44
    d.rounded_rectangle([px, 330, px + pw, 330 + 46], radius=23, outline=WHITE, width=2)
    d.text((px + pw / 2, 330 + 23), label, font=pill_font, fill=WHITE, anchor="mm")
    px += pw + 16

d.text((lx, 420), "Free forever. No watermark on your resume.", font=sub_font, fill=(216, 236, 235), anchor="lm")
d.text((lx, 540), "resumecraftco.vercel.app", font=url_font, fill=(190, 214, 232), anchor="lm")

# Rounded corners are irrelevant for og:image; save optimized PNG
img.save("C:/resumecraft/frontend/public/social-preview.png", optimize=True)
print("saved", img.size)
