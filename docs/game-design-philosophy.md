# Game Design Philosophy

This document defines the core design principles that all Famerlo Games must follow. It serves as the guiding reference for designing new games and evaluating changes to existing ones.

## Purpose of Famerlo Games

Famerlo Games serve two goals:

1. **Self-funded advertising for Famerlo.** Famerlo is an AI assistant that helps busy parents manage family logistics — a commercial product. The games provide ad impressions for Famerlo at no cost beyond building the games themselves. The advertising is deliberately discrete and unobtrusive: a non-animating banner in the footer, and a more detailed mention in the About/How to Play section.

2. **Free, stress-free casual puzzle games for kids.** Every game is completely free with no in-app purchases, no third-party ads, and no data collection. The games are simple puzzle experiences designed for relaxation, not anxiety.

## Stress-Free Design Principles

Many games today deliberately induce stress — aggressive timers, forced difficulty escalation, limited lives — often to push users toward in-app purchases for aids or extra time. Famerlo Games reject this model entirely.

### No timers

No game shall have a countdown timer or any time-based pressure. The player can take as long as they want on any puzzle.

### User-chosen difficulty

The player decides what difficulty level to play. Games do not force progressive difficulty. If a player wants to play easy puzzles all day, that's perfectly fine.

### No lives, no maximum errors

Games do not use a lives system or a hard error limit that abruptly ends the game. The player can focus on the puzzle without fear of sudden failure.

### The error emoji system

Across all Famerlo Games, errors are handled consistently:

- An incorrect move produces an **unhappy smiley emoji** displayed on or near the board.
- Each unhappy smiley **disappears after 30 seconds**.
- If the player accumulates **five concurrent active unhappy smileys**, the game is over.
- The player can immediately try again.

This system is very lenient. A patient player will rarely see game over — the smileys expire naturally. But it does penalize rapid, thoughtless tapping, which preserves the puzzle-solving nature of the game.

### No in-app purchases

There are no purchasable hints, power-ups, extra lives, or any other microtransactions. Everything the player needs is available for free, always.

### All puzzles must be solvable

Every puzzle presented to the player must have at least one valid solution path from its initial state. The player should never encounter an impossible puzzle. This is a technical requirement that must be verified by the game's puzzle generation or validation logic.

## Advertising Guidelines

- The Famerlo advertisement appears as a **static, non-animating footer banner** at the bottom of the game screen.
- A more detailed **About Famerlo** section is included in the How to Play or About overlay.
- Advertising must never interrupt gameplay, overlay the game board, or require interaction to dismiss.
- No third-party advertisements of any kind.

## Summary of Design Requirements

When designing or reviewing a Famerlo Game, check against this list:

| Requirement | Details |
|---|---|
| Free | No cost to download or play |
| No IAP | No in-app purchases of any kind |
| No third-party ads | Only Famerlo's own discrete branding |
| No timer | No time pressure whatsoever |
| User-chosen difficulty | Player selects their own difficulty level |
| Error emoji system | 30-second unhappy smileys, 5 concurrent = game over |
| Solvable puzzles | Every puzzle must be solvable from its initial state |
| Stress-free | No mechanics designed to induce anxiety or urgency |
