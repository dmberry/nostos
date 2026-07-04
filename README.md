# postAI

An isometric 2D survival game set in a world devastated by the collapse that followed a failed AI takeover. Civilisation burned down its own infrastructure to win, and years later the survivors scavenge the ruins while avoiding wild animals that have gained strange powers. The truth of what happened is never stated: the player pieces it together from newspapers, diaries, floppy disks, VHS tapes, and dead computers scattered through the world.

Inspired by Project Zomboid: knowledge is the real progression, scarcity drives movement, every fight is optional and risky, and the world tells the story.

Created by David M. Berry and Henrik.

## Running

No build tools, no dependencies. Serve the folder and open it:

```
python3 -m http.server 8000
# then open http://localhost:8000
```

(Opening `index.html` directly also works in browsers that allow ES modules from `file://`; a local server is the reliable route.)

## Controls

- **WASD / arrow keys**: move
- **Shift**: sprint
- **E / Space**: use the held tool (start with a penknife; face a tree and swing to cut it down for wood)

The dashboard along the bottom of the screen shows health, stamina, the hands slot (current tool), four pocket slots, and current stats.

## Tech

- HTML5 Canvas 2D, plain JavaScript ES modules
- 2:1 isometric tiles, painter's-algorithm depth sorting
- Chunk-friendly renderer that only draws the visible tile range
- Saves (later phases) in `localStorage`

## Layout

```
index.html          entry point
src/main.js         bootstrap + fixed-timestep game loop
src/engine/         iso maths, renderer, camera, input
src/game/           tiles, map, player (game content)
```

## Build phases

1. **Iso foundation** — renderer, camera, input, test map, walkable player with collision *(current)*
2. **World generation** — seeded terrain, hills, rivers/bridges, towns with broken buildings, day/night
3. **Survival core** — hunger/thirst/stamina/health moodles, inventory, looting, saving
4. **First animals** — feral dogs, boars, vipers; perception, noise/scent, wounds, death screen
5. **Combat and equipment** — weapons, timed shield blocking, layered clothing protection, durability
6. **Full roster and journal** — all eight animals, animal-vs-animal behaviour, persistent Field Journal
7. **The hidden story** — lore fragments, playback devices and power, the Archive timeline
8. **Polish** — weather, sound cues, balancing, title screen, seed selection
