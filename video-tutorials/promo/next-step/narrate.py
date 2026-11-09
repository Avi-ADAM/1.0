"""Narration for promo/next-step: one MP3 per scene, Adam on ElevenLabs v3 (same voice as the
concierge tutorial). Existing files are kept unless --force; name scene ids to redo only those.

  ../../OpenMontage/.venv/Scripts/python.exe promo/next-step/narrate.py [--force] [n2 n4]
"""
import json, os, sys
OM = r"C:\Users\babay\Documents\GitHub\OpenMontage"
sys.path.insert(0, OM)
from dotenv import load_dotenv
load_dotenv(os.path.join(OM, ".env"))
from tools.tool_registry import registry

HERE = os.path.dirname(os.path.abspath(__file__))
OUT = os.path.join(HERE, "assets", "narration")
os.makedirs(OUT, exist_ok=True)

# caption = what the screen shows; spoken = what the voice reads (pointed / spelled for the TTS)
LINES = [
    ("n1", "יש לך רעיון, אבל אין לך כסף... ואין לך ידע? מה הצעד הבא?"),
    ("n2", "כותבים אותו במילים שלך."),
    ("n3", "הוא מתפרק למשימות ולמשאבים."),
    ("n4", "ואנשים שיודעים, מציעים את עצמם."),
    ("n5", "לא צריך לדעת הכול. צריך למצוא את מי שיודע. אחד-לב-אחד."),
]

force = "--force" in sys.argv
only = [a for a in sys.argv[1:] if not a.startswith("--")]
registry.discover()
tts = registry._tools["elevenlabs_tts"]
report = []
for sid, text in LINES:
    if only and sid not in only:
        continue
    path = os.path.join(OUT, sid + ".mp3")
    if os.path.exists(path) and not force:
        print("keep", sid); continue
    res = tts.execute({"text": text, "output_path": path,
                       "voice_id": "pNInz6obpgDQGcFmaJgB", "model_id": "eleven_v3", "language_code": "he"})
    d = res.data or {}
    report.append({"scene": sid, "ok": res.success, "error": res.error, "duration": d.get("duration_seconds")})
    print(sid, "ok" if res.success else "FAIL", res.error or "", d.get("duration_seconds"))
json.dump(report, open(os.path.join(OUT, "_report.json"), "w", encoding="utf-8"), ensure_ascii=False, indent=2)
