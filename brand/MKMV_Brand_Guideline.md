# MKMV brand guideline

Updated 25 Nov 2026. Paste the first block in front of any prompt you give an AI design or image tool.

## 1. Guideline (paste this)

```
MKMV BRAND GUIDELINE

Who: MKMV ("make move") is a community in Johor Bahru of ordinary
busy people who train every Wednesday at 5am and keep their word.
Not for elite athletes. Values: accepting, encouraging, committing.
Tagline: Make your move.

Look: classic and minimalist performance wear, in the family of
Bandit, Tracksmith, Satisfy and District Vision. Quiet, premium,
honest. Nothing loud.

Colour: black #10100F and off-white #EAE4DE only. One reserved
colour, oxblood #522E2C, used only on kit earned by finishing,
and never on black.

Logo: the four letters MKMV in a bold extended sans with a
5 degree forward slant, stacked (MK over MV) or horizontal.
Small placement. Never redrawn, stretched or restyled.

Photography: real pre-dawn light, real people, dark and honest
over polished.

Never: gradients, neon, glows, extra colours, runner silhouettes,
flames, lightning bolts, wings, crests, script lettering,
distressed textures, slogans on the garment.
```

## 2. Colour

| Name | Hex | Use |
|---|---|---|
| Black | `#10100F` | Text, dark surfaces, black-ink prints |
| Off-white | `#EAE4DE` | Backgrounds, text on black |
| Oxblood | `#522E2C` | Finisher kit and finisher states only |

- Everyday brand is black and off-white.
- Oxblood is earned by finishing a project. It is never sold to the public.
- Never print or place oxblood on black. Use it on off-white.

## 3. Logo

- Files are in `brand/logo/` as transparent SVGs: stacked and horizontal, each in black, off-white and oxblood.
- Use the files. Never retype, redraw, stretch or recolour the wordmark.
- Stacked for square spaces (profile picture, chest print). Horizontal for wide spaces (headers, hems).
- The letters lean forward 5°. This "5° Shift" is internal design logic and is never explained in public copy.

## 4. Words

| Write | Never write |
|---|---|
| MKMV | The registered-trademark symbol |
| Make your move. | Make a move |
| Wednesdays, 5am | Make Moves (as a slogan) |
| | The 5am club |

- English first. Chinese in Traditional Chinese.
- icebatu and Pulse are venues and sponsors. Never merge them into the MKMV brand.
- Short and plain. No "elite", "rank" or "leaderboard".

## 5. Kit image prompt

AI image tools garble lettering, so generate **blank** garments and add the real logo afterwards. Three images give all six pieces.

Run this once per piece, changing the `[PIECE]` line:

```
Product photograph of a single [PIECE], laid flat, front view,
centred, shot straight from above.

[PIECE] is one of:
- a pair of crew-length running socks, side by side
- a lightweight running singlet
- a pair of lightweight running shorts with a 5 inch inseam

Fabric: plain off-white (#EAE4DE), matte technical knit, fine
visible texture, clean seams. Completely blank: no logo, no text,
no print, no label, no pattern, no stripes.

Lighting: soft, even studio light, a faint natural shadow under
the garment. Pure white background (#FFFFFF), nothing else in
frame. No model, no mannequin, no hanger, no props.

Style: minimalist premium running apparel catalogue. Same angle,
scale, lighting and crop as the other pieces in the set.
Square image, 2048 x 2048, garment fills about 70 percent of
the frame.
```

Two assumptions to confirm: the fabric is off-white, and "pants" means shorts.

## 6. After generating

1. Remove the white background and save as transparent PNG.
2. Save into `brand/kit/` as `socks.png`, `singlet.png` and `pants.png`.
3. Do not add the logo to the image. The website overlays the real SVG: black for black-ink pieces, oxblood for finisher pieces.
4. Logo placement: left chest on the singlet, outer cuff on the socks, left hem on the pants. Keep it small.
