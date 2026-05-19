from enum import Enum


class Sector(str, Enum):
    transport = "transport"
    energy = "energy"
    buildings = "buildings"
    waste = "waste"
    land_use = "land use"


class ActionStatus(str, Enum):
    planned = "planned"
    in_progress = "in progress"
    completed = "completed"
