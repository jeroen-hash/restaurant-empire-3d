extends Node3D
class_name WorldBuilder
## Belgian street frontage and a furnished ANIMO café.

var sun_light: DirectionalLight3D
var world_environment: WorldEnvironment

func _ready() -> void:
	_build_lighting()
	_build_world_safety_floor()
	_build_street()
	_build_cafe()
	_build_culinary_school()

func _material(color: Color, roughness := 0.78, metallic := 0.0) -> StandardMaterial3D:
	var mat := StandardMaterial3D.new()
	mat.albedo_color = color
	mat.roughness = roughness
	mat.metallic = metallic
	return mat

func _box(parent: Node3D, label: String, pos: Vector3, size: Vector3, color: Color, solid := true, roughness := 0.78) -> MeshInstance3D:
	var mesh_instance := MeshInstance3D.new()
	mesh_instance.name = label
	var box := BoxMesh.new()
	box.size = size
	mesh_instance.mesh = box
	mesh_instance.position = pos
	mesh_instance.material_override = _material(color, roughness)
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

func _collision_box(parent: Node3D, label: String, pos: Vector3, size: Vector3) -> void:
	var body := StaticBody3D.new()
	body.name = label
	var shape := CollisionShape3D.new()
	var box_shape := BoxShape3D.new()
	box_shape.size = size
	shape.shape = box_shape
	body.add_child(shape)
	body.position = pos
	parent.add_child(body)

func _cylinder(parent: Node3D, label: String, pos: Vector3, radius: float, height: float, color: Color, sides := 20) -> MeshInstance3D:
	var node := MeshInstance3D.new()
	node.name = label
	var mesh := CylinderMesh.new()
	mesh.top_radius = radius
	mesh.bottom_radius = radius
	mesh.height = height
	mesh.radial_segments = sides
	node.mesh = mesh
	node.position = pos
	node.material_override = _material(color)
	parent.add_child(node)
	return node

func _sphere(parent: Node3D, label: String, pos: Vector3, radius: float, color: Color) -> MeshInstance3D:
	var node := MeshInstance3D.new()
	node.name = label
	var mesh := SphereMesh.new()
	mesh.radius = radius
	mesh.height = radius * 2.0
	mesh.radial_segments = 16
	mesh.rings = 8
	node.mesh = mesh
	node.position = pos
	node.material_override = _material(color)
	parent.add_child(node)
	return node

func _label(parent: Node3D, text_value: String, pos: Vector3, size := 0.34, color := Color(0.94, 0.84, 0.66)) -> void:
	var label := Label3D.new()
	label.text = text_value
	label.position = pos
	label.font_size = 48
	label.pixel_size = size / 48.0
	label.modulate = color
	label.outline_size = 5
	label.outline_modulate = Color(0.035, 0.045, 0.04)
	label.horizontal_alignment = HORIZONTAL_ALIGNMENT_CENTER
	parent.add_child(label)

func _build_lighting() -> void:
	world_environment = WorldEnvironment.new()
	var environment := Environment.new()
	environment.background_mode = Environment.BG_SKY
	environment.sky = Sky.new()
	environment.ambient_light_source = Environment.AMBIENT_SOURCE_COLOR
	environment.ambient_light_color = Color(0.72, 0.76, 0.78)
	environment.ambient_light_energy = 0.72
	environment.tonemap_mode = Environment.TONE_MAPPER_FILMIC
	environment.reflected_light_source = Environment.REFLECTION_SOURCE_BG
	world_environment.environment = environment
	add_child(world_environment)

	sun_light = DirectionalLight3D.new()
	sun_light.rotation_degrees = Vector3(-48, -32, 0)
	sun_light.light_energy = 1.05
	sun_light.shadow_enabled = true
	sun_light.directional_shadow_max_distance = 38.0
	add_child(sun_light)
	set_game_time(8 * 60)

func _build_world_safety_floor() -> void:
	# Large continuous collision floor beneath the playable campus/street area.
	_collision_box(self, "WorldSafetyGround", Vector3(0, -0.42, 0), Vector3(180.0, 0.8, 180.0))
	# Soft perimeter barriers prevent walking off the playable first-city test area.
	_collision_box(self, "WorldBoundaryNorth", Vector3(0, 2.0, -82.0), Vector3(164.0, 4.0, 1.0))
	_collision_box(self, "WorldBoundarySouth", Vector3(0, 2.0, 82.0), Vector3(164.0, 4.0, 1.0))
	_collision_box(self, "WorldBoundaryWest", Vector3(-82.0, 2.0, 0), Vector3(1.0, 4.0, 164.0))
	_collision_box(self, "WorldBoundaryEast", Vector3(82.0, 2.0, 0), Vector3(1.0, 4.0, 164.0))

func _build_street() -> void:
	_box(self, "Road", Vector3(0, -0.18, 3), Vector3(42, 0.3, 32), Color(0.105, 0.115, 0.12))
	_box(self, "LeftPavement", Vector3(-5.7, 0.02, 1), Vector3(5.2, 0.28, 30), Color(0.43, 0.43, 0.40))
	_box(self, "RightPavement", Vector3(5.7, 0.02, 1), Vector3(5.2, 0.28, 30), Color(0.43, 0.43, 0.40))
	for i in range(8):
		_box(self, "RoadMarking_%02d" % i, Vector3(-15.0 + i * 4.3, -0.015, 4.5), Vector3(2.0, 0.025, 0.12), Color(0.82, 0.79, 0.68), false)
	_box(self, "Curb_Left", Vector3(-3.15, 0.17, 1), Vector3(0.18, 0.25, 30), Color(0.62, 0.61, 0.56))
	_box(self, "Curb_Right", Vector3(3.15, 0.17, 1), Vector3(0.18, 0.25, 30), Color(0.62, 0.61, 0.56))

	# Street lamps with warm glass housings.
	for z in [-8.0, 3.0, 14.0]:
		_cylinder(self, "StreetLampPost", Vector3(-7.8, 2.0, z), 0.055, 4.0, Color(0.075, 0.085, 0.08), 12)
		_box(self, "StreetLampArm", Vector3(-7.45, 3.85, z), Vector3(0.75, 0.07, 0.07), Color(0.075, 0.085, 0.08), false)
		var lamp := _sphere(self, "StreetLampGlow", Vector3(-7.08, 3.72, z), 0.16, Color(1.0, 0.76, 0.42))
		var light := OmniLight3D.new()
		light.position = Vector3(-7.08, 3.72, z)
		light.light_color = Color(1.0, 0.72, 0.40)
		light.light_energy = 0.35
		light.omni_range = 5.0
		add_child(light)

	# Restrained Belgian urban frontage opposite the café.
	for x in [-12.0, 12.0]:
		var building := Node3D.new()
		building.position = Vector3(x, 0, -8.0)
		add_child(building)
		_box(building, "NeighbourBuilding", Vector3(0, 4.2, -1.0), Vector3(8.0, 8.4, 8.0), Color(0.39, 0.36, 0.31))
		for floor_y in [2.2, 4.8, 7.1]:
			for window_x in [-2.2, 2.2]:
				_box(building, "WindowRecess", Vector3(window_x, floor_y, 3.05), Vector3(1.45, 1.5, 0.08), Color(0.10, 0.16, 0.17), false)
				_box(building, "WindowFrame", Vector3(window_x, floor_y, 2.98), Vector3(1.58, 1.63, 0.07), Color(0.16, 0.13, 0.10), false)


func _build_culinary_school() -> void:
	var school := Node3D.new()
	school.name = "ANIMO_CULINARY_SCHOOL"
	school.position = Vector3(-22.0, 0.0, -9.0)
	add_child(school)

	# Open-roof teaching kitchen so the player and the full equipment remain visible.
	_box(school, "SchoolKitchenFloor", Vector3(0, -0.14, 0), Vector3(12.0, 0.28, 10.2), Color(0.34, 0.36, 0.35))
	_box(school, "SchoolBackWall", Vector3(0, 1.8, -5.0), Vector3(12.0, 3.6, 0.25), Color(0.68, 0.67, 0.62))
	_box(school, "SchoolLeftWall", Vector3(-5.9, 1.8, 0), Vector3(0.25, 3.6, 10.0), Color(0.68, 0.67, 0.62))
	_box(school, "SchoolRightWall", Vector3(5.9, 1.8, 0), Vector3(0.25, 3.6, 10.0), Color(0.68, 0.67, 0.62))
	_box(school, "SchoolFrontLeft", Vector3(-4.55, 1.8, 5.0), Vector3(2.7, 3.6, 0.25), Color(0.68, 0.67, 0.62))
	_box(school, "SchoolFrontRight", Vector3(4.55, 1.8, 5.0), Vector3(2.7, 3.6, 0.25), Color(0.68, 0.67, 0.62))
	_box(school, "SchoolEntranceHeader", Vector3(0, 3.25, 5.0), Vector3(6.4, 0.7, 0.25), Color(0.16, 0.22, 0.19))
	_box(school, "SchoolSign", Vector3(0, 3.65, 5.18), Vector3(5.5, 0.52, 0.12), Color(0.12, 0.17, 0.15), false)
	_label(school, "ANIMO CULINARY SCHOOL", Vector3(0, 3.56, 5.10), 0.19, Color(0.91, 0.82, 0.62))
	_label(school, "PRAKTIJKKEUKEN 01", Vector3(0, 2.95, -4.72), 0.14)

	var kitchen_scene := load("res://assets/environment/working-kitchen-line.glb") as PackedScene
	if kitchen_scene != null:
		var kitchen := kitchen_scene.instantiate()
		kitchen.name = "ANIMO_Professional_Training_Kitchen"
		kitchen.position = Vector3(0.0, 0.02, -1.9)
		school.add_child(kitchen)
	else:
		push_warning("De 3D-praktijkkeuken kon niet worden geladen.")

	# Vier afzonderlijke, herkenbare praktijkstations aan de open voorzijde.
	# De speler moet fysiek naar de juiste post lopen voor elke kookhandeling.
	var station_x := [-3.0, -1.0, 1.0, 3.0]
	var station_names := ["SNIJDEN", "GAREN", "KRUIDEN", "DRESSEREN"]
	var station_accents := [Color(0.72, 0.48, 0.22), Color(0.30, 0.39, 0.43), Color(0.43, 0.52, 0.32), Color(0.62, 0.56, 0.43)]
	for i in range(4):
		var x: float = station_x[i]
		var station := Node3D.new()
		station.name = "ANIMO_Workstation_" + station_names[i]
		station.position = Vector3(x, 0.0, 2.25)
		school.add_child(station)
		_box(station, "StainlessWorkBench", Vector3(0, 0.48, 0), Vector3(1.72, 0.92, 0.92), Color(0.25, 0.28, 0.28), true, 0.34)
		_box(station, "SteelWorkTop", Vector3(0, 0.96, 0), Vector3(1.82, 0.10, 1.02), Color(0.68, 0.70, 0.68), false, 0.22)
		_box(station, "StationAccent", Vector3(0, 0.42, 0.47), Vector3(1.68, 0.12, 0.035), station_accents[i], false, 0.35)
		_label(station, station_names[i], Vector3(0, 1.72, 0.0), 0.14, Color(0.96, 0.88, 0.70))
		if i == 0:
			_box(station, "CuttingBoard", Vector3(0, 1.04, 0), Vector3(0.78, 0.045, 0.52), Color(0.56, 0.39, 0.23), false)
			_box(station, "ChefKnifeBlade", Vector3(0.36, 1.10, 0), Vector3(0.36, 0.018, 0.07), Color(0.78, 0.81, 0.80), false, 0.2)
		elif i == 1:
			_cylinder(station, "CookingPan", Vector3(0, 1.10, 0), 0.30, 0.10, Color(0.16, 0.18, 0.19), 24)
			_box(station, "PanHandle", Vector3(0.38, 1.11, 0), Vector3(0.48, 0.055, 0.08), Color(0.12, 0.13, 0.13), false)
			_cylinder(station, "InductionHob", Vector3(0, 1.035, 0), 0.38, 0.025, Color(0.08, 0.09, 0.10), 32)
		elif i == 2:
			for j in range(3):
				_cylinder(station, "SeasoningBowl_%d" % j, Vector3(-0.42 + j * 0.42, 1.10, 0), 0.13, 0.09, station_accents[j], 16)
		else:
			_cylinder(station, "PlatingPlate", Vector3(0, 1.08, 0), 0.34, 0.035, Color(0.88, 0.86, 0.79), 32)
			_cylinder(station, "PlateRim", Vector3(0, 1.105, 0), 0.30, 0.018, Color(0.96, 0.94, 0.88), 32)

	# Practical work surfaces are part of the imported professional kitchen set.
	var school_light := OmniLight3D.new()
	school_light.position = Vector3(0, 3.1, 0.8)
	school_light.light_color = Color(1.0, 0.91, 0.78)
	school_light.light_energy = 1.15
	school_light.omni_range = 13.0
	school.add_child(school_light)

func _build_cafe() -> void:
	var cafe := Node3D.new()
	cafe.name = "ANIMO_CAFE"
	cafe.position = Vector3(0, 0, -7.2)
	add_child(cafe)

	# Prefer a complete, real-scale CC0 restaurant interior over the old blockout.
	var dining_scene := load("res://assets/environment/casual-dining-restaurant-interior-60-covers.glb") as PackedScene
	if dining_scene != null:
		var dining := dining_scene.instantiate()
		dining.name = "ANIMO_60_Cover_Restaurant_Interior"
		dining.scale = Vector3.ONE * 0.8
		cafe.add_child(dining)
		# Collision boundary keeps the player inside the cut-away room while leaving the front open.
		_collision_box(cafe, "RestaurantFloorCollision", Vector3(0, -0.14, 0), Vector3(12.2, 0.28, 8.6))
		_collision_box(cafe, "RestaurantBackWallCollision", Vector3(0, 1.55, -4.25), Vector3(12.2, 3.1, 0.2))
		_collision_box(cafe, "RestaurantLeftWallCollision", Vector3(-6.05, 1.55, 0), Vector3(0.2, 3.1, 8.6))
		_collision_box(cafe, "RestaurantRightWallCollision", Vector3(6.05, 1.55, 0), Vector3(0.2, 3.1, 8.6))
		_label(cafe, "ANIMO CAFE", Vector3(0, 3.45, 4.45), 0.34)
		for x in [-3.5, 0.0, 3.5]:
			var dining_light := OmniLight3D.new()
			dining_light.position = Vector3(x, 2.65, 0.0)
			dining_light.light_color = Color(1.0, 0.82, 0.62)
			dining_light.light_energy = 0.8
			dining_light.omni_range = 5.5
			cafe.add_child(dining_light)
		return

	var wall := Color(0.17, 0.22, 0.19)
	var wood := Color(0.24, 0.15, 0.095)
	var wood_light := Color(0.48, 0.34, 0.21)
	var brass := Color(0.62, 0.43, 0.20)
	var glass := Color(0.17, 0.31, 0.32)
	var tile := Color(0.48, 0.43, 0.35)

	# Shell and tiled floor.
	_box(cafe, "InteriorFloor", Vector3(0, 0.13, 0), Vector3(12, 0.26, 10), tile)
	for x in range(-5, 6):
		_box(cafe, "FloorGroutX", Vector3(float(x), 0.265, 0), Vector3(0.018, 0.006, 9.8), Color(0.31, 0.29, 0.25), false)
	for z in range(-4, 5):
		_box(cafe, "FloorGroutZ", Vector3(0, 0.266, float(z)), Vector3(11.8, 0.006, 0.018), Color(0.31, 0.29, 0.25), false)
	_box(cafe, "BackWall", Vector3(0, 2.0, -4.85), Vector3(12, 4.0, 0.3), wall)
	_box(cafe, "LeftWall", Vector3(-5.85, 2.0, 0), Vector3(0.3, 4.0, 10), wall)
	_box(cafe, "RightWall", Vector3(5.85, 2.0, 0), Vector3(0.3, 4.0, 10), wall)
	_box(cafe, "FrontLeft", Vector3(-4.25, 2.0, 4.85), Vector3(3.5, 4.0, 0.3), wall)
	_box(cafe, "FrontRight", Vector3(4.25, 2.0, 4.85), Vector3(3.5, 4.0, 0.3), wall)
	_box(cafe, "FrontHeader", Vector3(0, 3.55, 4.85), Vector3(5.0, 0.9, 0.3), wall)
	_box(cafe, "Roof", Vector3(0, 4.1, 0), Vector3(12.3, 0.25, 10.3), Color(0.12, 0.15, 0.14))

	# Front windows, frames, double door and brass handle.
	for x in [-4.25, 4.25]:
		_box(cafe, "FrontWindowGlass", Vector3(x, 2.0, 4.66), Vector3(2.65, 2.2, 0.035), glass, false, 0.18)
		for dx in [-1.35, 1.35]:
			_box(cafe, "WindowFrameVertical", Vector3(x + dx, 2.0, 4.60), Vector3(0.07, 2.36, 0.08), brass, false, 0.36)
		_box(cafe, "WindowFrameHorizontal", Vector3(x, 0.86, 4.60), Vector3(2.75, 0.07, 0.08), brass, false, 0.36)
		_box(cafe, "WindowFrameHorizontal", Vector3(x, 3.14, 4.60), Vector3(2.75, 0.07, 0.08), brass, false, 0.36)
	_box(cafe, "DoorGlass", Vector3(0, 1.45, 4.66), Vector3(1.55, 2.75, 0.035), Color(0.12, 0.24, 0.25), false, 0.16)
	_box(cafe, "DoorFrameLeft", Vector3(-0.82, 1.45, 4.59), Vector3(0.08, 2.9, 0.09), brass, false, 0.34)
	_box(cafe, "DoorFrameRight", Vector3(0.82, 1.45, 4.59), Vector3(0.08, 2.9, 0.09), brass, false, 0.34)
	_box(cafe, "DoorHandle", Vector3(0.62, 1.35, 4.51), Vector3(0.035, 0.36, 0.05), brass, false, 0.28)

	# Exterior canopy, sign and warm wall lights.
	_box(cafe, "Awning", Vector3(0, 3.36, 5.25), Vector3(10.8, 0.16, 1.0), wood, false)
	for i in range(12):
		_box(cafe, "AwningStripe", Vector3(-5.0 + i * 0.91, 3.27, 5.27), Vector3(0.46, 0.08, 0.96), Color(0.64, 0.57, 0.42) if i % 2 == 0 else Color(0.19, 0.29, 0.24), false)
	_box(cafe, "ANIMO_SignBoard", Vector3(0, 4.48, 5.02), Vector3(5.6, 0.72, 0.20), wood, false)
	_label(cafe, "ANIMO  CAFE", Vector3(0, 4.42, 4.89), 0.35)
	for x in [-4.9, 4.9]:
		_box(cafe, "WallLightBase", Vector3(x, 2.9, 4.57), Vector3(0.22, 0.35, 0.12), brass, false)
		var glow := _sphere(cafe, "WallLight", Vector3(x, 2.86, 4.48), 0.10, Color(1.0, 0.72, 0.40))
		var warm := OmniLight3D.new()
		warm.position = glow.position
		warm.light_color = Color(1.0, 0.67, 0.36)
		warm.light_energy = 0.42
		warm.omni_range = 3.2
		cafe.add_child(warm)

	# Service counter with a stone top, brass foot rail and equipment.
	_box(cafe, "CounterBody", Vector3(0, 0.72, -2.25), Vector3(6.0, 1.15, 1.1), wood)
	_box(cafe, "CounterFrontPanel", Vector3(0, 0.74, -1.68), Vector3(5.7, 0.78, 0.035), wood_light, false)
	_box(cafe, "CounterTop", Vector3(0, 1.34, -2.25), Vector3(6.2, 0.12, 1.2), Color(0.47, 0.48, 0.43), false, 0.25)
	_cylinder(cafe, "FootRail", Vector3(0, 0.24, -1.54), 0.025, 5.4, brass, 16)
	_box(cafe, "EspressoMachineBase", Vector3(-1.45, 1.63, -2.35), Vector3(1.25, 0.52, 0.62), Color(0.19, 0.21, 0.20), false, 0.24)
	_box(cafe, "EspressoMachineTop", Vector3(-1.45, 1.92, -2.35), Vector3(1.30, 0.08, 0.66), brass, false, 0.28)
	for x in [-1.8, -1.45, -1.1]:
		_cylinder(cafe, "CoffeeGroup", Vector3(x, 1.50, -1.99), 0.08, 0.10, Color(0.10, 0.11, 0.10), 16)
	_box(cafe, "CoffeeGrinder", Vector3(-2.55, 1.62, -2.35), Vector3(0.34, 0.58, 0.34), Color(0.12, 0.13, 0.12), false, 0.25)
	_cylinder(cafe, "GrinderHopper", Vector3(-2.55, 1.98, -2.35), 0.14, 0.18, Color(0.26, 0.23, 0.18), 16)

	# Bottle and glass shelves against the rear wall.
	_box(cafe, "BackShelf", Vector3(0, 2.5, -4.55), Vector3(7.5, 0.10, 0.42), wood_light, false)
	_box(cafe, "BackShelfLower", Vector3(0, 1.78, -4.55), Vector3(7.5, 0.10, 0.42), wood_light, false)
	for i in range(9):
		var x := -3.3 + float(i) * 0.82
		_cylinder(cafe, "Bottle_%02d" % i, Vector3(x, 2.82, -4.55), 0.085, 0.42, Color(0.20, 0.34, 0.25) if i % 2 == 0 else Color(0.48, 0.28, 0.13), 12)
		_cylinder(cafe, "BottleNeck_%02d" % i, Vector3(x, 3.07, -4.55), 0.035, 0.12, Color(0.20, 0.34, 0.25), 12)

	# Real-world CC0 furniture models are used where available. Keep collision
	# geometry simple and separate from the visual GLB assets for mobile performance.
	var table_scene := load("res://assets/environment/restaurant-2-top-table-set.glb") as PackedScene
	if table_scene != null:
		for row in range(2):
			for col in range(2):
				var table_set := table_scene.instantiate()
				table_set.name = "ANIMO_TableSet_%02d_%02d" % [row, col]
				table_set.position = Vector3(-3.0 + float(col) * 6.0, 0.27, -0.2 + float(row) * 2.5)
				table_set.scale = Vector3.ONE * 0.92
				cafe.add_child(table_set)
	else:
		# Lightweight fallback while the licensed GLB is unavailable.
		for row in range(2):
			for col in range(2):
				var x := -3.2 + float(col) * 6.4
				var z := 0.0 + float(row) * 2.45
				_cylinder(cafe, "TablePedestal", Vector3(x, 0.57, z), 0.10, 1.0, Color(0.12, 0.12, 0.11), 16)
				_box(cafe, "TableTop", Vector3(x, 1.08, z), Vector3(1.65, 0.12, 0.95), wood_light, false)
				for cx in [-0.55, 0.55]:
					_cylinder(cafe, "ChairLeg", Vector3(x + cx, 0.30, z + 0.78), 0.035, 0.58, wood, 10)
					_box(cafe, "ChairSeat", Vector3(x + cx, 0.60, z + 0.78), Vector3(0.52, 0.10, 0.48), wood_light, false)
					_box(cafe, "ChairBack", Vector3(x + cx, 0.94, z + 0.98), Vector3(0.52, 0.62, 0.09), wood, false)

	var service_scene := load("res://assets/environment/restaurant-service-station.glb") as PackedScene
	if service_scene != null:
		var service_station := service_scene.instantiate()
		service_station.name = "ANIMO_ServiceStation_3D"
		service_station.position = Vector3(4.25, 0.27, -3.2)
		service_station.scale = Vector3.ONE * 0.88
		cafe.add_child(service_station)

	# Ceiling pendants with warm light pools.
	for x in [-3.0, 0.0, 3.0]:
		_cylinder(cafe, "PendantCable", Vector3(x, 3.55, -0.5), 0.018, 0.85, Color(0.08, 0.08, 0.07), 8)
		_cylinder(cafe, "PendantShade", Vector3(x, 3.10, -0.5), 0.24, 0.16, brass, 20)
		var pendant_light := OmniLight3D.new()
		pendant_light.position = Vector3(x, 2.98, -0.5)
		pendant_light.light_color = Color(1.0, 0.73, 0.48)
		pendant_light.light_energy = 0.55
		pendant_light.omni_range = 5.0
		cafe.add_child(pendant_light)

	# Plants soften the corners without blocking the entrance.
	for x in [-5.0, 5.0]:
		_cylinder(cafe, "Planter", Vector3(x, 0.43, 3.45), 0.38, 0.72, Color(0.22, 0.16, 0.12), 20)
		_sphere(cafe, "PlantCanopy", Vector3(x, 1.15, 3.45), 0.62, Color(0.12, 0.25, 0.16))
		_sphere(cafe, "PlantCanopyTop", Vector3(x + 0.18, 1.55, 3.4), 0.38, Color(0.16, 0.31, 0.19))

	# Wall art, trim and service details.
	_box(cafe, "MenuBoard", Vector3(-4.9, 2.65, -4.62), Vector3(1.15, 1.25, 0.08), Color(0.055, 0.075, 0.065), false)
	_label(cafe, "MENU", Vector3(-4.9, 2.86, -4.55), 0.17)
	_label(cafe, "KOFFIE  •  LUNCH  •  TAART", Vector3(-4.9, 2.48, -4.54), 0.075, Color(0.83, 0.76, 0.61))

func set_game_time(minutes: int) -> void:
	if sun_light == null or world_environment == null:
		return
	var minute_of_day := posmod(minutes, 1440)
	var phase := float(minute_of_day) / 1440.0 * TAU
	var daylight := clampf((sin(phase - PI * 0.5) + 0.12) / 0.78, 0.0, 1.0)
	sun_light.rotation_degrees.x = cos(phase) * 68.0
	sun_light.light_energy = lerpf(0.10, 1.05, daylight)
	world_environment.environment.ambient_light_energy = lerpf(0.18, 0.72, daylight)


func show_cooking_action(action: String) -> void:
	var school := get_node_or_null("ANIMO_CULINARY_SCHOOL")
	if school == null:
		return
	if action == "prepare":
		for old_station_name in ["ANIMO_Workstation_SNIJDEN", "ANIMO_Workstation_GAREN", "ANIMO_Workstation_KRUIDEN", "ANIMO_Workstation_DRESSEREN"]:
			var old_station := school.get_node_or_null(old_station_name)
			if old_station != null:
				for child in old_station.get_children():
					if child.name.begins_with("ActionVisual_"):
						old_station.remove_child(child)
						child.queue_free()
	var station_names := {
		"prepare": "ANIMO_Workstation_SNIJDEN",
		"load_pan": "ANIMO_Workstation_GAREN",
		"cook": "ANIMO_Workstation_GAREN",
		"season": "ANIMO_Workstation_KRUIDEN",
		"plate": "ANIMO_Workstation_DRESSEREN"
	}
	var station := school.get_node_or_null(str(station_names.get(action, "")))
	if station == null:
		return
	var visual_name := "ActionVisual_" + action
	if station.has_node(visual_name):
		return
	var visual := Node3D.new()
	visual.name = visual_name
	station.add_child(visual)
	if action == "prepare":
		# Cut vegetables as small, recognisable food pieces on the board.
		for i in range(5):
			var carrot := _cylinder(visual, "CarrotSlice_%02d" % i, Vector3(-0.25 + float(i) * 0.12, 1.12, -0.10), 0.045, 0.11, Color(0.86, 0.31, 0.08), 12)
			carrot.rotation.z = PI * 0.5
			_box(visual, "OnionDice_%02d" % i, Vector3(-0.22 + float(i) * 0.11, 1.12, 0.12), Vector3(0.075, 0.055, 0.07), Color(0.88, 0.82, 0.67), false)
	elif action == "load_pan":
		# Visible food enters the pan only after the player presses the contextual load action.
		for i in range(3):
			var chicken := _box(visual, "ChickenPiece_%02d" % i, Vector3(-0.12 + float(i) * 0.12, 1.18, -0.06 + float(i % 2) * 0.12), Vector3(0.14, 0.065, 0.10), Color(0.79, 0.60, 0.40), false)
			chicken.rotation.y = float(i) * 0.55
		for i in range(3):
			var carrot_piece := _cylinder(visual, "CarrotPiece_%02d" % i, Vector3(-0.12 + float(i) * 0.12, 1.20, 0.12), 0.035, 0.10, Color(0.88, 0.31, 0.07), 12)
			carrot_piece.rotation.z = PI * 0.5
	elif action == "cook":
		var heat := OmniLight3D.new()
		heat.name = "VisibleCookingHeat"
		heat.position = Vector3(0, 1.25, 0)
		heat.light_color = Color(1.0, 0.28, 0.06)
		heat.light_energy = 1.1
		heat.omni_range = 2.2
		visual.add_child(heat)
		var heat_pulse := visual.create_tween()
		heat_pulse.set_loops()
		heat_pulse.tween_property(heat, "light_energy", 1.75, 0.32)
		heat_pulse.tween_property(heat, "light_energy", 0.62, 0.32)
		for i in range(3):
			var steam := _box(visual, "CookingSteam_%02d" % i, Vector3(-0.18 + float(i) * 0.18, 1.38, 0), Vector3(0.035, 0.22, 0.035), Color(0.86, 0.89, 0.88), false)
			steam.transparency = 0.48
	elif action == "season":
		for i in range(4):
			var spice := _box(visual, "Seasoning_%02d" % i, Vector3(-0.18 + float(i) * 0.12, 1.20, -0.08 + float(i % 2) * 0.12), Vector3(0.055, 0.025, 0.055), Color(0.76, 0.56, 0.20) if i % 2 == 0 else Color(0.34, 0.43, 0.20), false)
	elif action.begins_with("plate_"):
		var plate_station := station
		if not plate_station.has_node("ActionVisual_plate_main"):
			var base := Node3D.new()
			base.name = "ActionVisual_plate_main"
			plate_station.add_child(base)
			# White ceramic plate with a raised rim, clearly visible from the player camera.
			var plate_center := _cylinder(base, "CeramicPlate", Vector3(0, 1.08, 0), 0.34, 0.045, Color(0.94, 0.93, 0.88), 48)
			var plate_rim := MeshInstance3D.new()
			plate_rim.name = "CeramicPlateRim"
			var rim_mesh := TorusMesh.new()
			rim_mesh.inner_radius = 0.29
			rim_mesh.outer_radius = 0.34
			plate_rim.mesh = rim_mesh
			plate_rim.position = Vector3(0, 1.11, 0)
			plate_rim.material_override = _material(Color(0.98, 0.97, 0.93), 0.22)
			base.add_child(plate_rim)
		if action == "plate_main":
			var main_food := Node3D.new()
			main_food.name = "ActionVisual_plate_main"
			station.add_child(main_food)
			var steak := MeshInstance3D.new()
			steak.name = "SearedChickenFillet"
			var steak_mesh := CapsuleMesh.new()
			steak_mesh.radius = 0.115
			steak_mesh.height = 0.34
			steak.mesh = steak_mesh
			steak.position = Vector3(-0.09, 1.19, -0.04)
			steak.rotation_degrees = Vector3(0, 0, 90)
			steak.scale = Vector3(1.0, 0.72, 0.52)
			steak.material_override = _material(Color(0.48, 0.24, 0.12), 0.48)
			main_food.add_child(steak)
		elif action == "plate_side":
			var side := Node3D.new()
			side.name = "ActionVisual_plate_side"
			station.add_child(side)
			for i in range(3):
				var potato := _box(side, "RoastedPotatoWedge_%02d" % i, Vector3(0.12 + float(i) * 0.045, 1.18, -0.16 + float(i) * 0.13), Vector3(0.15, 0.07, 0.075), Color(0.78, 0.62, 0.32), false)
				potato.rotation.y = -0.25 + float(i) * 0.25
		elif action == "plate_veg":
			var vegetables := Node3D.new()
			vegetables.name = "ActionVisual_plate_veg"
			station.add_child(vegetables)
			for i in range(3):
				var carrot := _cylinder(vegetables, "GlazedCarrot_%02d" % i, Vector3(-0.16 + float(i) * 0.11, 1.18, 0.18), 0.035, 0.13, Color(0.88, 0.32, 0.07), 12)
				carrot.rotation.z = PI * 0.5
			for i in range(2):
				var broccoli := _cylinder(vegetables, "BroccoliStem_%02d" % i, Vector3(0.18, 1.20, 0.08 + float(i) * 0.10), 0.035, 0.11, Color(0.25, 0.42, 0.16), 10)
				broccoli.rotation.z = PI * 0.5
		elif action == "plate_finish":
			var finish := Node3D.new()
			finish.name = "ActionVisual_plate_finish"
			station.add_child(finish)
			var sauce := _cylinder(finish, "SauceSwipe", Vector3(0.02, 1.145, 0.18), 0.045, 0.22, Color(0.55, 0.16, 0.08), 24)
			sauce.rotation.z = PI * 0.5
			var herb := _box(finish, "FreshHerbGarnish", Vector3(-0.18, 1.205, 0.02), Vector3(0.10, 0.012, 0.045), Color(0.22, 0.42, 0.16), false)

