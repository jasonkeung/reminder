from typing import List
from enum import Enum, auto
import json
import random
from .map import Map, Layer, Tile
from .think import Brain

class Player:
    class FacingDirection(Enum):
        UP = (0, -1)
        DOWN = (0, 1)
        LEFT = (-1, 0)
        RIGHT = (1, 0)

        def __init__(self, dx, dy):
            self.dx = dx
            self.dy = dy

        @staticmethod
        def from_move(oldX: int, oldY: int, newX: int, newY: int):
            dx = newX - oldX
            dy = newY - oldY
            for direction in Player.FacingDirection:
                if direction.dx == dx and direction.dy == dy:
                    return direction
            return None
        



    def __init__(self, world, playerId: str, x: int = 0, y: int = 0, facingDirection: FacingDirection = FacingDirection.DOWN):
        self.world = world
        self.playerId = playerId
        self.x = x
        self.y = y
        self.facingDirection = facingDirection
        self.thought = ""
        self.memory = ""

    def to_dict(self):
        return {
            "playerId": self.playerId,
            "x": self.x,
            "y": self.y,
            "facingDirection": self.facingDirection.name,
            "thought": self.thought
        }

    def move(self, dx: int, dy: int):
        self.x += dx
        self.y += dy

    def moveIfValid(self, new_x: int, new_y: int):
        direction = Player.FacingDirection.from_move(self.x, self.y, new_x, new_y)
        if direction is not None:
            if abs(new_x - self.x) + abs(new_y - self.y) == 1:
                if self.facingDirection == direction:
                    if self.world.map.is_walkable(new_x, new_y):
                        self.move(direction.dx, direction.dy)
                        return True
                    
        return False
    
    def moveOrFaceRandom(self):
        directions = list(Player.FacingDirection)
        min_x, min_y = 1, 1
        max_x = self.world.worldWidth - 1
        max_y = self.world.worldHeight - 1

        # 75% chance to move in the current facing direction, 25% to pick another direction
        if random.random() < 0.75:
            dir = self.facingDirection
        else:
            other_dirs = [d for d in directions if d != self.facingDirection]
            dir = random.choice(other_dirs)

        dx, dy = dir.dx, dir.dy

        new_x = self.x + dx
        new_y = self.y + dy

        if (min_x <= new_x <= max_x) and (min_y <= new_y <= max_y) and self.world.map.is_walkable(new_x, new_y):
            if self.facingDirection != dir:
                self.face(dir)
            else:
                self.move(dx, dy)
        else:
            # If can't move, just face the direction
            if self.facingDirection != dir:
                self.face(dir)

    def face(self, direction: FacingDirection):
        self.facingDirection = direction

    def update(self, brain):
        self.moveOrFaceRandom()
        # senses = self.observe()
        # brain_output = brain.think(senses, self.memory)
        # # new_thought would have REMEMBER: <thing to remember> in new_thought, update memory with "thing to remember" if REMEMBER is in new_thought
        # try:
        #     thought_json = json.loads(brain_output)
        #     self.thought = thought_json.get("new_thought", "")
        #     walk = thought_json.get("walk", None)
        #     face = thought_json.get("face", None)
        #     new_memory = thought_json.get("new_memory", None)
        # except Exception as e:
        #     print(f"Error parsing brain_output: {e}")
        #     walk = None
        #     face = None
        #     new_memory = None
        # if new_memory:
        #     self.memory = new_memory
        #     print(f"New memory: {new_memory}")
        # if walk:
        #     # translate to a walk call from the text in the new_thought
        #     dx, dy = self.facingDirection.dx, self.facingDirection.dy
        #     if self.moveIfValid(self.x + dx, self.y + dy):
        #         self.memory = "walked|" + self.memory
        #     else:
        #         self.memory = "failed to walk|"
        #     if len(self.memory) > 500:
        #         self.memory = self.memory[:500]
        #     print(f"Tried to ({self.x}, {self.y}) in direction {self.facingDirection.name}")
        # if face:
        #     # translate to a face call from the text in the new_thought
        #     print("trying to face direction:", face)
        #     direction = Player.FacingDirection[face]
        #     self.face(direction)
        #     self.memory = f"faced {direction}|" + self.memory
        #     print(f"Faced {direction.name} at ({self.x}, {self.y})")
        
        # print("\n-------Brain-------")
        # print(f"Senses: {senses}")
        # print(f"New thought: {self.thought}")
        # print(f"Updated memory: {self.memory}")
        # print("--------------------\n")

    def observe(self):
        observation = f"Facing {self.facingDirection.name} at ({self.x}, {self.y})"

        seeing_distance = 5
        for i in range(seeing_distance):
            dx, dy = self.facingDirection.dx * i, self.facingDirection.dy * i
            front_x = self.x + dx
            front_y = self.y + dy

            if (front_x < 0 or front_x >= self.world.worldWidth or
                front_y < 0 or front_y >= self.world.worldHeight):
                observation += f"\nSeeing the world edge at ({front_x}, {front_y})."
            else:
                layers = []
                for layer in self.world.map.layers.values():
                    tile = layer.get_tile(front_x, front_y)
                    layers.append(Tile.TILE_DESCRIPTIONS.get(tile, ""))
                observation += f"\nSeeing {i} tiles away at ({front_x}, {front_y}): {layers}."

        return observation

class Action:
    pass

class WalkPlayer(Action):
    def __init__(self, playerId: str, oldX: int, oldY: int, newX: int, newY: int):
        self.playerId = playerId
        self.oldX = oldX
        self.oldY = oldY
        self.newX = newX
        self.newY = newY

    def to_dict(self):
        return {
            "type": "WalkPlayer",
            "playerId": self.playerId,
            "oldX": self.oldX,
            "oldY": self.oldY,
            "newX": self.newX,
            "newY": self.newY
        }

class World:
    def __init__(self, map_name: str, worldWidth: int = 20, worldHeight: int = 20):
        self.map_name = map_name
        self.worldWidth = worldWidth
        self.worldHeight = worldHeight

        self.map = Map(f"maps/{self.map_name}.tmj")
        self.brain = Brain()
        
        # self.objects: dict[str, WorldObject] = {}
        self.players: dict[str, Player] = {}

    def set_map_name(self, map_name: str):
        self.map_name = map_name

    def set_world_width(self, width: int):
        self.worldWidth = width

    def set_world_height(self, height: int):
        self.worldHeight = height

    # def add_object(self, obj: WorldObject):
    #     self.objects[obj.name] = obj

    def add_player(self, player: Player):
        self.players[player.playerId] = player

    def setup(self):
        print("Setting up world...")
        self.set_world_width(30)
        self.set_world_height(20)
        self.add_player(Player(self, "p1", 13, 10, Player.FacingDirection.DOWN))
        print(f"Just set up world, returning {self.to_dict()}")

    def update(self):
        print("Updating world...")
        for player in self.players.values():
            player.update(self.brain)
        return
    
    def to_dict(self):
        return {
            "mapName": self.map_name,
            "worldWidth": self.worldWidth,
            "worldHeight": self.worldHeight,
            # "objects": [obj.to_dict() for obj in self.objects.values()],
            "players": [player.to_dict() for player in self.players.values()]
        }