extends Node3D
class_name WorldBuilder
## Eerste speelbare blok: straat, trottoir en een café met een echte deuropening.

func _ready() -> void:
	_build_lighting()
	_build_street()
	_build_cafe()

func _material(color: Color, roughness := 0.82) -> StandardMaterial3D:
	var mat := StandardMaterial3D.new()
	mat.albedo_color = color
	mat.roughness = roughness
	return mat

func _box(parent: Node3D, label: String, pos: Vector3, size: Vector3, color: Color, solid := true) -> MeshInstance3D:
	var mesh_instance := MeshInstance3D.new()
	mesh_instance.name = label
	var box := BoxMesh.new()
	box.size = size
	mesh_instance.mesh = box
	mesh_instance.position = pos
	mesh_instance.material_override = _material(color)
	parent.add_child(mesh_instance)
	if solid:
		var body := StaticBody3D.new()
		body.name = label + "Collision"
		var shape := CollisionShape3D.new()
		var box_shape := BoxShape3D.new()
		box_shape.size = size
		shape.shape = box_shape
		body.add_child(shape)
		body.position = pos
		parent.add_child(body)
	return mesh_instance

func _build_lighting() -> void:
	var world_environment := WorldEnvironment.new()
	var environment := Environment.new()
	environment.background_mode = Environment.BG_SKY
	environment.sky = Sky.new()
	environment.ambient_light_source = Environment.AMBIENT_SOURCE_COLOR
	environment.ambient_light_color = Color(0.62, 0.68, 0.72)
	environment.ambient_light_energy = 0.55
	environment.tonemap_mode = Environment.TONE_MAPPER_FILMIC
	world_environment.environment = environment
	add_child(world_environment)

	var sun := DirectionalLight3D.new()
	sun.rotation_degrees = Vector3(-48, -32, 0)
	sun.light_energy = 1.15
	sun.shadow_enabled = true
	add_child(sun)

func _build_street() -> void:
	_box(self, "Road", Vector3(0, -0.18, 3), Vector3(38, 0.3, 28), Color(0.12, 0.14, 0.14))
	_box(self, "LeftPavement", Vector3(-5.7, 0.02, 1), Vector3(5.2, 0.28, 26), Color(0.38, 0.39, 0.36))
	_box(self, "RightPavement", Vector3(5.7, 0.02, 1), Vector3(5.2, 0.28, 26), Color(0.38, 0.39, 0.36))
	for i in range(7):
		_box(self, "RoadMarking_%02d" % i, Vector3(-13.0 + i * 4.3, -0.015, 4.5), Vector3(2.0, 0.025, 0.12), Color(0.78, 0.76, 0.65), false)

func _build_cafe() -> void:
	var cafe := Node3D.new()
	cafe.name = "ANIMO_CAFE"
	cafe.position = Vector3(0, 0, -7.2)
	add_child(cafe)

	_box(cafe, "InteriorFloor", Vector3(0, 0.13, 0), Vector3(12, 0.26, 10), Color(0.34, 0.29, 0.23))
	_box(cafe, "BackWall", Vector3(0, 2.0, -4.85), Vector3(12, 4.0, 0.3), Color(0.25, 0.29, 0.27))
	_box(cafe, "LeftWall", Vector3(-5.85, 2.0, 0), Vector3(0.3, 4.0, 10), Color(0.28, 0.31, 0.29))
	_box(cafe, "RightWall", Vector3(5.85, 2.0, 0), Vector3(0.3, 4.0, 10), Color(0.28, 0.31, 0.29))
	_box(cafe, "FrontLeft", Vector3(-4.25, 2.0, 4.85), Vector3(3.5, 4.0, 0.3), Color(0.20, 0.24, 0.22))
	_box(cafe, "FrontRight", Vector3(4.25, 2.0, 4.85), Vector3(3.5, 4.0, 0.3), Color(0.20, 0.24, 0.22))
	_box(cafe, "FrontHeader", Vector3(0, 3.55, 4.85), Vector3(5.0, 0.9, 0.3), Color(0.20, 0.24, 0.22))
	_box(cafe, "Roof", Vector3(0, 4.1, 0), Vector3(12.3, 0.25, 10.3), Color(0.15, 0.18, 0.17))
	_box(cafe, "Counter", Vector3(0, 0.72, -2.25), Vector3(6.0, 1.15, 1.1), Color(0.20, 0.14, 0.10))
	_box(cafe, "CounterTop", Vector3(0, 1.34, -2.25), Vector3(6.2, 0.12, 1.2), Color(0.52, 0.43, 0.31))
	for x in [-3.5, 3.5]:
		_box(cafe, "WindowGlass", Vector3(x, 2.0, 4.68), Vector3(2.7, 2.2, 0.06), Color(0.22, 0.39, 0.42), false)
	_box(cafe, "ANIMO_Sign", Vector3(0, 4.5, 4.9), Vector3(5.2, 0.7, 0.25), Color(0.72, 0.48, 0.24), false)
