"""Build the glyph-koi home prototype.

  python3 build.py                 -> index.html (links the live site.css / home.js)
  python3 build.py --inline OUT    -> one self-contained file (for an Artifact)

Rebundle the engine first if src/ changed:
  npx esbuild@0.24.0 entry.ts --bundle --format=iife --target=es2020 --outfile=glyph-ocean.js
"""
import pathlib, sys

here = pathlib.Path(__file__).parent
root = here.parent.parent
page = (here / "home-page.html").read_text()

# The prototype keeps the URL as is: views live in history state only.
HISTORY_SHIM = """<script>
  ["pushState", "replaceState"].forEach(function (m) {
    var f = history[m].bind(history);
    history[m] = function (s, t) { try { f(s, t); } catch (e) {} };
  });
</script>"""

if "--inline" in sys.argv:
    out = pathlib.Path(sys.argv[sys.argv.index("--inline") + 1])
    html = (page
        .replace("<!--SITE_CSS-->", "<style>\n" + (root / "assets/css/site.css").read_text() + "\n</style>")
        .replace("<!--GLYPH_OCEAN-->", "<script>\n" + (here / "glyph-ocean.js").read_text() + "\n</script>")
        .replace("<!--HOME_JS-->", HISTORY_SHIM + "\n<script>\n" + (root / "assets/js/home.js").read_text() + "\n</script>"))
    # The artifact skeleton supplies <body>; keep its class on our own wrapper call.
    html = html.replace('<body class="lang-zh-Hant home">', '<script>document.body.className = "lang-zh-Hant home";</script>').replace("</body>", "")
    out.write_text(html)
else:
    head, body = page.split("<body", 1)
    html = ('<!DOCTYPE html>\n<html lang="zh-Hant">\n<head>\n<meta charset="utf-8">\n'
            '<meta name="viewport" content="width=device-width, initial-scale=1">\n'
            + head.replace("<!--SITE_CSS-->", '<link rel="stylesheet" href="../../assets/css/site.css">')
            + "</head>\n<body" + body
              .replace("<!--GLYPH_OCEAN-->", '<script src="glyph-ocean.js"></script>')
              .replace("<!--HOME_JS-->", HISTORY_SHIM + '\n  <script src="../../assets/js/home.js"></script>')
            + "</html>\n")
    (here / "index.html").write_text(html)
