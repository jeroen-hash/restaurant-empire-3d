# RESTAURANT EMPIRE 3D — Real Kitchen Rebuild

This branch is a clean restart of the kitchen gameplay. It deliberately starts before the recent menu-driven kitchen interaction experiments.

## The agreed priority

A small kitchen that behaves credibly is more important than a large city, decorative menus, or a long feature list. Keep the existing live project and `main` branch untouched.

## Non-negotiable player loop

1. Walk to a physical refrigerator, freezer, or dry-store shelf.
2. Open the relevant door or storage area.
3. See the actual available ingredient objects in that storage.
4. Select and physically take one item. The item must appear in the player's hand; stock decreases only after a successful pickup.
5. Walk to the worktop.
6. Take a cutting board from its actual rack and place it on the counter.
7. Take a chef's knife from its actual rack and use it at the board.
8. Put the ingredient on the board and perform a visible cutting action. The ingredient must visibly change into cut pieces; it must not simply disappear or be marked as cut by a button.
9. Carry the cut pieces to a cooking station, take a pan, place it on the hob, add the ingredients, and cook them with controllable heat and time.
10. Plate the finished food using a real plate and utensils.

## Interaction rules

- Context prompts appear only when the player is close enough to a relevant object.
- No permanent row of generic action buttons.
- One held object at a time unless a deliberate two-hand mechanic is implemented.
- A held object has a visible 3D representation attached to the correct hand.
- Doors visibly animate; shelves and products are visible when open.
- Inventory, stock, held objects, worktop contents, and cooking state must agree.
- If stock is empty, pickup fails with a clear message.
- Actions are state-driven and cannot be skipped by clicking later recipe steps.
- The mobile control scheme must support left-side movement and right-side camera look, with a small contextual interaction control.

## Visual quality rules

- Do not use spheres, capsules, or plain cubes as final food, tools, kitchen equipment, or character art.
- Use the included licensed professional kitchen GLB assets as the environment foundation.
- Use real ingredient/tool/prop models with appropriate materials and scale. If an asset is not available, leave a clearly marked placeholder for development rather than pretending it is final art.
- The current procedural humanoid is not accepted as the final chef character; replace it with a properly rigged character asset and verify hand attachment points.
- Keep the first playable slice to one compact professional kitchen and one recipe.

## First vertical slice

One recipe: chicken with vegetables.

Required visible sequence:
- retrieve chicken and vegetables from cold storage;
- retrieve a potato and seasoning from dry storage;
- take and place cutting board;
- take knife and cut ingredients visibly;
- take pan, place it on hob, add prepared ingredients;
- cook with heat/time feedback;
- plate and serve.

## Engineering acceptance checks

Do not call the slice complete until:
- Godot imports the project without script errors;
- the player can walk around the kitchen without falling through or getting trapped;
- every interaction is reachable in third-person and first-person;
- pickup, placement, cutting, cooking, and plating change visible 3D state;
- stock and recipe state update correctly;
- the same flow works on the iPhone web export;
- a human playtest confirms the complete sequence, not just a unit test.

Automated tests are useful but do not replace a real visual and input playtest.


## Implementation progress — physical interaction prototype

The new `scripts/physical_kitchen_v1.gd` module is now connected to the culinary-school scene through `main.gd`. It introduces a first raycast-based physical interaction loop:
- Take a stocked ingredient from the storage proxy; stock count decreases only on pickup.
- Carry the ingredient attached to the character's right-hand anchor.
- Aim at the cutting-board interaction surface and place the ingredient down.
- Pick up the knife as a separate held object.
- Use the knife at the board to replace the whole chicken proxy with visible cut-piece proxies.

The interaction prototype has since been extended so chicken, carrot, and potato can each be placed on the board, converted into visible cut-piece proxies, and transferred to the pan one ingredient at a time. Pan visuals now represent each transferred ingredient. This remains blockout logic: the board is still a fixed interaction surface rather than a board physically taken from a rack, and the cut/cook visuals are not final food models or animations.

**Important status:** this is an early interaction prototype, not an accepted playable build. The ingredient, knife, board and storage visuals are temporary primitive blockout meshes. The imported professional kitchen remains the environment model. Final food/tool models, robust placement/return rules, cutting animation, vegetable preparation, a more detailed heat/time simulation, mobile runtime validation, and Godot runtime validation are still outstanding. Basic pan placement, chicken transfer, three hob heat levels, timed cooking, and plate/serve interactions now exist as prototype logic. Do not describe this prototype as finished or iPhone-tested.
