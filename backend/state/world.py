from typing import List
from enum import Enum, auto

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

    def update(self, action: Action):
        if isinstance(action, WalkPlayer):
            player = self.players.get(action.playerId)
            if player is None:
                return
            else:
                move_dir = Player.FacingDirection.from_move(action.oldX, action.oldY, action.newX, action.newY)
                if move_dir is None or player.facingDirection != move_dir:
                    return

                player.x = action.newX
                player.y = action.newY
            return
        else:
            pass
        
        return
    
    def to_dict(self):
        return {
            "mapName": self.map_name,
            "worldWidth": self.worldWidth,
            "worldHeight": self.worldHeight,
            "objects": [obj.to_dict() for obj in self.objects.values()],
            "players": [player.to_dict() for player in self.players.values()]
        }