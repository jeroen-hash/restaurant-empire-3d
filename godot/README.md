# RESTAURANT EMPIRE 3D — Godot foundation

This folder is the actual Godot 4 project, separate from the existing Three.js browser preview.

## Open the project
Open the `godot/` folder in Godot 4.x and run the main scene.

## Included
- Godot 4 project and main scene
- Procedurally built first street block and ANIMO CAFE shell
- CharacterBody3D player with third-person camera
- Keyboard movement and initial touchscreen drag controls
- Central game state and versioned local JSON save/load
- Restaurant stock purchasing with weighted average unit cost
- Recipe ingredient costing and food-cost percentage
- Preparing and selling a recipe deducts ingredients and records revenue
- Automated economy tests

## Economy units
Stock quantities use base units (pieces, grams or millilitres). Example: buying 10 eggs for €5 gives a unit cost of €0.50. A recipe using 5 eggs therefore has an egg cost of €2.50. New deliveries update the weighted average unit cost.

## Not implemented yet
This is an early technical foundation, not a finished game. It does not yet contain production-quality character animation, detailed final art, customer/staff AI, complete kitchen stations, school/career progression, vehicles, multiplayer, or a finished mobile UI. Those systems will be added as separate modules and tested in Godot.

## Validation
GitHub Actions checks parse the Godot project, launch the main scene headlessly and run the economy tests. They do not replace visual testing on a real iPhone or PC.
