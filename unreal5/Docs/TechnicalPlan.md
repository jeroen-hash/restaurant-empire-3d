# Technical plan — first playable vertical slice

## Scope

Build one compact culinary-school training kitchen before attempting the full city. The first milestone is a genuinely playable and visually credible PC slice, not a collection of screenshots.

## Runtime architecture

- **Player:** third-person character with camera collision, walk/run, and a planned first-person camera mode.
- **Interaction:** trace from the camera; interact only with an actor in range and within a valid viewing angle. Display a small contextual prompt near the relevant station.
- **Stations:** separate prep, cooking, seasoning, and plating actors. Each station owns its allowed actions and interaction state.
- **Items:** data-driven ingredient and utensil definitions; track item state, quantity, quality, and preparation state.
- **Recipe flow:** explicit required ingredients and steps. Cooking cannot begin until the required ingredients have been placed in the pan/pot.
- **Preparation:** cutting is an animated, timed interaction with visible knife/hand/ingredient feedback and a prepared-ingredient result.
- **UI:** contextual prompts and compact feedback only. No permanent bottom action bar.
- **Save:** add after the core loop works; save important career and restaurant state rather than transient animation state.

## Input strategy

Use Enhanced Input. Keep action definitions and mapping contexts separate for:
- Keyboard and mouse (first implementation).
- Game controller (later validation).
- Touch controls (separate mobile pass, tested on physical devices).

## Visual production rules

- Use properly licensed, high-quality human characters, kitchen props, food and animations.
- Record the source, license, attribution requirements, and modifications for every imported asset.
- Prefer realistic scanned or carefully authored materials and meshes. Use Nanite/Lumen only where supported and performant; provide scalable alternatives.
- Do not use primitive blocks, capsule people, or colored spheres as final art.
- Use real food silhouettes and recognizable cut states. Do not represent ingredients as generic colored balls.
- Use animation retargeting and IK where appropriate so hands contact knives, boards, pans, and plates convincingly.

## Performance strategy

- Validate PC visuals first.
- Keep asset budgets, texture sizes, material complexity, shadow cost, and effects under control.
- Create scalable quality tiers before mobile work.
- Test on actual target phones/tablets before claiming mobile compatibility.

## Acceptance criteria for the first kitchen slice

1. Project opens and C++ compiles in the user's installed UE5 version.
2. A believable kitchen environment loads without placeholder blockout art being presented as final.
3. Player movement and camera work reliably.
4. Context prompt appears only near the correct station.
5. Player can pick up/place a utensil and ingredient.
6. Cutting is visibly performed and changes ingredient state.
7. Cooking is unavailable until required ingredients are added.
8. Seasoning and plating are distinct manual steps.
9. No critical errors and acceptable measured performance on the tested PC.

## Explicitly out of scope for the first slice

Open-world city, school-year progression, staff simulation, business economy, multiplayer, vehicles, mobile release, and monetization. These remain in the larger product vision, but come after the core kitchen loop is proven.
