# JPEG XL fixtures

These small synthetic gradients were generated for PICR; no external photos or
third-party assets are included. Keep them outside `tests/api/env/media` so they
do not change the shared seed gallery, its file IDs, or visual snapshots. The
JXL integration test temporarily copies them into a seeded folder and removes
them afterward, including on failure.

Generated with ImageMagick 7 and libjxl 0.11.1:

```sh
magick -size 320x240 gradient:red-blue -quality 100 landscape.jxl
magick -size 120x160 gradient:green-yellow -rotate 90 -quality 100 portrait-orientation-6.jxl
exiftool -overwrite_original -Make='PICR Fixture' -Model='JPEG XL Test' -Orientation#=6 -XMP-xmp:Rating=4 portrait-orientation-6.jxl
```

`landscape.jxl` contains a 320 × 240 image. The portrait fixture stores
160 × 120 pixels with EXIF Orientation 6, so its displayed size is 120 × 160.
The gradients use 16-bit channels. Both are encoded losslessly (`-quality 100`)
and exercise the PNG intermediate before PICR's final JPEG thumbnail encode.

The portrait fixture also has an XMP rating of 4. The integration test checks
that value through PICR's metadata reader after PNG conversion, not only with
ExifTool.

`display-p3.jxl` is a 256 × 128 16-bit gradient with a Display P3 ICC profile.
`display-p3-srgb.png` is its independently colour-converted 8-bit reference.
Profiles were extracted from Sharp's built-in `p3` and `srgb` profiles (CC0),
then the pair was generated with ImageMagick/LCMS:

```sh
magick -size 256x128 'gradient:#c94527-#2a598b' -depth 16 -profile p3.icc p3-reference.png
magick p3-reference.png -define jxl:effort=1 -quality 100 display-p3.jxl
magick p3-reference.png -profile srgb.icc -depth 8 -define png:compression-level=1 display-p3-srgb.png
```

The API test compares decoded JPEG preview pixels against the sRGB reference
with a small cross-codec rounding allowance. The unconverted P3 values differ
by up to 24 channel levels, well beyond that allowance. See
[the JXL implementation notes](../../../docs/development/jpeg-xl.md) for the
colour investigation and full-resolution decode measurements.
