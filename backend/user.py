import json

class User:
    def __init__(self, name, picture, user_id, email):
        self.name = name
        self.picture = picture
        self.user_id = user_id
        self.email = email

    @classmethod
    def from_dict(cls, user_dict: dict):
        # data_dict = json.loads(user_dict_string)
        return cls(
            name=user_dict.get('name'),
            picture=user_dict.get('picture'),
            user_id=user_dict.get('user_id'),
            email=user_dict.get('email')
        )