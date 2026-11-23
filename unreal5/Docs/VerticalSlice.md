# RESTAURANT EMPIRE 3D — Vertical slice brief

## Non-negotiable direction

The target is a grounded, believable 3D restaurant-life simulation. The kitchen must read as a real professional Belgian horeca kitchen, not a collection of primitive placeholder blocks. Characters need believable proportions, clothing, hands, locomotion, and task animation. Food must use recognizable ingredient meshes and visibly change during preparation.

## First playable environment

A culinary-school training kitchen with:
- Stainless-steel prep benches, sinks, extraction, ovens, cooktops, refrigeration, shelves, and professional utensils.
- A clear prep zone, cooking zone, seasoning zone, and plating zone.
- A third-person player camera, with a first-person camera option planned.
- Context-sensitive interaction prompts located near the relevant station.
- No permanent bottom-screen action bar; controls appear only when relevant.
- PC keyboard/mouse controls first; touch controls added as a separate tested input layer.

## First gameplay loop

1. Walk to the preparation station.
2. Take a knife and a real ingredient from the work surface or storage.
3. Place the ingredient on the cutting board.
4. Perform a deliberate cutting action with visible hand, knife, and ingredient movement.
5. Show the ingredient changing into cut pieces; do not replace it with colored spheres.
6. Carry or move the prepared ingredient to a pan or pot.
7. Start cooking only after the required ingredients have been added.
8. Season manually, then plate components through separate player actions.
9. Evaluate the result using preparation, timing, and execution.

## Production order

1. Confirm the installed UE5 version and create/open the project in the matching editor.
2. Compile the empty C++ project and verify the editor launches.
3. Import licensed, high-quality kitchen and character assets; record their licenses and attribution.
4. Build and light one compact kitchen scene.
5. Implement player movement, camera, and interaction.
6. Implement visible preparation, cooking, and plating interactions.
7. Profile the PC build, then create mobile scalability settings and test on actual devices.
8. Only after the vertical slice is convincing, expand to the culinary school and the wider city.

## Technical guardrails

- Keep the Unreal implementation separate from the Godot prototype.
- Do not modify or merge into `main` as part of this work.
- Prefer modular, reusable gameplay systems and data-driven recipes/interactions.
- Use Enhanced Input for keyboard, mouse, controller, and future touch mappings.
- Avoid expensive effects as mandatory settings; provide scalable quality tiers.
- Do not claim a build or visual test passed until it has actually been run in Unreal Engine.
