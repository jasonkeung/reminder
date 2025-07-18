import json
from typing import List, Dict

class Tile:
    def __init__(self, tile_id: int, description: str = ""):
        self.tile_id = tile_id
        self.description = description

    def __str__(self):
        return f"Tile(id={self.tile_id}, description='{self.description}')"

    # Static map from int to text description
    TILE_DESCRIPTIONS = {
        0: "Empty",
        26: "Trunk of a tree",
        29: "Trunk of a tree",
        64: "Shadow under a tree, shadow on the right",
        65: "Base trunk of a tree",
        66: "Shadow under a tree, shadow on the left",
        67: "Shadow under a tree, shadow on the right",
        68: "Base trunk of a tree",
        69: "Shadow under a tree, shadow on the left",
        128: "Grass",
        149: "Water",
        205: "Grass with a lot of taller grass",
        206: "Grass with some taller grass",
        207: "Grass with a little taller grass",
        399: "Beach border, with water on top",
        452: "Sand",
        454: "Beach border, with water on left",
        455: "Sand",
        456: "Beach border, with water on right",
        # 180: "Sand border, with sand on left",
        # 181: "Beach border with water on left",
        # 182: "Sand",
        # 183: "Beach border with water on right",


        # 11: "Sand with space on bottom right",
        # 12: "Sand with space on bottom left",
        # 13: "Small pile of sand in water",
        # 14: "Sand with water on bottom right",
        # 15: "Sand with water on bottom left",
        # 66: "Patch of sand",
        # 67: "Sand with space on top right",
        # 68: "Sand with space on top left",
        # 69: "Patch of sand on water",
        # 70: "Sand with water on top right",
        # 71: "Sand with water on top left",
        # 100: "Ground water hole border, with water on bottom right",
        # 101: "Ground water hole border, with water on bottom",
        # 102: "Ground water hole border, with water on bottom left",
        # 122: "Sand border, with sand on bottom right",
        # 123: "Sand border, with sand on bottom",
        # 124: "Sand border, with sand on bottom left",
        # 125: "Beach border, with sand on bottom right",
        # 126: "Beach border, with sand on bottom",
        # 127: "Beach border, with sand on bottom left",
        # 139: "Ground water hold border, with water on right",
        # 140: "Water",
        # 141: "Ground water hold border, with water on left",
        # 149: "Water",
        # 178: "Sand border, with sand on right",
        # 179: "Sand",
        # 180: "Sand border, with sand on left",
        # 181: "Beach border with water on left",
        # 182: "Sand",
        # 183: "Beach border with water on right",

        # 234: "Sand border, with sand on top right",
        # 235: "Sand border, with sand on top",
        # 236: "Sand border, with sand on top left",
        # 237: "Beach border, with sand on top right",
        # 238: "Beach border, with sand on top",
        # 239: "Beach border, with sand on top left",
        # 290: "Sand",
        # 291: "Sand",
        # 292: "Sand",
        # 293: "Sand",
        # 294: "Sand",
        # 295: "Sand",
        # 587: "Crate of peppers",
        # 588: "Crate of carrots",
        # 589: "Crate of artichokes",
        # 590: "Crate of cucumbers",
        # 591: "Crate of potatoes",
        # 592: "Crate of tomatoes",
        # 593: "Crate of corn",
    }

class Layer:
    def __init__(self, name: str, tiles: List[List[int]], walkable: bool):
        self.name = name
        self.tiles = tiles
        print(self.tiles)
        self.walkable = walkable

    def get_tile(self, x: int, y: int) -> int:
        if y < 0 or y >= len(self.tiles) or x < 0 or x >= len(self.tiles[0]):
            raise IndexError("Tile coordinates out of bounds")
        return self.tiles[y][x]
    
    def __str__(self):
        return f"Layer(name={self.name}, tiles={self.tiles}, walkable={self.walkable})"

class Map:
    def __init__(self, path: str):
        with open(path, 'r') as f:
            self.raw = json.load(f)
        
        self.width = self.raw['width']
        self.height = self.raw['height']
        self.layers = self._parse_layers()

    def _parse_layers(self) -> Dict[str, Layer]:
        layer_map = {}
        for layer in self.raw.get('layers', []):
            if layer['type'] != 'tilelayer':
                continue

            name = layer['name']
            data = layer['data']
            width = layer['width']
            height = layer['height']

            matrix = [
                data[y * width:(y + 1) * width]
                for y in range(height)
            ]
            # Determine walkable property: not walkable if "[blocked]" in name
            walkable = "[blocked]" not in name
            layer_map[name] = Layer(name, matrix, walkable)
        
        return layer_map

    def get_layer(self, name: str) -> Layer:
        maybeLayer = self.layers.get(name)
        if maybeLayer is None:
            raise ValueError(f"Layer '{name}' not found")
        return maybeLayer

    def get_all_layers(self) -> Dict[str, Layer]:
        return self.layers
    
    def is_walkable(self, x, y):
        for layer in self.layers.values():
            if not layer.walkable:
                tile = layer.get_tile(x, y)
                if tile != 0:
                    return False
        return True

if __name__ == "__main__":
    map_path = "basemap.tmj"
    m = Map(map_path)
    for layer_name, layer in m.get_all_layers().items():
        print(f"Layer: {layer.name}")
        print(f"Walkable: {layer.walkable}")
        print("Tiles:")
        for row in layer.tiles:
            print(row)
        print()