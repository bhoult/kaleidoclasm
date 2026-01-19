# Combat System

Combat is melee-only and requires adjacent positioning (including diagonals).

## Initiating Combat

Two ways to attack:
- **Left-click** an enemy with a unit selected (quick attack)
- **Right-click** an enemy to open context menu, select "Attack"

## Combat Resolution

```
1. Check range (must be within 1.5 tiles - adjacent including diagonals)
2. Spend 1 AP (attack fails if insufficient AP)
3. Roll for hit (10% miss chance)
4. If hit, calculate damage:
   - Base damage: 20
   - Variance: ±10 (random)
   - Final damage: max(1, base + variance)
5. Apply damage to defender
6. Check for death (HP <= 0)
```

## Combat Stats

| Stat | Player Units | Raiders |
|------|--------------|---------|
| Base Damage | 20 | 20 |
| Damage Variance | ±10 | ±10 |
| Miss Chance | 10% | 10% |
| Attack Cost | 1 AP | N/A (enemy turn) |
| Attack Range | Adjacent (1 tile) | Adjacent (1 tile) |

## Damage Formula

```javascript
damage = max(1, baseDamage + random(-variance, +variance))
// Example: 20 + random(-10, +10) = 10 to 30 damage
```

## Death and Loot

- **Player units**: Removed from game, check for game over
- **Enemies**: Drop 1-5 scrap, removed from game
