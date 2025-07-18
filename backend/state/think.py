from openai import OpenAI

class Brain:
    def __init__(self):
        self.client = None

    def think(self, senses: str, memory: str) -> str:
        prompt = f"""You are a player in a game world.
        Given the following memory and current senses, generate a new thought. 
        Possible thoughts could be what you're curious about, what you are recalling, what you want to do, how you feel, etc.
        You must face a direction in order to walk to it.
        You can walk in the direction with the action WALK.
        You can face a different direction by saying "FACE direction" where direction is one of:
        "UP", "DOWN", "LEFT", "RIGHT".
        You can remember things by saying "REMEMBER: <thing to remember>".
        REMEMBER things, otherwise you will completely forget them, and lead to circular or repeated thoughts.
        
        You are on a two dimensional grid with top, down, left, and right directions.
        All directions given are absolute, so if you are facing down, "WALK" means move down.
        Layers are tiles in the same location.
        Senses: {senses}
        This is your memory:
        Memory: {memory}

        Output in a json format, with required key "new_thought", "new_memory": "<your new memory>", and optional entries "walk": true/false, "face": "UP"/"DOWN"/"LEFT"/"RIGHT"
        You have a limited memory, so reevaluate and generalize your memory into denser memories as needed.
        You must always return a new_thought and your new_memory.
        Do not output anything else, only the json object with your new_thought,ew new_memory, and actions you want to persist into your next instance of consciousness.
        """
        response = self.client.responses.create(
            model="gpt-4.1-nano",
            input=prompt
        )   
        return response.output_text