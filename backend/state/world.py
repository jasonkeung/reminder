from typing import List
from enum import Enum, auto
import random

class WorldObject:
    def __init__(self, name: str, x: int = 0, y: int = 0):
        self.name = name
        self.x = x
        self.y = y

    def to_dict(self):
        return {
            "name": self.name,
            "x": self.x,
            "y": self.y
        }

class Player:
    class FacingDirection(Enum):
        UP = auto()
        DOWN = auto()
        LEFT = auto()
        RIGHT = auto()

        @staticmethod
        def from_move(oldX: int, oldY: int, newX: int, newY: int):
            dx = newX - oldX
            dy = newY - oldY
            if dx == 1 and dy == 0:
                return Player.FacingDirection.RIGHT
            elif dx == -1 and dy == 0:
                return Player.FacingDirection.LEFT
            elif dx == 0 and dy == -1:
                return Player.FacingDirection.UP
            elif dx == 0 and dy == 1:
                return Player.FacingDirection.DOWN
            else:
                return None

    def __init__(self, playerId: str, x: int = 0, y: int = 0, facingDirection: FacingDirection = FacingDirection.DOWN):
        self.playerId = playerId
        self.x = x
        self.y = y
        self.facingDirection = facingDirection

    def to_dict(self):
        return {
            "playerId": self.playerId,
            "x": self.x,
            "y": self.y,
            "facingDirection": self.facingDirection.name
        }

    def move(self, dx: int, dy: int):
        self.x += dx
        self.y += dy
    
    def moveOrFaceRandom(self, world):
        directions = list(Player.FacingDirection)
        min_x, min_y = 1, 1
        max_x = world.worldWidth - 1
        max_y = world.worldHeight - 1

        # 50% chance to move in the current facing direction, 50% to pick another direction
        if random.random() < 0.75:
            dir = self.facingDirection
        else:
            other_dirs = [d for d in directions if d != self.facingDirection]
            dir = random.choice(other_dirs)

        if dir == Player.FacingDirection.UP and self.y > min_y:
            if self.facingDirection != Player.FacingDirection.UP:
                self.face(Player.FacingDirection.UP)
            else:
                if self.y - 1 >= min_y:
                    self.move(0, -1)
        elif dir == Player.FacingDirection.DOWN and self.y < max_y:
            if self.facingDirection != Player.FacingDirection.DOWN:
                self.face(Player.FacingDirection.DOWN)  
            else:
                if self.y + 1 <= max_y:
                    self.move(0, 1)
        elif dir == Player.FacingDirection.LEFT and self.x > min_x:
            if self.facingDirection != Player.FacingDirection.LEFT:
                self.face(Player.FacingDirection.LEFT)
            else:
                if self.x - 1 >= min_x:
                    self.move(-1, 0)
        elif dir == Player.FacingDirection.RIGHT and self.x < max_x:
            if self.facingDirection != Player.FacingDirection.RIGHT:
                self.face(Player.FacingDirection.RIGHT)
            else:
                if self.x + 1 <= max_x:
                    self.move(1, 0)

    def face(self, direction: FacingDirection):
        self.facingDirection = direction

    def update(self, world):
        print(f"Updating player {self.playerId} at position ({self.x}, {self.y}) facing {self.facingDirection.name}")
        self.moveOrFaceRandom(world)

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
        
        self.objects: dict[str, WorldObject] = {}
        self.players: dict[str, Player] = {}

    def set_map_name(self, map_name: str):
        self.map_name = map_name

    def set_world_width(self, width: int):
        self.worldWidth = width

    def set_world_height(self, height: int):
        self.worldHeight = height

    def add_object(self, obj: WorldObject):
        self.objects[obj.name] = obj

    def add_player(self, player: Player):
        self.players[player.playerId] = player

    def setup(self):
        print("Setting up world...")
        self.set_map_name("map2")
        self.set_world_width(30)
        self.set_world_height(20)
        self.add_player(Player("p1", 2, 2, Player.FacingDirection.DOWN))
        print(f"Just set up world, returning {self.to_dict()}")

    def update(self):
        print("Updating world...")
        for player in self.players.values():
            player.update(self)
        return
    
    def to_dict(self):
        return {
            "mapName": self.map_name,
            "worldWidth": self.worldWidth,
            "worldHeight": self.worldHeight,
            "objects": [obj.to_dict() for obj in self.objects.values()],
            "players": [player.to_dict() for player in self.players.values()]
        }