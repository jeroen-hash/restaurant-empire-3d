extends CharacterBody3D
class_name PlayerController
## Third-person controller with a visible articulated humanoid and animated feet.

@export var move_speed := 4.2
@export var acceleration := 18.0
@export var gravity := 18.0
@export var mouse_sensitivity := 0.003
@export var touch_sensitivity := 0.006
@export var camera_distance := 3.25
var first_person := false
var character_type := "man"

var camera_yaw := 0.0
var camera_pitch := -0.12
var touch_move := Vector2.ZERO
var active_move_touch := -1
var active_look_touch := -1
var move_touch_origin := Vector2.ZERO
var spawn_safety_position := Vector3(-22.0, 0.0, -5.3)

var camera_pivot: Node3D
var camera: Camera3D
var character: Node3D
var left_arm: Node3D
var right_arm: Node3D
var left_leg: Node3D
var right_leg: Node3D
var left_knee: Node3D
var right_knee: Node3D
var walk_clock := 0.0
var _animation_player: AnimationPlayer

func _ready() -> void:
	name = "Player"
	var collision_shape := CapsuleShape3D.new()
	collision_shape.radius = 0.29
	collision_shape.height = 1.82
	var collision := CollisionShape3D.new()
	collision.shape = collision_shape
	collision.position.y = 0.91
	add_child(collision)

	_build_humanoid()

	camera_pivot = Node3D.new()
	camera_pivot.name = "CameraPivot"
	camera_pivot.position = Vector3(0, 1.48, 0)
	add_child(camera_pivot)

	camera = Camera3D.new()
	camera.name = "ThirdPersonCamera"
	camera.position = Vector3(0, 0.32, camera_distance)
	camera.fov = 60.0
	camera_pivot.add_child(camera)
	camera.current = true
	_build_touch_controls()

func set_character_type(value: String) -> void:
	character_type = "woman" if value.to_lower() == "woman" else "man"
	if is_inside_tree():
		if is_instance_valid(character):
			character.queue_free()
		_animation_player = null
		_build_humanoid()
		if first_person:
			character.visible = false

func toggle_camera_mode() -> bool:
	first_person = not first_person
	if first_person:
		camera_pivot.position = Vector3(0, 1.62, 0)
		camera.position = Vector3(0, 0, 0.08)
		character.visible = false
	else:
		camera_pivot.position = Vector3(0, 1.48, 0)
		camera.position = Vector3(0, 0.32, camera_distance)
		character.visible = true
	return first_person

func _mat(color: Color, roughness := 0.78) -> StandardMaterial3D:
	var material := StandardMaterial3D.new()
	material.albedo_color = color
	material.roughness = roughness
	return material

func _capsule(parent: Node3D, label: String, radius: float, height: float, material: Material, pos: Vector3) -> MeshInstance3D:
	var mesh_node := MeshInstance3D.new()
	mesh_node.name = label
	var mesh := CapsuleMesh.new()
	mesh.radius = radius
	mesh.height = height
	mesh.radial_segments = 16
	mesh.rings = 6
	mesh_node.mesh = mesh
	mesh_node.material_override = material
	mesh_node.position = pos
	parent.add_child(mesh_node)
	return mesh_node

func _sphere(parent: Node3D, label: String, radius: float, material: Material, pos: Vector3) -> MeshInstance3D:
	var node := MeshInstance3D.new()
	node.name = label
	var mesh := SphereMesh.new()
	mesh.radius = radius
	mesh.height = radius * 2.0
	mesh.radial_segments = 16
	mesh.rings = 10
	node.mesh = mesh
	node.material_override = material
	node.position = pos
	parent.add_child(node)
	return node

func _box(parent: Node3D, label: String, size: Vector3, material: Material, pos: Vector3) -> MeshInstance3D:
	var node := MeshInstance3D.new()
	node.name = label
	var mesh := BoxMesh.new()
	mesh.size = size
	node.mesh = mesh
	node.material_override = material
	node.position = pos
	parent.add_child(node)
	return node

func _build_humanoid() -> void:
	character = Node3D.new()
	character.name = "ANIMO_PlayerCharacter"
	add_child(character)

	# Prefer a real textured, rigged GLB character. Keep the procedural figure
	# only as a safe fallback if the asset is unavailable.
	var model_path := "res://assets/characters/casual-woman.glb" if character_type == "woman" else "res://assets/characters/casual-man.glb"
	var character_scene: PackedScene = null
	if ResourceLoader.exists(model_path):
		character_scene = load(model_path) as PackedScene
	if character_scene != null:
		var imported_model := character_scene.instantiate()
		imported_model.name = "RiggedHuman"
		imported_model.rotation.y = PI
		character.add_child(imported_model)
		character.scale = Vector3.ONE
		_animation_player = _find_animation_player(imported_model)
		if _animation_player != null:
			_play_character_animation("idle")
		return

	# Offline fallback for editor/test environments without the downloaded GLB.
	
	character.name = "ANIMO_Humanoid"

	var skin := _mat(Color(0.69, 0.46, 0.33))
	var shirt := _mat(Color(0.12, 0.24, 0.20))
	var shirt_light := _mat(Color(0.19, 0.34, 0.28))
	var trousers := _mat(Color(0.105, 0.13, 0.16))
	var shoe := _mat(Color(0.045, 0.052, 0.05), 0.48)
	var hair := _mat(Color(0.075, 0.055, 0.043))
	var eye := _mat(Color(0.025, 0.022, 0.02), 0.35)

	# Torso, neck and head: deliberately separate meshes so the silhouette reads as a person.
	_capsule(character, "Torso", 0.235, 0.76, shirt, Vector3(0, 1.19, 0))
	_capsule(character, "Waist", 0.205, 0.25, trousers, Vector3(0, 0.79, 0))
	_capsule(character, "Neck", 0.075, 0.18, skin, Vector3(0, 1.60, 0))
	_sphere(character, "Head", 0.185, skin, Vector3(0, 1.78, -0.005))
	_sphere(character, "Hair", 0.19, hair, Vector3(0, 1.88, 0.025))
	_box(character, "Hairline", Vector3(0.29, 0.09, 0.20), hair, Vector3(0, 1.82, -0.105))
	_sphere(character, "Ear_L", 0.045, skin, Vector3(-0.18, 1.78, 0))
	_sphere(character, "Ear_R", 0.045, skin, Vector3(0.18, 1.78, 0))
	_sphere(character, "Eye_L", 0.018, eye, Vector3(-0.065, 1.80, -0.166))
	_sphere(character, "Eye_R", 0.018, eye, Vector3(0.065, 1.80, -0.166))
	_sphere(character, "Nose", 0.027, skin, Vector3(0, 1.755, -0.18))
	_box(character, "ApronFront", Vector3(0.34, 0.47, 0.035), shirt_light, Vector3(0, 1.02, -0.224))
	_box(character, "ApronPocket", Vector3(0.12, 0.09, 0.012), trousers, Vector3(0, 1.12, -0.246))

	# Articulated arms with elbows and hands.
	left_arm = Node3D.new()
	left_arm.name = "LeftArmPivot"
	left_arm.position = Vector3(-0.28, 1.48, 0)
	character.add_child(left_arm)
	_capsule(left_arm, "UpperArm_L", 0.085, 0.48, shirt, Vector3(0, -0.22, 0))
	var left_elbow := Node3D.new()
	left_elbow.position = Vector3(0, -0.43, 0)
	left_arm.add_child(left_elbow)
	_capsule(left_elbow, "Forearm_L", 0.067, 0.40, shirt_light, Vector3(0, -0.18, 0))
	_sphere(left_elbow, "Hand_L", 0.075, skin, Vector3(0, -0.40, -0.005))

	right_arm = Node3D.new()
	right_arm.name = "RightArmPivot"
	right_arm.position = Vector3(0.28, 1.48, 0)
	character.add_child(right_arm)
	_capsule(right_arm, "UpperArm_R", 0.085, 0.48, shirt, Vector3(0, -0.22, 0))
	var right_elbow := Node3D.new()
	right_elbow.position = Vector3(0, -0.43, 0)
	right_arm.add_child(right_elbow)
	_capsule(right_elbow, "Forearm_R", 0.067, 0.40, shirt_light, Vector3(0, -0.18, 0))
	_sphere(right_elbow, "Hand_R", 0.075, skin, Vector3(0, -0.40, -0.005))

	# Separate thigh, shin and shoe pieces prevent the feet disappearing while walking.
	left_leg = Node3D.new()
	left_leg.name = "LeftLegPivot"
	left_leg.position = Vector3(-0.115, 0.86, 0)
	character.add_child(left_leg)
	_capsule(left_leg, "Thigh_L", 0.115, 0.54, trousers, Vector3(0, -0.25, 0))
	left_knee = Node3D.new()
	left_knee.name = "LeftKnee"
	left_knee.position = Vector3(0, -0.48, 0)
	left_leg.add_child(left_knee)
	_capsule(left_knee, "Shin_L", 0.082, 0.48, trousers, Vector3(0, -0.21, 0))
	_box(left_knee, "Shoe_L", Vector3(0.17, 0.105, 0.29), shoe, Vector3(0, -0.435, -0.055))

	right_leg = Node3D.new()
	right_leg.name = "RightLegPivot"
	right_leg.position = Vector3(0.115, 0.86, 0)
	character.add_child(right_leg)
	_capsule(right_leg, "Thigh_R", 0.115, 0.54, trousers, Vector3(0, -0.25, 0))
	right_knee = Node3D.new()
	right_knee.name = "RightKnee"
	right_knee.position = Vector3(0, -0.48, 0)
	right_leg.add_child(right_knee)
	_capsule(right_knee, "Shin_R", 0.082, 0.48, trousers, Vector3(0, -0.21, 0))
	_box(right_knee, "Shoe_R", Vector3(0.17, 0.105, 0.29), shoe, Vector3(0, -0.435, -0.055))

func _find_animation_player(root: Node) -> AnimationPlayer:
	if root is AnimationPlayer:
		return root as AnimationPlayer
	for child in root.get_children():
		var found := _find_animation_player(child)
		if found != null:
			return found
	return null

func _play_character_animation(wanted: String) -> void:
	if _animation_player == null:
		return
	for animation_name in _animation_player.get_animation_list():
		if animation_name.to_lower().contains(wanted):
			if _animation_player.current_animation != animation_name:
				_animation_player.play(animation_name)
			return

func _physics_process(delta: float) -> void:
	var input_vector := Vector2.ZERO
	input_vector.x = Input.get_axis("move_left", "move_right")
	input_vector.y = Input.get_axis("move_forward", "move_back")
	if touch_move.length() > 0.12:
		input_vector = touch_move
	input_vector = input_vector.limit_length(1.0)

	var forward := -camera_pivot.global_basis.z
	var right := camera_pivot.global_basis.x
	var direction := right * input_vector.x + forward * -input_vector.y
	direction.y = 0.0
	direction = direction.normalized()

	var target_velocity := direction * move_speed
	velocity.x = move_toward(velocity.x, target_velocity.x, acceleration * delta)
	velocity.z = move_toward(velocity.z, target_velocity.z, acceleration * delta)
	if not is_on_floor():
		velocity.y -= gravity * delta
	else:
		velocity.y = 0.0
	move_and_slide()
	# Recovery guard: never let a bad spawn/collision send the player endlessly below the world.
	if global_position.y < -3.0:
		global_position = spawn_safety_position
		velocity = Vector3.ZERO

	if direction.length() > 0.08:
		var target_yaw := atan2(-direction.x, -direction.z)
		character.rotation.y = lerp_angle(character.rotation.y, target_yaw, minf(delta * 11.0, 1.0))
	_animate_character(delta, Vector2(velocity.x, velocity.z).length())
	if _animation_player != null:
		_play_character_animation("walk" if Vector2(velocity.x, velocity.z).length() > 0.18 else "idle")

	camera_pivot.rotation.y = camera_yaw
	camera_pivot.rotation.x = camera_pitch

func _animate_character(delta: float, speed: float) -> void:
	if _animation_player != null:
		return
	var moving := speed > 0.18
	if moving:
		walk_clock += delta * (7.4 if speed < 3.0 else 10.0)
	else:
		walk_clock += delta * 1.8
	var stride := sin(walk_clock)
	var blend := clampf(speed / move_speed, 0.0, 1.0)
	left_leg.rotation.x = stride * 0.62 * blend
	right_leg.rotation.x = -stride * 0.62 * blend
	left_knee.rotation.x = maxf(0.0, -stride) * 0.72 * blend
	right_knee.rotation.x = maxf(0.0, stride) * 0.72 * blend
	left_arm.rotation.x = -stride * 0.42 * blend
	right_arm.rotation.x = stride * 0.42 * blend
	character.position.y = absf(sin(walk_clock * 2.0)) * 0.025 * blend
	if not moving:
		character.rotation.z = sin(walk_clock) * 0.012
	else:
		character.rotation.z = 0.0

func _unhandled_input(event: InputEvent) -> void:
	if event is InputEventMouseMotion and Input.mouse_mode == Input.MOUSE_MODE_CAPTURED:
		camera_yaw -= event.relative.x * mouse_sensitivity
		camera_pitch = clampf(camera_pitch - event.relative.y * mouse_sensitivity, -0.72, 0.18)
	elif event is InputEventMouseButton and event.button_index == MOUSE_BUTTON_RIGHT:
		Input.mouse_mode = Input.MOUSE_MODE_CAPTURED if event.pressed else Input.MOUSE_MODE_VISIBLE
	elif event is InputEventKey and event.pressed and event.keycode == KEY_ESCAPE:
		Input.mouse_mode = Input.MOUSE_MODE_VISIBLE
	elif event is InputEventScreenTouch:
		if event.pressed:
			if event.position.x < get_viewport().get_visible_rect().size.x * 0.48 and active_move_touch == -1:
				active_move_touch = event.index
				move_touch_origin = event.position
			elif active_look_touch == -1:
				active_look_touch = event.index
		else:
			if event.index == active_move_touch:
				active_move_touch = -1
				touch_move = Vector2.ZERO
			if event.index == active_look_touch:
				active_look_touch = -1
	elif event is InputEventScreenDrag:
		if event.index == active_move_touch:
			var size := get_viewport().get_visible_rect().size
			touch_move = ((event.position - move_touch_origin) / Vector2(72.0, 72.0)).limit_length(1.0)
		elif event.index == active_look_touch:
			camera_yaw -= event.relative.x * touch_sensitivity
			camera_pitch = clampf(camera_pitch - event.relative.y * touch_sensitivity, -0.72, 0.18)

func set_spawn_position(pos: Vector3) -> void:
	global_position = pos
	spawn_safety_position = pos


func _build_touch_controls() -> void:
	# Subtle on-screen guidance for touch devices; movement/look input remains handled above.
	var layer := CanvasLayer.new()
	layer.name = "TouchControls"
	layer.layer = 5
	add_child(layer)

	var base := Panel.new()
	base.name = "MoveJoystickBase"
	var viewport_size := get_viewport().get_visible_rect().size
	base.position = Vector2(viewport_size.x * 0.23 - 66.0, viewport_size.y * 0.78 - 66.0)
	base.size = Vector2(132, 132)
	var base_style := StyleBoxFlat.new()
	base_style.bg_color = Color(0.08, 0.10, 0.09, 0.34)
	base_style.border_color = Color(0.88, 0.82, 0.68, 0.55)
	base_style.set_border_width_all(2)
	base_style.set_corner_radius_all(66)
	base.add_theme_stylebox_override("panel", base_style)
	layer.add_child(base)

	var knob := Panel.new()
	knob.name = "MoveJoystickKnob"
	knob.position = Vector2(42, 42)
	knob.size = Vector2(48, 48)
	var knob_style := StyleBoxFlat.new()
	knob_style.bg_color = Color(0.82, 0.75, 0.61, 0.72)
	knob_style.border_color = Color(1.0, 0.96, 0.86, 0.8)
	knob_style.set_border_width_all(1)
	knob_style.set_corner_radius_all(24)
	knob.add_theme_stylebox_override("panel", knob_style)
	base.add_child(knob)

	var move_label := Label.new()
	move_label.text = "BEWEGEN"
	move_label.position = base.position + Vector2(36, 134)
	move_label.add_theme_font_size_override("font_size", 13)
	move_label.add_theme_color_override("font_color", Color(0.95, 0.91, 0.82, 0.88))
	layer.add_child(move_label)

	var look_label := Label.new()
	look_label.text = "SLEEP RECHTS OM CAMERA TE DRAAIEN"
	look_label.anchor_left = 1.0
	look_label.anchor_right = 1.0
	look_label.anchor_top = 1.0
	look_label.anchor_bottom = 1.0
	look_label.offset_left = -250
	look_label.offset_right = -18
	look_label.offset_top = -48
	look_label.offset_bottom = -20
	look_label.horizontal_alignment = HORIZONTAL_ALIGNMENT_RIGHT
	look_label.add_theme_font_size_override("font_size", 11)
	look_label.add_theme_color_override("font_color", Color(0.95, 0.91, 0.82, 0.82))
	layer.add_child(look_label)
