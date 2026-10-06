"""Write film.json: one scene per stretch of the song, each cut on a measured beat just before the
first sung word of the scene (or on a beat at the time given for the instrumental stretches)."""
import json
L = json.load(open('data/lyrics.json'))
beats = L['beats']; lines = L['lines']
# (scene, first line of the scene, or a song time for an instrumental cut, hold note)
PLAN = [
    ('s00-title', 0.0, 'the title in the first seconds'),
    ('s01-rent', 'Well, Moab', None),
    ('s02-visit', 'Then Ehud came', None),
    ('s03-palace', 13.2, None),
    ('s04-summer', 'King Eglon had', None),
    ('s05-tribute', 'And folks lined up', None),
    ('s06-payment', 'Ehud brought the payment', None),
    ('s07-secret', 'With a double-edged', None),
    ('s08-sent', 'He sent the other', None),
    ('s09-private', '"I got a private', 'one request'),
    ('s10-out', 'Out went every', None),
    ('s11-message', '"I\'ve got a message', None),
    ('s12-dagger', 'His left hand', None),
    ('s13-porch', 'Then he slipped out', None),
    ('s14-knock', "Don't knock, he's busy! Give", None),
    ('s15-boys', "That's what the palace", None),
    ('s16-quarry', 'While Ehud made the quarry', None),
    ('s17-polite', "Don't knock, he's busy! Ain't", None),
    ('s18-sight', 'They gave him every', None),
    ('s19-relieving', 'One guard said', None),
    ('s20-nobody', 'Nobody wanted', None),
    ('s21-key', 'They waited till', None),
    ('s22-floor', 'The king was on the floor', None),
    ('s23-free', 'And Ehud was running', None),
    ('s24-knock2', "Don't knock, he's busy! Give", None),
    ('s25-boys2', "That's what the palace", None),
    ('s26-quarry2', 'While Ehud made the quarry', None),
    ('s27-polite2', "Don't knock, he's busy! Ain't", None),
    ('s28-sight2', 'They gave him every', None),
    ('s29-horn', 'Ehud blew the horn', None),
    ('s30-came', 'And Israel came', None),
    ('s31-fords', 'They held the fords', None),
    ('s32-reign', "And the king's long", None),
    ('s33-eighty', 'The land got eighty', None),
    ('s34-check', 'But down at Eglon', None),
    ('s35-knock3', "Don't knock, he's busy! Give", None),
    ('s36-boys3', "That's what the palace", None),
    ('s37-quarry3', 'While Ehud made the quarry', None),
    ('s38-mistake', "Don't knock, he's busy! That", None),
    ('s39-break', 'They minded all', None),
    ('s40-tag', 'Next time the king', 'the spoken tag'),
    ('s41-rest', 164.5, None),
    ('s42-end', 172.0, 'the book closes and the end title'),
]
norm = lambda s: s.lower().replace(',', '').replace('\u2019', "'")
cuts = []
after = 0.0
prev_end = 0.0
for name, key, hold in PLAN:
    if isinstance(key, float):
        t = key if key == 0 else min(beats, key=lambda b: abs(b - key))
    else:
        l = next(l for l in lines if l['start'] >= after and norm(l['text']).startswith(norm(key)))
        after = l['start'] + 0.01
        k = lines.index(l)
        prev_end = lines[k - 1]['end'] if k else 0.0   # the line sung just before: never cut inside it
        ok = [b for b in beats if prev_end - 0.05 <= b <= l['start'] - 0.12]
        t = ok[-1] if ok else (prev_end + l['start']) / 2
    cuts.append((name, round(t, 3), hold))
scenes = []
for i, (name, t, hold) in enumerate(cuts):
    to = cuts[i + 1][1] if i + 1 < len(cuts) else round(L['duration'], 3)
    s = {'id': f'{i:02d}', 'scene': name, 'from': t, 'to': to}
    if hold: s['hold'] = hold
    scenes.append(s)
json.dump({'fps': 60, 'samples': 10, 'tier': 'standard', 'lyric': {'haloSpread': 9, 'shade': 0.5}, 'scenes': scenes}, open('film.json', 'w'), indent=1)
for s in scenes: print(s['id'], s['scene'].ljust(16), f"{s['from']:7.2f} {s['to']:7.2f} {s['to']-s['from']:5.2f}")
