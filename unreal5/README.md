# RESTAURANT EMPIRE 3D — Unreal Engine 5

This is the separate Unreal Engine 5 implementation. The existing Godot prototype and the repository's `main` branch are intentionally left untouched.

## Project status

- [x] Dedicated `unreal5/vertical-slice` branch created from `main`.
- [x] Initial Unreal C++ project descriptor and game module scaffold added.
- [ ] Open and compile with the user's installed Unreal Engine version.
- [ ] Build the first playable kitchen vertical slice.
- [ ] Verify visuals, controls, and performance on target hardware.

## Open the project

Open `RestaurantEmpire.uproject` from this folder using Unreal Engine 5. If Unreal asks to associate an engine version, select the UE5 version installed on the computer. The project has not yet been compiled or visually tested; this scaffold is the starting point, not a finished game.

## First playable milestone

A realistic culinary-school kitchen in which the player can move around, approach a prep station, pick up ingredients and a knife, manually perform a cutting interaction, then move to cooking and plating stations. Actions must be visible in the world and must not complete automatically.

## Platform strategy

Develop and validate the first visual slice on Windows PC, while keeping input and rendering systems scalable for Android and iOS. Mobile support must be proven with profiling and device testing; it is not assumed from a successful PC build.
