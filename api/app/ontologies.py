from lib2to3.pytree import Base
from typing import Optional, List
from pydantic import BaseModel

class OntologyClass(BaseModel):
    name: str

class OntologyProperties(BaseModel):
    name: str

class OntologyData(BaseModel):
    classes: List[OntologyClass]
    properties: List[OntologyProperties]

class Ontology(BaseModel):
    name: str
    data: OntologyData