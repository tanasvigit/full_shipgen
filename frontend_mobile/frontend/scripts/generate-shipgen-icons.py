"""Generate ShipGen app-icon and splash assets.

Sources:
  * assets/images/shipgen-logo.png       -> APP ICON ONLY (icon mark)
  * assets/images/shipgen-logo-full.png  -> SPLASH + in-app brand (full wordmark)

Left untouched on purpose:
  * assets/images/shipgen-icon.png       -> loading animation artwork
  * assets/images/shipgen-logo-full.png  -> source for the full brand logo
"""
from __future__ import annotations

from pathlib import Path

from PIL import Image

ROOT = Path(__file__).resolve().parents[1]
ASSETS = ROOT / "assets" / "images"
ANDROID_RES = ROOT / "android" / "app" / "src" / "main" / "res"

ICON_SRC = ASSETS / "shipgen-logo.png"        # app icon = icon mark
FULL_SRC = ASSETS / "shipgen-logo-full.png"   # splash / in-app = full wordmark

WHITE = (255, 255, 255, 255)
TRANSPARENT = (0, 0, 0, 0)


def fit_logo(source: Image.Image, canvas_w: int, canvas_h: int, *, bg=TRANSPARENT, padding_ratio=0.12) -> Image.Image:
    pad_w = canvas_w * (1 - 2 * padding_ratio)
    pad_h = canvas_h * (1 - 2 * padding_ratio)
    ratio = min(pad_w / source.width, pad_h / source.height)
    new_w = max(1, int(source.width * ratio))
    new_h = max(1, int(source.height * ratio))
    resized = source.resize((new_w, new_h), Image.Resampling.LANCZOS)
    canvas = Image.new("RGBA", (canvas_w, canvas_h), bg)
    canvas.paste(resized, ((canvas_w - new_w) // 2, (canvas_h - new_h) // 2), resized)
    return canvas


def save_png(img: Image.Image, path: Path) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    img.save(path, "PNG")


def save_webp(img: Image.Image, path: Path) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    img.save(path, "WEBP", quality=92, method=6)


def build_app_icon(icon: Image.Image) -> None:
    # Expo / shared
    save_png(fit_logo(icon, 1024, 1024, bg=WHITE, padding_ratio=0.14), ASSETS / "icon.png")
    save_png(fit_logo(icon, 1024, 1024, bg=TRANSPARENT, padding_ratio=0.20), ASSETS / "adaptive-icon.png")
    save_png(fit_logo(icon, 48, 48, bg=WHITE, padding_ratio=0.06), ASSETS / "favicon.png")

    # Android adaptive foreground (needs safe-zone padding)
    for folder, size in {
        "mipmap-mdpi": 108, "mipmap-hdpi": 162, "mipmap-xhdpi": 216,
        "mipmap-xxhdpi": 324, "mipmap-xxxhdpi": 432,
    }.items():
        save_webp(fit_logo(icon, size, size, bg=TRANSPARENT, padding_ratio=0.22),
                  ANDROID_RES / folder / "ic_launcher_foreground.webp")

    # Android legacy launcher icons (white bg)
    for folder, size in {
        "mipmap-mdpi": 48, "mipmap-hdpi": 72, "mipmap-xhdpi": 96,
        "mipmap-xxhdpi": 144, "mipmap-xxxhdpi": 192,
    }.items():
        legacy = fit_logo(icon, size, size, bg=WHITE, padding_ratio=0.12)
        save_webp(legacy, ANDROID_RES / folder / "ic_launcher.webp")
        save_webp(legacy, ANDROID_RES / folder / "ic_launcher_round.webp")


def build_splash(full: Image.Image) -> None:
    # Expo splash image (full wordmark logo)
    save_png(fit_logo(full, 512, 512, bg=TRANSPARENT, padding_ratio=0.16), ASSETS / "splash-icon.png")

    # Android native splash logos
    for folder, size in {
        "drawable-mdpi": 288, "drawable-hdpi": 432, "drawable-xhdpi": 576,
        "drawable-xxhdpi": 864, "drawable-xxxhdpi": 1152,
    }.items():
        save_png(fit_logo(full, size, size, bg=TRANSPARENT, padding_ratio=0.18),
                 ANDROID_RES / folder / "splashscreen_logo.png")


def main() -> None:
    icon = Image.open(ICON_SRC).convert("RGBA")
    full = Image.open(FULL_SRC).convert("RGBA")
    build_app_icon(icon)
    build_splash(full)
    print("App icon <- shipgen-logo.png ; splash <- shipgen-logo-full.png (loader untouched)")


if __name__ == "__main__":
    main()
