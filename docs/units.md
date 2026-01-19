# Units

## Survivors

Players start with **3 survivors**, each with:

| Stat | Max Value | Description |
|------|-----------|-------------|
| Health | 100 | Unit dies at 0 |
| Action Points | 3 | Refreshes each turn |
| Hydration | 100 | Decreases 5/turn |
| Nutrition | 100 | Decreases 3/turn |
| Radiation | 100 | Accumulates in toxic zones |

## Radiation Sickness (ARS)

Radiation accumulates when moving through or standing on toxic terrain:
- **Passing through**: 50% dose per tile
- **Ending turn on**: Full dose

### ARS Stages

| Stage | Threshold | Effects |
|-------|-----------|---------|
| Stage 1 | 25+ rads | Mild symptoms |
| Stage 2 | 50+ rads | 5 HP damage/turn |
| Stage 3 | 75+ rads | 10 HP damage/turn, reduced AP |
| Stage 4 | 100 rads | 20 HP damage/turn, 1 AP max |

## Turn System

The game operates on a turn-based system with the following phases:

- **Action Phase** - Player moves units, plays cards, and engages enemies
- **End Phase** - Resources are consumed, radiation damage is applied, enemies act

Each unit has **3 Action Points (AP)** per turn that can be spent on:
- Movement (cost varies by terrain and distance)
- Playing cards (most cost 1 AP)
- Attacking enemies (1 AP)
