extends CharacterBody3D
class_name PlayerController
## Derde-persoonsbesturing. Links slepen = bewegen, rechts slepen = camera draaien.

@export var move_speed := 4.2
@export var acceleration := 18.0
@export var gravity := 18.0
@export var mouse_sensitivity := 0.003
@export var touch_sensitivity := 0.006

var camera_yaw := 0.0
var camera_pitch := -0.18
var touch_move := Vector2.ZERO
var active_move_touch := -1
var active_look_touch := -1
var last_touch_position := Vector2.ZERO

var camera_pivot: Node3D
var camera: Camera3D

func _ready() -> void:
	name = "Player"
	var capsule := CapsuleShape3D.new()
	capsule.radius = 0.34
	capsule.height = 1.75
	var collision := CollisionShape3D.new()
	collision.shape = capsule
	collision.position.y = 0.88
	add_child(collision)

	var body_mesh := MeshInstance3D.new()
	var body := CapsuleMesh.new()
	body.radius = 0.34
	body.height = 1.75
	body_mesh.mesh = body
	body_mesh.position.y = 0.88
	var skin := StandardMaterial3D.new()
	skin.albedo_color = Color(0.23, 0.32, 0.29)
	body_mesh.material_override = skin
	add_child(body_mesh)

	camera_pivot = Node3D.new()
	camera_pivot.name = "CameraPivot"
	camera_pivot.position = Vector3(0, 1.45, 0)
	add_child(camera_pivot)

	camera = Camera3D.new()
	camera.name = "ThirdPersonCamera"
	camera.position = Vector3(0, 2.1, 5.6)
	camera.rotation.x = 0.23
	camera.fov = 68.0
	camera_pivot.add_child(camera)
	camera.current = true

func _physics_process(delta: float) -> void:
	var input_vector := Vector2.ZERO
	input_vector.x = Input.get_axis("move_left", "move_right")
	input_vector.y = Input.get_axis("move_forward", "move_back")
	if touch_move.length() > 0.12:
		input_vector = touch_move
	input_vector = input_vector.limit_length(1.0)

	var forward := -camera_pivot.global_basis.z
	var right := camera_pivot.global_basis.x
	var direction := (right * input_vector.x + forward * -input_vector.y)
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

	camera_pivot.rotation.y = camera_yaw
	camera_pivot.rotation.x = camera_pitch

func _unhandled_input(event: InputEvent) -> void:
	if event is InputEventMouseMotion and Input.mouse_mode == Input.MOUSE_MODE_CAPTURED:
		camera_yaw -= event.relative.x * mouse_sensitivity
		camera_pitch = clampf(camera_pitch - event.relative.y * mouse_sensitivity, -0.75, 0.25)
	elif event is InputEventMouseButton and event.button_index == MOUSE_BUTTON_RIGHT:
		Input.mouse_mode = Input.MOUSE_MODE_CAPTURED if event.pressed else Input.MOUSE_MODE_VISIBLE
	elif event is InputEventKey and event.pressed and event.keycode == KEY_ESCAPE:
		Input.mouse_mode = Input.MOUSE_MODE_VISIBLE
	elif event is InputEventScreenTouch:
		if event.pressed:
			if event.position.x < get_viewport().get_visible_rect().size.x * 0.48 and active_move_touch == -1:
				active_move_touch = event.index
				last_touch_position = event.position
			elif active_look_touch == -1:
				active_look_touch = event.index
				last_touch_position = event.position
		else:
			if event.index == active_move_touch:
				active_move_touch = -1
				touch_move = Vector2.ZERO
			if event.index == active_look_touch:
				active_look_touch = -1
	elif event is InputEventScreenDrag:
		if event.index == active_move_touch:
			var size := get_viewport().get_visible_rect().size
			var center := Vector2(size.x * 0.23, size.y * 0.78)
			touch_move = ((event.position - center) / Vector2(100.0, 100.0)).limit_length(1.0)
		elif event.index == active_look_touch:
			camera_yaw -= event.relative.x * touch_sensitivity
			camera_pitch = clampf(camera_pitch - event.relative.y * touch_sensitivity, -0.75, 0.25)

func set_spawn_position(pos: Vector3) -> void:
	global_position = pos
