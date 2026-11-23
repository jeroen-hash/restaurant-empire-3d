extends SceneTree

const PlayerScript = preload("res://scripts/player_controller.gd")
var failures := 0

func _initialize() -> void:
	call_deferred("_run_tests")

func _run_tests() -> void:
	var player = PlayerScript.new()
	root.add_child(player)
	await process_frame
	_assert(player.camera != null and player.camera.current, "Third-person camera starts active")
	_assert(player.camera_arm is SpringArm3D, "Third-person camera uses a collision spring arm")
	_assert(is_equal_approx(player.camera_arm.spring_length, player.camera_distance), "Spring arm starts at the intended follow distance")
	_assert(player.camera_arm.collision_mask == 1, "Camera spring arm detects world walls")
	_assert(player.camera_arm.get_excluded_objects().has(player.get_rid()), "Camera spring arm ignores the player body")
	_assert(player.joystick_base != null and player.joystick_knob != null, "Mobile movement joystick is created")
	_assert(player.joystick_knob.get_parent() == player.joystick_base, "Joystick knob stays inside its base")
	_assert(player.joystick_base.mouse_filter == Control.MOUSE_FILTER_IGNORE, "Joystick does not block touch input")
	var default_joystick_position: Vector2 = player.joystick_default_position
	var touch_down := InputEventScreenTouch.new()
	touch_down.index = 4
	touch_down.position = Vector2(180, 420)
	touch_down.pressed = true
	player._unhandled_input(touch_down)
	_assert(player.active_move_touch == 4, "Touch on the left half activates movement")
	_assert(player.joystick_base.position != default_joystick_position, "Joystick follows the thumb position")
	var touch_up := InputEventScreenTouch.new()
	touch_up.index = 4
	touch_up.position = Vector2(180, 420)
	touch_up.pressed = false
	player._unhandled_input(touch_up)
	_assert(player.active_move_touch == -1, "Releasing the thumb ends movement input")
	_assert(player.joystick_base.position == default_joystick_position, "Joystick returns to its default position")

	player.set_character_type("woman")
	_assert(player.character_type == "woman", "Player can choose the female character")
	if ResourceLoader.exists("res://assets/characters/casual-woman.glb"):
		_assert(player._animation_player != null, "Female GLB loads with its animations")
	player.set_character_type("man")
	_assert(player.character_type == "man", "Player can choose the male character")
	if ResourceLoader.exists("res://assets/characters/casual-man.glb"):
		_assert(player._animation_player != null, "Male GLB loads with its animations")
	_assert(not player.first_person and player.character.visible, "Character is visible in third-person mode")
	var first_person: bool = player.toggle_camera_mode()
	_assert(first_person, "Camera switches to first-person mode")
	_assert(not player.character.visible, "Character model is hidden in first-person mode")
	_assert(is_equal_approx(player.camera_arm.spring_length, 0.08), "First-person camera moves to eye level")
	var third_person: bool = player.toggle_camera_mode()
	_assert(not third_person, "Camera switches back to third-person mode")
	_assert(player.character.visible, "Character model returns in third-person mode")
	_assert(is_equal_approx(player.camera_arm.spring_length, player.camera_distance), "Third-person camera restores follow distance")
	if failures == 0:
		print("CAMERA TESTS PASSED")
		quit(0)
	else:
		push_error("%d CAMERA TEST(S) FAILED" % failures)
		quit(1)

func _assert(condition: bool, description: String) -> void:
	if not condition:
		failures += 1
		push_error("TEST FAILED: " + description)
