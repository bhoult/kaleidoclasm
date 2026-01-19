# Resources and Interactions

## Global Resources

Resources are shared by all survivors:

| Resource | Starting | Use |
|----------|----------|-----|
| Scrap | 10 | Crafting (future feature) |
| Medicine | 2 | Healing |
| Food | 5 | Restore nutrition |
| Water | 5 | Restore hydration |

## Context Menu Interactions

Right-click on tiles and objects to open a context menu with available actions. Actions require an adjacent unit and cost AP.

| Target | Action | AP Cost | Result |
|--------|--------|---------|--------|
| Enemy | Attack | 1 | Deal damage to enemy |
| Water | Collect Water | 1 | +1-2 water |
| Dead Tree | Harvest Wood | 1 | +2-4 scrap, removes tree |
| Building | Search Building | 2 | Random loot |
| Toxic Barrel | Salvage Chemicals | 1 | +1 medicine/scrap, radiation risk |
| Car Wreck | Salvage Parts | 2 | +3-7 scrap |
| Debris | Search Debris | 1 | Small chance of loot |
| Empty Tile | Search Area | 1 | Low chance of loot |
| Dirt/Sand/Mud | Dig | 2 | Chance of buried items |

## Loot Tables

### Search Building
- 30%: 1-2 food
- 20%: 1 medicine
- 20%: 1-2 water
- 20%: 2-5 scrap
- 10%: Nothing

### Search Debris
- 40%: 1-2 scrap
- 10%: 1 food
- 50%: Nothing

### Search Ground
- 15%: 1 scrap
- 5%: 1 food (edible plants)
- 80%: Nothing

### Dig
- 20%: 2-5 buried scrap
- 10%: 1 water (underground source)
- 5%: 1 medicine (buried med kit)
- 65%: Nothing

### Salvage Chemicals (Toxic Barrel)
- 40% chance of radiation exposure (5-14 rads)
- 60%: 1 medicine
- 40%: 1 scrap
