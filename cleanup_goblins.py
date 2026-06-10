from pathlib import Path

replacements = {
    "\u00e2\u20ac\u201d": "-",
    "\u00e2\u20ac\u201c": "-",
    "\u00e2\u20ac\u02dc": "'",
    "\u00e2\u20ac\u2122": "'",
    "\u00e2\u20ac\u0153": '"',
    "\u00e2\u20ac\u009d": '"',
    "\u00e2\u20ac\u00a6": "...",
    "\u00e2\u20ac\u00a2": "*",
    "\u00c2\u00a0": " ",
    "\ufeff": "",
}

root = Path("app")
for path in list(root.rglob("*.ts")) + list(root.rglob("*.tsx")):
    text = path.read_text(encoding="utf-8", errors="replace")
    original = text
    for bad, good in replacements.items():
        text = text.replace(bad, good)
    if text != original:
        path.write_text(text, encoding="utf-8")
        print(f"Cleaned {path}")
