# Enemies

## Raiders

**Raiders** spawn every 3 turns and use AI behaviors:

### AI States

| State | Behavior |
|-------|----------|
| PATROL | Wander randomly when no targets nearby |
| CHASE | Move toward nearest survivor within sight range |
| ATTACK | Deal damage to adjacent survivors |
| FLEE | Retreat when health is critical (<20%) |

### State Transitions

1. **PATROL → CHASE**: When player unit enters sight range (6 tiles)
2. **CHASE → ATTACK**: When adjacent to player unit
3. **ATTACK → FLEE**: When health drops below 20%
4. **FLEE**: Move away from nearest player unit

Enemies attack automatically during their turn phase when adjacent to a player unit.

## Enemy Stats

| Stat | Value |
|------|-------|
| Health | 60 |
| Damage | 20 (±10 variance) |
| Move Range | 2 tiles/turn |
| Sight Range | 6 tiles |

## Spawning

- Raiders spawn every 3 turns
- They spawn near player units (within visible range)
- Spawning avoids impassable terrain and occupied tiles
