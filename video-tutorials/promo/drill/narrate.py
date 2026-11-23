"""Narration for promo/drill: one MP3 per scene, Adam on ElevenLabs v3 (same voice as the
concierge tutorial). Existing files are kept unless --force; name scene ids to redo only those.

  ../../OpenMontage/.venv/Scripts/python.exe promo/drill/narrate.py [--force] [n2 n4]
  ../../OpenMontage/.venv/Scripts/python.exe promo/drill/narrate.py --lang en --engine fal

--lang en   English lines -> assets/narration/en/ (index.en.html reads them)
--engine fal  same voice and model through fal.ai (FAL_KEY) instead of the ElevenLabs key;
              also writes <id>.words.json with per-word start/end seconds for timing the page.
--engine gemini  Gemini TTS (GOOGLE_API_KEY), voice Charon - the English series' voice since
              the ElevenLabs key died (2026-11). WAV out, converted to <id>.mp3 with Remotion's ffmpeg.
"""
import json, os, subprocess, sys
OM = r"C:\Users\babay\Documents\GitHub\OpenMontage"
sys.path.insert(0, OM)
from dotenv import load_dotenv
load_dotenv(os.path.join(OM, ".env"))
from tools.tool_registry import registry

HERE = os.path.dirname(os.path.abspath(__file__))

def arg(name, default):
    return sys.argv[sys.argv.index(name) + 1] if name in sys.argv else default

LANG = arg("--lang", "he")
ENGINE = arg("--engine", "elevenlabs")
OUT = os.path.join(HERE, "assets", "narration", *([] if LANG == "he" else [LANG]))
os.makedirs(OUT, exist_ok=True)

# caption = what the screen shows; spoken = what the voice reads (pointed / spelled for the TTS)
LINES = {
    "he": [
        ("n1", "יש לך מקדחה שעובדת כמה דקות בשנה."),
        ("n2", "בָּרִקְמָה, מקדחה, טנדר או חדר ריק הם משאב, והשווי שלהם נספר כחלק שלך."),
        ("n3", "מה שיש לך במחסן, יכול להיות חלק משותפות. אחד-לב-אחד."),
    ],
    # the brand on screen is 1💗1; spoken, it is "one love one"
    "en": [
        ("n1", "You own a drill that works a few minutes a year."),
        ("n2", "In a rikma, a drill, a van or an empty room is a resource, and its value counts as your share."),
        ("n3", "What sits in your shed could be your share in a partnership. One love one."),
    ],
}[LANG]

flags = {"--lang", "--engine"}
argv = sys.argv[1:]
only = [a for i, a in enumerate(argv) if not a.startswith("--") and (i == 0 or argv[i - 1] not in flags)]
force = "--force" in sys.argv
registry.discover()
tts = registry._tools[{"fal": "fal_elevenlabs_tts", "gemini": "gemini_tts"}.get(ENGINE, "elevenlabs_tts")]
FFMPEG = os.path.join(OM, "remotion-composer", "node_modules", "@remotion", "compositor-win32-x64-msvc", "ffmpeg.exe")
GEMINI_STYLE = "Warm, confident narrator of a short social video. Natural pace, friendly, not salesy."
report = []
for sid, text in LINES:
    if only and sid not in only:
        continue
    path = os.path.join(OUT, sid + ".mp3")
    if os.path.exists(path) and not force:
        print("keep", sid); continue
    inp = {"text": text, "output_path": path, "voice_id": "pNInz6obpgDQGcFmaJgB",
           "model_id": "eleven_v3", "language_code": LANG}
    if ENGINE == "fal":
        inp["timestamps"] = True
    if ENGINE == "gemini":
        inp = {"text": text, "output_path": path[:-4] + ".wav", "voice_id": "Charon", "style": GEMINI_STYLE}
    res = tts.execute(inp)
    if ENGINE == "gemini" and res.success:
        subprocess.run([FFMPEG, "-y", "-loglevel", "error", "-i", inp["output_path"], "-b:a", "192k", path], check=True)
        os.remove(inp["output_path"])
    d = res.data or {}
    words = d.get("timestamps") or d.get("words") or d.get("alignment")
    if words:
        json.dump(words, open(os.path.join(OUT, sid + ".words.json"), "w", encoding="utf-8"), ensure_ascii=False, indent=1)
    report.append({"scene": sid, "ok": res.success, "error": res.error, "duration": d.get("duration_seconds")})
    print(sid, "ok" if res.success else "FAIL", res.error or "", d.get("duration_seconds"))
json.dump(report, open(os.path.join(OUT, "_report.json"), "w", encoding="utf-8"), ensure_ascii=False, indent=2)
