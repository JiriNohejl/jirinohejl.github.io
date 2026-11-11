# Jiri Nohejl — personal website

Local draft for GitHub Pages. Open `index.html` directly or serve this folder with a static HTTP server. All local links and assets are relative, so the same folder works on a username site or a repository subpath. No packages, external fonts, tracking, or build runtime are required by the deployed pages.

## Edit and regenerate

The page bodies and common layout are in `../tools/build-site.py`. The Media inventory is `../Resources/media.json`. Styles and browser interactions are in `assets/`. From the workspace root, run `python tools/build-site.py` after editing content. It writes the eight HTML pages in this folder. To rebuild only selected pages and preserve direct edits elsewhere, pass their names: `python tools/build-site.py projects.html studio.html teaching.html`. Styles and scripts are retained as authored files.

All HTML pages use line breaks and tab indentation, preserved by the generators. To reformat a page after direct HTML edits without regenerating its content, run `python tools/format_html.py website/index.html` from the workspace root, substituting the relevant filename. Multiple filenames can be passed in one command. Direct content edits should also be reflected in the generator before rebuilding.

Keep source code readable: use tab indentation for HTML and CSS, blank lines between rules or sections, and one CSS declaration per line. Preserve this style when editing; do not minify the source. CSS can be formatted with `python tools/format_css.py website/assets/site.css`. Section comments identify the main components and responsive rules.

## Content and review

The editorial source ledger is `../Resources/site-content-sources.md`. Original links appear next to relevant public work. Research described only in the supplied résumé is presented as ongoing work; unverified public papers and hosted demonstrations have no buttons. The CV page is a selected public CV with a browser print action; the original résumé and its private/reference information are not copied into this folder.

`../tools/check-website.cjs` checks local links, section navigation, Media filtering/search, mobile layout, and browser errors, and saves screenshots in `../style-previews/site/`. It uses the existing bundled Playwright and Microsoft Edge. It does not follow every external source link or independently reproduce the economic benchmark.

## Growth project integration

`studio.html` is the integrated Solow Growth Studio; `projects.html#growth` contains its compact experiment. Both share the portfolio's base stylesheet and navigation. Component styles and readable JavaScript live in `assets/growth/`; HTML templates live in `../Resources/templates/`. The original supplied files remain in `../Projects/`.

The studio works directly from local files and on static GitHub Pages hosting. It has no chart CDN, API, or server dependency. CSV files are processed in memory in the browser. Bundled country series retain the supplied numerical data and are explicitly labelled as teaching samples with unverified provenance. Fitting is in-sample calibration; there are no future projections or persistent saved experiments.

`node tools/check-growth.cjs` from the workspace root checks the supplied and integrated model outputs, all sample datasets, sliders, comparison paths, regime changes, TFP fitting, CSV upload/rejection/download, responsive charts, and operation without network requests. It uses the existing bundled Playwright and Edge runtime.

Nothing has been deployed or connected to a GitHub repository. For eventual GitHub Pages publication, use the contents of this folder as the site's publishing root. Keep `Resources/`, `tmp/`, and the original résumé outside the public artifact.
